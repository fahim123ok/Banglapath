/* Static file server + Gemini proxy for BanglaPath.
 *
 * Run:  GEMINI_API_KEY=... node server.js
 * The key stays in this process; the browser only ever calls POST /api/chat.
 */

const http = require('http');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');

const ROOT = __dirname;
const BOOK_DIST = path.resolve(ROOT, '../book/dist');
const HOSP_DIST = path.resolve(ROOT, '../Hospital finding/dist');
const PORT = Number(process.env.PORT) || 3000;
/* gemini-2.5-flash leads because of generous quota and full googleSearch support.
 * The rest are tried in order when one is rate-limited. */
const MODELS = [
  ...(process.env.GEMINI_MODEL ? [process.env.GEMINI_MODEL] : []),
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-3.8-flash',
].filter((m, i, all) => all.indexOf(m) === i);

// Thinking is configured differently across generations, and both families
// otherwise burn the whole output budget before writing a word.
const thinkingFor = (model) =>
  model.startsWith('gemini-3') ? { thinkingLevel: 'low' } : (model.includes('2.5') ? { thinkingBudget: 512 } : undefined);

// Load a local .env if present, so `node server.js` just works.
for (const envPath of [path.join(ROOT, '.env'), path.join(process.cwd(), '.env')]) {
  try {
    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {
    /* no .env, fall back to the ambient environment */
  }
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    reply: { type: 'string' },
    places: { type: 'array', items: { type: 'string' } },
  },
  required: ['reply'],
};

/* The model answers in JSON, but a truncated or half-written answer still
 * contains a usable sentence. Pull the "reply" string out by hand rather than
 * dropping the turn or showing the user raw braces. */
function salvage(text) {
  const m = text.match(/"reply"\s*:\s*"((?:[^"\\]|\\.)*)/);
  if (!m) return text.startsWith('{') ? '' : text;
  try {
    return JSON.parse(`"${m[1].replace(/\\?$/, '')}"`);
  } catch {
    return m[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
  }
}

let placesCatalog = [];
try {
  const pData = JSON.parse(fs.readFileSync(path.join(ROOT, 'places.json'), 'utf8'));
  placesCatalog = Array.isArray(pData.places) ? pData.places : [];
} catch (err) {
  console.warn('Could not preload places.json:', err.message);
}

function readReply(raw) {
  const data = JSON.parse(raw);
  const cand = data.candidates?.[0];
  const text = (cand?.content?.parts || []).map((p) => p.text || '').join('').trim();
  if (!text) return { reply: '', places: [], finish: cand?.finishReason || 'EMPTY' };

  // If response is wrapped in ```json ... ```
  let cleanText = text;
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) cleanText = jsonMatch[1].trim();

  let replyStr = '';
  let extractedPlaces = [];

  try {
    const out = JSON.parse(cleanText);
    if (out && typeof out === 'object' && out.reply) {
      replyStr = String(out.reply || '').trim();
      extractedPlaces = Array.isArray(out.places) ? out.places : [];
    }
  } catch {}

  if (!replyStr) {
    const sal = salvage(text);
    replyStr = sal && sal.length > 3 ? sal.trim() : text.trim();
  }

  // If places array is empty, match from places catalog by id or name
  if (!extractedPlaces.length && placesCatalog.length && replyStr) {
    const lower = replyStr.toLowerCase();
    for (const p of placesCatalog) {
      if (!p.id || !p.name) continue;
      if (lower.includes(p.name.toLowerCase()) || lower.includes(p.id.toLowerCase())) {
        extractedPlaces.push(p.id);
        if (extractedPlaces.length >= 2) break;
      }
    }
  }

  return { reply: replyStr, places: extractedPlaces, finish: cand?.finishReason };
}

function json(res, code, body) {
  const payload = JSON.stringify(body);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(payload) });
  res.end(payload);
}

function readBody(req, limit = 256 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) {
        reject(new Error('Request body too large.'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function chat(req, res) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return json(res, 503, { error: 'GEMINI_API_KEY is not set on the server.' });

  let payload;
  try {
    payload = JSON.parse(await readBody(req));
  } catch (err) {
    return json(res, 400, { error: `Could not read the request: ${err.message}` });
  }

  const rawTurns = Array.isArray(payload.turns) 
    ? payload.turns.slice(-30) 
    : Array.isArray(payload.messages) 
      ? payload.messages.slice(-30) 
      : [];
  if (!rawTurns.length) return json(res, 400, { error: 'No conversation turns were sent.' });

  // Sanitize turns so Gemini API rules are strictly satisfied:
  // 1. Must alternate: user, model, user, model...
  // 2. Must start with 'user'
  const sanitizedContents = [];
  for (const t of rawTurns) {
    const text = String(t.text || '').trim();
    if (!text) continue;
    const role = t.role === 'model' || t.role === 'bot' ? 'model' : 'user';

    if (sanitizedContents.length === 0) {
      if (role === 'model') continue; // First turn must be user
      sanitizedContents.push({ role: 'user', parts: [{ text: text.slice(0, 4000) }] });
    } else {
      const prev = sanitizedContents[sanitizedContents.length - 1];
      if (prev.role === role) {
        // Merge consecutive turns with the same role
        prev.parts[0].text += '\n\n' + text.slice(0, 4000);
      } else {
        sanitizedContents.push({ role, parts: [{ text: text.slice(0, 4000) }] });
      }
    }
  }

  // Ensure at least one user turn
  if (!sanitizedContents.length) {
    sanitizedContents.push({ role: 'user', parts: [{ text: 'Hello, please recommend top destinations and foods in Bangladesh.' }] });
  }

  const now = new Date();
  const currentDateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const isoDate = now.toISOString().split('T')[0];

  const BASE_SYSTEM_INSTRUCTION = `You are BanglaPath AI — the premier travel, cultural, and smart life companion for Bangladesh.

REAL-WORLD CURRENT DATE & LIVE SEARCH:
- TODAY'S REAL-WORLD DATE IS: ${currentDateStr} (${isoDate}).
- YOU ARE OPERATING IN THE PRESENT YEAR 2026. NEVER claim you are in 2024 or that 2026 is in the future!
- You have real-time Google Search grounding enabled. Whenever the user asks to "search on web", asks about current news, latest events, politics, recent happenings, transport, weather, or dates in 2026, use your Google Search tool to search the live web and provide current facts as of ${currentDateStr}.

REPLY LENGTH DIRECTIVE (MEDIUM LENGTH ONLY - CRITICAL):
- Do NOT make your replies too long (no giant walls of text or exhaustive essays).
- Do NOT make your replies too small (no 1-line dismissive answers).
- ALWAYS provide a balanced, MEDIUM-length reply (approx 100 to 220 words, or 2 to 4 crisp sections/bullet points).
- Keep every answer neat, punchy, informative, and easily readable on mobile.

KAOMOJI DIRECTIVE (MANDATORY IN EVERY LINE/POINT):
- You MUST use lots of expressive, cute kaomojis throughout your reply!
- Include at least one expressive kaomoji on almost EVERY line, sentence, or bullet point!
- Use a rich, lively variety of kaomojis to bring warmth and excitement, such as:
  (✿◠‿◠), (★ω★), (｡♥‿♥｡), (づ｡◕‿‿◕｡)づ, (≧◡≦), ( ˘▽˘)っ♨, (*^▽^*), (´｡• ᵕ •｡), (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧,
  (•̀ᴗ•́)و, (ง'-'́)ง, (｡•́︿•̀｡), (´･_･), ヽ(>∀<☆)ノ, (o˘◡˘o), (⌒‿⌒), (＾▽＾), ٩(◕‿◕｡)۶
- Every major greeting, thought, fact, and conclusion must feature kaomojis!

KNOWLEDGE SCOPE:
- Speak with warmth, authentic local knowledge, cultural respect, and safety-conscious precision.
- Provide recommendations across all 64 districts of Bangladesh (Dhaka, Chittagong, Sylhet, Cox's Bazar, Sundarbans, Bandarban, Sreemangal, Rajshahi, Rangpur, Barisal, Mymensingh, etc.), covering destinations, transport, food, heritage, customs, seasons, and itineraries.`;

  const safeSystemPrompt = payload.systemPrompt
    ? `${BASE_SYSTEM_INSTRUCTION}\n\nClient Context & Catalog:\n${String(payload.systemPrompt).slice(0, 3000)}`
    : BASE_SYSTEM_INSTRUCTION;

  const body = {
    contents: sanitizedContents,
    generationConfig: {
      temperature: 0.75,
      topP: 0.95,
      maxOutputTokens: 1200,
    },
    tools: [
      {
        googleSearch: {},
      },
    ],
    systemInstruction: { parts: [{ text: safeSystemPrompt }] },
  };

  // Overload, rate limits and empty candidates are all transient, and a chat
  // bubble that says "502" is useless to a traveller — work down the models
  // before giving up.
  let last = 'Gemini did not answer.';
  const deadline = Date.now() + 60000;
  for (let attempt = 0; attempt < MODELS.length + 1; attempt += 1) {
    if (attempt) await new Promise((r) => setTimeout(r, 400));
    if (Date.now() > deadline) break;
    const model = MODELS[Math.min(attempt, MODELS.length - 1)];
    const tc = thinkingFor(model);
    if (tc) {
      body.generationConfig.thinkingConfig = tc;
    } else {
      delete body.generationConfig.thinkingConfig;
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

    let upstream;
    try {
      upstream = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        // Cap each try so a slow model still leaves room for the next one.
        signal: AbortSignal.timeout(Math.max(5000, Math.min(25000, deadline - Date.now()))),
      });
    } catch (err) {
      last =
        err.name === 'TimeoutError' || /timeout/i.test(err.message)
          ? 'That answer is taking longer than usual — ask me once more?'
          : `Could not reach Gemini: ${err.message}`;
      continue;
    }

    const raw = await upstream.text();
    if (!upstream.ok) {
      let message = raw.slice(0, 300);
      try {
        message = JSON.parse(raw).error?.message || message;
      } catch {
        /* keep the raw snippet */
      }
      console.error(`[chat] ${model} ${upstream.status}: ${message.split('\n')[0]}`);
      last =
        upstream.status === 429
          ? 'The Gemini key has run out of free quota for now — try again in a minute.'
          : `Gemini said: ${message}`;
      if (upstream.status < 500 && upstream.status !== 429 && upstream.status !== 404) break;
      continue;
    }

    let out;
    try {
      out = readReply(raw);
    } catch {
      last = 'Gemini sent something I could not read.';
      continue;
    }
    if (!out.reply) {
      console.error(`[chat] ${model} empty candidate (finishReason ${out.finish})`);
      last = 'Gemini sent an empty reply.';
      continue;
    }
    return json(res, 200, { reply: out.reply, places: out.places.slice(0, 2) });
  }

  // If all models failed or were exhausted, provide an intelligent local response based on user prompt
  const lastUserText = sanitizedContents[sanitizedContents.length - 1]?.parts[0]?.text || '';
  const lower = lastUserText.toLowerCase();

  let fallbackReply = '';
  let fallbackPlaces = [];

  if (lower.includes('food') || lower.includes('eat') || lower.includes('biryani') || lower.includes('kacchi') || lower.includes('khabar')) {
    fallbackReply = `Bangladesh is a paradise for food lovers! Here are the must-try culinary experiences:
1. **Old Dhaka Kacchi Biryani & Morog Polao**: Fragrant chinigura or basmati rice layered with spiced mutton/chicken, potatoes, and boiled egg, served with refreshing Borhani.
2. **Chittagong Mezban Beef & Kala Bhuna**: Slow-cooked beef caramelized in mustard oil, radhuni seeds, and ground spices.
3. **Padma Shorshe Ilish**: Tender Hilsa fish stewed in fresh mustard paste, green chilies, and pure mustard oil.
4. **Winter Pitha**: Steamed Bhapa Pitha (rice flour, jaggery, coconut) and delicate Patishapta crepes.
5. **Sweets**: Bogura's authentic Curtis curd (Mishti Doi) and Comilla's Rasomalai!`;
    fallbackPlaces = ['kacchi-biryani', 'mezban-beef'];
  } else if (lower.includes('sylhet') || lower.includes('tea') || lower.includes('ratargul') || lower.includes('jaflong')) {
    fallbackReply = `Sylhet is the serene emerald crown of Bangladesh!
• **Ratargul Freshwater Swamp Forest**: Glide through submerged koroch and hijol trees in quiet wooden canoes.
• **Sreemangal Tea Estates**: Endless rolling hills covered in lush green tea carpets, Lawachara Rainforest, and the legendary 7-layer tea at Nilkantha Tea Cabin.
• **Jaflong & Bichnakandi**: Crystal-clear mountain streams cascading down from the Meghalaya hills over smooth river pebbles.
Best time to explore: October through March for cool breezes, or monsoon (July-September) for lush waterfalls!`;
    fallbackPlaces = ['ratargul-forest', 'sreemangal-tea'];
  } else if (lower.includes('beach') || lower.includes('sea') || lower.includes('cox') || lower.includes('saint') || lower.includes('inani')) {
    fallbackReply = `The coastal beauty of Bangladesh is unmatched:
• **Cox's Bazar**: The longest unbroken natural sea beach in the world (120 km), with golden sunsets at Laboni and gentle waves at Kolatoli.
• **Marine Drive & Inani**: Drive between towering hills on one side and coral beaches on the other, heading toward Himchari's waterfalls.
• **Saint Martin's Island (Narikel Jinjira)**: Bangladesh's only coral island with turquoise water, coconut groves, and fresh grilled red snapper.`;
    fallbackPlaces = ['coxs-bazar-beach', 'saint-martins-island'];
  } else {
    fallbackReply = `Assalamu alaikum! Welcome to BanglaPath AI, your companion for exploring Bangladesh:
• **Must-visit destinations**: The untouched mangrove wilderness of Sundarbans, the rolling clouds of Sajek Valley, serene tea gardens of Sreemangal, and historic Old Dhaka.
• **Local tip**: Travel between November and February for the coolest and most pleasant weather.
Feel free to ask about any of the 64 districts, authentic traditional foods, or custom itineraries!`;
    fallbackPlaces = ['sajek-valley', 'sundarbans-mangroves'];
  }

  return json(res, 200, { reply: fallbackReply, places: fallbackPlaces });
}

const TRANSLATE_CACHE = new Map();

async function translate(req, res) {
  let payload;
  try {
    payload = JSON.parse(await readBody(req));
  } catch (err) {
    return json(res, 400, { error: `Could not read the request: ${err.message}` });
  }

  const { text, from = 'en', to = 'bn' } = payload;
  if (!text || !text.trim()) return json(res, 400, { error: 'Text to translate is required.' });

  const cleanText = text.trim();
  const cacheKey = `${from}:${to}:${cleanText.toLowerCase()}`;
  if (TRANSLATE_CACHE.has(cacheKey)) {
    return json(res, 200, TRANSLATE_CACHE.get(cacheKey));
  }

  if (from === to) {
    return json(res, 200, { translatedText: cleanText, pronunciation: '' });
  }

  const key = process.env.GEMINI_API_KEY;
  let last = 'Translation failed.';

  if (key) {
    const prompt = `Translate the following text accurately from ${from} to ${to} for a traveler visiting Bangladesh.
Source Text: "${cleanText}"

Respond in JSON format:
{
  "translatedText": "natural translation in target language",
  "pronunciation": "transliterated phonetic pronunciation in English alphabet if target is Bangla/Sylheti/Chittagonian"
}`;

    const body = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        topP: 0.8,
        maxOutputTokens: 350,
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            translatedText: { type: 'string' },
            pronunciation: { type: 'string' },
          },
          required: ['translatedText'],
        },
      },
    };

    for (let attempt = 0; attempt < MODELS.length; attempt += 1) {
      const model = MODELS[attempt];
      if (model.startsWith('gemini-3')) {
        body.generationConfig.thinkingConfig = { thinkingBudget: 0 };
      } else {
        delete body.generationConfig.thinkingConfig;
      }

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
      try {
        const upstream = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(8000),
        });
        if (!upstream.ok) continue;
        const raw = await upstream.text();
        const data = JSON.parse(raw);
        const resText = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('').trim();
        const parsed = JSON.parse(resText);
        if (parsed && parsed.translatedText) {
          const resultObj = {
            translatedText: parsed.translatedText || '',
            pronunciation: parsed.pronunciation || '',
          };
          if (TRANSLATE_CACHE.size > 2000) {
            const firstKey = TRANSLATE_CACHE.keys().next().value;
            TRANSLATE_CACHE.delete(firstKey);
          }
          TRANSLATE_CACHE.set(cacheKey, resultObj);
          return json(res, 200, resultObj);
        }
      } catch (e) {
        last = e.message;
      }
    }
  }

  // Resilient Fallback: MyMemory Translation API
  try {
    const pair = `${from.slice(0, 2)}|${to.slice(0, 2)}`;
    const mmUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanText)}&langpair=${encodeURIComponent(pair)}`;
    const mmRes = await fetch(mmUrl, { signal: AbortSignal.timeout(6000) });
    if (mmRes.ok) {
      const mmData = await mmRes.json();
      if (mmData && mmData.responseData && mmData.responseData.translatedText) {
        const tr = mmData.responseData.translatedText.trim();
        if (!tr.toUpperCase().includes('MYMEMORY WARNING') && tr.length > 0) {
          const resultObj = {
            translatedText: tr,
            pronunciation: '',
          };
          TRANSLATE_CACHE.set(cacheKey, resultObj);
          return json(res, 200, resultObj);
        }
      }
    }
  } catch (e) {
    last = e.message;
  }

  return json(res, 502, { error: last });
}

async function tts(req, res) {
  const urlObj = new URL(req.url, 'http://localhost');
  const text = (urlObj.searchParams.get('text') || '').trim().slice(0, 300);
  const lang = (urlObj.searchParams.get('lang') || 'bn').toLowerCase();

  if (!text) {
    return json(res, 400, { error: 'No text provided.' });
  }

  let ttsLang = 'bn';
  if (lang === 'bn' || lang === 'syl' || lang === 'ctg') {
    ttsLang = 'bn';
  } else if (lang === 'en') {
    ttsLang = 'en';
  } else if (lang === 'es') {
    ttsLang = 'es';
  } else if (lang === 'hi') {
    ttsLang = 'hi';
  } else if (lang === 'ar') {
    ttsLang = 'ar';
  } else if (lang === 'fr') {
    ttsLang = 'fr';
  } else if (lang === 'ja') {
    ttsLang = 'ja';
  } else if (lang === 'de') {
    ttsLang = 'de';
  } else {
    ttsLang = lang;
  }

  const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${encodeURIComponent(ttsLang)}&client=tw-ob`;

  try {
    const upstream = await fetch(googleTtsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://translate.google.com/',
      },
      signal: AbortSignal.timeout(7000),
    });

    if (!upstream.ok) {
      return json(res, 502, { error: `TTS service returned status ${upstream.status}` });
    }

    res.writeHead(200, {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'public, max-age=86400',
    });
    const buffer = Buffer.from(await upstream.arrayBuffer());
    return res.end(buffer);
  } catch (err) {
    return json(res, 502, { error: `TTS failed: ${err.message}` });
  }
}

async function serveStatic(req, res) {
  const rel = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = path.join(ROOT, rel === '/' ? 'index.html' : rel);
  if (!file.startsWith(ROOT)) return json(res, 403, { error: 'Forbidden' });

  // Security: Block any hidden files, .env, .git, package.json, server.js, start.bat, etc.
  const base = path.basename(file).toLowerCase();
  const relLower = rel.toLowerCase();
  if (
    base.startsWith('.') ||
    relLower.includes('/.') ||
    base === 'package.json' ||
    base === 'server.js' ||
    base === 'start.bat' ||
    base.endsWith('.env')
  ) {
    return json(res, 403, { error: 'Forbidden' });
  }

  let stat;
  try {
    stat = await fsp.stat(file);
  } catch {
    return json(res, 404, { error: 'Not found' });
  }
  if (stat.isDirectory()) return json(res, 404, { error: 'Not found' });

  const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
  const range = req.headers.range;

  // Videos need byte ranges for Chrome to scrub and autoplay reliably.
  if (range && /^bytes=/.test(range)) {
    const [startRaw, endRaw] = range.replace('bytes=', '').split('-');
    const start = Number(startRaw) || 0;
    const end = endRaw ? Math.min(Number(endRaw), stat.size - 1) : stat.size - 1;
    res.writeHead(206, {
      'Content-Type': type,
      'Content-Range': `bytes ${start}-${end}/${stat.size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': end - start + 1,
    });
    return fs.createReadStream(file, { start, end }).pipe(res);
  }

  res.writeHead(200, { 'Content-Type': type, 'Content-Length': stat.size, 'Accept-Ranges': 'bytes' });
  fs.createReadStream(file).pipe(res);
}

async function serveSpaDist(req, res, distRoot, baseRoute) {
  let subPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).slice(baseRoute.length);
  if (!subPath || subPath === '/') subPath = 'index.html';
  let targetFile = path.join(distRoot, subPath);
  if (!targetFile.startsWith(distRoot)) return json(res, 403, { error: 'Forbidden' });

  let stat;
  try {
    stat = await fsp.stat(targetFile);
    if (stat.isDirectory()) {
      targetFile = path.join(targetFile, 'index.html');
      stat = await fsp.stat(targetFile);
    }
  } catch {
    // SPA fallback: serve index.html
    targetFile = path.join(distRoot, 'index.html');
    try {
      stat = await fsp.stat(targetFile);
    } catch {
      return json(res, 404, { error: 'Application build not found.' });
    }
  }

  const type = MIME[path.extname(targetFile).toLowerCase()] || 'application/octet-stream';
  res.writeHead(200, {
    'Content-Type': type,
    'Content-Length': stat.size,
    'Cache-Control': targetFile.endsWith('.html') ? 'no-cache' : 'public, max-age=31536000, immutable'
  });
  fs.createReadStream(targetFile).pipe(res);
}

http
  .createServer((req, res) => {
    const route = req.url.split('?')[0];

    // Standalone Book App route
    if (route === '/book') {
      res.writeHead(302, { Location: '/book/' });
      return res.end();
    }
    if (route.startsWith('/book/')) {
      if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { error: 'Use GET.' });
      return serveSpaDist(req, res, BOOK_DIST, '/book/').catch((err) => json(res, 500, { error: err.message }));
    }

    // Standalone Hospital App route
    if (route === '/hospital') {
      res.writeHead(302, { Location: '/hospital/' });
      return res.end();
    }
    if (route.startsWith('/hospital/')) {
      if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { error: 'Use GET.' });
      return serveSpaDist(req, res, HOSP_DIST, '/hospital/').catch((err) => json(res, 500, { error: err.message }));
    }

    if (route === '/api/chat') {
      if (req.method !== 'POST') return json(res, 405, { error: 'Use POST.' });
      return chat(req, res).catch((err) => json(res, 500, { error: err.message }));
    }
    if (route === '/api/translate') {
      if (req.method !== 'POST') return json(res, 405, { error: 'Use POST.' });
      return translate(req, res).catch((err) => json(res, 500, { error: err.message }));
    }
    if (route === '/api/tts') {
      if (req.method !== 'GET') return json(res, 405, { error: 'Use GET.' });
      return tts(req, res).catch((err) => json(res, 500, { error: err.message }));
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { error: 'Use GET.' });
    serveStatic(req, res).catch((err) => json(res, 500, { error: err.message }));
  })
  .listen(PORT, '0.0.0.0', () => {
    console.log(`BanglaPath on http://0.0.0.0:${PORT}`);
    if (!process.env.GEMINI_API_KEY) console.warn('GEMINI_API_KEY is not set — the chat will return 503.');
  });
