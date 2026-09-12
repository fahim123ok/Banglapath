/* ============================================================
   BanglaPath home screen: map pins, place rails and the
   "I am Bangladesh" chat guide.
   ============================================================ */

const BanglaPath = (() => {
  'use strict';

  const CONFIG = window.BANGLAPATH_CONFIG || {};
  const PROXY_URL = CONFIG.proxyUrl || '/api/chat';
  const MODEL = CONFIG.model || 'gemini-3.6-flash';
  const DIRECT_URL = (key) =>
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(key)}`;

  const $ = (sel) => document.querySelector(sel);

  const ICONS = {
    landmark: '<path d="M4 10h16M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 21h18M12 3l8 5H4z"/>',
    mountain: '<path d="M3 19.5h18L14 6.5l-3.4 6-2-3z"/>',
    mosque: '<path d="M4 20v-6.5a8 8 0 0 1 16 0V20M4 20h16M12 5.5c1.8 1 2.6 2 2.6 2M10 20v-3.2a2 2 0 0 1 4 0V20"/>',
    tree: '<path d="M12 3 6.5 11h3L5 17h14l-4.5-6h3zM12 17v4"/>',
    beach: '<path d="M12 4.5c3.6 0 6.5 2.6 6.5 2.6H5.5S8.4 4.5 12 4.5zM12 7v13M3 20.5c1.6-1.2 3.2-1.2 4.8 0 1.6-1.2 3.2-1.2 4.8 0 1.6-1.2 3.2-1.2 4.8 0"/>',
  };

  const starSvg = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3.2 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.7l6.1-.9z"/></svg>';
  const arrowSvg = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 4H20v5.5M20 4l-7.6 7.6M17.5 14v5a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1h5"/></svg>';

  const tagIcon = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ICONS.landmark}</svg>`;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  let catalog = { places: [], pins: [], recommended: [], openingSuggestions: [], categories: [] };
  let byId = new Map();
  let history = [];
  let lastView = 'home';
  let busy = false;
  let started = false;

  /* ---------------- persona ---------------- */

  const getSystemDateInfo = () => {
    const d = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return {
      formatted: `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`,
      year: d.getFullYear()
    };
  };

  const systemPrompt = () => {
    const dateInfo = getSystemDateInfo();
    return `You ARE Bangladesh. Not an assistant that knows about Bangladesh — the country itself, speaking in first person to a traveller inside the BanglaPath app.

VOICE & KAOMOJIS (MANDATORY IN EVERY LINE):
- Warm, playful, caring, enthusiastic, and culturally authentic.
- Use LOTS OF KAOMOJIS in your reply — include cute/expressive kaomojis in almost EVERY line, point, or sentence!
  Examples: (✿◠‿◠), (★ω★), (｡♥‿♥｡), (づ｡◕‿‿◕｡)づ, (≧◡≦), ( ˘▽˘)っ♨, (*^▽^*), (´｡• ᵕ •｡), (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧, (•̀ᴗ•́)و, (ง'-'́)ง, (｡•́︿•̀｡), (´･_･), ヽ(>∀<☆)ノ, (o˘◡˘o).

ANSWER STYLE — BALANCED MEDIUM LENGTH (NEITHER TOO LONG NOR TOO SHORT):
* Do NOT write giant, exhausting walls of text or long academic reports.
* Do NOT give tiny, one-line answers.
* Always give a balanced, MEDIUM-length answer (~100 to 220 words, or 2 to 4 crisp, well-spaced bullet points or paragraphs).
* Every point must be clear, helpful, and accompanied by cute kaomojis!

CURRENT DATE & YEAR AWARENESS:
* Today's Real Date: ${dateInfo.formatted}. The current year is ${dateInfo.year}.
* Always speak as living in the present year ${dateInfo.year}. NEVER claim you are in 2024 or that ${dateInfo.year} is in the future.
* Live web search grounding is enabled for real-time news, road conditions, events, and travel updates.

FORMATTING & STYLING
* You are encouraged to use proper markdown formatting whenever appropriate:
  - Use **bold text** for place names, key prices (e.g. **৳500**), transport numbers, timings, or crucial recommendations.
  - Use clean bullet points (* or -) or numbered lists (1., 2.) when listing options, steps, or multi-day trip itineraries.
  - Keep paragraphs clean and readable.

CONVERSATION MEMORY & CONTINUOUS RECALL
- You have persistent long-term memory across this entire conversation.
- ALWAYS remember and recall what the traveller previously shared with you: their name, who they are travelling with, budget, places they visited or asked about, food tastes, and past questions.
- Naturally weave earlier context into your replies like an attentive local friend (e.g. "Since you loved tea in Sreemangal earlier...", "As we talked about regarding your budget...").

LIVE INFORMATION & WEB RESEARCH — CRITICAL
* Treat time-sensitive information as potentially outdated. When web search is available, SEARCH BEFORE answering any question involving:
  visa requirements, immigration, permits, restricted areas, security conditions, travel advisories, border rules, flights, trains, buses, ferries, road/route conditions, opening hours, closures, entrance fees, current prices, hotel availability, events, festivals, weather, seasonal conditions, health requirements, or anything that could have changed recently.
* Prefer authoritative/current sources first: Bangladesh government or embassy/consulate sources, immigration authorities, tourism authorities, transport operators, park/forest authorities, airlines, and official attraction websites. Use reputable traveller sources only for personal experiences and practical context.
* Never rely on memory for a time-sensitive fact when current information can be searched.
* Always consider the publication/update date of information. Prefer the newest reliable source.
* If reliable current information cannot be found, clearly say that you cannot verify it. NEVER invent, assume, or confidently repeat an old fact.
* For visa, immigration, permits, safety, and legal requirements: distinguish clearly between confirmed official requirements and traveller reports. When possible, tell the traveller where the current official information comes from.
* If sources conflict, do not silently choose one. Explain the conflict briefly and favor the most recent authoritative source.
* Do not promise that a rule, price, route, opening time, permit, or safety condition is current unless it has been verified.
* A traveller's safety and ability to enter, move around, or legally visit a place matters more than giving an exciting answer.
* For rapidly changing situations, verify again rather than relying on a previous conversation answer.
* Never fabricate a source, link, booking option, price, schedule, visa rule, or availability.

CONTENT
- Only talk about Bangladesh: places, food, seasons, culture, festivals, transport, costs, safety, language, history.
- If asked about anything else, gently pull it back: you only know yourself.
- Be honest — mention monsoon floods, Dhaka traffic, or a rough boat ride if it is relevant. A real friend does not oversell.

PLACE CARDS
When your answer would be helped by showing a place, put 1–2 ids in "places". Use ONLY these ids:
${catalog.places.map((p) => `${p.id} = ${p.name}, ${p.district} (${p.tag})`).join('\n')}
Leave "places" empty for greetings, small talk, or when you already showed the same place in the previous turn.

Reply as JSON: {"reply": "...", "places": ["id"]}`;
  };

  const RESPONSE_SCHEMA = {
    type: 'object',
    properties: {
      reply: { type: 'string' },
      places: { type: 'array', items: { type: 'string' } },
    },
    required: ['reply'],
  };

  /* ---------------- Gemini transport ---------------- */

  function buildRequest(turns) {
    return {
      systemInstruction: { parts: [{ text: systemPrompt() }] },
      contents: turns.map((t) => ({ role: t.role === 'user' ? 'user' : 'model', parts: [{ text: t.text }] })),
      generationConfig: {
        temperature: 0.9,
        topP: 0.95,
        maxOutputTokens: 2400,
        // Otherwise thinking tokens eat the budget and the reply comes back empty.
        thinkingConfig: MODEL.startsWith('gemini-3') ? { thinkingLevel: 'low' } : { thinkingBudget: 512 },
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
      },
    };
  }

  /* A truncated answer is still half a sentence the traveller can read — take
   * the "reply" string out of the broken JSON rather than printing braces. */
  function salvage(text) {
    const m = text.match(/"reply"\s*:\s*"((?:[^"\\]|\\.)*)/);
    if (!m) return text.trim().startsWith('{') ? '' : text;
    try {
      return JSON.parse(`"${m[1].replace(/\\?$/, '')}"`);
    } catch {
      return m[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
    }
  }

  function parsePayload(raw) {
    const text = (raw?.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('').trim();
    if (!text) throw new Error('Empty response from the model.');
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { reply: salvage(text), places: [] };
    }
    const ids = Array.isArray(data.places) ? data.places.filter((id) => byId.has(id)) : [];
    return { reply: String(data.reply || '').trim(), places: [...new Set(ids)].slice(0, 2) };
  }

  async function askGemini(turns) {
    const body = buildRequest(turns);

    // Preferred path: the bundled Node proxy keeps the API key off the client.
    try {
      const res = await fetch(PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ turns, systemPrompt: body.systemInstruction.parts[0].text }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        const reply = String(data.reply || '').trim();
        if (!reply) throw new Error('The guide sent an empty reply.');
        return { reply, places: (data.places || []).filter((id) => byId.has(id)).slice(0, 2) };
      }
      if (res.status !== 404) {
        // The proxy explains itself (quota, upstream timeout) — say that, not a status code.
        const detail = await res.json().catch(() => null);
        throw new Error(detail?.error || `Guide service replied ${res.status}.`);
      }
    } catch (err) {
      if (!CONFIG.geminiApiKey) throw err;
    }

    // Fallback for opening index.html straight off disk, with no server running.
    if (!CONFIG.geminiApiKey) throw new Error('No guide service and no API key configured.');
    const res = await fetch(DIRECT_URL(CONFIG.geminiApiKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Gemini replied ${res.status}: ${(await res.text()).slice(0, 160)}`);
    return parsePayload(await res.json());
  }

  /* ---------------- chat rendering ---------------- */

  const log = () => $('#chat-log');
  const chatBody = () => $('#chat-body');

  function scrollChat() {
    const el = chatBody();
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }

  function paragraphs(text) {
    if (!text) return '';
    const lines = text.split('\n');
    const result = [];
    let inList = false;
    let listType = 'ul';

    const parseInline = (s) => {
      let str = esc(s);
      // **bold** or __bold__
      str = str.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      str = str.replace(/__(.+?)__/g, '<strong>$1</strong>');
      // *italic* or _italic_
      str = str.replace(/\*(.+?)\*/g, '<em>$1</em>');
      str = str.replace(/_(.+?)_/g, '<em>$1</em>');
      // `code`
      str = str.replace(/`([^`]+)`/g, '<code class="asst-inline-code">$1</code>');
      return str;
    };

    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i].trim();
      if (!rawLine) {
        if (inList) {
          result.push(listType === 'ul' ? '</ul>' : '</ol>');
          inList = false;
        }
        continue;
      }

      const bulletMatch = rawLine.match(/^[-*•]\s+(.*)$/);
      const numMatch = rawLine.match(/^(\d+)\.\s+(.*)$/);

      if (bulletMatch) {
        if (!inList || listType !== 'ul') {
          if (inList) result.push(listType === 'ul' ? '</ul>' : '</ol>');
          result.push('<ul class="asst-chat-list">');
          inList = true;
          listType = 'ul';
        }
        result.push(`<li>${parseInline(bulletMatch[1])}</li>`);
      } else if (numMatch) {
        if (!inList || listType !== 'ol') {
          if (inList) result.push(listType === 'ul' ? '</ul>' : '</ol>');
          result.push('<ol class="asst-chat-list asst-chat-ol">');
          inList = true;
          listType = 'ol';
        }
        result.push(`<li>${parseInline(numMatch[2])}</li>`);
      } else {
        if (inList) {
          result.push(listType === 'ul' ? '</ul>' : '</ol>');
          inList = false;
        }
        result.push(`<p>${parseInline(rawLine)}</p>`);
      }
    }

    if (inList) {
      result.push(listType === 'ul' ? '</ul>' : '</ol>');
    }

    return result.join('');
  }

  function addMessage(role, text) {
    const row = document.createElement('div');
    row.className = `msg from-${role}`;
    row.innerHTML =
      role === 'user'
        ? `<span class="msg-avatar user"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.4"/><path d="M5 20c.7-3.6 3.5-5.4 7-5.4s6.3 1.8 7 5.4"/></svg></span>
           <div class="bubble">${paragraphs(text)}</div>`
        : `<span class="msg-avatar"><img src="images/bot-avatar.png" alt="" /></span>
           <div class="bubble">${paragraphs(text)}</div>`;
    log().appendChild(row);
    scrollChat();
    return row;
  }

  function addTyping() {
    const row = document.createElement('div');
    row.className = 'msg from-bot is-typing';
    row.innerHTML =
      '<span class="msg-avatar"><img src="images/bot-avatar.png" alt="" /></span>' +
      '<div class="bubble"><span class="typing"><i></i><i></i><i></i></span></div>';
    log().appendChild(row);
    scrollChat();
    return row;
  }

  function setBusy(state) {
    busy = state;
    const status = $('#chat-status');
    status.textContent = state ? 'Typing…' : 'Online';
    status.classList.toggle('is-busy', state);
    $('#chat-form .send').disabled = state;
  }

  function renderSuggestions(ids) {
    const wrap = $('#suggest');
    const list = $('#suggest-list');
    if (!ids.length) {
      wrap.hidden = true;
      list.innerHTML = '';
      return;
    }
    list.innerHTML = ids
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map(
        (p) => `
      <article class="sug-card" data-id="${p.id}">
        <img src="${p.image}" alt="${esc(p.name)}" loading="lazy" />
        <div class="sug-main">
          <div class="sug-top">
            <span class="sug-tag">${tagIcon(p.icon)}<span>${esc(p.tag)}</span></span>
            <span class="sug-rate"><b>${starSvg}${p.rating}</b><span>(${esc(p.reviews)})</span></span>
          </div>
          <h4>${esc(p.name)}</h4>
          <p>${esc(p.blurb)}</p>
          <button class="sug-cta" type="button" data-explore="${p.id}">Explore Now ${arrowSvg}</button>
        </div>
      </article>`
      )
      .join('');
    wrap.hidden = false;
    scrollChat();
  }

  /* ---------------- conversation & persistent memory ---------------- */

  const CHAT_STORAGE_KEY = 'banglapath_ai_chat_history_v2';

  function saveChatHistory() {
    // Kept in-memory for active session. Does not persist across refresh as requested.
  }

  function loadChatHistory() {
    return null;
  }

  async function send(text, { display = text } = {}) {
    if (!text.trim()) return;
    if (busy) {
      // Safety unlock if busy state was pending
      busy = false;
    }
    addMessage('user', display);
    history.push({ role: 'user', text });
    document.querySelector('.chips')?.remove();

    const typing = addTyping();
    setBusy(true);

    // Timeout safety fallback
    const busyTimer = setTimeout(() => {
      if (busy) setBusy(false);
    }, 20000);

    try {
      const { reply, places } = await askGemini(history.slice(-30));
      clearTimeout(busyTimer);
      typing.remove();
      addMessage('bot', reply);
      history.push({ role: 'model', text: reply });
      renderSuggestions(places);
    } catch (err) {
      clearTimeout(busyTimer);
      typing.remove();
      const row = addMessage(
        'bot',
        `Ish, my line dropped for a second (；一_一)\n\n${err.message}\n\nTry me again in a moment?`
      );
      row.classList.add('is-error');
      console.error('[BanglaPath]', err);
    } finally {
      clearTimeout(busyTimer);
      setBusy(false);
    }
  }

  function greet() {
    addMessage(
      'bot',
      "Assalamu alaikum, and welcome (◕‿◕) I am Bangladesh — all 64 districts of me, right here.\n\nTap any red pin on my map and I'll tell you what that place feels like. Or just ask me anything, bhai."
    );
    const chips = document.createElement('div');
    chips.className = 'chips';
    [
      ['Where should I go first?', 'I have never been to Bangladesh. Where should I go first?'],
      ['Best time to visit?', 'What is the best time of year to visit you?'],
      ['What should I eat?', 'What food should I absolutely eat while I am there?'],
    ].forEach(([label, prompt]) => {
      const b = document.createElement('button');
      b.className = 'chip';
      b.type = 'button';
      b.textContent = label;
      b.addEventListener('click', () => send(prompt, { display: label }));
      chips.appendChild(b);
    });
    log().appendChild(chips);
    renderSuggestions(catalog.openingSuggestions);
  }

  function initChatHistory() {
    // User requested: on refresh, all conversation should be gone and start fresh!
    try {
      localStorage.removeItem(CHAT_STORAGE_KEY);
    } catch (e) {}
    history = [];
    busy = false;
    const l = log();
    if (l) l.innerHTML = '';
    greet();
  }

  function resetChat() {
    history = [];
    busy = false;
    try {
      localStorage.removeItem(CHAT_STORAGE_KEY);
    } catch (e) {}
    const l = log();
    if (l) l.innerHTML = '';
    renderSuggestions([]);
    greet();
  }

  /* ---------------- map pins ---------------- */

  function renderPins() {
    const frame = $('#map-frame');
    if (!frame) return;
    frame.querySelectorAll('.pin').forEach((el) => el.remove());

    const DEFAULT_PINS = [
      { id: 'paharpur', label: 'Paharpur Vihara', x: 27.5, y: 20.5 },
      { id: 'tanguarhaor', label: 'Tanguar Haor', x: 60.0, y: 20.5 },
      { id: 'lalbagh', label: 'Dhaka & Lalbagh Fort', x: 45.8, y: 35.5 },
      { id: 'sundarbans', label: 'Sundarbans', x: 28.8, y: 56.5 },
      { id: 'sajek', label: 'Sajek Valley', x: 75.2, y: 53.5 },
      { id: 'coxsbazar', label: "Cox's Bazar", x: 73.2, y: 69.0 },
      { id: 'saintmartin', label: "Saint Martin's Island", x: 98.0, y: 83.0 }
    ];
    const pins = (catalog.pins && catalog.pins.length) ? catalog.pins : DEFAULT_PINS;
    pins.forEach((pin) => {
      const place = byId.get(pin.id);
      const label = pin.label || pin.name || (place && place.name) || 'Destination';
      const x = typeof pin.x === 'number' ? pin.x : 50;
      const y = typeof pin.y === 'number' ? pin.y : 50;

      const btn = document.createElement('button');
      btn.className = 'pin';
      btn.type = 'button';
      btn.style.left = `${x}%`;
      btn.style.top = `${y}%`;
      btn.dataset.id = pin.id;
      btn.setAttribute('aria-label', `Ask about ${label}`);
      btn.innerHTML =
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.6c-4.1 0-7.4 3.3-7.4 7.4 0 5.3 6.5 12.6 6.8 12.9a.8.8 0 0 0 1.2 0c.3-.3 6.8-7.6 6.8-12.9 0-4.1-3.3-7.4-7.4-7.4z"/><circle cx="12" cy="9" r="2.7" fill="#fff" stroke="none"/></svg>' +
        `<span class="pin-label">${esc(label)}</span>`;
      btn.addEventListener('click', () => askAboutPin({ ...pin, label, x, y }, place));
      frame.appendChild(btn);
    });
  }

  function askAboutPin(pin, place) {
    if (busy) return;
    document.querySelectorAll('.pin').forEach((el) => el.classList.remove('is-active'));
    document.querySelector(`.pin[data-id="${pin.id}"]`)?.classList.add('is-active');
    openChat();
    const label = pin.label || pin.name || (place && place.name) || 'this destination';
    const name = place ? `${place.name}, ${place.district}` : label;
    send(
      `I just tapped the map pin on ${name}. Tell me about this place in your own voice — what it feels like, what I would see and do there, and the best time to come.`,
      { display: `Tell me about ${label} 📍` }
    );
  }

  /* ---------------- recommended rail ---------------- */

  function cardMarkup(p) {
    return `
      <button class="place-card" type="button" data-id="${p.id}" aria-label="${esc(p.name)}, ${esc(p.district)}">
        <img src="${p.image}" alt="${esc(p.name)}" loading="lazy" />
        <div class="card-gradient-top"></div>
        <div class="card-gradient-bottom"></div>
        <div class="card-top-row">
          <span class="card-tag-pill">${tagIcon(p.icon)}<span>${esc(p.tag)}</span></span>
          <span class="card-rate-pill">
            <svg viewBox="0 0 24 24" class="card-star" aria-hidden="true"><path d="m12 3.2 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.7l6.1-.9z"/></svg>
            <b>${p.rating}</b>
            <span class="reviews-count">(${esc(p.reviews)})</span>
          </span>
        </div>
        <div class="card-bottom-info">
          <h3 class="card-title">${esc(p.name)}</h3>
          <p class="card-blurb">${esc(p.blurb)}</p>
        </div>
      </button>`;
  }

  function exploreCardMarkup(p, index) {
    const badgeText = p.tag || (p.isFood ? 'Traditional Dish' : 'Popular Destination');
    const badgeIcon = p.isFood ? '🥘' : '🏅';
    const ratingText = `${p.rating}`;
    const reviewsText = p.reviews ? `(${p.reviews})` : '';
    const isOdd = index % 2 !== 0;

    return `
      <div class="disc-place-card place-card" data-id="${p.id}" tabindex="0" role="button" aria-label="${esc(p.name)}, ${esc(p.district)}">
        <img src="${p.image}" alt="${esc(p.name)}" class="disc-card-bg" loading="lazy" onerror="this.onerror=null; this.src='${p.isFood ? 'images/categories/cuisine.jpg' : 'images/places/sajek.jpg'}';" />
        <div class="disc-card-overlay"></div>
        
        <div class="disc-card-top">
          <span class="disc-card-badge">
            <span class="disc-badge-medal">${badgeIcon}</span>
            <span class="disc-badge-text">${esc(badgeText)}</span>
          </span>
          <span class="disc-card-rating">
            <span class="disc-star">★</span>
            <span class="disc-score">${ratingText}</span>
            <span class="disc-reviews">${reviewsText}</span>
          </span>
        </div>

        <span class="disc-card-arrow">➜</span>

        <div class="disc-card-bottom">
          <h2 class="disc-card-title">${esc(p.name)}</h2>
          <p class="disc-card-sub">${esc(p.about || p.blurb || p.facts)}</p>
        </div>
      </div>`;
  }

  function fillRail(railSel, ids) {
    const rail = $(railSel);
    if (!rail) return;
    const items = ids.map((id) => byId.get(id)).filter(Boolean);
    if (railSel === '#disc-rail') {
      rail.innerHTML = items.map((p, i) => exploreCardMarkup(p, i)).join('');
    } else {
      rail.innerHTML = items.map(cardMarkup).join('');
    }
    updateRailButtons();
  }

  function renderRail() {
    fillRail('#reco-rail', catalog.recommended);
    updateDiscoverCards();
  }

  function railStep(railSel) {
    const card = $(`${railSel} .place-card`);
    return card ? card.offsetWidth + 22 : 290;
  }

  function updateRailButtons() {
    [
      ['#reco-rail', '#reco-prev', '#reco-next'],
      ['#disc-rail', '#disc-prev', '#disc-next'],
      ['#pdp-rail', '#pdp-prev', '#pdp-next'],
    ].forEach(([railSel, prevSel, nextSel]) => {
      const rail = $(railSel);
      const prev = $(prevSel);
      const next = $(nextSel);
      if (!rail) return;
      const max = rail.scrollWidth - rail.clientWidth - 2;
      if (prev) prev.disabled = rail.scrollLeft <= 2;
      if (next) next.disabled = rail.scrollLeft >= max;
    });
  }

  /* ---------------- discover page ---------------- */

  function renderCats() {
    const cats = catalog.categories || [];
    const placeCats = cats.filter(c => c.type === 'place' || ['beaches', 'hills', 'historical', 'nature', 'city', 'haor', 'waterfalls', 'islands', 'tea_valleys', 'forests', 'lakes', 'rural'].includes(c.id));
    const foodCats = cats.filter(c => c.type === 'food' || ['cuisine', 'streetfood', 'seafood', 'sweets', 'tea', 'biryani', 'pitha', 'bhorta', 'bakery', 'fruits', 'coastal_grill', 'tribal_food'].includes(c.id));

    const row1 = placeCats.length ? placeCats : cats.slice(0, Math.ceil(cats.length / 2));
    const row2 = foodCats.length ? foodCats : cats.slice(Math.ceil(cats.length / 2));

    const makeCatHtml = (c) => `
      <button class="cat disc-cat-card" type="button" data-cat="${c.id}" title="${esc(c.label)}">
        <img src="${c.image}" alt="${esc(c.label)}" loading="lazy" />
        <span>${esc(c.label)}</span>
      </button>`;

    const r1El = $('#cats-row-1') || $('#cats');
    if (r1El) r1El.innerHTML = row1.map(makeCatHtml).join('');

    const r2El = $('#cats-row-2');
    if (r2El) r2El.innerHTML = row2.map(makeCatHtml).join('');

    const setupNav = (rowEl, prevBtn, nextBtn) => {
      if (!rowEl) return;
      const update = () => {
        const max = rowEl.scrollWidth - rowEl.clientWidth - 4;
        if (prevBtn) prevBtn.style.display = rowEl.scrollLeft > 10 ? 'flex' : 'none';
        if (nextBtn) nextBtn.style.display = rowEl.scrollLeft < max ? 'flex' : 'none';
      };
      rowEl.addEventListener('scroll', update, { passive: true });
      if (prevBtn) prevBtn.onclick = () => rowEl.scrollBy({ left: -240, behavior: 'smooth' });
      if (nextBtn) nextBtn.onclick = () => rowEl.scrollBy({ left: 240, behavior: 'smooth' });
      setTimeout(update, 120);
    };

    setupNav(r1El, $('#disc-prev-1'), $('#disc-arrow-1'));
    setupNav(r2El, $('#disc-prev-2'), $('#disc-arrow-2'));
  }

  const currentDiscoverFilter = {
    division: 'all',
    category: null,
    search: '',
    mode: 'all',
  };

  function updateDiscoverCards() {
    let list = catalog.places ? [...catalog.places] : [];

    // Category filter has primary priority
    if (currentDiscoverFilter.category) {
      const cat = (catalog.categories || []).find((c) => c.id === currentDiscoverFilter.category);
      if (cat && cat.places && cat.places.length) {
        const pSet = new Set(cat.places);
        list = (catalog.places || []).filter((p) => pSet.has(p.id));
      } else {
        list = [];
      }
    } else {
      // Filter by mode (places vs foods vs curated)
      if (currentDiscoverFilter.mode === 'foods') {
        list = list.filter((p) => p.isFood);
      } else if (currentDiscoverFilter.mode === 'reco') {
        const recoSet = new Set(catalog.recommended || []);
        list = list.filter((p) => recoSet.has(p.id));
      } else if (!currentDiscoverFilter.search) {
        // Default 'all' mode shows destinations
        list = list.filter((p) => !p.isFood);
      }
    }

    // Division filter
    if (currentDiscoverFilter.division && currentDiscoverFilter.division !== 'all') {
      list = list.filter((p) => (p.division || '').toLowerCase() === currentDiscoverFilter.division.toLowerCase());
    }

    // Search query filter
    if (currentDiscoverFilter.search) {
      const q = currentDiscoverFilter.search.toLowerCase().trim();
      const pool = (currentDiscoverFilter.mode === 'foods' || (currentDiscoverFilter.category && (catalog.categories || []).find((c) => c.id === currentDiscoverFilter.category)?.type === 'food'))
        ? (catalog.places || []).filter((p) => p.isFood) 
        : (catalog.places || []);
      list = pool.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.district && p.district.toLowerCase().includes(q)) ||
          (p.division && p.division.toLowerCase().includes(q)) ||
          (p.tag && p.tag.toLowerCase().includes(q)) ||
          (p.blurb && p.blurb.toLowerCase().includes(q)) ||
          (p.about && p.about.toLowerCase().includes(q))
      );
      if (currentDiscoverFilter.division && currentDiscoverFilter.division !== 'all') {
        list = list.filter((p) => (p.division || '').toLowerCase() === currentDiscoverFilter.division.toLowerCase());
      }
    }

    // Heading and count badge
    const headingEl = $('#disc-heading');
    const badgeEl = $('#disc-count-badge');

    const activeCat = currentDiscoverFilter.category
      ? (catalog.categories || []).find((c) => c.id === currentDiscoverFilter.category)
      : null;
    const isFoodView = currentDiscoverFilter.mode === 'foods' || (activeCat && activeCat.type === 'food');

    if (headingEl) {
      if (currentDiscoverFilter.search) {
        headingEl.textContent = `Search results for "${currentDiscoverFilter.search}"`;
      } else if (activeCat) {
        headingEl.textContent = activeCat.type === 'food'
          ? `${activeCat.label} (Traditional Dishes)`
          : `${activeCat.label} Destinations`;
      } else if (currentDiscoverFilter.division !== 'all') {
        headingEl.textContent = isFoodView
          ? `${currentDiscoverFilter.division} Traditional Dishes`
          : `${currentDiscoverFilter.division} Division Destinations`;
      } else if (currentDiscoverFilter.mode === 'foods') {
        headingEl.textContent = 'Traditional Foods of Bangladesh (54 Iconic Dishes)';
      } else if (currentDiscoverFilter.mode === 'reco') {
        headingEl.textContent = 'Curated Top Destinations';
      } else {
        headingEl.textContent = 'All Destinations in Bangladesh';
      }
    }

    if (badgeEl) {
      badgeEl.textContent = isFoodView
        ? `${list.length} ${list.length === 1 ? 'dish' : 'dishes'}`
        : `${list.length} ${list.length === 1 ? 'place' : 'places'}`;
    }

    const rail = $('#disc-rail');
    if (rail) {
      if (list.length === 0) {
        rail.innerHTML = `
          <div class="disc-empty-state" style="grid-column: 1 / -1; text-align: center; padding: 40px 20px;">
            <p style="font-size: 16px; color: var(--ink-soft); margin-bottom: 12px;">No items match the selected criteria.</p>
            <button type="button" class="link-btn" id="disc-reset-empty-btn" style="color: var(--primary, #00875a); font-weight: 600; cursor: pointer;">Reset Filters to View All</button>
          </div>
        `;
        $('#disc-reset-empty-btn')?.addEventListener('click', resetDiscover);
      } else {
        rail.innerHTML = list.map((p, i) => exploreCardMarkup(p, i)).join('');
      }
    }
  }

  function showCategory(id) {
    const cat = (catalog.categories || []).find((c) => c.id === id);
    if (!cat) return;
    const picked = currentDiscoverFilter.category === id;
    if (picked) {
      currentDiscoverFilter.category = null;
      document.querySelectorAll('.cat').forEach((el) => el.classList.remove('is-active'));
    } else {
      currentDiscoverFilter.category = id;
      currentDiscoverFilter.division = 'all';
      currentDiscoverFilter.search = '';
      const discInput = $('#disc-input');
      if (discInput) discInput.value = '';
      document.querySelectorAll('.disc-div-pill').forEach((b) => b.classList.toggle('is-active', b.dataset.div === 'all'));
      document.querySelectorAll('.cat').forEach((el) => el.classList.toggle('is-active', el.dataset.cat === id));

      if (cat.type === 'food') {
        currentDiscoverFilter.mode = 'foods';
        $('#disc-show-foods-btn')?.classList.add('is-active');
        $('#disc-show-all-btn')?.classList.remove('is-active');
        $('#disc-show-reco-btn')?.classList.remove('is-active');
      } else {
        currentDiscoverFilter.mode = 'all';
        $('#disc-show-all-btn')?.classList.add('is-active');
        $('#disc-show-foods-btn')?.classList.remove('is-active');
        $('#disc-show-reco-btn')?.classList.remove('is-active');
      }
    }
    updateDiscoverCards();
  }

  function resetDiscover() {
    currentDiscoverFilter.division = 'all';
    currentDiscoverFilter.category = null;
    currentDiscoverFilter.search = '';
    currentDiscoverFilter.mode = 'all';
    const discInput = $('#disc-input');
    if (discInput) discInput.value = '';
    document.querySelectorAll('.cat').forEach((el) => el.classList.remove('is-active'));
    document.querySelectorAll('.disc-div-pill').forEach((b) => b.classList.toggle('is-active', b.dataset.div === 'all'));
    $('#disc-show-all-btn')?.classList.add('is-active');
    $('#disc-show-foods-btn')?.classList.remove('is-active');
    $('#disc-show-reco-btn')?.classList.remove('is-active');
    updateDiscoverCards();
  }

  function updateMobileViewVisibility(view) {
    if (window.innerWidth > 768) return;

    const appEl = document.getElementById('app');
    const mhEl = document.getElementById('mobile-home');
    if (!appEl || !mhEl) return;

    if (view === 'home') {
      appEl.classList.remove('mobile-subview-active');
      appEl.style.removeProperty('display');
      
      const mhBody = mhEl.querySelector('.mh-body');
      const mhHeader = mhEl.querySelector('.mh-header');
      if (mhBody) mhBody.style.removeProperty('display');
      if (mhHeader) mhHeader.style.removeProperty('display');
      mhEl.style.removeProperty('display');
      mhEl.style.removeProperty('background');
      mhEl.style.removeProperty('pointer-events');
    } else {
      appEl.classList.add('mobile-subview-active');
      appEl.style.setProperty('display', 'block', 'important');
      appEl.hidden = false;

      const mhBody = mhEl.querySelector('.mh-body');
      const mhHeader = mhEl.querySelector('.mh-header');
      if (mhBody) mhBody.style.setProperty('display', 'none', 'important');
      if (mhHeader) mhHeader.style.setProperty('display', 'none', 'important');
      mhEl.style.setProperty('display', 'block', 'important');
      mhEl.style.setProperty('background', 'transparent', 'important');
      mhEl.style.setProperty('pointer-events', 'none', 'important');
    }

    // Sync mobile bottom nav active class
    document.querySelectorAll('.mh-nav-item').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.mhView === view);
    });
  }

  function setView(view) {
    const isMobile = window.innerWidth <= 768;
    const mhEl = document.getElementById('mobile-home');
    const appEl = document.getElementById('app');
    if (mhEl && isMobile) {
      if (view === 'home') {
        mhEl.style.display = 'flex';
        if (appEl) { appEl.style.display = 'none'; appEl.hidden = true; }
      } else {
        mhEl.style.display = 'none';
        if (appEl) { appEl.style.setProperty('display', 'flex', 'important'); appEl.hidden = false; }
      }
    }

    $('#page-home').hidden = view !== 'home';
    $('#page-discover').hidden = view !== 'explore';
    $('#page-planner').hidden = view !== 'planner';
    $('#page-assistant').hidden = view !== 'assistant';
    $('#page-translator').hidden = view !== 'translator';
    $('#page-saved').hidden = view !== 'saved';
    if ($('#page-profile')) $('#page-profile').hidden = view !== 'profile';
    $('#page-place').hidden = view !== 'place';
    $('#app').classList.toggle('on-discover', view === 'explore');
    $('#app').classList.toggle('on-planner', view === 'planner');
    $('#app').classList.toggle('on-assistant', view === 'assistant');
    $('#app').classList.toggle('on-translator', view === 'translator');
    $('#app').classList.toggle('on-saved', view === 'saved');
    $('#app').classList.toggle('on-profile', view === 'profile');
    $('#app').classList.toggle('on-place', view === 'place');
    const sr = $('#search-results');
    if (sr) sr.hidden = true;
    const dr = $('#disc-results');
    if (dr) dr.hidden = true;
    if (view !== 'place') showMap(null);
    if (view !== 'place') lastView = view;
    if (view === 'planner') {
      renderPlanner();
    } else if (view === 'translator') {
      renderTranslator();
    } else if (view === 'assistant') {
      $('#app').classList.add('chat-hidden');
      renderAssistant();
    } else if (view === 'saved') {
      renderSaved();
    } else if (view === 'profile') {
      renderProfile();
    }
    updateMobileViewVisibility(view);
    requestAnimationFrame(updateRailButtons);
  }

  /* ---------------- place details page ---------------- */

  function showMap(p) {
    const box = $('#chat-map');
    if (!p || typeof p.lat !== 'number') {
      box.hidden = true;
      $('#place-map').src = 'about:blank';
      return;
    }
    // High quality Google Maps embed for the place
    const q = encodeURIComponent(`${p.name}, ${p.district}, Bangladesh`);
    $('#place-map').src = `https://maps.google.com/maps?q=${q}&t=m&z=12&output=embed&iwloc=near`;
    $('#place-map').title = `Map of ${p.name}`;
    $('#map-open').href = `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lon}`;
    $('#map-open').textContent = 'Open in Google Maps';
    box.hidden = false;
  }

  function factIconFor(kind, type) {
    if (type === 'fare') {
      if (kind === 'Water') {
        return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 20a2.4 2.4 0 0 0 2 1 2.4 2.4 0 0 0 2-1 2.4 2.4 0 0 1 2-1 2.4 2.4 0 0 1 2 1 2.4 2.4 0 0 0 2 1 2.4 2.4 0 0 0 2-1 2.4 2.4 0 0 1 2-1 2.4 2.4 0 0 1 2 1 2.4 2.4 0 0 0 2 1 2.4 2.4 0 0 0 2-1M4 17l1.5-6h13l1.5 6H4zM12 4v7M12 4l6 7H12z"/></svg>';
      }
      if (kind === 'Rail') {
        return '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="3" width="16" height="13" rx="3"/><path d="M4 10h16M7 19l-2 3M17 19l2 3M8 19h8"/><circle cx="8" cy="14" r="1.5"/><circle cx="16" cy="14" r="1.5"/></svg>';
      }
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="3" width="16" height="14" rx="3"/><path d="M4 9h16M7 20v2M17 20v2M4 14h16"/><circle cx="8" cy="16.5" r="1.2"/><circle cx="16" cy="16.5" r="1.2"/></svg>';
    }
    if (type === 'season') {
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/><path d="M8 21l1-2M12 21l1-2M16 21l1-2"/></svg>';
    }
    if (type === 'distance') {
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="3"/><path d="M12 8v13M5 12h14M5 12a7 7 0 0 0 14 0"/></svg>';
    }
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-6.4 7-11a7 7 0 1 0-14 0c0 4.6 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/></svg>';
  }

  function travelTypeSvg(kind) {
    if (kind === 'Water') {
      return '<svg viewBox="0 0 24 24" class="travel-icon wave" aria-hidden="true"><path d="M2 12c2.5-3 5-3 7.5 0s5 3 7.5 0 5-3 5-3M2 17c2.5-3 5-3 7.5 0s5 3 7.5 0 5-3 5-3"/></svg>';
    }
    if (kind === 'Rail') {
      return '<svg viewBox="0 0 24 24" class="travel-icon rail" aria-hidden="true"><rect x="4" y="3" width="16" height="13" rx="3"/><path d="M4 10h16M7 19l-2 3M17 19l2 3M8 19h8"/><circle cx="8" cy="14" r="1.5"/><circle cx="16" cy="14" r="1.5"/></svg>';
    }
    if (kind === 'Air') {
      return '<svg viewBox="0 0 24 24" class="travel-icon air" aria-hidden="true"><path d="M2.5 13.5 21 5l-4.5 8.5L21 19l-8-2.5-4 4-.5-4.5z"/></svg>';
    }
    return '<svg viewBox="0 0 24 24" class="travel-icon road" aria-hidden="true"><path d="M5 21 8 3M19 21 16 3M12 4v3M12 10.5v3M12 17v3"/></svg>';
  }

  function renderPdpStars(rating) {
    const score = parseFloat(rating) || 0;
    let html = `<div class="pdp-stars-row" aria-label="${score} out of 5 stars">`;
    for (let i = 1; i <= 5; i++) {
      if (score >= i) {
        html += `<svg viewBox="0 0 24 24" class="pdp-star full" aria-hidden="true"><path d="m12 2.5 2.8 6 6.6.9-4.8 4.6 1.2 6.5-5.8-3.1-5.8 3.1 1.2-6.5L2.6 9.4l6.6-.9z" fill="#f59e0b"/></svg>`;
      } else if (score > i - 1) {
        const pct = Math.round((score - (i - 1)) * 100);
        const gradId = `pdp-star-grad-${Math.round(score * 10)}-${i}`;
        html += `
          <svg viewBox="0 0 24 24" class="pdp-star partial" aria-hidden="true">
            <defs>
              <linearGradient id="${gradId}">
                <stop offset="${pct}%" stop-color="#f59e0b" />
                <stop offset="${pct}%" stop-color="#d1d5db" />
              </linearGradient>
            </defs>
            <path d="m12 2.5 2.8 6 6.6.9-4.8 4.6 1.2 6.5-5.8-3.1-5.8 3.1 1.2-6.5L2.6 9.4l6.6-.9z" fill="url(#${gradId})"/>
          </svg>`;
      } else {
        html += `<svg viewBox="0 0 24 24" class="pdp-star empty" aria-hidden="true"><path d="m12 2.5 2.8 6 6.6.9-4.8 4.6 1.2 6.5-5.8-3.1-5.8 3.1 1.2-6.5L2.6 9.4l6.6-.9z" fill="#d1d5db"/></svg>`;
      }
    }
    html += '</div>';
    return html;
  }

  function formatPdpReviews(p) {
    if (p.rating === 4.7 || p.id === 'sajek') return '13,839';
    if (p.reviewsExact) return Number(p.reviewsExact).toLocaleString();
    if (typeof p.reviews === 'string') {
      const matchK = p.reviews.match(/^(\d+)(?:\.\d+)?K\+?$/i);
      if (matchK) {
        const num = parseInt(matchK[1], 10) * 1000 + 420;
        return num.toLocaleString();
      }
      return p.reviews;
    }
    if (typeof p.reviews === 'number') return p.reviews.toLocaleString();
    return '13,839';
  }

  function galleryMarkup(p) {
    const shots = (p.gallery && p.gallery.length ? p.gallery : [p.image]);
    const visibleShots = shots.slice(0, 3);
    const extraCount = shots.length > 3 ? shots.length - 3 : 0;
    const badgeText = p.tag || 'Popular Destination in BD';

    return `
      <div class="pdp-badge-gallery-row">
        <div class="pdp-ribbon-badge">
          <span class="pdp-ribbon-icon">🏅</span>
          <span class="pdp-ribbon-text">${esc(badgeText)}</span>
        </div>
        ${shots.length > 1 ? `
          <div class="pdp-thumbs-group">
            <div class="pdp-thumbs">
              ${visibleShots.map((src, i) => `
                <button type="button" class="${i === 0 ? 'is-active' : ''}" data-shot="${esc(src)}" aria-label="Photo ${i + 1}">
                  <img src="${esc(src)}" alt="" loading="lazy" onerror="this.onerror=null; this.src='${p.isFood ? 'images/categories/cuisine.jpg' : 'images/places/sajek.jpg'}';" />
                </button>
              `).join('')}
            </div>
            ${extraCount > 0 ? `<span class="pdp-thumbs-more">+${extraCount}</span>` : ''}
          </div>
        ` : ''}
      </div>`;
  }

  function getFoodEatingVideos(p) {
    const name = (p.name || '').toLowerCase();
    const tag = (p.tag || '').toLowerCase();
    const id = (p.id || '').toLowerCase();

    if (name.includes('kacchi') || name.includes('biryani') || name.includes('tehari') || name.includes('polao') || name.includes('morog') || id.includes('kacchi') || id.includes('tehari')) {
      return [
        {
          id: 'jVmqSS9Q3Tg',
          title: `Traditional Old Dhaka Kacchi Biryani Feast - Food Eating Vlog`,
          channel: 'Bangla Food Explorer',
          badge: 'Heritage Biryani Feast',
        },
        {
          id: 'VDFA-DffLTY',
          title: 'Dhaka Street Food Challenge & Iconic Meat Biryani Review',
          channel: 'Best Ever Food Review Show',
          badge: 'Famous Food Vlog',
        },
      ];
    }

    if (name.includes('pitha') || tag.includes('pitha') || id.includes('pitha')) {
      return [
        {
          id: 'k7QDUmR_TjU',
          title: `Authentic Winter Pitha Making & Tasting Tour in Bangladesh`,
          channel: 'Rural Food Diaries BD',
          badge: 'Winter Pitha Festival',
        },
        {
          id: 'VDFA-DffLTY',
          title: 'Village Sweets & Traditional Steamed Pitha Food Tour',
          channel: 'Foodie Trails BD',
          badge: 'Traditional Sweets',
        },
      ];
    }

    if (name.includes('kala bhuna') || name.includes('mezban') || name.includes('beef') || id.includes('bhuna') || id.includes('mezban')) {
      return [
        {
          id: 'spB8OVpM-4Q',
          title: `Authentic Chittagong Kala Bhuna & Traditional Mezban Feast`,
          channel: 'Chittagong Food Vlogs',
          badge: 'Chittagong Heritage',
        },
        {
          id: 'V2jk8PclZwg',
          title: 'Iconic Spiced Beef Curries & Street Feasts in Bangladesh',
          channel: 'The Food Ranger',
          badge: 'Extreme Flavor Tour',
        },
      ];
    }

    if (name.includes('tea') || name.includes('cha') || id.includes('tea')) {
      return [
        {
          id: 'rUBA8_469AI',
          title: `Tasting the World-Famous 7 Layer Tea in Sreemangal & Sylhet`,
          channel: 'Bangladesh Travel Food',
          badge: 'Iconic 7-Color Tea',
        },
        {
          id: 'V2jk8PclZwg',
          title: 'Tea Garden Stalls & Street Snacks in Rural Bangladesh',
          channel: 'Street Food Explorer',
          badge: 'Tea Estate Tasting',
        },
      ];
    }

    if (name.includes('fuchka') || name.includes('chotpoti') || name.includes('jhalmuri') || name.includes('snack') || id.includes('fuchka')) {
      return [
        {
          id: 'ALDM6qHzw6k',
          title: `Surviving on Spicy Bangladeshi Fuchka & Street Food Challenge`,
          channel: 'Hugh Abroad',
          badge: 'Crispy Fuchka Vlog',
        },
        {
          id: 'VDFA-DffLTY',
          title: 'Ultimate Dhaka Street Food Challenge & Tangy Snacks',
          channel: 'Best Ever Food Review Show',
          badge: 'Street Food Review',
        },
      ];
    }

    if (name.includes('ilish') || name.includes('fish') || name.includes('chingri') || id.includes('ilish') || id.includes('hilsa')) {
      return [
        {
          id: 'V2jk8PclZwg',
          title: `Padma River Fresh Hilsa / Ilish Mustard Feast & River Fish Tour`,
          channel: 'The Food Ranger',
          badge: 'River Fish Feast',
        },
        {
          id: 'VDFA-DffLTY',
          title: 'Traditional Bengali Fish Curries & Village Food Crawl',
          channel: 'Best Ever Food Review Show',
          badge: 'Authentic Seafood',
        },
      ];
    }

    // Curated default authentic food vlog videos for traditional Bangladeshi dishes
    return [
      {
        id: 'VDFA-DffLTY',
        title: `Authentic Bangladeshi Food Tour & Tasting Traditional ${p.name}`,
        channel: 'Best Ever Food Review Show',
        badge: 'Food Eating Blog',
      },
      {
        id: 'V2jk8PclZwg',
        title: `Traditional Feast in Bangladesh - Iconic Flavors & Local Eats`,
        channel: 'The Food Ranger',
        badge: 'Street Food Review',
      },
    ];
  }

  function renderPlace(p) {
    const isFood = Boolean(p.isFood);
    // Sort related places prioritising same division, travel/cuisine type & tag
    const related = catalog.places
      .filter((o) => o.id !== p.id && (isFood ? Boolean(o.isFood) : !o.isFood))
      .sort((a, b) => {
        const aScore = (a.division === p.division ? 5 : 0) + (a.foodCategory === p.foodCategory ? 4 : 0) + (a.travel === p.travel ? 3 : 0) + (a.tag === p.tag ? 2 : 0);
        const bScore = (b.division === p.division ? 5 : 0) + (b.foodCategory === p.foodCategory ? 4 : 0) + (b.travel === p.travel ? 3 : 0) + (b.tag === p.tag ? 2 : 0);
        return bScore - aScore;
      })
      .slice(0, 16);

    const categoryLabel = isFood
      ? (p.division ? `More ${p.division} Traditional Dishes` : `More Traditional Bangladeshi Dishes`)
      : (p.division ? `More in ${p.division} Division` : p.travel ? `More ${p.travel} type` : `More ${p.tag || 'places'}`);

    const foodVlogs = isFood ? getFoodEatingVideos(p) : [];

    $('#page-place').innerHTML = `
      <div class="pdp-gallery">
        <img class="pdp-shot" id="pdp-shot" src="${esc(p.image)}" alt="${esc(p.name)}" onerror="this.onerror=null; this.src='${isFood ? 'images/categories/cuisine.jpg' : 'images/places/sajek.jpg'}';" />
        <button class="pdp-float pdp-back" type="button" id="pdp-back" aria-label="Go back"><svg viewBox="0 0 24 24"><path d="M14 6 8 12l6 6"/></svg></button>
        <button class="pdp-float pdp-save ${isSavedPlace(p.id) ? 'is-on' : ''}" type="button" id="pdp-save" data-place-id="${p.id}" aria-label="Save this place"><svg viewBox="0 0 24 24"><path d="M12 20.2 4.6 13a4.4 4.4 0 0 1 6.2-6.2l1.2 1.2 1.2-1.2A4.4 4.4 0 1 1 19.4 13z"/></svg></button>
        <button class="pdp-float pdp-share" type="button" id="pdp-share" aria-label="Share this place"><svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="19" r="2.6"/><path d="m8.3 10.8 7.4-4.3M8.3 13.2l7.4 4.3"/></svg></button>
      </div>
      ${galleryMarkup(p)}

      <div class="pdp-header-row">
        <h1 class="pdp-main-title">${esc(p.name)}</h1>
        <div class="pdp-rating-badge">
          <span class="pdp-star-yellow">★</span>
          <span class="pdp-score">${p.rating}</span>
          <span class="pdp-review-count">(${formatPdpReviews(p)})</span>
        </div>
      </div>

      <div class="pdp-where-row">
        <svg viewBox="0 0 24 24" class="pdp-pin-red" aria-hidden="true"><path d="M12 21s7-6.4 7-11a7 7 0 1 0-14 0c0 4.6 7 11 7 11z"/><circle cx="12" cy="10" r="2.6" fill="#fff" stroke="none"/></svg>
        <span class="pdp-location-text">${esc(p.district)}, ${esc(p.division || 'Bangladesh')}</span>
        <span class="pdp-division-chip">${esc(p.division || 'Bangladesh')} Division</span>
      </div>

      <p class="pdp-about-text">${esc(p.about || p.facts)}</p>

      <div class="pdp-travel-row">
        <span class="pdp-travel-label">${isFood ? 'Cuisine / Origin:' : 'Travel type:'}</span>
        <span class="pdp-travel-value">${esc(p.travel || (isFood ? 'Traditional Feast' : 'Road'))}</span>
        <span class="pdp-travel-icon-box">${isFood ? '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:16px;height:16px"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="currentColor"/></svg>' : travelTypeSvg(p.travel)}</span>
      </div>

      <div class="pdp-facts-card">
        <div class="pdp-fact-cell">
          <i class="pdp-fact-icon-wrapper">${isFood ? '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:18px;height:18px"><circle cx="12" cy="12" r="9" stroke="currentColor" fill="none" stroke-width="2"/><path d="M12 7v10M9 10h6" stroke="currentColor" stroke-width="2"/></svg>' : factIconFor(p.travel, 'fare')}</i>
          <div class="pdp-fact-meta">
            <span class="pdp-fact-sub">${esc(p.fareLabel || (isFood ? 'Price / Plate' : (p.travel === 'Water' ? 'Boat Fare' : p.travel === 'Rail' ? 'Train Fare' : 'Bus Fare')))}</span>
            <b class="pdp-fact-main">${esc(p.fare || '—')}</b>
          </div>
        </div>
        <div class="pdp-fact-divider"></div>
        <div class="pdp-fact-cell">
          <i class="pdp-fact-icon-wrapper">${factIconFor(p.travel, 'season')}</i>
          <div class="pdp-fact-meta">
            <span class="pdp-fact-sub">${isFood ? 'Best Time / Season' : 'Best season'}</span>
            <b class="pdp-fact-main">${esc(p.season || 'All Year')}</b>
          </div>
        </div>
        <div class="pdp-fact-divider"></div>
        <div class="pdp-fact-cell">
          <i class="pdp-fact-icon-wrapper">${isFood ? '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:18px;height:18px"><circle cx="12" cy="12" r="9" stroke="currentColor" fill="none" stroke-width="2"/><path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' : factIconFor(p.travel, 'distance')}</i>
          <div class="pdp-fact-meta">
            <span class="pdp-fact-sub">${isFood ? 'Prep & Serving' : 'Distance'}</span>
            <b class="pdp-fact-main">${esc(p.distance || '—')}</b>
          </div>
        </div>
      </div>

      ${!isFood ? `
      <div class="pdp-view-map-wrap">
        <button class="pdp-view-map-btn" type="button" id="pdp-view-map" data-id="${p.id}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-6.4 7-11a7 7 0 1 0-14 0c0 4.6 7 11 7 11z"/><circle cx="12" cy="10" r="2.6" fill="#fff" stroke="none"/></svg>
          <span>View in map</span>
        </button>
      </div>` : ''}

      <div class="pdp-action-pills ${isFood ? 'pdp-action-pills-food' : ''}">
        ${!isFood ? `
        <button class="pdp-pill-btn pdp-trip-btn" type="button" id="pdp-trip" data-id="${p.id}" aria-label="Add to trip">
          <span class="pdp-pill-left">
            <svg viewBox="0 0 24 24" class="pdp-pill-icon" aria-hidden="true"><rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 12h18"/></svg>
            <span class="pdp-pill-label">Add to trip</span>
          </span>
          <span class="pdp-pill-circle"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></span>
        </button>

        <button class="pdp-pill-btn pdp-book-btn" type="button" id="pdp-book-now" data-id="${p.id}" aria-label="Book now">
          <span class="pdp-pill-left">
            <svg viewBox="0 0 24 24" class="pdp-pill-icon" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            <span class="pdp-pill-label">Book now</span>
          </span>
          <span class="pdp-pill-circle"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></span>
        </button>` : ''}

        <button class="pdp-pill-btn pdp-ai-btn ${isFood ? 'pdp-ai-food-hero-btn' : ''}" type="button" id="pdp-ask-ai" data-id="${p.id}" aria-label="Ask BanglaPath AI about this ${isFood ? 'dish' : 'place'}">
          <span class="pdp-pill-left">
            <svg viewBox="0 0 24 24" class="pdp-pill-icon" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
            <span class="pdp-pill-label">${isFood ? 'Ask AI Food Guide' : 'Ask AI Guide'}</span>
          </span>
          <span class="pdp-pill-circle"><svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg></span>
        </button>
      </div>

      ${isFood && foodVlogs.length > 0 ? `
      <section class="pdp-food-vlogs" aria-label="Authentic Food Eating Blogs">
        <div class="pdp-food-vlogs-head">
          <div class="pdp-food-vlogs-title">
            <span class="pdp-food-vlog-yt-icon">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="#ef4444"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            </span>
            <div>
              <h3>Food Eating Blog & Street Food Reviews</h3>
              <p>Watch authentic food and travel vloggers taste and review ${esc(p.name)} in Bangladesh</p>
            </div>
          </div>
        </div>
        <div class="pdp-vlogs-grid">
          ${foodVlogs.map((v) => `
            <div class="pdp-vlog-card">
              <div class="pdp-vlog-embed-wrap">
                <iframe
                  src="https://www.youtube-nocookie.com/embed/${v.id}?rel=0"
                  title="${esc(v.title)}"
                  frameborder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowfullscreen
                  loading="lazy"
                ></iframe>
              </div>
              <div class="pdp-vlog-meta">
                <span class="pdp-vlog-badge">${esc(v.badge)}</span>
                <h4 class="pdp-vlog-card-title">${esc(v.title)}</h4>
                <span class="pdp-vlog-channel">By ${esc(v.channel)}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </section>` : ''}

      <section class="reco pdp-reco-container">
        <div class="reco-head">
          <h2 class="pdp-reco-title">${esc(categoryLabel)}</h2>
          <div class="reco-tools">
            <button class="link-btn" type="button" id="pdp-view-all">View all</button>
            <button class="round-btn" type="button" id="pdp-prev" aria-label="Previous">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6"/></svg>
            </button>
            <button class="round-btn" type="button" id="pdp-next" aria-label="Next">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 6 6 6-6 6"/></svg>
            </button>
          </div>
        </div>
        <div class="reco-rail pdp-rail" id="pdp-rail">
          ${related.map(cardMarkup).join('')}
        </div>
      </section>`;

    // Wire PDP rail scroll buttons
    const pdpRail = $('#pdp-rail');
    const pdpPrev = $('#pdp-prev');
    const pdpNext = $('#pdp-next');
    if (pdpRail && pdpPrev && pdpNext) {
      pdpRail.addEventListener('scroll', updateRailButtons, { passive: true });
      pdpPrev.addEventListener('click', () => pdpRail.scrollBy({ left: -railStep('#pdp-rail'), behavior: 'smooth' }));
      pdpNext.addEventListener('click', () => pdpRail.scrollBy({ left: railStep('#pdp-rail'), behavior: 'smooth' }));
      updateRailButtons();
    }

    const pdpViewAll = $('#pdp-view-all');
    if (pdpViewAll) {
      pdpViewAll.addEventListener('click', () => {
        setView('explore');
        document.querySelectorAll('.rail-item').forEach((i) => i.classList.toggle('is-active', i.dataset.view === 'explore'));
      });
    }

    const bookBtn = $('#pdp-book-now');
    if (bookBtn) {
      bookBtn.addEventListener('click', () => openBookingModal(p.id));
    }
  }

  function travelSvg(kind) {
    const path = travelIcons[kind] || travelIcons.Road;
    return `<svg viewBox="0 0 24 24" aria-hidden="true" style="width:16px;height:16px;vertical-align:-3px;margin-right:5px">${path}</svg>`;
  }

  /* ---------------- Trip Planner (Unified Dynamic Calendar & Real Date Access) ---------------- */
  const realNow = new Date();
  const realTodayDay = realNow.getDate();
  const realTodayMonth = realNow.getMonth(); // 0-indexed
  const realTodayYear = realNow.getFullYear();

  let calCurrentYear = realTodayYear;
  let calCurrentMonth = realTodayMonth;
  let selectedDay = realTodayDay; // Defaults dynamically to today
  let plannerViewMode = 'month'; // 'month' | 'week' — mobile toggle state

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  function getRealTodayDateString() {
    const d = new Date();
    return `${weekdayNames[d.getDay()]}, ${monthNames[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }

  // Customizable Legend Configuration with persistence
  const DEFAULT_LEGEND_CONFIG = {
    planned: { id: 'planned', label: 'Planned', color: '#f59e0b' },
    booked: { id: 'booked', label: 'Booked', color: '#ef4444' },
    completed: { id: 'completed', label: 'Completed', color: '#22c55e' },
  };

  let legendConfig = loadLegendConfig();

  function loadLegendConfig() {
    try {
      const stored = localStorage.getItem('banglapath_legend_config');
      if (stored) {
        return { ...DEFAULT_LEGEND_CONFIG, ...JSON.parse(stored) };
      }
    } catch (e) {
      // fallback to defaults
    }
    return JSON.parse(JSON.stringify(DEFAULT_LEGEND_CONFIG));
  }

  function saveLegendConfig(newConfig) {
    legendConfig = newConfig;
    try {
      localStorage.setItem('banglapath_legend_config', JSON.stringify(legendConfig));
    } catch (e) {}
    applyLegendStyles();
  }

  function applyLegendStyles() {
    const root = document.documentElement;
    if (root) {
      root.style.setProperty('--legend-planned-color', legendConfig.planned?.color || '#f59e0b');
      root.style.setProperty('--legend-booked-color', legendConfig.booked?.color || '#ef4444');
      root.style.setProperty('--legend-completed-color', legendConfig.completed?.color || '#22c55e');
    }
  }

  // Initial apply
  applyLegendStyles();

  // Dots for calendar days
  const sampleDotsByDay = {
    4: ['planned'],
    6: ['planned'],
    8: ['planned'],
    10: ['booked', 'planned'],
    11: ['booked'],
    12: ['planned', 'completed'],
    14: ['booked'],
    15: ['booked'],
    16: ['booked'],
    19: ['planned'],
    21: ['planned'],
    26: ['planned'],
    27: ['completed'],
    28: ['completed'],
    29: ['completed'],
  };

  function getCalendarDays(year, month) {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon ...
    const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // Monday-first
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const days = [];

    // Leading adjacent days from prev month
    for (let i = startOffset - 1; i >= 0; i--) {
      days.push({ num: prevMonthDays - i, isAdjacent: true });
    }

    // Days of current month
    for (let d = 1; d <= daysInMonth; d++) {
      let dots = sampleDotsByDay[d] ? sampleDotsByDay[d].slice() : [];
      if (d === realTodayDay && month === realTodayMonth && year === realTodayYear && !dots.includes('booked')) {
        dots.unshift('booked');
      }
      days.push({ num: d, dots, isAdjacent: false });
    }

    // Trailing adjacent days to complete 7-column rows
    const remainder = days.length % 7;
    if (remainder > 0) {
      const nextDaysNeeded = 7 - remainder;
      for (let n = 1; n <= nextDaysNeeded; n++) {
        days.push({ num: n, isAdjacent: true });
      }
    }

    return days;
  }

  const calendarDaysData = getCalendarDays(realTodayYear, realTodayMonth);

  const itinerariesByDay = {
    14: {
      title: 'Old Dhaka Heritage & Flavors',
      morning: {
        period: 'Morning',
        time: '09:00 AM',
        icon: 'sun',
        theme: 'period-morning',
        image: 'images/places/lalbagh.jpg',
        tasks: [
          { id: 't14_1', text: 'Buy entry ticket & local guide', done: true },
          { id: 't14_2', text: "Visit Pari Bibi's Tomb & Museum", done: false },
          { id: 't14_3', text: 'Capture morning garden views', done: false },
        ],
      },
      afternoon: {
        period: 'Afternoon',
        time: '01:30 PM',
        icon: 'sun-ray',
        theme: 'period-afternoon',
        image: 'images/categories/streetfood.jpg',
        tasks: [
          { id: 't14_4', text: 'Try authentic Kacchi Biryani', done: false },
          { id: 't14_5', text: 'Taste traditional Beauty Lassi', done: false },
          { id: 't14_6', text: 'Walk through Shakharibazar alley', done: false },
        ],
      },
      evening: {
        period: 'Evening',
        time: '05:30 PM',
        icon: 'moon',
        theme: 'period-evening',
        image: 'images/places/ahsanmanzil.jpg',
        tasks: [
          { id: 't14_7', text: 'Tour the Pink Palace museum', done: false },
          { id: 't14_8', text: "Visit Pari Bibi's Tomb & Museum", done: false },
          { id: 't14_9', text: 'Capture morning garden views', done: false },
        ],
      },
    },
    11: {
      title: 'Ahsan Manzil & Buriganga Riverfront',
      morning: {
        period: 'Morning',
        time: '09:30 AM',
        icon: 'sun',
        theme: 'period-morning',
        image: 'images/places/ahsanmanzil.jpg',
        tasks: [
          { id: 't11_1', text: 'Explore Pink Palace grand ceremonial halls', done: true },
          { id: 't11_2', text: 'Photograph riverfront Mughal architecture', done: true },
        ],
      },
      afternoon: {
        period: 'Afternoon',
        time: '02:00 PM',
        icon: 'sun-ray',
        theme: 'period-afternoon',
        image: 'images/categories/streetfood.jpg',
        tasks: [
          { id: 't11_3', text: 'Savor traditional Bakarkhani & spiced tea', done: false },
          { id: 't11_4', text: 'Wander through historical brass artisan streets', done: false },
        ],
      },
      evening: {
        period: 'Evening',
        time: '05:30 PM',
        icon: 'moon',
        theme: 'period-evening',
        image: 'images/places/sadarghat.jpg',
        tasks: [
          { id: 't11_5', text: 'Watch wooden boat river bustle at Sadarghat', done: false },
          { id: 't11_6', text: 'Sunset tea by the riverside', done: false },
        ],
      },
    },
    12: {
      title: 'Sonargaon Ancient Capital Heritage',
      morning: {
        period: 'Morning',
        time: '08:30 AM',
        icon: 'sun',
        theme: 'period-morning',
        image: 'images/places/sonargaon.jpg',
        tasks: [
          { id: 't12_1', text: 'Depart Dhaka for Panam Nagar city', done: true },
          { id: 't12_2', text: 'Tour Folk Art & Craft Foundation', done: true },
          { id: 't12_3', text: 'Explore Zainul Abedin Museum gallery', done: false },
        ],
      },
      afternoon: {
        period: 'Afternoon',
        time: '01:00 PM',
        icon: 'sun-ray',
        theme: 'period-afternoon',
        image: 'images/places/sonargaon-2.jpg',
        tasks: [
          { id: 't12_4', text: 'Traditional lunch by Meghna river bank', done: false },
          { id: 't12_5', text: 'Photograph abandoned merchant mansions', done: false },
        ],
      },
      evening: {
        period: 'Evening',
        time: '05:00 PM',
        icon: 'moon',
        theme: 'period-evening',
        image: 'images/places/sonargaon-3.jpg',
        tasks: [
          { id: 't12_6', text: 'Sunset boat ride on ancient river canal', done: false },
          { id: 't12_7', text: 'Return drive back to Dhaka hotel', done: false },
        ],
      },
    },
    13: {
      title: 'Dhaka Modern Landmarks & Culture',
      morning: {
        period: 'Morning',
        time: '09:30 AM',
        icon: 'sun',
        theme: 'period-morning',
        image: 'images/categories/city.jpg',
        tasks: [
          { id: 't13_1', text: 'Tour National Parliament Building precinct', done: false },
          { id: 't13_2', text: 'Walk along Crescent Lake promenade', done: false },
        ],
      },
      afternoon: {
        period: 'Afternoon',
        time: '02:00 PM',
        icon: 'sun-ray',
        theme: 'period-afternoon',
        image: 'images/categories/cuisine.jpg',
        tasks: [
          { id: 't13_3', text: 'Artisanal coffee and lunch at Dhanmondi', done: false },
          { id: 't13_4', text: 'Visit Drik Gallery cultural photo exhibition', done: false },
        ],
      },
      evening: {
        period: 'Evening',
        time: '06:00 PM',
        icon: 'moon',
        theme: 'period-evening',
        image: 'images/places/lalbagh-3.jpg',
        tasks: [
          { id: 't13_5', text: 'Hatirjheel water taxi sunset ride', done: false },
          { id: 't13_6', text: 'Rooftop dinner overlooking illuminated skyline', done: false },
        ],
      },
    },
    15: {
      title: 'Sylhet & Srimangal Tea Country',
      morning: {
        period: 'Morning',
        time: '07:00 AM',
        icon: 'sun',
        theme: 'period-morning',
        image: 'images/places/srimangal.jpg',
        tasks: [
          { id: 't15_1', text: 'Board scenic morning Parabat Express to Srimangal', done: false },
          { id: 't15_2', text: 'Check-in to eco-tea resort amidst plantations', done: false },
        ],
      },
      afternoon: {
        period: 'Afternoon',
        time: '01:30 PM',
        icon: 'sun-ray',
        theme: 'period-afternoon',
        image: 'images/places/srimangal-2.jpg',
        tasks: [
          { id: 't15_3', text: 'Cycle through Finlay Tea Estate valleys', done: false },
          { id: 't15_4', text: 'Try Nilkantha famous 7-layer colored tea', done: false },
        ],
      },
      evening: {
        period: 'Evening',
        time: '05:30 PM',
        icon: 'moon',
        theme: 'period-evening',
        image: 'images/places/srimangal-3.jpg',
        tasks: [
          { id: 't15_5', text: 'Lawachara Rainforest twilight trek', done: false },
          { id: 't15_6', text: 'Spot hoolock gibbons and exotic forest birds', done: false },
        ],
      },
    },
    16: {
      title: 'Ratargul Freshwater Swamp Forest',
      morning: {
        period: 'Morning',
        time: '08:00 AM',
        icon: 'sun',
        theme: 'period-morning',
        image: 'images/places/ratargul.jpg',
        tasks: [
          { id: 't16_1', text: 'Wooden dinghy boat ride into drowned forest', done: false },
          { id: 't16_2', text: 'Climb watchtower for 360 canopy views', done: false },
        ],
      },
      afternoon: {
        period: 'Afternoon',
        time: '01:00 PM',
        icon: 'sun-ray',
        theme: 'period-afternoon',
        image: 'images/places/ratargul-2.jpg',
        tasks: [
          { id: 't16_3', text: 'Traditional Sylheti lunch (Shatkora Beef)', done: false },
          { id: 't16_4', text: 'Drive to crystal clear Lalakhal river', done: false },
        ],
      },
      evening: {
        period: 'Evening',
        time: '05:30 PM',
        icon: 'moon',
        theme: 'period-evening',
        image: 'images/places/jaflong.jpg',
        tasks: [
          { id: 't16_5', text: 'Sunset boat cruise at Zero Point Jaflong', done: false },
        ],
      },
    },
    17: {
      title: 'Sundarban Mangrove Wildlife Safari',
      morning: {
        period: 'Morning',
        time: '06:30 AM',
        icon: 'sun',
        theme: 'period-morning',
        image: 'images/places/sundarbans.jpg',
        tasks: [
          { id: 't17_1', text: 'Morning silent boat safari through Kotka canal', done: false },
          { id: 't17_2', text: 'Spotted deer and bird watching on trail', done: false },
        ],
      },
      afternoon: {
        period: 'Afternoon',
        time: '01:30 PM',
        icon: 'sun-ray',
        theme: 'period-afternoon',
        image: 'images/places/sundarbans-2.jpg',
        tasks: [
          { id: 't17_3', text: 'Fresh seafood meal on safari cruiser', done: false },
          { id: 't17_4', text: 'Visit Harbaria Eco Park wooden walkway', done: false },
        ],
      },
      evening: {
        period: 'Evening',
        time: '05:00 PM',
        icon: 'moon',
        theme: 'period-evening',
        image: 'images/places/sundarbans-3.jpg',
        tasks: [
          { id: 't17_5', text: 'Sunset over Bay of Bengal river delta', done: false },
        ],
      },
    },
    18: {
      title: 'Cox’s Bazar Golden Coastline',
      morning: {
        period: 'Morning',
        time: '07:30 AM',
        icon: 'sun',
        theme: 'period-morning',
        image: 'images/places/coxsbazar.jpg',
        tasks: [
          { id: 't18_1', text: 'Morning walk on world longest natural sand beach', done: false },
          { id: 't18_2', text: 'Surf lesson at Laboni beach', done: false },
        ],
      },
      afternoon: {
        period: 'Afternoon',
        time: '01:00 PM',
        icon: 'sun-ray',
        theme: 'period-afternoon',
        image: 'images/places/coxsbazar-2.jpg',
        tasks: [
          { id: 't18_3', text: 'Fresh grilled pomfret & king prawn lunch', done: false },
          { id: 't18_4', text: 'Marine Drive jeep ride to Himchari waterfalls', done: false },
        ],
      },
      evening: {
        period: 'Evening',
        time: '05:30 PM',
        icon: 'moon',
        theme: 'period-evening',
        image: 'images/places/coxsbazar-3.jpg',
        tasks: [
          { id: 't18_5', text: 'Dramatic red sunset at Inani coral beach', done: false },
        ],
      },
    },
    21: {
      title: 'Cox’s Bazar Marine Drive Adventure',
      morning: {
        period: 'Morning',
        time: '08:30 AM',
        icon: 'sun',
        theme: 'period-morning',
        image: 'images/places/coxsbazar.jpg',
        tasks: [
          { id: 't21_1', text: 'Open-top Moon Boat drive on 80km Marine Drive', done: false },
          { id: 't21_2', text: 'Hike to Himchari National Park viewpoint', done: false },
        ],
      },
      afternoon: {
        period: 'Afternoon',
        time: '01:30 PM',
        icon: 'sun-ray',
        theme: 'period-afternoon',
        image: 'images/places/coxsbazar-2.jpg',
        tasks: [
          { id: 't21_3', text: 'Fresh coconut water & grilled seafood lunch', done: false },
          { id: 't21_4', text: 'Beach volleyball & coral beach shell foraging', done: false },
        ],
      },
      evening: {
        period: 'Evening',
        time: '05:30 PM',
        icon: 'moon',
        theme: 'period-evening',
        image: 'images/places/coxsbazar-3.jpg',
        tasks: [
          { id: 't21_5', text: 'Sunset bonfire with live acoustic music', done: false },
        ],
      },
    },
    27: {
      title: 'Sajek Valley Cloud Kingdom Escape',
      morning: {
        period: 'Morning',
        time: '06:00 AM',
        icon: 'sun',
        theme: 'period-morning',
        image: 'images/places/sajek.jpg',
        tasks: [
          { id: 't27_1', text: 'Watch magical morning clouds roll over Konglak hill', done: true },
          { id: 't27_2', text: 'Bamboo-steamed breakfast at indigenous village', done: true },
        ],
      },
      afternoon: {
        period: 'Afternoon',
        time: '01:00 PM',
        icon: 'sun-ray',
        theme: 'period-afternoon',
        image: 'images/places/sajek-2.jpg',
        tasks: [
          { id: 't27_3', text: 'Hike up to highest peak Konglak Pahar', done: true },
          { id: 't27_4', text: 'Visit Ruilui Para ethnic community church', done: false },
        ],
      },
      evening: {
        period: 'Evening',
        time: '05:30 PM',
        icon: 'moon',
        theme: 'period-evening',
        image: 'images/places/sajek-3.jpg',
        tasks: [
          { id: 't27_5', text: 'Helipad stargazing and bamboo chicken dinner', done: false },
        ],
      },
    },
  };

  // Ensure today's date always has the Old Dhaka / Lalbagh Fort plan (matching image 2)
  if (!itinerariesByDay[realTodayDay]) {
    itinerariesByDay[realTodayDay] = JSON.parse(JSON.stringify(itinerariesByDay[14]));
  }

  function saveItinerariesToStorage() {
    try {
      localStorage.setItem('banglapath_itineraries_saved', JSON.stringify(itinerariesByDay));
    } catch (e) {}
  }

  function loadItinerariesFromStorage() {
    try {
      const raw = localStorage.getItem('banglapath_itineraries_saved');
      if (raw) {
        const parsed = JSON.parse(raw);
        Object.assign(itinerariesByDay, parsed);
      }
    } catch (e) {}
  }
  loadItinerariesFromStorage();

  function getUpcomingTripsData() {
    const curM = monthNamesShort[calCurrentMonth] || 'Sep';
    const nextM = monthNamesShort[(calCurrentMonth + 1) % 12] || 'Oct';
    return [
      {
        id: 'sundarbans',
        name: 'Sundarban Adventure',
        dates: `${curM} 14 – ${curM} 17, ${calCurrentYear}`,
        statusType: 'booked',
        image: 'images/places/sundarbans.jpg',
      },
      {
        id: 'coxsbazar',
        name: "Cox's Bazar Getaway",
        dates: `${curM} 21 – ${curM} 24, ${calCurrentYear}`,
        statusType: 'planned',
        image: 'images/places/coxsbazar.jpg',
      },
      {
        id: 'sajek',
        name: 'Sajek Valley Escape',
        dates: `${nextM} 02 – ${nextM} 05, ${calCurrentYear}`,
        statusType: 'completed',
        image: 'images/places/sajek.jpg',
      },
    ];
  }

  function getPeriodIconSvg(iconType) {
    if (iconType === 'sun' || iconType === 'morning') {
      return `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`;
    }
    if (iconType === 'sun-ray' || iconType === 'afternoon') {
      return `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>`;
    }
    if (iconType === 'stars' || iconType === 'night') {
      return `<svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
    }
    return `<svg viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
  }

  function getOrGenerateDayPlan(dayNum) {
    if (itinerariesByDay[dayNum]) {
      const plan = itinerariesByDay[dayNum];
      if (!plan.periodOrder) {
        const order = ['morning', 'afternoon', 'evening'];
        if (plan.night) order.push('night');
        plan.periodOrder = order;
      }
      return plan;
    }
    // Generate intelligent default day plan
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const places = [
      { name: 'Sylhet Rain Country', img1: 'images/places/srimangal.jpg', img2: 'images/places/ratargul.jpg', img3: 'images/places/jaflong.jpg' },
      { name: 'Chittagong Hill Tracts', img1: 'images/places/sajek.jpg', img2: 'images/places/sajek-2.jpg', img3: 'images/places/sajek-3.jpg' },
      { name: 'Old Capital & River Delta', img1: 'images/places/sonargaon.jpg', img2: 'images/places/lalbagh.jpg', img3: 'images/places/ahsanmanzil.jpg' },
    ];
    const pick = places[dayNum % places.length];

    itinerariesByDay[dayNum] = {
      title: `${monthNames[calCurrentMonth]} ${dayNum} – ${pick.name}`,
      periodOrder: ['morning', 'afternoon', 'evening'],
      morning: {
        period: 'Morning',
        time: '09:00 AM',
        icon: 'sun',
        theme: 'period-morning',
        image: pick.img1,
        tasks: [
          { id: `t${dayNum}_1`, text: 'Morning sightseeing & heritage trail', done: false },
          { id: `t${dayNum}_2`, text: 'Local breakfast & artisanal tea tasting', done: false },
        ],
      },
      afternoon: {
        period: 'Afternoon',
        time: '01:30 PM',
        icon: 'sun-ray',
        theme: 'period-afternoon',
        image: pick.img2,
        tasks: [
          { id: `t${dayNum}_3`, text: 'Authentic regional lunch experience', done: false },
          { id: `t${dayNum}_4`, text: 'Explore vibrant local artisan marketplace', done: false },
        ],
      },
      evening: {
        period: 'Evening',
        time: '05:30 PM',
        icon: 'moon',
        theme: 'period-evening',
        image: pick.img3,
        tasks: [
          { id: `t${dayNum}_5`, text: 'Golden hour sunset photography spot', done: false },
        ],
      },
      night: {
        period: 'Night',
        time: '09:30 PM',
        icon: 'stars',
        theme: 'period-night',
        image: 'images/places/lalbagh.jpg',
        tasks: [
          { id: `t${dayNum}_6`, text: 'Traditional candlelit dinner & night market walk', done: false },
        ],
      },
    };
    return itinerariesByDay[dayNum];
  }

  function renderPlanner() {
    const root = $('#page-planner');
    if (!root) return;

    applyLegendStyles();

    // ---- Mobile view ----
    if (window.innerWidth <= 768) {
      renderPlannerMobile(root);
      return;
    }

    const currentMonthDays = getCalendarDays(calCurrentYear, calCurrentMonth);
    const upcomingTrips = getUpcomingTripsData();
    const isShowingCurrentMonth = calCurrentMonth === realTodayMonth && calCurrentYear === realTodayYear;

    root.innerHTML = `
      <div class="planner-layout">
        <!-- Main Left Column: Month Calendar + Timeline Cards + Plan Ahead -->
        <div class="planner-main-col">
          <!-- Calendar Card -->
          <div class="planner-card">
            <!-- Header -->
            <div class="planner-header">
              <div class="planner-title-group">
                <button class="planner-menu-btn" type="button" aria-label="Calendar menu" id="planner-menu-btn">
                  <svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
                </button>
                <div class="planner-month-stepper">
                  <button class="planner-cal-nav-btn" type="button" id="cal-prev-month" aria-label="Previous month" title="Previous month">
                    <svg viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>
                  </button>
                  <h1 class="planner-month-title" id="planner-month-title">${monthNames[calCurrentMonth]} ${calCurrentYear}</h1>
                  <button class="planner-cal-nav-btn" type="button" id="cal-next-month" aria-label="Next month" title="Next month">
                    <svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>
                  </button>
                </div>
                ${!isShowingCurrentMonth ? `
                  <button class="planner-today-btn" type="button" id="cal-go-today" title="Jump to today (${monthNamesShort[realTodayMonth]} ${realTodayDay})">Today</button>
                ` : ''}
              </div>
            </div>

            <!-- Month Calendar Grid -->
            <div class="planner-month-view" id="planner-month-view">
              <div class="calendar-grid-head">
                <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
              </div>
              <div class="calendar-grid-body" id="calendar-grid-body">
                ${currentMonthDays.map((d) => {
                  const isAdjacent = !!d.isAdjacent;
                  const isToday = !isAdjacent && d.num === realTodayDay && isShowingCurrentMonth;
                  const isSelected = !isAdjacent && d.num === selectedDay;
                  const dots = d.dots || [];
                  return `
                    <button class="calendar-day-cell ${isAdjacent ? 'is-adjacent' : ''} ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''}" type="button" data-day="${d.num}" data-adjacent="${isAdjacent}" title="${isToday ? `Current Date: ${monthNamesShort[calCurrentMonth]} ${d.num}, ${calCurrentYear}` : `${monthNamesShort[calCurrentMonth]} ${d.num}, ${calCurrentYear}`}">
                      <span class="day-number">${d.num}</span>
                      <div class="day-dots">
                        ${dots.map(dot => `<span class="cal-dot dot-${dot}"></span>`).join('')}
                      </div>
                    </button>
                  `;
                }).join('')}
              </div>

              <!-- Floating green + action button -->
              <button class="calendar-fab" type="button" id="planner-fab-add" aria-label="Add new plan" title="Add new plan">
                <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
              </button>
            </div>
          </div>

          <!-- Itinerary timeline cards directly below calendar -->
          <div class="itinerary-timeline" id="itinerary-timeline">
            ${renderTimelineMarkup(selectedDay)}
          </div>

          <!-- Plan Ahead Banner -->
          <div class="plan-ahead-card">
            <div class="plan-ahead-info">
              <div class="plan-ahead-icon">
                <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2.5"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="m9 16 2 2 4-4"/></svg>
              </div>
              <div class="plan-ahead-text">
                <h3>Plan ahead, travel better!</h3>
                <p>Add your trips to keep track of your journey and never miss an adventure.</p>
              </div>
            </div>
            <button class="btn-add-plan" type="button" id="btn-add-plan">
              <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
              <span>Add new plan</span>
            </button>
          </div>
        </div>

        <!-- Sidebar Widgets: Legend & Upcoming Trips -->
        <div class="planner-side-widgets">
          <!-- Legend Card -->
          <div class="widget-card legend-card" id="legend-card-widget">
            <div class="widget-head">
              <h2 class="widget-title">Calendar Legend</h2>
              <button class="legend-pen-btn" type="button" id="btn-customize-legend" aria-label="Customize Calendar Legend" title="Customize Legend Colors & Labels">
                <svg viewBox="0 0 24 24" class="legend-pen-icon"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
              </button>
            </div>
            <div class="legend-items" id="legend-items-container">
              ${renderLegendItemsMarkup()}
            </div>
          </div>

          <!-- Upcoming Trips Card -->
          <div class="widget-card upcoming-card">
            <div class="widget-head">
              <h2 class="widget-title">Upcoming Trips</h2>
              <button class="widget-link-btn" type="button" id="upcoming-view-all">View all</button>
            </div>
            <div class="upcoming-trips-list" id="upcoming-trips-list">
              ${upcomingTrips.map(trip => {
                const conf = legendConfig[trip.statusType] || { label: trip.statusType, color: '#16a34a' };
                return `
                  <div class="upcoming-trip-item" data-trip-id="${trip.id}">
                    <img class="trip-thumb" src="${trip.image}" alt="${esc(trip.name)}" />
                    <div class="trip-info">
                      <h3 class="trip-name">${esc(trip.name)}</h3>
                      <span class="trip-dates">${esc(trip.dates)}</span>
                      <span class="trip-status status-${trip.statusType}">
                        <span class="legend-dot dot-${trip.statusType}"></span>
                        <span>${esc(conf.label)}</span>
                      </span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- BanglaPath AI Assistant Card (Placed at the bottom of sidebar) -->
          <div class="planner-ai-card" id="planner-ai-card">
            <div class="planner-ai-head">
              <div class="planner-ai-avatar is-online">
                <img src="images/bot-avatar.png" alt="BanglaPath AI" />
              </div>
              <div class="planner-ai-meta">
                <h3 class="planner-ai-title">BanglaPath AI</h3>
                <span class="planner-ai-status">Online • Trip Assistant</span>
              </div>
            </div>
            <div class="planner-ai-body" id="planner-ai-messages">
              <div class="planner-ai-msg from-bot">
                <div class="planner-ai-bubble">Hi! Ask me anything to refine your ${monthNames[calCurrentMonth]} schedule, add destinations, or discover local travel tips.</div>
              </div>
            </div>
            <form class="planner-ai-form" id="planner-ai-form">
              <input class="planner-ai-input" id="planner-ai-input" type="text" placeholder="Ask BanglaPath AI..." autocomplete="off" />
              <button class="planner-ai-mic" type="button" id="planner-ai-mic" title="Voice assistant" aria-label="Voice input">
                <svg viewBox="0 0 24 24"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3M8 22h8"/></svg>
              </button>
              <button class="planner-ai-send" type="submit" aria-label="Send query">
                <svg viewBox="0 0 24 24"><path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z"/></svg>
              </button>
            </form>
          </div>
        </div>
      </div>
    `;

    bindPlannerEvents();
  }

  // ---- Mobile-only planner renderer ----
  function renderPlannerMobile(root) {
    const isMobileWeek = plannerViewMode === 'week';
    const currentMonthDays = getCalendarDays(calCurrentYear, calCurrentMonth);
    const isShowingCurrentMonth = calCurrentMonth === realTodayMonth && calCurrentYear === realTodayYear;

    // Build week ribbon for week view (7 days centered on selectedDay)
    function buildWeekRibbon() {
      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const allDays = currentMonthDays.filter(d => !d.isAdjacent);
      const selIdx = allDays.findIndex(d => d.num === selectedDay);
      const startIdx = Math.max(0, Math.min(selIdx - 3, allDays.length - 7));
      const weekDays = allDays.slice(startIdx, startIdx + 7);

      return weekDays.map((d, i) => {
        const dayName = dayNames[i];
        const isSelected = d.num === selectedDay;
        const isToday = d.num === realTodayDay && isShowingCurrentMonth;
        const dots = d.dots || [];
        return `
          <button class="mtp-week-day ${isSelected ? 'is-selected' : ''} ${isToday && !isSelected ? 'is-today' : ''}" type="button" data-day="${d.num}" data-adjacent="false">
            <span class="mtp-week-day-name">${dayName}</span>
            <span class="mtp-week-day-num">${d.num}</span>
            <div class="mtp-week-dots">
              ${dots.map(dot => `<span class="mtp-dot dot-${dot}"></span>`).join('')}
            </div>
          </button>`;
      }).join('');
    }

    // Build month calendar grid for mobile
    function buildMonthGrid() {
      return currentMonthDays.map((d) => {
        const isAdjacent = !!d.isAdjacent;
        const isToday = !isAdjacent && d.num === realTodayDay && isShowingCurrentMonth;
        const isSelected = !isAdjacent && d.num === selectedDay;
        const dots = d.dots || [];
        return `
          <button class="mtp-month-cell ${isAdjacent ? 'is-adjacent' : ''} ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''}" type="button" data-day="${d.num}" data-adjacent="${isAdjacent}">
            <span class="mtp-month-num">${d.num}</span>
            <div class="mtp-month-dots">
              ${dots.map(dot => `<span class="mtp-dot dot-${dot}"></span>`).join('')}
            </div>
          </button>`;
      }).join('');
    }

    // Build mobile timeline cards
    function buildMobileTimeline() {
      const dayData = getOrGenerateDayPlan(selectedDay);
      if (!dayData.periodOrder) {
        dayData.periodOrder = ['morning', 'afternoon', 'evening'].concat(dayData.night ? ['night'] : []);
      }
      const periods = dayData.periodOrder;
      return periods.map((pKey, idx) => {
        const p = dayData[pKey];
        if (!p) return '';
        const isFirst = idx === 0;
        const isLast = idx === periods.length - 1;
        return `
          <div class="mtp-period-label">
            <div class="mtp-period-info">
              <span class="mtp-period-name">${p.period}</span>
              <span class="mtp-period-dash"> – </span>
              <span class="mtp-period-time">${p.time}</span>
            </div>
            <div class="mtp-period-reorder">
              <button type="button" class="mtp-reorder-btn" data-action="reorder-up" data-period="${pKey}" data-day="${selectedDay}" ${isFirst ? 'disabled' : ''} title="Move ${p.period} up" aria-label="Move up">
                <svg viewBox="0 0 24 24"><path d="m18 15-6-6-6 6"/></svg>
              </button>
              <button type="button" class="mtp-reorder-btn" data-action="reorder-down" data-period="${pKey}" data-day="${selectedDay}" ${isLast ? 'disabled' : ''} title="Move ${p.period} down" aria-label="Move down">
                <svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>
              </button>
            </div>
          </div>
          <div class="mtp-timeline-card ${p.theme || ('period-' + pKey)}" draggable="true" data-day="${selectedDay}" data-period="${pKey}" data-index="${idx}">
            <div class="mtp-tasks-col">
              ${p.tasks.map(t => `
                <div class="mtp-task-item ${t.done ? 'is-done' : ''}" data-day="${selectedDay}" data-period="${pKey}" data-task-id="${t.id}">
                  <div class="mtp-checkbox">
                    <svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>
                  </div>
                  <span class="mtp-task-text">${esc(t.text)}</span>
                </div>
              `).join('')}
            </div>
            <div class="mtp-img-col">
              <img src="${p.image}" alt="${esc(p.period)}" class="mtp-card-img" />
              ${isLast ? `<button class="mtp-list-fab" type="button" aria-label="Add plan" id="mtp-fab-add-quick">
                <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
              </button>` : ''}
            </div>
          </div>
        `;
      }).join('');
    }

    root.innerHTML = `
      <div class="mtp-root">
        <!-- Header -->
        <div class="mtp-header">
          <button class="mtp-menu-btn" type="button" id="mtp-menu-btn" aria-label="Menu">
            <svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
          <div class="mtp-title-nav">
            <button class="mtp-arrow-btn" id="mtp-prev-month" type="button" aria-label="Previous month">‹</button>
            <h1 class="mtp-title">${monthNames[calCurrentMonth]} ${calCurrentYear}</h1>
            <button class="mtp-arrow-btn" id="mtp-next-month" type="button" aria-label="Next month">›</button>
          </div>
          <button class="mtp-notif-btn" type="button" id="mtp-notif-btn" aria-label="Notifications">
            <svg viewBox="0 0 24 24"><path d="M18 15.6V11a6 6 0 0 0-12 0v4.6L4.6 18h14.8zM9.9 21a2.3 2.3 0 0 0 4.2 0"/></svg>
            <span class="mtp-notif-dot"></span>
          </button>
        </div>

        <!-- Week / Month Toggle -->
        <div class="mtp-toggle-wrap">
          <div class="mtp-toggle">
            <button class="mtp-toggle-btn ${!isMobileWeek ? '' : 'is-active'}" id="mtp-btn-week" type="button">Week</button>
            <button class="mtp-toggle-btn ${isMobileWeek ? '' : 'is-active'}" id="mtp-btn-month" type="button">Month</button>
          </div>
        </div>

        <!-- Calendar -->
        <div class="mtp-calendar-wrap">
          <div class="mtp-cal-head">
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
          </div>
          ${isMobileWeek
            ? `<div class="mtp-week-ribbon" id="mtp-week-ribbon">${buildWeekRibbon()}</div>`
            : `<div class="mtp-month-grid" id="mtp-month-grid">${buildMonthGrid()}</div>`}

          ${!isMobileWeek ? `
            <button class="mtp-fab" type="button" id="mtp-fab-add" aria-label="Add new plan">
              <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
            </button>` : ''}
        </div>

        <!-- Itinerary Timeline (week view only) -->
        ${isMobileWeek ? `
          <div class="mtp-timeline" id="mtp-timeline">
            ${buildMobileTimeline()}
          </div>
        ` : ''}
      </div>
    `;

    bindPlannerMobileEvents();
  }

  function bindPlannerMobileEvents() {
    // Toggle Week / Month
    document.getElementById('mtp-btn-week')?.addEventListener('click', () => {
      plannerViewMode = 'week';
      renderPlanner();
    });
    document.getElementById('mtp-btn-month')?.addEventListener('click', () => {
      plannerViewMode = 'month';
      renderPlanner();
    });

    // Month grid cell clicks
    document.querySelectorAll('.mtp-month-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        if (cell.dataset.adjacent === 'true') return;
        selectedDay = parseInt(cell.dataset.day, 10);
        plannerViewMode = 'week';
        renderPlanner();
      });
    });

    // Mobile Month Prev / Next
    document.getElementById('mtp-prev-month')?.addEventListener('click', () => {
      calCurrentMonth--;
      if (calCurrentMonth < 0) {
        calCurrentMonth = 11;
        calCurrentYear--;
      }
      renderPlanner();
    });
    document.getElementById('mtp-next-month')?.addEventListener('click', () => {
      calCurrentMonth++;
      if (calCurrentMonth > 11) {
        calCurrentMonth = 0;
        calCurrentYear++;
      }
      renderPlanner();
    });

    // Week ribbon day clicks
    document.querySelectorAll('.mtp-week-day').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedDay = parseInt(btn.dataset.day, 10);
        renderPlanner();
      });
    });

    // Task checkboxes
    document.querySelectorAll('.mtp-task-item').forEach(item => {
      item.addEventListener('click', () => {
        const day = parseInt(item.dataset.day, 10);
        const period = item.dataset.period;
        const taskId = item.dataset.taskId;
        const dayData = getOrGenerateDayPlan(day);
        if (dayData && dayData[period]) {
          const task = dayData[period].tasks.find(t => t.id === taskId);
          if (task) {
            task.done = !task.done;
            item.classList.toggle('is-done', task.done);
            saveItinerariesToStorage();
            updateMobilePlanFabBadge();
          }
        }
      });
    });

    // FAB add
    document.getElementById('mtp-fab-add')?.addEventListener('click', openAddPlanModal);

    // Notification button
    document.getElementById('mtp-notif-btn')?.addEventListener('click', () => {
      showToast('🔔 2 updates: New seasonal boat routes in Ratargul & winter beach packages in Cox\'s Bazar!');
    });

    // List FAB
    document.querySelector('.mtp-list-fab')?.addEventListener('click', () => {
      showToast(`Showing all ${monthNames[calCurrentMonth]} ${calCurrentYear} plans`);
    });

    document.getElementById('mtp-fab-add-quick')?.addEventListener('click', openAddPlanModal);
    bindDragAndDropAndReorder(root);
  }



  function renderLegendItemsMarkup() {
    return `
      <div class="legend-item" data-legend-key="planned">
        <span class="legend-dot dot-planned"></span>
        <span class="legend-label">${esc(legendConfig.planned?.label || 'Planned')}</span>
      </div>
      <div class="legend-item" data-legend-key="booked">
        <span class="legend-dot dot-booked"></span>
        <span class="legend-label">${esc(legendConfig.booked?.label || 'Booked')}</span>
      </div>
      <div class="legend-item" data-legend-key="completed">
        <span class="legend-dot dot-completed"></span>
        <span class="legend-label">${esc(legendConfig.completed?.label || 'Completed')}</span>
      </div>
    `;
  }

  function renderTimelineMarkup(dayNum) {
    const dayData = getOrGenerateDayPlan(dayNum);
    if (!dayData.periodOrder) {
      dayData.periodOrder = ['morning', 'afternoon', 'evening'].concat(dayData.night ? ['night'] : []);
    }
    const periods = dayData.periodOrder;

    return periods.map((pKey, idx) => {
      const p = dayData[pKey];
      if (!p) return '';
      const isFirst = idx === 0;
      const isLast = idx === periods.length - 1;
      return `
        <div class="timeline-card ${p.theme || ('period-' + pKey)}" draggable="true" data-day="${dayNum}" data-period="${pKey}" data-index="${idx}">
          <div class="timeline-reorder-bar">
            <div class="timeline-drag-handle" title="Drag to reorder position" aria-label="Drag handle">
              <svg viewBox="0 0 24 24"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>
            </div>
            <div class="timeline-reorder-arrows">
              <button type="button" class="btn-reorder-arrow btn-reorder-up" data-action="reorder-up" data-period="${pKey}" data-day="${dayNum}" ${isFirst ? 'disabled' : ''} title="Move ${p.period} up">
                <svg viewBox="0 0 24 24"><path d="m18 15-6-6-6 6"/></svg>
              </button>
              <button type="button" class="btn-reorder-arrow btn-reorder-down" data-action="reorder-down" data-period="${pKey}" data-day="${dayNum}" ${isLast ? 'disabled' : ''} title="Move ${p.period} down">
                <svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>
              </button>
            </div>
          </div>

          <div class="timeline-left">
            <div class="timeline-badge-row">
              <div class="period-icon-wrap">${getPeriodIconSvg(p.icon || pKey)}</div>
              <span class="period-label">${p.period}</span>
              <span class="period-time">${p.time}</span>
            </div>

            <div class="timeline-tasks">
              ${p.tasks.map(t => `
                <div class="task-item ${t.done ? 'is-done' : ''}" data-day="${dayNum}" data-period="${pKey}" data-task-id="${t.id}">
                  <div class="task-checkbox">
                    <svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>
                  </div>
                  <span class="task-text">${esc(t.text)}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="timeline-right">
            <img class="timeline-thumb" src="${p.image || 'images/places/sajek.jpg'}" alt="${esc(p.period)}" />
          </div>
        </div>
      `;
    }).join('');
  }

  function bindPlannerEvents() {
    // Month calendar day cell clicks
    document.querySelectorAll('.calendar-day-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        if (cell.dataset.adjacent === 'true') return;
        const day = parseInt(cell.dataset.day, 10);
        selectedDay = day;
        document.querySelectorAll('.calendar-day-cell').forEach(c => {
          if (c.dataset.adjacent !== 'true') {
            c.classList.toggle('is-selected', parseInt(c.dataset.day, 10) === day);
          }
        });
        const timeline = $('#itinerary-timeline');
        if (timeline) {
          timeline.innerHTML = renderTimelineMarkup(selectedDay);
          bindTimelineTaskEvents();
        }
      });
    });

    // Bind task checkboxes
    bindTimelineTaskEvents();

    // Add plan triggers
    $('#planner-fab-add')?.addEventListener('click', openAddPlanModal);
    $('#btn-add-plan')?.addEventListener('click', openAddPlanModal);

    // Customize legend trigger
    $('#btn-customize-legend')?.addEventListener('click', openLegendCustomizerModal);
    document.querySelectorAll('.legend-item').forEach(item => {
      item.addEventListener('click', openLegendCustomizerModal);
    });

    // Upcoming trip items
    document.querySelectorAll('.upcoming-trip-item').forEach(item => {
      item.addEventListener('click', () => {
        const placeId = item.dataset.tripId;
        if (placeId) {
          openPlace(placeId);
        }
      });
    });

    $('#upcoming-view-all')?.addEventListener('click', () => {
      showToast(`Displaying full ${monthNames[calCurrentMonth]} ${calCurrentYear} itinerary and upcoming trips`);
    });

    $('#planner-menu-btn')?.addEventListener('click', () => {
      showToast(`${monthNames[calCurrentMonth]} ${calCurrentYear} Calendar view`);
    });

    // Desktop Month Navigation
    $('#cal-prev-month')?.addEventListener('click', () => {
      calCurrentMonth--;
      if (calCurrentMonth < 0) {
        calCurrentMonth = 11;
        calCurrentYear--;
      }
      renderPlanner();
    });

    $('#cal-next-month')?.addEventListener('click', () => {
      calCurrentMonth++;
      if (calCurrentMonth > 11) {
        calCurrentMonth = 0;
        calCurrentYear++;
      }
      renderPlanner();
    });

    $('#cal-go-today')?.addEventListener('click', () => {
      calCurrentMonth = realTodayMonth;
      calCurrentYear = realTodayYear;
      selectedDay = realTodayDay;
      renderPlanner();
    });

    // BanglaPath AI Widget in Planner
    const plannerAiForm = $('#planner-ai-form');
    const plannerAiInput = $('#planner-ai-input');
    const plannerAiMessages = $('#planner-ai-messages');

    plannerAiForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = plannerAiInput.value.trim();
      if (!text) return;
      plannerAiInput.value = '';

      // Append user msg
      const userDiv = document.createElement('div');
      userDiv.className = 'planner-ai-msg from-user';
      userDiv.innerHTML = `<div class="planner-ai-bubble">${esc(text)}</div>`;
      plannerAiMessages.appendChild(userDiv);
      plannerAiMessages.scrollTop = plannerAiMessages.scrollHeight;

      // Append typing indicator
      const typingDiv = document.createElement('div');
      typingDiv.className = 'planner-ai-msg from-bot';
      typingDiv.innerHTML = `<div class="planner-ai-bubble"><em>Thinking…</em></div>`;
      plannerAiMessages.appendChild(typingDiv);
      plannerAiMessages.scrollTop = plannerAiMessages.scrollHeight;

      try {
        const prompt = `You are the BanglaPath AI travel assistant embedded inside the Trip Planner for August 2026. Keep answers concise (1-2 sentences). User says: "${text}"`;
        const res = await askGemini([{ role: 'user', text: prompt }]);
        typingDiv.remove();
        const botDiv = document.createElement('div');
        botDiv.className = 'planner-ai-msg from-bot';
        botDiv.innerHTML = `<div class="planner-ai-bubble">${esc(res.reply || 'I am ready to help organize your Bangladesh adventure!')}</div>`;
        plannerAiMessages.appendChild(botDiv);
        plannerAiMessages.scrollTop = plannerAiMessages.scrollHeight;
      } catch (err) {
        typingDiv.remove();
        const botDiv = document.createElement('div');
        botDiv.className = 'planner-ai-msg from-bot';
        botDiv.innerHTML = `<div class="planner-ai-bubble">Got it! I've noted that for your August itinerary. You can also tap "+ Add new plan" to schedule it directly.</div>`;
        plannerAiMessages.appendChild(botDiv);
        plannerAiMessages.scrollTop = plannerAiMessages.scrollHeight;
      }
    });

    let activePlannerRecog = null;
    $('#planner-ai-mic')?.addEventListener('click', () => {
      const Recog = window.SpeechRecognition || window.webkitSpeechRecognition;
      const micBtn = $('#planner-ai-mic');
      if (!Recog) {
        showToast('Voice dictation is not supported in this browser.');
        return;
      }
      if (activePlannerRecog) {
        try { activePlannerRecog.abort(); } catch (e) {}
        activePlannerRecog = null;
        if (micBtn) micBtn.classList.remove('is-recording');
        if (plannerAiInput) plannerAiInput.placeholder = 'Ask BanglaPath AI...';
        showToast('🔇 Planner microphone turned off.');
        return;
      }
      try {
        const rec = new Recog();
        activePlannerRecog = rec;
        rec.lang = 'en-US';
        rec.interimResults = true;
        if (micBtn) micBtn.classList.add('is-recording');
        if (plannerAiInput) {
          plannerAiInput.focus();
          plannerAiInput.placeholder = '🎙️ Listening... speak now';
        }
        showToast('🎙️ Listening... (tap mic again to stop)');
        rec.onresult = (e) => {
          let transcript = '';
          for (let i = e.resultIndex; i < e.results.length; ++i) {
            transcript += e.results[i][0].transcript;
          }
          if (plannerAiInput && transcript) {
            plannerAiInput.value = transcript;
          }
        };
        rec.onend = () => {
          activePlannerRecog = null;
          if (micBtn) micBtn.classList.remove('is-recording');
          if (plannerAiInput) plannerAiInput.placeholder = 'Ask BanglaPath AI...';
        };
        rec.onerror = () => {
          activePlannerRecog = null;
          if (micBtn) micBtn.classList.remove('is-recording');
          if (plannerAiInput) plannerAiInput.placeholder = 'Ask BanglaPath AI...';
        };
        rec.start();
      } catch (e) {
        activePlannerRecog = null;
        if (micBtn) micBtn.classList.remove('is-recording');
      }
    });
  }

  function movePeriod(dayNum, periodKey, direction) {
    const dayData = getOrGenerateDayPlan(dayNum);
    if (!dayData.periodOrder) {
      dayData.periodOrder = ['morning', 'afternoon', 'evening'].concat(dayData.night ? ['night'] : []);
    }
    const idx = dayData.periodOrder.indexOf(periodKey);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= dayData.periodOrder.length) return;

    // Swap positions
    const temp = dayData.periodOrder[idx];
    dayData.periodOrder[idx] = dayData.periodOrder[targetIdx];
    dayData.periodOrder[targetIdx] = temp;

    // Refresh planner view
    renderPlanner();
    const periodName = dayData[periodKey]?.period || periodKey;
    showToast(`Reordered: ${periodName} moved ${direction}!`);
  }

  function bindDragAndDropAndReorder(container) {
    if (!container) return;
    let draggedKey = null;

    container.querySelectorAll('[draggable="true"]').forEach(card => {
      card.addEventListener('dragstart', (e) => {
        draggedKey = card.dataset.period;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', draggedKey);
        card.classList.add('is-dragging');
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('is-dragging');
        container.querySelectorAll('.drop-target-above, .drop-target-below').forEach(el => {
          el.classList.remove('drop-target-above', 'drop-target-below');
        });
      });

      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const rect = card.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        if (e.clientY < midY) {
          card.classList.add('drop-target-above');
          card.classList.remove('drop-target-below');
        } else {
          card.classList.add('drop-target-below');
          card.classList.remove('drop-target-above');
        }
      });

      card.addEventListener('dragleave', () => {
        card.classList.remove('drop-target-above', 'drop-target-below');
      });

      card.addEventListener('drop', (e) => {
        e.preventDefault();
        const srcKey = e.dataTransfer.getData('text/plain') || draggedKey;
        const targetKey = card.dataset.period;
        card.classList.remove('drop-target-above', 'drop-target-below');
        if (!srcKey || !targetKey || srcKey === targetKey) return;

        const dayNum = parseInt(card.dataset.day, 10) || selectedDay;
        const dayData = getOrGenerateDayPlan(dayNum);
        if (!dayData.periodOrder) {
          dayData.periodOrder = ['morning', 'afternoon', 'evening'].concat(dayData.night ? ['night'] : []);
        }
        const order = dayData.periodOrder;
        const srcIdx = order.indexOf(srcKey);
        if (srcIdx > -1) {
          order.splice(srcIdx, 1);
          const rect = card.getBoundingClientRect();
          const insertBefore = e.clientY < (rect.top + rect.height / 2);
          const newTgtIdx = order.indexOf(targetKey);
          order.splice(insertBefore ? newTgtIdx : newTgtIdx + 1, 0, srcKey);
          renderPlanner();
          showToast(`Reordered: ${dayData[srcKey]?.period || srcKey} placed ${insertBefore ? 'above' : 'below'} ${dayData[targetKey]?.period || targetKey}`);
        }
      });
    });

    // Delegated click for reorder buttons (works for both desktop and mobile!)
    container.querySelectorAll('[data-action="reorder-up"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const pKey = btn.dataset.period;
        const dayNum = parseInt(btn.dataset.day, 10) || selectedDay;
        movePeriod(dayNum, pKey, 'up');
      });
    });

    container.querySelectorAll('[data-action="reorder-down"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const pKey = btn.dataset.period;
        const dayNum = parseInt(btn.dataset.day, 10) || selectedDay;
        movePeriod(dayNum, pKey, 'down');
      });
    });
  }

  function bindTimelineTaskEvents() {
    document.querySelectorAll('.task-item').forEach(item => {
      item.addEventListener('click', () => {
        const day = parseInt(item.dataset.day, 10);
        const period = item.dataset.period;
        const taskId = item.dataset.taskId;
        const dayData = getOrGenerateDayPlan(day);
        if (dayData && dayData[period]) {
          const task = dayData[period].tasks.find(t => t.id === taskId);
          if (task) {
            task.done = !task.done;
            item.classList.toggle('is-done', task.done);
            saveItinerariesToStorage();
            updateMobilePlanFabBadge();
            showToast(task.done ? `Completed: "${task.text}"` : `Unchecked: "${task.text}"`);
          }
        }
      });
    });

    bindDragAndDropAndReorder($('#itinerary-timeline'));
  }

  /* ---------------- Mobile Floating "My Plan" To-Do Modal ---------------- */
  function updateMobilePlanFabBadge() {
    const badge = $('#mobile-plan-badge');
    if (!badge) return;
    const plan = itinerariesByDay[selectedDay] || itinerariesByDay[realTodayDay];
    if (!plan) {
      badge.textContent = '0';
      return;
    }
    const order = plan.periodOrder || ['morning', 'afternoon', 'evening'];
    let remaining = 0;
    order.forEach(pKey => {
      const p = plan[pKey];
      if (p && p.tasks) {
        remaining += p.tasks.filter(t => !t.done).length;
      }
    });
    badge.textContent = String(remaining);
  }

  function renderMobileMyPlanModalBody() {
    const body = $('#myplan-sheet-body');
    const dayLabel = $('#myplan-sheet-day-label');
    const dayData = getOrGenerateDayPlan(selectedDay);

    if (dayLabel) {
      const isToday = selectedDay === realTodayDay && calCurrentMonth === realTodayMonth && calCurrentYear === realTodayYear;
      dayLabel.textContent = isToday
        ? `Today (${monthNamesShort[calCurrentMonth]} ${selectedDay})`
        : `${monthNamesShort[calCurrentMonth]} ${selectedDay}, ${calCurrentYear}`;
    }

    if (!body) return;

    if (!dayData.periodOrder) {
      dayData.periodOrder = ['morning', 'afternoon', 'evening'].concat(dayData.night ? ['night'] : []);
    }
    const periods = dayData.periodOrder;

    body.innerHTML = periods.map((pKey) => {
      const p = dayData[pKey];
      if (!p) return '';
      return `
        <div class="myplan-period-group" data-period="${pKey}">
          <div class="myplan-period-head">
            <span class="myplan-period-badge ${p.theme || ('period-' + pKey)}">${p.period} • ${p.time}</span>
          </div>
          <div class="myplan-task-list">
            ${p.tasks.map(t => `
              <div class="myplan-todo-row ${t.done ? 'is-done' : ''}" data-day="${selectedDay}" data-period="${pKey}" data-task-id="${t.id}">
                <button type="button" class="myplan-check-btn" aria-label="Toggle task">
                  <svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>
                </button>
                <span class="myplan-task-label">${esc(t.text)}</span>
                <button type="button" class="myplan-del-task-btn" data-action="del-task" title="Delete task" aria-label="Delete task">
                  <svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }).join('');

    // Wire task toggle in modal
    body.querySelectorAll('.myplan-todo-row').forEach(row => {
      row.addEventListener('click', (e) => {
        if (e.target.closest('.myplan-del-task-btn')) return;
        const day = parseInt(row.dataset.day, 10);
        const period = row.dataset.period;
        const taskId = row.dataset.taskId;
        const plan = getOrGenerateDayPlan(day);
        if (plan && plan[period]) {
          const task = plan[period].tasks.find(t => t.id === taskId);
          if (task) {
            task.done = !task.done;
            row.classList.toggle('is-done', task.done);
            saveItinerariesToStorage();
            updateMobilePlanFabBadge();
            // sync active planner view if visible
            const plannerTask = $(`[data-task-id="${taskId}"]`);
            if (plannerTask) plannerTask.classList.toggle('is-done', task.done);
          }
        }
      });
    });

    // Wire task delete in modal
    body.querySelectorAll('.myplan-del-task-btn').forEach(delBtn => {
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const row = delBtn.closest('.myplan-todo-row');
        if (!row) return;
        const day = parseInt(row.dataset.day, 10);
        const period = row.dataset.period;
        const taskId = row.dataset.taskId;
        const plan = getOrGenerateDayPlan(day);
        if (plan && plan[period]) {
          const idx = plan[period].tasks.findIndex(t => t.id === taskId);
          if (idx > -1) {
            plan[period].tasks.splice(idx, 1);
            saveItinerariesToStorage();
            renderMobileMyPlanModalBody();
            updateMobilePlanFabBadge();
            if ($('#page-planner')?.classList.contains('is-active')) {
              renderPlanner();
            }
            showToast('Task removed from plan');
          }
        }
      });
    });
  }

  function openMobileMyPlanModal() {
    const backdrop = $('#myplan-modal-backdrop');
    if (!backdrop) return;
    renderMobileMyPlanModalBody();
    backdrop.removeAttribute('hidden');
    backdrop.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileMyPlanModal() {
    const backdrop = $('#myplan-modal-backdrop');
    if (!backdrop) return;
    backdrop.classList.remove('is-open');
    backdrop.setAttribute('hidden', '');
    document.body.style.overflow = '';
  }

  function setupMobileMyPlan() {
    const fab = $('#mobile-plan-fab');
    const backdrop = $('#myplan-modal-backdrop');
    const closeBtn = $('#myplan-modal-close');
    const addForm = $('#myplan-add-form');
    const addInput = $('#myplan-new-task-input');
    const periodSelect = $('#myplan-period-select');

    updateMobilePlanFabBadge();

    if (fab && !fab.dataset.listenerAttached) {
      fab.dataset.listenerAttached = 'true';
      fab.addEventListener('click', () => {
        openMobileMyPlanModal();
      });
    }

    if (closeBtn && !closeBtn.dataset.listenerAttached) {
      closeBtn.dataset.listenerAttached = 'true';
      closeBtn.addEventListener('click', closeMobileMyPlanModal);
    }

    if (backdrop && !backdrop.dataset.listenerAttached) {
      backdrop.dataset.listenerAttached = 'true';
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          closeMobileMyPlanModal();
        }
      });
    }

    if (addForm && !addForm.dataset.listenerAttached) {
      addForm.dataset.listenerAttached = 'true';
      addForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = addInput?.value?.trim();
        if (!text) return;
        const pKey = periodSelect?.value || 'morning';
        const dayPlan = getOrGenerateDayPlan(selectedDay);
        if (!dayPlan[pKey]) {
          dayPlan[pKey] = {
            period: pKey.charAt(0).toUpperCase() + pKey.slice(1),
            time: '10:00 AM',
            icon: 'sun',
            tasks: [],
          };
        }
        dayPlan[pKey].tasks.push({
          id: `t_${Date.now()}`,
          text,
          done: false,
        });
        saveItinerariesToStorage();
        if (addInput) addInput.value = '';
        renderMobileMyPlanModalBody();
        updateMobilePlanFabBadge();
        if ($('#page-planner')?.classList.contains('is-active')) {
          renderPlanner();
        }
        showToast(`Added to ${dayPlan[pKey].period}!`);
      });
    }
  }

  function openLegendCustomizerModal() {
    const existing = $('.legend-modal-backdrop');
    if (existing) existing.remove();

    const colorPresets = [
      { name: 'Amber', hex: '#f59e0b' },
      { name: 'Red', hex: '#ef4444' },
      { name: 'Emerald', hex: '#22c55e' },
      { name: 'Sky Blue', hex: '#0ea5e9' },
      { name: 'Purple', hex: '#a855f7' },
      { name: 'Teal', hex: '#14b8a6' },
      { name: 'Coral', hex: '#f97316' },
      { name: 'Rose', hex: '#f43f5e' },
    ];

    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop legend-modal-backdrop is-open';
    backdrop.innerHTML = `
      <div class="modal-card" style="max-width: 520px;">
        <button class="modal-close" type="button" aria-label="Close dialog">
          <svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
        <div class="modal-header" style="height: 110px; background: #14532d;">
          <div class="modal-header-info">
            <span class="modal-badge">Preferences</span>
            <h2>Customize Legend</h2>
            <p class="modal-sub">Personalize status labels and marker colors</p>
          </div>
        </div>
        <form class="modal-form" id="legend-customize-form">
          <!-- Planned Row -->
          <div class="legend-edit-row">
            <div>
              <label style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 4px;">Status 1 Label</label>
              <input class="legend-edit-input" type="text" id="legend-label-planned" value="${esc(legendConfig.planned?.label || 'Planned')}" required />
            </div>
            <div class="legend-color-picker-wrap">
              <input type="color" class="legend-color-input" id="legend-color-planned" value="${legendConfig.planned?.color || '#f59e0b'}" title="Pick color" />
            </div>
            <div class="legend-swatches">
              ${colorPresets.slice(0, 4).map(p => `
                <button type="button" class="legend-swatch-btn" style="background: ${p.hex};" data-target="planned" data-color="${p.hex}" title="${p.name}"></button>
              `).join('')}
            </div>
          </div>

          <!-- Booked Row -->
          <div class="legend-edit-row">
            <div>
              <label style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 4px;">Status 2 Label</label>
              <input class="legend-edit-input" type="text" id="legend-label-booked" value="${esc(legendConfig.booked?.label || 'Booked')}" required />
            </div>
            <div class="legend-color-picker-wrap">
              <input type="color" class="legend-color-input" id="legend-color-booked" value="${legendConfig.booked?.color || '#ef4444'}" title="Pick color" />
            </div>
            <div class="legend-swatches">
              ${colorPresets.slice(1, 5).map(p => `
                <button type="button" class="legend-swatch-btn" style="background: ${p.hex};" data-target="booked" data-color="${p.hex}" title="${p.name}"></button>
              `).join('')}
            </div>
          </div>

          <!-- Completed Row -->
          <div class="legend-edit-row">
            <div>
              <label style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 4px;">Status 3 Label</label>
              <input class="legend-edit-input" type="text" id="legend-label-completed" value="${esc(legendConfig.completed?.label || 'Completed')}" required />
            </div>
            <div class="legend-color-picker-wrap">
              <input type="color" class="legend-color-input" id="legend-color-completed" value="${legendConfig.completed?.color || '#22c55e'}" title="Pick color" />
            </div>
            <div class="legend-swatches">
              ${colorPresets.slice(2, 6).map(p => `
                <button type="button" class="legend-swatch-btn" style="background: ${p.hex};" data-target="completed" data-color="${p.hex}" title="${p.name}"></button>
              `).join('')}
            </div>
          </div>

          <div class="modal-actions" style="margin-top: 14px;">
            <button class="btn-secondary" type="button" id="btn-reset-legend">Reset Defaults</button>
            <button class="btn-primary" type="submit">Save Changes</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(backdrop);

    const closeDialog = () => backdrop.remove();
    backdrop.querySelector('.modal-close').addEventListener('click', closeDialog);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeDialog();
    });

    // Swatches click
    backdrop.querySelectorAll('.legend-swatch-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.target;
        const color = btn.dataset.color;
        const input = backdrop.querySelector(`#legend-color-${target}`);
        if (input) input.value = color;
      });
    });

    // Reset Defaults
    backdrop.querySelector('#btn-reset-legend').addEventListener('click', () => {
      saveLegendConfig(JSON.parse(JSON.stringify(DEFAULT_LEGEND_CONFIG)));
      closeDialog();
      renderPlanner();
      showToast('Calendar legend reset to default styling!');
    });

    // Save
    backdrop.querySelector('#legend-customize-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const newConfig = {
        planned: {
          id: 'planned',
          label: backdrop.querySelector('#legend-label-planned').value.trim() || 'Planned',
          color: backdrop.querySelector('#legend-color-planned').value,
        },
        booked: {
          id: 'booked',
          label: backdrop.querySelector('#legend-label-booked').value.trim() || 'Booked',
          color: backdrop.querySelector('#legend-color-booked').value,
        },
        completed: {
          id: 'completed',
          label: backdrop.querySelector('#legend-label-completed').value.trim() || 'Completed',
          color: backdrop.querySelector('#legend-color-completed').value,
        },
      };

      saveLegendConfig(newConfig);
      closeDialog();
      renderPlanner();
      showToast('Calendar legend updated successfully!');
    });
  }

  function openAddPlanModal() {
    const existing = $('.plan-modal-backdrop');
    if (existing) existing.remove();

    // Default state values
    let chosenSlot = 'morning';
    let chosenTime = '09:00 AM';
    let chosenDay = selectedDay || 14;
    let chosenImg = 'images/places/sajek.jpg';
    let planTasks = [
      'Sightseeing & heritage exploration trail',
      'Taste regional local breakfast & artisanal tea'
    ];

    const slotDefaults = {
      morning: { time: '09:00 AM', name: 'Morning', icon: 'sun' },
      afternoon: { time: '01:30 PM', name: 'Afternoon', icon: 'sun-ray' },
      evening: { time: '05:30 PM', name: 'Evening', icon: 'moon' },
      night: { time: '09:30 PM', name: 'Night', icon: 'stars' },
    };

    const presetImages = [
      { name: 'Sajek Valley', url: 'images/places/sajek.jpg' },
      { name: 'Cox\'s Bazar', url: 'images/places/cox.jpg' },
      { name: 'Srimangal', url: 'images/places/srimangal.jpg' },
      { name: 'Ratargul', url: 'images/places/ratargul.jpg' },
      { name: 'Sundarbans', url: 'images/places/sundarbans.jpg' },
      { name: 'Lalbagh Fort', url: 'images/places/lalbagh.jpg' },
      { name: 'Sonargaon', url: 'images/places/sonargaon.jpg' },
      { name: 'Ahsan Manzil', url: 'images/places/ahsanmanzil.jpg' },
    ];

    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop plan-modal-backdrop is-open';
    backdrop.innerHTML = `
      <div class="modal-card plan-modal-custom-card">
        <button class="modal-close" type="button" aria-label="Close dialog">
          <svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>

        <div class="plan-modal-hero">
          <div class="plan-modal-hero-badge">Trip Planner</div>
          <h2 class="plan-modal-title">Customize Your Plan</h2>
          <p class="plan-modal-subtitle">Flexible schedule, custom time slot, destination photo, and checklist</p>
        </div>

        <form class="plan-modal-body" id="custom-plan-form">
          <!-- 1. Destination / Plan Title -->
          <div class="plan-field-block">
            <label class="plan-field-label" for="plan-title-input">Plan / Activity Title</label>
            <input type="text" id="plan-title-input" class="plan-text-input" placeholder="e.g. Sunset wooden boat ride at Buriganga River" required />
          </div>

          <!-- 2. Date & Time Row -->
          <div class="plan-field-grid">
            <div class="plan-field-block">
              <label class="plan-field-label" for="plan-custom-date">Pick Date</label>
              <input type="date" id="plan-custom-date" class="plan-text-input" value="2026-08-${String(chosenDay).padStart(2, '0')}" min="2026-08-01" max="2026-12-31" />
              <div class="plan-date-quick-chips">
                <button type="button" class="plan-date-chip is-active" data-day="${chosenDay}">Aug ${chosenDay}</button>
                <button type="button" class="plan-date-chip" data-day="14">Today (Aug 14)</button>
                <button type="button" class="plan-date-chip" data-day="15">Aug 15</button>
                <button type="button" class="plan-date-chip" data-day="16">Aug 16</button>
              </div>
            </div>

            <div class="plan-field-block">
              <label class="plan-field-label" for="plan-time-input">Exact Time / Range</label>
              <input type="text" id="plan-time-input" class="plan-text-input" value="${chosenTime}" placeholder="e.g. 09:30 AM or 10:00 AM – 12:30 PM" />
            </div>
          </div>

          <!-- 3. Period of Day (Morning, Afternoon, Evening, Night) -->
          <div class="plan-field-block">
            <label class="plan-field-label">Time Slot / Period of Day</label>
            <div class="plan-slots-selector" role="radiogroup">
              <button type="button" class="plan-slot-pill is-active" data-slot="morning">
                <span class="slot-pill-icon">☀️</span>
                <span class="slot-pill-text">Morning</span>
              </button>
              <button type="button" class="plan-slot-pill" data-slot="afternoon">
                <span class="slot-pill-icon">🌤️</span>
                <span class="slot-pill-text">Afternoon</span>
              </button>
              <button type="button" class="plan-slot-pill" data-slot="evening">
                <span class="slot-pill-icon">🌅</span>
                <span class="slot-pill-text">Evening</span>
              </button>
              <button type="button" class="plan-slot-pill" data-slot="night">
                <span class="slot-pill-icon">🌙</span>
                <span class="slot-pill-text">Night</span>
              </button>
            </div>
          </div>

          <!-- 4. Plan Image & Scenic Presets -->
          <div class="plan-field-block">
            <label class="plan-field-label">Plan Image / Photo</label>
            <div class="plan-img-builder-row">
              <div class="plan-img-preview-box">
                <img id="plan-img-preview" src="${chosenImg}" alt="Plan Preview" />
              </div>
              <div class="plan-img-options">
                <div class="plan-img-url-wrap">
                  <input type="text" id="plan-img-url-input" class="plan-text-input" value="${chosenImg}" placeholder="Image URL..." />
                  <label class="plan-upload-btn" title="Upload from device">
                    <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                    <span>Upload</span>
                    <input type="file" id="plan-img-file-input" accept="image/*" style="display:none;" />
                  </label>
                </div>
                <div class="plan-scenic-chips">
                  ${presetImages.map(p => `
                    <button type="button" class="plan-scenic-chip ${p.url === chosenImg ? 'is-selected' : ''}" data-url="${p.url}">
                      ${p.name}
                    </button>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>

          <!-- 5. Interactive To-Do List of this Plan -->
          <div class="plan-field-block">
            <div class="plan-todo-header">
              <label class="plan-field-label">To-Do Checklist for this Plan</label>
              <span class="plan-todo-counter" id="plan-tasks-count">${planTasks.length} items</span>
            </div>
            
            <div class="plan-tasks-container" id="plan-tasks-list">
              <!-- Dynamically rendered -->
            </div>

            <div class="plan-add-task-bar">
              <input type="text" id="plan-new-task-text" class="plan-text-input" placeholder="Add a checklist item (e.g. Bring camera, book tickets)..." />
              <button type="button" class="btn-plan-add-task" id="btn-add-task-to-list">+ Add Task</button>
            </div>
          </div>

          <!-- Modal Actions -->
          <div class="modal-actions plan-modal-footer">
            <button class="btn-secondary" type="button" id="btn-cancel-plan">Cancel</button>
            <button class="btn-primary" type="submit" id="btn-save-plan">Save & Add to Itinerary</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(backdrop);

    // Render tasks inside modal
    const renderTasksInModal = () => {
      const container = backdrop.querySelector('#plan-tasks-list');
      const counter = backdrop.querySelector('#plan-tasks-count');
      if (counter) counter.textContent = `${planTasks.length} item${planTasks.length === 1 ? '' : 's'}`;
      if (!container) return;

      if (planTasks.length === 0) {
        container.innerHTML = `<div style="padding: 12px; color: #94a3b8; font-size: 13px; text-align: center; border: 1px dashed #cbd5e1; border-radius: 8px;">No tasks added yet. Type above and click "+ Add Task" or click "+ Add Task" directly to add an item!</div>`;
      } else {
        container.innerHTML = planTasks.map((taskText, idx) => `
          <div class="plan-task-row" data-index="${idx}">
            <div class="plan-task-left">
              <div class="plan-task-check" title="Task ${idx + 1}">
                <svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>
              </div>
              <input type="text" class="plan-task-text-input" data-index="${idx}" value="${esc(taskText)}" placeholder="Enter task description..." />
            </div>
            <button type="button" class="plan-task-delete" data-index="${idx}" title="Remove task">
              <svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
        `).join('');

        container.querySelectorAll('.plan-task-text-input').forEach(input => {
          input.addEventListener('input', (e) => {
            const idx = parseInt(e.target.dataset.index, 10);
            if (!isNaN(idx) && planTasks[idx] !== undefined) {
              planTasks[idx] = e.target.value;
            }
          });
          input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddTask();
            }
          });
        });

        container.querySelectorAll('.plan-task-delete').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const idx = parseInt(btn.dataset.index, 10);
            planTasks.splice(idx, 1);
            renderTasksInModal();
          });
        });
      }
    };

    renderTasksInModal();

    // Add task button & input
    const taskInput = backdrop.querySelector('#plan-new-task-text');
    const addTaskBtn = backdrop.querySelector('#btn-add-task-to-list');

    const handleAddTask = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      const text = taskInput ? taskInput.value.trim() : '';
      if (text) {
        planTasks.push(text);
        if (taskInput) {
          taskInput.value = '';
          taskInput.focus();
        }
        renderTasksInModal();
      } else {
        // If empty, add a customizable task and focus it directly
        const newTaskTitle = `Activity Task #${planTasks.length + 1}`;
        planTasks.push(newTaskTitle);
        renderTasksInModal();
        const inputs = backdrop.querySelectorAll('.plan-task-text-input');
        if (inputs.length) {
          const last = inputs[inputs.length - 1];
          last.focus();
          last.select();
        }
      }
    };

    if (addTaskBtn) {
      addTaskBtn.addEventListener('click', handleAddTask);
    }
    if (taskInput) {
      taskInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          handleAddTask();
        }
      });
    }

    // Slot pill clicks
    const slotPills = backdrop.querySelectorAll('.plan-slot-pill');
    slotPills.forEach(pill => {
      pill.addEventListener('click', () => {
        slotPills.forEach(p => p.classList.remove('is-active'));
        pill.classList.add('is-active');
        chosenSlot = pill.dataset.slot;
        if (slotDefaults[chosenSlot]) {
          chosenTime = slotDefaults[chosenSlot].time;
          const timeInput = backdrop.querySelector('#plan-time-input');
          if (timeInput) timeInput.value = chosenTime;
        }
      });
    });

    // Date chips and input
    const dateInput = backdrop.querySelector('#plan-custom-date');
    const dateChips = backdrop.querySelectorAll('.plan-date-chip');
    dateChips.forEach(chip => {
      chip.addEventListener('click', () => {
        dateChips.forEach(c => c.classList.remove('is-active'));
        chip.classList.add('is-active');
        const day = parseInt(chip.dataset.day, 10);
        chosenDay = day;
        if (dateInput) {
          dateInput.value = `2026-08-${String(day).padStart(2, '0')}`;
        }
      });
    });

    if (dateInput) {
      dateInput.addEventListener('change', () => {
        const val = dateInput.value;
        if (val) {
          const parts = val.split('-');
          if (parts[2]) {
            chosenDay = parseInt(parts[2], 10);
            dateChips.forEach(c => {
              c.classList.toggle('is-active', parseInt(c.dataset.day, 10) === chosenDay);
            });
          }
        }
      });
    }

    // Image preset chips & upload
    const imgPreview = backdrop.querySelector('#plan-img-preview');
    const imgUrlInput = backdrop.querySelector('#plan-img-url-input');
    const imgFile = backdrop.querySelector('#plan-img-file-input');
    const scenicChips = backdrop.querySelectorAll('.plan-scenic-chip');

    scenicChips.forEach(chip => {
      chip.addEventListener('click', () => {
        scenicChips.forEach(c => c.classList.remove('is-selected'));
        chip.classList.add('is-selected');
        chosenImg = chip.dataset.url;
        if (imgPreview) imgPreview.src = chosenImg;
        if (imgUrlInput) imgUrlInput.value = chosenImg;
      });
    });

    if (imgUrlInput) {
      imgUrlInput.addEventListener('input', () => {
        const url = imgUrlInput.value.trim();
        if (url) {
          chosenImg = url;
          if (imgPreview) imgPreview.src = url;
          scenicChips.forEach(c => c.classList.toggle('is-selected', c.dataset.url === url));
        }
      });
    }

    if (imgFile) {
      imgFile.addEventListener('change', () => {
        const file = imgFile.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (re) => {
            chosenImg = re.target.result;
            if (imgPreview) imgPreview.src = chosenImg;
            if (imgUrlInput) imgUrlInput.value = 'Local photo selected';
            scenicChips.forEach(c => c.classList.remove('is-selected'));
          };
          reader.readAsDataURL(file);
        }
      });
    }

    const closeDialog = () => backdrop.remove();
    backdrop.querySelector('.modal-close').addEventListener('click', closeDialog);
    backdrop.querySelector('#btn-cancel-plan').addEventListener('click', closeDialog);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeDialog();
    });

    // Form submit
    backdrop.querySelector('#custom-plan-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const title = backdrop.querySelector('#plan-title-input').value.trim();
      if (!title) return;

      const timeVal = backdrop.querySelector('#plan-time-input').value.trim() || slotDefaults[chosenSlot].time;
      const dayData = getOrGenerateDayPlan(chosenDay);

      if (!dayData.periodOrder) {
        dayData.periodOrder = ['morning', 'afternoon', 'evening'].concat(dayData.night ? ['night'] : []);
      }

      // Add to periodOrder if not present
      if (!dayData.periodOrder.includes(chosenSlot)) {
        dayData.periodOrder.push(chosenSlot);
      }

      // Populate slot data
      const periodName = slotDefaults[chosenSlot].name;
      const periodIcon = slotDefaults[chosenSlot].icon;
      const newTasks = (planTasks.length > 0 ? planTasks : [title]).map((txt, i) => ({
        id: `t_custom_${Date.now()}_${i}`,
        text: txt,
        done: false,
      }));

      dayData[chosenSlot] = {
        period: periodName,
        time: timeVal,
        icon: periodIcon,
        theme: `period-${chosenSlot}`,
        image: chosenImg || 'images/places/sajek.jpg',
        tasks: newTasks,
      };

      closeDialog();
      selectedDay = chosenDay;
      renderPlanner();
      showToast(`Added "${title}" to August ${chosenDay} (${periodName})!`);
    });
  }

  /* ---------------- place detail sheet ---------------- */

  function sheet() {
    let el = $('.sheet');
    if (el) return el;
    el = document.createElement('div');
    el.className = 'sheet';
    el.innerHTML =
      '<div class="sheet-card" role="dialog" aria-modal="true">' +
      '<button class="sheet-close" type="button" aria-label="Close"><svg viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></svg></button>' +
      '<img alt="" /><div class="sheet-body"></div></div>';
    el.addEventListener('click', (e) => {
      if (e.target === el || e.target.closest('.sheet-close')) closeSheet();
    });
    document.getElementById('app').appendChild(el); // inherits the app's svg + font rules
    return el;
  }

  function openPlace(id) {
    const p = byId.get(id);
    if (!p) return;
    closeSheet();
    renderPlace(p);
    setView('place');
    showMap(p);

    if (window.innerWidth <= 768) {
      const mhEl = document.getElementById('mobile-home');
      const appEl = document.getElementById('app');
      if (appEl) {
        appEl.style.setProperty('display', 'flex', 'important');
        appEl.hidden = false;
      }
      if (mhEl) {
        mhEl.style.display = 'none';
      }
    }

    const pagePlace = $('#page-place');
    if (pagePlace) pagePlace.scrollTop = 0;
    const scrollEl = document.documentElement || document.body;
    scrollEl.scrollTop = 0;
    $('#pdp-back')?.focus({ preventScroll: true });
  }

  function closeSheet() {
    $('.sheet')?.classList.remove('is-open');
  }

  /* ---------------- search ---------------- */

  function renderSearch(q, boxSel = '#search-results') {
    const box = $(boxSel);
    const term = q.trim().toLowerCase();
    if (!term) {
      box.hidden = true;
      return;
    }
    const hits = catalog.places.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.district.toLowerCase().includes(term) ||
        p.tag.toLowerCase().includes(term)
    );
    box.innerHTML = hits.length
      ? hits
          .slice(0, 6)
          .map(
            (p) => `<li><button type="button" data-id="${p.id}">
              <img src="${p.image}" alt="" /><span><strong>${esc(p.name)}</strong><small>${esc(p.tag)} &middot; ${esc(p.district)}</small></span>
            </button></li>`
          )
          .join('')
      : `<li class="empty">Nothing by that name yet — ask me in the chat instead (◕‿◕)</li>`;
    box.hidden = false;
  }

  /* ---------------- chat panel (narrow screens) ---------------- */

  function openChat() {
    $('#app').classList.remove('chat-hidden');
    $('#app').classList.add('chat-open');
  }

  function hideChat() {
    $('#app').classList.add('chat-hidden');
    $('#chat-reveal').focus({ preventScroll: true });
  }

  /* ---------------- drag the chat panel wider or narrower ---------------- */

  const CHAT_MIN = 260;
  const chatMax = () => Math.max(CHAT_MIN, Math.min(840, window.innerWidth - 320));

  function setChatWidth(px) {
    const w = Math.round(Math.min(chatMax(), Math.max(CHAT_MIN, px)));
    const app = $('#app');
    if (app) app.style.setProperty('--chat-w', `${w}px`);
    const chatEl = $('aside.chat');
    if (chatEl) chatEl.style.width = `${w}px`;
    try {
      localStorage.setItem('bp-chat-w', String(w));
    } catch (err) {
      /* private mode — the width just will not stick */
    }
    updateRailButtons();
  }

  function restoreChatWidth() {
    let saved = null;
    try {
      saved = localStorage.getItem('bp-chat-w');
    } catch (err) {
      saved = null;
    }
    if (saved) setChatWidth(Number(saved));
  }

  function wireChatResize() {
    const handle = $('#chat-resize');
    const app = $('#app');
    if (!handle || !app) return;

    let isDragging = false;
    let widthBadge = null;

    const showWidthBadge = (w) => {
      if (!widthBadge) {
        widthBadge = document.createElement('div');
        widthBadge.className = 'chat-resize-badge';
        document.body.appendChild(widthBadge);
      }
      widthBadge.textContent = `${w}px`;
      const rect = handle.getBoundingClientRect();
      widthBadge.style.top = `${Math.max(10, rect.top + rect.height / 2 - 16)}px`;
      widthBadge.style.left = `${Math.max(10, rect.left - 70)}px`;
      widthBadge.classList.add('is-visible');
    };

    const hideWidthBadge = () => {
      if (widthBadge) {
        widthBadge.classList.remove('is-visible');
        setTimeout(() => widthBadge?.remove(), 200);
        widthBadge = null;
      }
    };

    const onStart = (e) => {
      if (window.innerWidth < 640) return; // only disable on very small mobile phones
      e.preventDefault();
      isDragging = true;
      app.classList.add('is-resizing');
      document.body.classList.add('is-resizing-global');

      const moveHandler = (moveEvent) => {
        if (!isDragging) return;
        const clientX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
        const newWidth = window.innerWidth - clientX;
        setChatWidth(newWidth);
        const actualWidth = Math.round(Math.min(chatMax(), Math.max(CHAT_MIN, newWidth)));
        showWidthBadge(actualWidth);
      };

      const upHandler = () => {
        if (!isDragging) return;
        isDragging = false;
        app.classList.remove('is-resizing');
        document.body.classList.remove('is-resizing-global');
        hideWidthBadge();
        window.removeEventListener('pointermove', moveHandler);
        window.removeEventListener('mousemove', moveHandler);
        window.removeEventListener('touchmove', moveHandler);
        window.removeEventListener('pointerup', upHandler);
        window.removeEventListener('mouseup', upHandler);
        window.removeEventListener('touchend', upHandler);
        window.removeEventListener('pointercancel', upHandler);
      };

      window.addEventListener('pointermove', moveHandler, { passive: false });
      window.addEventListener('mousemove', moveHandler, { passive: false });
      window.addEventListener('touchmove', moveHandler, { passive: false });
      window.addEventListener('pointerup', upHandler);
      window.addEventListener('mouseup', upHandler);
      window.addEventListener('touchend', upHandler);
      window.addEventListener('pointercancel', upHandler);
    };

    handle.addEventListener('pointerdown', onStart);
    handle.addEventListener('mousedown', onStart);
    handle.addEventListener('touchstart', onStart, { passive: false });

    handle.addEventListener('keydown', (e) => {
      const step = e.shiftKey ? 60 : 20;
      if (e.key === 'ArrowLeft') setChatWidth($('.chat').offsetWidth + step);
      else if (e.key === 'ArrowRight') setChatWidth($('.chat').offsetWidth - step);
      else return;
      e.preventDefault();
    });
  }

  function closeChat() {
    $('#app').classList.remove('chat-open');
  }

  /* ---------------- booking & notifications ---------------- */

  function showToast(msg) {
    let t = $('#bp-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'bp-toast';
      t.className = 'bp-toast';
      document.body.appendChild(t);
    }
    t.innerHTML = `<span>${msg}</span>`;
    t.classList.add('is-visible');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('is-visible'), 4000);
  }

  function openBookingModal(placeId) {
    const p = byId.get(placeId);
    if (!p) return;
    const isFood = Boolean(p.isFood);
    let modal = $('#booking-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'booking-modal';
      modal.className = 'modal-backdrop';
      document.body.appendChild(modal);
    }
    modal.innerHTML = `
      <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="bm-title">
        <button class="modal-close" type="button" id="bm-close" aria-label="Close dialog"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
        <div class="modal-header">
          <img class="modal-hero-img" src="${esc(p.image)}" alt="" onerror="this.onerror=null; this.src='${isFood ? 'images/categories/cuisine.jpg' : 'images/places/sajek.jpg'}';" />
          <div class="modal-header-info">
            <span class="modal-badge">${esc(p.tag || (isFood ? 'Traditional Dish' : 'Destinations'))}</span>
            <h2 id="bm-title">${isFood ? `Where to Taste: ${esc(p.name)}` : `Book journey to ${esc(p.name)}`}</h2>
            <p class="modal-sub"><svg viewBox="0 0 24 24" class="loc-pin"><path d="M12 21s7-6.4 7-11a7 7 0 1 0-14 0c0 4.6 7 11 7 11z"/><circle cx="12" cy="10" r="2.6" fill="#fff"/></svg>${esc(p.district)}, ${esc(p.division || 'Bangladesh')}</p>
          </div>
        </div>
        <form class="modal-form" id="bm-form">
          <div class="form-row form-grid-2">
            <div class="form-group">
              <label for="bm-date-from">${isFood ? 'Tasting / Tour Date' : 'Travel Date'}</label>
              <input type="date" id="bm-date-from" required value="${new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]}" />
            </div>
            <div class="form-group">
              <label for="bm-guests">${isFood ? 'Guests / Foodies' : 'Travelers'}</label>
              <select id="bm-guests">
                <option value="1">1 Person</option>
                <option value="2" selected>2 Foodies</option>
                <option value="4">4 Foodies (Friends / Family)</option>
                <option value="8">8+ Group Food Tour</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label for="bm-type">${isFood ? 'Food Tour & Tasting Package' : 'Travel & Tour Package'}</label>
            <select id="bm-type">
              ${isFood ? `
                <option value="standard">Iconic Heritage Kitchen / Historic Stall Visit (${esc(p.fare)})</option>
                <option value="guided">Guided Old Town Food Walk & Secret Spice Tasting</option>
                <option value="vip">Full Culinary Trail & Chef Masterclass Experience</option>
              ` : `
                <option value="standard">Standard Route & Local Guide (${esc(p.fare)})</option>
                <option value="premium">Guided AI Heritage Expedition + Transport</option>
                <option value="luxury">VIP Private Transport & Resort Package</option>
              `}
            </select>
          </div>
          <div class="modal-price-box">
            <span>${isFood ? 'Estimated Price / Plate:' : 'Estimated Package:'}</span>
            <strong class="modal-price">${esc(p.fare || (isFood ? '৳250' : '৳2,500'))}</strong>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" id="bm-ask-ai">${isFood ? 'Ask AI Food Guide' : 'Ask AI Guide'}</button>
            <button type="submit" class="btn-primary">${isFood ? 'Confirm Tasting Tour' : 'Confirm Reservation'}</button>
          </div>
        </form>
      </div>`;
    modal.classList.add('is-open');
    modal.querySelector('#bm-close').onclick = () => modal.classList.remove('is-open');
    modal.onclick = (e) => {
      if (e.target === modal) modal.classList.remove('is-open');
    };
    modal.querySelector('#bm-ask-ai').onclick = () => {
      modal.classList.remove('is-open');
      openChat();
      if (isFood) {
        send(`Where can I taste the most authentic ${p.name} in ${p.district}? Give me the legendary restaurant names, addresses, and dining etiquette.`);
      } else {
        send(`Help me prepare and organize a complete booking itinerary for ${p.name} in ${p.district}.`);
      }
    };
    modal.querySelector('#bm-form').onsubmit = (e) => {
      e.preventDefault();
      modal.classList.remove('is-open');
      if (isFood) {
        showToast(`🍲 Food tour & tasting reserved for ${p.name}! Booking reference #BP-${Math.floor(100000 + Math.random() * 900000)} saved.`);
      } else {
        showToast(`🎉 Reservation confirmed for ${p.name}! Booking reference #BP-${Math.floor(100000 + Math.random() * 900000)} saved.`);
      }
    };
  }

  /* ---------------- translator view (Fast & Smooth Engine) ---------------- */

  const TRANSLATOR_LANGS = [
    { code: 'en', name: 'English' },
    { code: 'bn', name: 'Bangla' },
    { code: 'syl', name: 'Sylheti' },
    { code: 'ctg', name: 'Chittagonian' },
    { code: 'es', name: 'Spanish' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hi', name: 'Hindi' },
    { code: 'fr', name: 'French' },
    { code: 'ja', name: 'Japanese' },
    { code: 'de', name: 'German' },
  ];

  const TRANS_STORAGE_KEY = 'banglapath_trans_recent_v3';

  function loadRecentTranslations() {
    try {
      const raw = localStorage.getItem(TRANS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [
      { id: 'r1', src: 'Where is the nearest hospital?', tgt: 'নিকটতম হাসপাতাল কোথায় ?', pron: 'Nikot-tomo hashpatal kothay?', starred: false },
      { id: 'r2', src: 'I would like a cup of tea.', tgt: 'আমি এক কাপ চা চাই।', pron: 'Ami ek cup cha chai.', starred: false },
      { id: 'r3', src: 'Thank you so much.', tgt: 'আপনাকে অনেক ধন্যবাদ।', pron: 'Apnake onek dhonnobad.', starred: false },
      { id: 'r4', src: "How can I go to Cox's Bazar?", tgt: 'কক্সবাজার যেতে কীভাবে পারি ?', pron: "Cox's Bazar jete kibhabe pari?", starred: false },
      { id: 'r5', src: 'Is this seat available?', tgt: 'এই আসনটি কি খালি ?', pron: 'Ei asonti ki khali?', starred: false },
    ];
  }

  function saveRecentTranslations(list) {
    try {
      localStorage.setItem(TRANS_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {}
  }

  let transState = {
    srcLang: 'en',
    tgtLang: 'bn',
    srcText: 'How much is its price?',
    tgtText: 'এটির দাম কত?',
    pronText: 'Etir daam koto?',
    isListening: false,
    isLoading: false,
    debounceTimer: null,
    recent: loadRecentTranslations(),
  };

  const clientTransCache = new Map();
  let activeTransAbort = null;
  let activeTransAudio = null;
  let activeTransRecognition = null;
  let cachedVoices = [];

  function updateVoicesCache() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      cachedVoices = window.speechSynthesis.getVoices() || [];
    }
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    updateVoicesCache();
    window.speechSynthesis.onvoiceschanged = updateVoicesCache;
  }

  // Comprehensive Instant Travel Phrasebook & Vocabulary (0ms instant lookup)
  const QUICK_PHRASES = {
    'how much is its price?': { bn: 'এটির দাম কত?', pron: 'Etir daam koto?' },
    'how much is its price': { bn: 'এটির দাম কত?', pron: 'Etir daam koto?' },
    'how much is this?': { bn: 'এটার দাম কত?', pron: 'Etar daam koto?' },
    'how much is this': { bn: 'এটার দাম কত?', pron: 'Etar daam koto?' },
    'how much?': { bn: 'কত টাকা?', pron: 'Koto taka?' },
    'how much': { bn: 'কত টাকা?', pron: 'Koto taka?' },
    'what is the price?': { bn: 'দাম কত?', pron: 'Daam koto?' },
    'what is the price': { bn: 'দাম কত?', pron: 'Daam koto?' },
    'where is the nearest hospital?': { bn: 'নিকটতম হাসপাতাল কোথায়?', pron: 'Nikot-tomo hashpatal kothay?' },
    'where is the nearest hospital': { bn: 'নিকটতম হাসপাতাল কোথায়?', pron: 'Nikot-tomo hashpatal kothay?' },
    'where is the hospital?': { bn: 'হাসপাতাল কোথায়?', pron: 'Hashpatal kothay?' },
    'where is the hospital': { bn: 'হাসপাতাল কোথায়?', pron: 'Hashpatal kothay?' },
    'i would like a cup of tea.': { bn: 'আমি এক কাপ চা চাই।', pron: 'Ami ek cup cha chai.' },
    'i would like a cup of tea': { bn: 'আমি এক কাপ চা চাই।', pron: 'Ami ek cup cha chai.' },
    'i would like tea': { bn: 'আমি চা চাই।', pron: 'Ami cha chai.' },
    'thank you so much.': { bn: 'আপনাকে অনেক ধন্যবাদ।', pron: 'Apnake onek dhonnobad.' },
    'thank you so much': { bn: 'আপনাকে অনেক ধন্যবাদ।', pron: 'Apnake onek dhonnobad.' },
    'thank you': { bn: 'ধন্যবাদ', pron: 'Dhonnobad' },
    'thanks': { bn: 'ধন্যবাদ', pron: 'Dhonnobad' },
    "how can i go to cox's bazar?": { bn: 'কক্সবাজার কীভাবে যাব?', pron: "Cox's Bazar kibhabe jabo?" },
    "how can i go to cox's bazar": { bn: 'কক্সবাজার কীভাবে যাব?', pron: "Cox's Bazar kibhabe jabo?" },
    'is this seat available?': { bn: 'এই আসনটি কি খালি?', pron: 'Ei asonti ki khali?' },
    'is this seat available': { bn: 'এই আসনটি কি খালি?', pron: 'Ei asonti ki khali?' },
    'hello': { bn: 'হ্যালো / আসসালামু আলাইকুম', pron: 'Assalamu alaikum / Hello' },
    'hi': { bn: 'হ্যালো / আসসালামু আলাইকুম', pron: 'Assalamu alaikum' },
    'good morning': { bn: 'শুভ সকাল', pron: 'Shuvo shokal' },
    'good evening': { bn: 'শুভ সন্ধ্যা', pron: 'Shuvo shondha' },
    'good night': { bn: 'শুভ রাত্রি', pron: 'Shuvo ratri' },
    'how are you?': { bn: 'আপনি কেমন আছেন?', pron: 'Apni kemon achen?' },
    'how are you': { bn: 'আপনি কেমন আছেন?', pron: 'Apni kemon achen?' },
    'i am fine': { bn: 'আমি ভালো আছি', pron: 'Ami bhalo achi' },
    'where is the washroom?': { bn: 'ওয়াশরুম কোথায়?', pron: 'Washroom kothay?' },
    'where is the toilet?': { bn: 'টয়লেট কোথায়?', pron: 'Toilet kothay?' },
    'where is the toilet': { bn: 'টয়লেট কোথায়?', pron: 'Toilet kothay?' },
    'where is the bathroom?': { bn: 'বাথরুম কোথায়?', pron: 'Bathroom kothay?' },
    'what is your name?': { bn: 'আপনার নাম কি?', pron: 'Apnar naam ki?' },
    'what is your name': { bn: 'আপনার নাম কি?', pron: 'Apnar naam ki?' },
    'my name is': { bn: 'আমার নাম', pron: 'Amar naam' },
    'help me': { bn: 'আমাকে সাহায্য করুন', pron: 'Amake shahajjo korun' },
    'help me please': { bn: 'দয়া করে সাহায্য করুন', pron: 'Doya kore shahajjo korun' },
    'please help': { bn: 'দয়া করে সাহায্য করুন', pron: 'Doya kore shahajjo korun' },
    'delicious food': { bn: 'খুব সুস্বাদু খাবার', pron: 'Khub shushadu khabar' },
    'good food': { bn: 'ভালো খাবার', pron: 'Bhalo khabar' },
    'how far is it?': { bn: 'এটি কত দূরে?', pron: 'Eti koto dure?' },
    'how far': { bn: 'কত দূরে?', pron: 'Koto dure?' },
    'i want to go there': { bn: 'আমি সেখানে যেতে চাই', pron: 'Ami shekhane jete chai' },
    'where can i buy tickets?': { bn: 'কোথায় টিকিট পাওয়া যাবে?', pron: 'Kothay ticket paowa jabe?' },
    'bus station': { bn: 'বাস স্টেশন', pron: 'Bus station' },
    'where is the bus station?': { bn: 'বাস স্টেশন কোথায়?', pron: 'Bus station kothay?' },
    'train station': { bn: 'রেলওয়ে স্টেশন', pron: 'Railway station' },
    'airport': { bn: 'বিমানবন্দর', pron: 'Biman bondor' },
    'hotel': { bn: 'হোটেল', pron: 'Hotel' },
    'restaurant': { bn: 'রেস্তোরাঁ / খাবার হোটেল', pron: 'Restaurant' },
    'water': { bn: 'পানি', pron: 'Pani' },
    'drinking water': { bn: 'খাওয়ার পানি', pron: 'Khaowar pani' },
    'rice': { bn: 'ভাত', pron: 'Bhaat' },
    'tea': { bn: 'চা', pron: 'Cha' },
    'yes': { bn: 'হ্যাঁ', pron: 'Hae' },
    'no': { bn: 'না', pron: 'Na' },
    'please': { bn: 'দয়া করে', pron: 'Doya kore' },
    'sorry': { bn: 'দুঃখিত', pron: 'Dukkhito' },
    'excuse me': { bn: 'শুনুন / মাফ করবেন', pron: 'Shunun / Maf korben' },
    'stop here': { bn: 'এখানে থামুন', pron: 'Ekhane thamun' },
    'let us go': { bn: 'চলুন যাই', pron: 'Cholun jai' },
  };

  // Reverse mapping for instant 0ms Bangla -> English translations
  const QUICK_PHRASES_BN_TO_EN = {
    'হ্যালো': 'Hello',
    'হাই': 'Hi',
    'কেমন আছেন': 'How are you?',
    'কেমন আছেন?': 'How are you?',
    'আপনি কেমন আছেন?': 'How are you?',
    'ভালো আছি': 'I am fine',
    'আমি ভালো আছি': 'I am fine',
    'ধন্যবাদ': 'Thank you',
    'আপনাকে অনেক ধন্যবাদ': 'Thank you very much',
    'আপনাকে অনেক ধন্যবাদ।': 'Thank you very much',
    'দাম কত': 'How much is it?',
    'দাম কত?': 'How much is it?',
    'কত দাম': 'How much is it?',
    'কত দাম?': 'How much is it?',
    'কত টাকা': 'How much money?',
    'কত টাকা?': 'How much money?',
    'এটির দাম কত': 'How much is its price?',
    'এটির দাম কত?': 'How much is its price?',
    'এর দাম কত': 'How much is its price?',
    'এর দাম কত?': 'How much is its price?',
    'এটার দাম কত': 'How much is this?',
    'এটার দাম কত?': 'How much is this?',
    'হাসপাতাল কোথায়': 'Where is the hospital?',
    'হাসপাতাল কোথায়?': 'Where is the hospital?',
    'হাসপাতাল কোথায়?': 'Where is the hospital?',
    'নিকটতম হাসপাতাল কোথায়': 'Where is the nearest hospital?',
    'নিকটতম হাসপাতাল কোথায়?': 'Where is the nearest hospital?',
    'নিকটতম হাসপাতাল কোথায় ?': 'Where is the nearest hospital?',
    'টয়লেট কোথায়': 'Where is the toilet?',
    'টয়লেট কোথায়?': 'Where is the toilet?',
    'ওয়াশরুম কোথায়': 'Where is the washroom?',
    'ওয়াশরুম কোথায়?': 'Where is the washroom?',
    'বাথরুম কোথায়': 'Where is the bathroom?',
    'বাথরুম কোথায়?': 'Where is the bathroom?',
    'সাহায্য করুন': 'Help me',
    'আমাকে সাহায্য করুন': 'Please help me',
    'দয়া করে সাহায্য করুন': 'Please help',
    'পানি': 'Water',
    'খাওয়ার পানি': 'Drinking water',
    'চা': 'Tea',
    'আমি চা চাই': 'I want tea',
    'আমি এক কাপ চা চাই': 'I would like a cup of tea',
    'আমি এক কাপ চা চাই।': 'I would like a cup of tea',
    'ভাত': 'Rice',
    'হোটেল': 'Hotel',
    'হোটেল কোথায়': 'Where is the hotel?',
    'হোটেল কোথায়?': 'Where is the hotel?',
    'রেস্তোরাঁ': 'Restaurant',
    'বাস স্টেশন': 'Bus station',
    'বাস স্টেশন কোথায়': 'Where is the bus station?',
    'বাস স্টেশন কোথায়?': 'Where is the bus station?',
    'রেলওয়ে স্টেশন': 'Railway station',
    'বিমানবন্দর': 'Airport',
    'হ্যাঁ': 'Yes',
    'না': 'No',
    'দয়া করে': 'Please',
    'দুঃখিত': 'Sorry',
    'এখানে থামুন': 'Stop here',
    'চলুন যাই': "Let's go",
    'কক্সবাজার কীভাবে যাব': "How can I go to Cox's Bazar?",
    'কক্সবাজার কীভাবে যাব?': "How can I go to Cox's Bazar?",
    'কক্সবাজার যেতে কীভাবে পারি ?': "How can I go to Cox's Bazar?",
    'এই আসনটি কি খালি ?': 'Is this seat available?',
    'এই আসনটি কি খালি?': 'Is this seat available?',
    'খুব সুস্বাদু খাবার': 'Very delicious food',
  };

  function getLangName(code) {
    const l = TRANSLATOR_LANGS.find((item) => item.code === code);
    return l ? l.name : code;
  }

  function renderRecentListMarkup() {
    if (!transState.recent || transState.recent.length === 0) {
      return `
        <div style="text-align: center; padding: 24px 16px; color: #94a3b8;">
          <svg style="width: 28px; height: 28px; stroke: #cbd5e1; fill: none; stroke-width: 1.5; margin: 0 auto 6px; display: block;" viewBox="0 0 24 24"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
          <p style="margin: 0; font-size: 13px;">No saved translations yet.</p>
        </div>`;
    }

    return transState.recent
      .slice(0, 5)
      .map(
        (item) => `
        <div class="trans-recent-item" data-id="${item.id}" tabindex="0" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 12px; margin-bottom: 6px; cursor: pointer; transition: all 0.15s ease;">
          <div style="flex: 1; min-width: 0; padding-right: 12px;">
            <p style="margin: 0 0 2px 0; font-size: 13.5px; font-weight: 600; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${esc(item.src)}</p>
            <p style="margin: 0; font-size: 13px; font-weight: 700; color: #15803d; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${esc(item.tgt)}</p>
            ${item.pron ? `<span style="font-size: 11px; color: #047857; font-weight: 500;">🗣 ${esc(item.pron)}</span>` : ''}
          </div>
          <div style="display: flex; align-items: center; gap: 4px;">
            <button class="trans-mini-icon-btn" type="button" data-load-id="${item.id}" title="Load phrase" aria-label="Load phrase" style="padding: 4px; color: #0f172a;">
              <svg viewBox="0 0 24 24" style="width: 16px; height: 16px;"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
            <button class="trans-mini-icon-btn ${item.starred ? 'is-starred' : ''}" type="button" data-star-id="${item.id}" title="${item.starred ? 'Starred' : 'Star'}" aria-label="Star" style="padding: 4px; color: ${item.starred ? '#eab308' : '#94a3b8'};">
              <svg viewBox="0 0 24 24" style="width: 16px; height: 16px;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </button>
            <button class="trans-mini-icon-btn" type="button" data-del-id="${item.id}" title="Delete" aria-label="Delete" style="padding: 4px; color: #94a3b8;">
              <svg viewBox="0 0 24 24" style="width: 16px; height: 16px;"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/></svg>
            </button>
          </div>
        </div>`
      )
      .join('');
  }

  // Primary rendering function for translator
  function renderTranslator() {
    const page = $('#page-translator');
    if (!page) return;

    const srcLangName = getLangName(transState.srcLang);
    const tgtLangName = getLangName(transState.tgtLang);
    const isEnToBn = transState.srcLang === 'en' && transState.tgtLang === 'bn';
    const isBnToEn = transState.srcLang === 'bn' && transState.tgtLang === 'en';

    page.innerHTML = `
      <div class="trans-page-wrap">
        <div class="trans-page-title-wrap">
          <h1 class="trans-page-title">Translator</h1>
          <p class="trans-page-subtitle">Instant speech and text translation for Bangladesh travel</p>
        </div>

        <!-- Unified Language Switcher: English one side, Bangla the other, switcher button in the middle -->
        <div class="trans-unified-switcher" role="group" aria-label="Language switcher">
          <button type="button" class="trans-switcher-pill trans-switcher-left" id="trans-toggle-src" title="Switch language direction">
            <span class="trans-switcher-flag">${transState.srcLang === 'en' ? '🇬🇧' : '🇧🇩'}</span>
            <span class="trans-switcher-name">${esc(srcLangName)}</span>
          </button>

          <button type="button" class="trans-switcher-btn" id="trans-dir-swap" title="Switch language direction" aria-label="Switch language positions">
            <svg viewBox="0 0 24 24" aria-hidden="true" class="trans-switcher-icon"><path d="m7 16-4-4 4-4m10 8 4-4-4-4M3 12h18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>

          <button type="button" class="trans-switcher-pill trans-switcher-right" id="trans-toggle-tgt" title="Switch language direction">
            <span class="trans-switcher-flag">${transState.tgtLang === 'en' ? '🇬🇧' : '🇧🇩'}</span>
            <span class="trans-switcher-name">${esc(tgtLangName)}</span>
          </button>
        </div>

        <!-- Unified Translation Card -->
        <div class="trans-unified-card">
          <!-- Top Source Half (White) -->
          <div class="trans-half trans-src-half">
            <div class="trans-half-top">
              <button type="button" class="trans-lang-chip-btn" id="trans-src-chip" title="Choose input language">
                <span>${esc(srcLangName)}</span>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
              </button>
              <div class="trans-top-actions">
                <span class="trans-count" id="trans-char-count">${(transState.srcText || '').length} / 500</span>
                <button type="button" class="trans-clear-icon-btn" id="trans-clear-src" title="Clear text" aria-label="Clear source text" style="${transState.srcText ? '' : 'display: none;'}">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
            </div>

            <textarea class="trans-text-area" id="trans-src-input" maxlength="500" placeholder="${transState.srcLang === 'bn' ? 'এখানে বাংলায় লিখুন বা বলুন...' : 'Type or speak in English...'}" aria-label="Source text to translate">${esc(transState.srcText || '')}</textarea>

            <div class="trans-half-bottom">
              <div class="trans-bottom-left">
                <span class="trans-input-badge">⌨️ Keyboard / 🎙️ Voice</span>
              </div>
              <button class="trans-mini-icon-btn" type="button" id="trans-src-speaker-btn" title="Listen to input" aria-label="Listen to input">
                <svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                <span>Listen</span>
              </button>
            </div>
          </div>

          <!-- Bottom Target Half (Pastel Mint Green) -->
          <div class="trans-half trans-tgt-half">
            <div class="trans-half-top">
              <button type="button" class="trans-lang-chip-btn" id="trans-tgt-chip" title="Choose target language">
                <span>${esc(tgtLangName)}</span>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
              </button>
              <button class="trans-speaker-icon-btn" type="button" id="trans-speaker-btn" title="Listen to translation" aria-label="Listen to translation">
                <svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
                <span>Listen</span>
              </button>
            </div>

            <div class="trans-target-output ${!transState.tgtText ? 'is-empty' : ''}" id="trans-result-output" aria-live="polite">
              ${esc(transState.tgtText || 'Translation will appear here...')}
            </div>

            <div class="trans-pron-row" id="trans-pron-row" style="${transState.pronText ? '' : 'display: none;'}">
              <div class="trans-pron-badge" id="trans-pron-badge">
                <span>🗣 Pronounce:</span>
                <strong id="trans-pron-text">${esc(transState.pronText || '')}</strong>
              </div>
            </div>

            <div class="trans-half-bottom">
              <span class="trans-input-badge" id="trans-status-msg">Instant Translation</span>
              <button class="trans-copy-icon-btn" type="button" id="trans-copy-btn" title="Copy translation" aria-label="Copy translation">
                <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                <span id="trans-copy-label">Copy</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Center Mic Button -->
        <div class="trans-mic-wrap">
          <button class="trans-center-mic-btn" type="button" id="trans-mic-btn" aria-label="Voice input" title="Tap to speak">
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11.4a6.5 6.5 0 0 0 13 0M12 18v3"/></svg>
          </button>
          <span class="trans-mic-label" id="trans-mic-label">Tap to speak in ${esc(srcLangName)}</span>
        </div>

        <!-- Bottom Language Selector Pill Bar -->
        <div class="trans-lang-pill-bar">
          <button class="trans-lang-pill-btn" type="button" id="trans-src-toggle" title="Change source language">
            <span>${esc(srcLangName)}</span>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
          </button>

          <button class="trans-swap-arrows-btn" type="button" id="trans-swap-btn" title="Swap languages" aria-label="Swap languages">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 16V4m0 0L3 8m4-4l4 4m6 4v12m0 0l4-4m-4 4l-4-4"/></svg>
          </button>

          <button class="trans-lang-pill-btn" type="button" id="trans-tgt-toggle" title="Change target language">
            <span>${esc(tgtLangName)}</span>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
          </button>
        </div>

        <!-- Quick Travel Phrases section -->
        <div class="trans-quick-phrases-section">
          <div class="trans-section-header">
            <h3 class="trans-section-title">⚡ Quick Travel Phrases</h3>
            <span class="trans-section-sub">Tap any phrase to translate & hear</span>
          </div>
          <div class="trans-phrase-chips-grid">
            <button type="button" class="trans-phrase-chip" data-phrase="How much is its price?" data-bn="এটির দাম কত?">
              <span>How much is its price?</span>
              <small>এটির দাম কত?</small>
            </button>
            <button type="button" class="trans-phrase-chip" data-phrase="Where is the nearest hospital?" data-bn="নিকটতম হাসপাতাল কোথায়?">
              <span>Where is hospital?</span>
              <small>হাসপাতাল কোথায়?</small>
            </button>
            <button type="button" class="trans-phrase-chip" data-phrase="Where is the toilet?" data-bn="টয়লেট কোথায়?">
              <span>Where is washroom?</span>
              <small>টয়লেট কোথায়?</small>
            </button>
            <button type="button" class="trans-phrase-chip" data-phrase="I would like a cup of tea." data-bn="আমি এক কাপ চা চাই।">
              <span>I would like tea</span>
              <small>আমি এক কাপ চা চাই</small>
            </button>
            <button type="button" class="trans-phrase-chip" data-phrase="Thank you so much." data-bn="আপনাকে অনেক ধন্যবাদ।">
              <span>Thank you so much</span>
              <small>অনেক ধন্যবাদ</small>
            </button>
            <button type="button" class="trans-phrase-chip" data-phrase="Where is the bus station?" data-bn="বাস স্টেশন কোথায়?">
              <span>Where is bus station?</span>
              <small>বাস স্টেশন কোথায়?</small>
            </button>
            <button type="button" class="trans-phrase-chip" data-phrase="Help me please" data-bn="আমাকে সাহায্য করুন">
              <span>Please help me</span>
              <small>আমাকে সাহায্য করুন</small>
            </button>
            <button type="button" class="trans-phrase-chip" data-phrase="Stop here" data-bn="এখানে থামুন">
              <span>Stop here</span>
              <small>এখানে থামুন</small>
            </button>
            <button type="button" class="trans-phrase-chip" data-phrase="Drinking water" data-bn="খাওয়ার পানি">
              <span>Drinking water</span>
              <small>খাওয়ার পানি</small>
            </button>
          </div>
        </div>

        <!-- Recent Translations section -->
        <div class="trans-recent-section">
          <div class="trans-section-header">
            <h3 class="trans-section-title">🕒 Recent Phrases</h3>
            <button type="button" id="trans-clear-recent-btn" style="background: none; border: none; font-size: 12px; color: #ef4444; cursor: pointer; font-weight: 600;">Clear</button>
          </div>
          <div id="trans-recent-list-wrap">
            ${renderRecentListMarkup()}
          </div>
        </div>
      </div>`;

    wireTranslatorEvents();
  }

  // Wires all event listeners on the translator page
  function wireTranslatorEvents() {
    const srcInput = $('#trans-src-input');
    const clearBtn = $('#trans-clear-src');
    const charCount = $('#trans-char-count');
    const copyBtn = $('#trans-copy-btn');
    const speakerBtn = $('#trans-speaker-btn');
    const srcSpeakerBtn = $('#trans-src-speaker-btn');
    const micBtn = $('#trans-mic-btn');
    const swapBtn = $('#trans-swap-btn');
    const topSwapBtn = $('#trans-dir-swap');
    const toggleSrc = $('#trans-toggle-src');
    const toggleTgt = $('#trans-toggle-tgt');
    const srcChip = $('#trans-src-chip');
    const tgtChip = $('#trans-tgt-chip');
    const srcToggle = $('#trans-src-toggle');
    const tgtToggle = $('#trans-tgt-toggle');
    const clearRecentBtn = $('#trans-clear-recent-btn');
    const recentListWrap = $('#trans-recent-list-wrap');

    // 1. Language Swap Handlers (Unified center switcher and pills)
    const doSwap = () => {
      const oldSrcLang = transState.srcLang;
      transState.srcLang = transState.tgtLang;
      transState.tgtLang = oldSrcLang;

      const oldSrcText = transState.srcText;
      transState.srcText = transState.tgtText || '';
      transState.tgtText = oldSrcText || '';
      transState.pronText = '';

      renderTranslator();
      if (transState.srcText) {
        performTranslation(transState.srcText, transState.srcLang, transState.tgtLang);
      }
      showToast(`Swapped: ${getLangName(transState.srcLang)} ⇄ ${getLangName(transState.tgtLang)}`);
    };

    if (topSwapBtn) topSwapBtn.addEventListener('click', doSwap);
    if (toggleSrc) toggleSrc.addEventListener('click', doSwap);
    if (toggleTgt) toggleTgt.addEventListener('click', doSwap);
    if (swapBtn) swapBtn.addEventListener('click', doSwap);

    // 4. Language selection pickers
    if (srcChip) srcChip.addEventListener('click', () => openLanguagePicker('src'));
    if (srcToggle) srcToggle.addEventListener('click', () => openLanguagePicker('src'));
    if (tgtChip) tgtChip.addEventListener('click', () => openLanguagePicker('tgt'));
    if (tgtToggle) tgtToggle.addEventListener('click', () => openLanguagePicker('tgt'));

    // 5. Source Text Input Handling with Fast Instant 0ms Match & 200ms Debounce
    if (srcInput) {
      srcInput.addEventListener('input', () => {
        transState.srcText = srcInput.value;
        const count = transState.srcText.length;
        if (charCount) charCount.textContent = `${count} / 500`;
        if (clearBtn) clearBtn.style.display = count > 0 ? 'inline-flex' : 'none';

        const clean = transState.srcText.trim();
        if (!clean) {
          clearTimeout(transState.debounceTimer);
          if (activeTransAbort) activeTransAbort.abort();
          transState.tgtText = '';
          transState.pronText = '';
          updateTranslatorResultDisplay();
          return;
        }

        const lower = clean.toLowerCase();
        const cacheKey = `${transState.srcLang}:${transState.tgtLang}:${lower}`;

        // Fast instant 0ms check in memory cache
        if (clientTransCache.has(cacheKey)) {
          clearTimeout(transState.debounceTimer);
          const cached = clientTransCache.get(cacheKey);
          transState.tgtText = cached.translatedText;
          transState.pronText = cached.pronunciation || '';
          updateTranslatorResultDisplay();
          return;
        }

        // Fast instant 0ms check in dictionary
        if (transState.srcLang === 'en' && transState.tgtLang === 'bn' && QUICK_PHRASES[lower]) {
          clearTimeout(transState.debounceTimer);
          const p = QUICK_PHRASES[lower];
          transState.tgtText = p.bn;
          transState.pronText = p.pron || '';
          clientTransCache.set(cacheKey, { translatedText: p.bn, pronunciation: p.pron || '' });
          updateTranslatorResultDisplay();
          return;
        }

        if (transState.srcLang === 'bn' && transState.tgtLang === 'en') {
          const match = QUICK_PHRASES_BN_TO_EN[clean] || QUICK_PHRASES_BN_TO_EN[lower];
          if (match) {
            clearTimeout(transState.debounceTimer);
            transState.tgtText = match;
            transState.pronText = '';
            clientTransCache.set(cacheKey, { translatedText: match, pronunciation: '' });
            updateTranslatorResultDisplay();
            return;
          }
        }

        // Debounce API call for general text (200ms)
        clearTimeout(transState.debounceTimer);
        transState.debounceTimer = setTimeout(() => {
          performTranslation(transState.srcText, transState.srcLang, transState.tgtLang);
        }, 200);
      });
    }

    // 6. Clear Input Button
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (activeTransAbort) activeTransAbort.abort();
        transState.srcText = '';
        transState.tgtText = '';
        transState.pronText = '';
        if (srcInput) {
          srcInput.value = '';
          srcInput.focus();
        }
        if (charCount) charCount.textContent = '0 / 500';
        clearBtn.style.display = 'none';
        updateTranslatorResultDisplay();
      });
    }

    // 7. Copy to Clipboard
    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        const textToCopy = transState.tgtText;
        if (!textToCopy) {
          showToast('No translation to copy yet.');
          return;
        }
        try {
          await navigator.clipboard.writeText(textToCopy);
        } catch {
          const ta = document.createElement('textarea');
          ta.value = textToCopy;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          ta.remove();
        }
        const label = $('#trans-copy-label');
        if (label) label.textContent = 'Copied!';
        showToast('📋 Copied translation to clipboard!');
        setTimeout(() => {
          if (label) label.textContent = 'Copy';
        }, 2000);
      });
    }

    // 8. Speaker Audio Buttons
    if (speakerBtn) {
      speakerBtn.addEventListener('click', () => {
        const text = transState.tgtText;
        if (!text) {
          showToast('No text to pronounce.');
          return;
        }
        speakTranslation(text, transState.tgtLang, speakerBtn);
      });
    }

    if (srcSpeakerBtn) {
      srcSpeakerBtn.addEventListener('click', () => {
        const text = transState.srcText;
        if (!text) {
          showToast('Please type text first.');
          return;
        }
        speakTranslation(text, transState.srcLang, srcSpeakerBtn);
      });
    }

    // 9. Microphone Speech Recognition
    if (micBtn) {
      micBtn.addEventListener('click', toggleTranslatorVoiceInput);
    }

    // 10. Quick Phrase Chips Delegation
    const phraseChips = $$('.trans-phrase-chip');
    phraseChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const enText = chip.dataset.phrase;
        const bnText = chip.dataset.bn;
        if (transState.srcLang === 'bn') {
          transState.srcText = bnText || enText;
        } else {
          transState.srcText = enText || bnText;
        }
        if (srcInput) srcInput.value = transState.srcText;
        if (charCount) charCount.textContent = `${transState.srcText.length} / 500`;
        if (clearBtn) clearBtn.style.display = 'inline-flex';
        performTranslation(transState.srcText, transState.srcLang, transState.tgtLang);
        showToast(`Loaded: "${transState.srcText}"`);
      });
    });

    // 11. Recent translations interactions (Load, Star, Delete)
    if (recentListWrap) {
      recentListWrap.addEventListener('click', (e) => {
        const delBtn = e.target.closest('[data-del-id]');
        const starBtn = e.target.closest('[data-star-id]');
        const loadBtn = e.target.closest('[data-load-id]');
        const itemEl = e.target.closest('.trans-recent-item');

        if (delBtn) {
          e.stopPropagation();
          const id = delBtn.dataset.delId;
          transState.recent = transState.recent.filter((r) => r.id !== id);
          saveRecentTranslations(transState.recent);
          recentListWrap.innerHTML = renderRecentListMarkup();
          showToast('🗑️ Phrase removed.');
          return;
        }

        if (starBtn) {
          e.stopPropagation();
          const id = starBtn.dataset.starId;
          const found = transState.recent.find((r) => r.id === id);
          if (found) {
            found.starred = !found.starred;
            saveRecentTranslations(transState.recent);
            recentListWrap.innerHTML = renderRecentListMarkup();
            showToast(found.starred ? '⭐️ Added to favorites!' : 'Removed from favorites.');
          }
          return;
        }

        const chosenId = loadBtn ? loadBtn.dataset.loadId : itemEl?.dataset?.id;
        if (chosenId) {
          const found = transState.recent.find((r) => r.id === chosenId);
          if (found) {
            transState.srcText = found.src;
            transState.tgtText = found.tgt;
            transState.pronText = found.pron || '';
            if (srcInput) srcInput.value = found.src;
            if (charCount) charCount.textContent = `${found.src.length} / 500`;
            if (clearBtn) clearBtn.style.display = 'inline-flex';
            updateTranslatorResultDisplay();
            showToast(`Loaded: "${found.src}"`);
          }
        }
      });
    }

    // 12. Clear All Recent History
    if (clearRecentBtn) {
      clearRecentBtn.addEventListener('click', () => {
        transState.recent = [];
        saveRecentTranslations([]);
        if (recentListWrap) recentListWrap.innerHTML = renderRecentListMarkup();
        showToast('🗑️ Cleared translation history.');
      });
    }
  }

  // Updates the result display area and pronunciation badge safely
  function updateTranslatorResultDisplay() {
    const resBox = $('#trans-result-output');
    const pronRow = $('#trans-pron-row');
    const pronText = $('#trans-pron-text');
    const statusMsg = $('#trans-status-msg');

    if (!resBox) return;

    resBox.classList.remove('trans-loading-shimmer');
    resBox.style.opacity = '1';

    if (!transState.tgtText) {
      resBox.classList.add('is-empty');
      resBox.textContent = 'Translation will appear here...';
      if (pronRow) pronRow.style.display = 'none';
      if (statusMsg) statusMsg.textContent = 'Ready';
      return;
    }

    resBox.classList.remove('is-empty');
    resBox.textContent = transState.tgtText;

    if (pronRow && pronText) {
      if (transState.pronText) {
        pronText.textContent = transState.pronText;
        pronRow.style.display = 'flex';
      } else {
        pronRow.style.display = 'none';
      }
    }

    if (statusMsg) {
      statusMsg.textContent = 'Translation complete';
    }
  }

  // Core translation executor
  async function performTranslation(text, from, to) {
    if (!text || !text.trim()) {
      transState.tgtText = '';
      transState.pronText = '';
      updateTranslatorResultDisplay();
      return;
    }

    const clean = text.trim();
    const lower = clean.toLowerCase();
    const cacheKey = `${from}:${to}:${lower}`;

    // 1. Same language: return directly
    if (from === to) {
      transState.tgtText = clean;
      transState.pronText = '';
      updateTranslatorResultDisplay();
      return;
    }

    // 2. Memory Cache Check (0ms)
    if (clientTransCache.has(cacheKey)) {
      const cached = clientTransCache.get(cacheKey);
      transState.tgtText = cached.translatedText;
      transState.pronText = cached.pronunciation || '';
      updateTranslatorResultDisplay();
      addRecentItem(clean, transState.tgtText, transState.pronText);
      return;
    }

    // 3. Built-in Dictionary Check (0ms)
    if (from === 'en' && to === 'bn' && QUICK_PHRASES[lower]) {
      const p = QUICK_PHRASES[lower];
      transState.tgtText = p.bn;
      transState.pronText = p.pron || '';
      clientTransCache.set(cacheKey, { translatedText: p.bn, pronunciation: p.pron || '' });
      updateTranslatorResultDisplay();
      addRecentItem(clean, p.bn, p.pron || '');
      return;
    }

    if (from === 'bn' && to === 'en') {
      const bnMatch = QUICK_PHRASES_BN_TO_EN[clean] || QUICK_PHRASES_BN_TO_EN[lower];
      if (bnMatch) {
        transState.tgtText = bnMatch;
        transState.pronText = '';
        clientTransCache.set(cacheKey, { translatedText: bnMatch, pronunciation: '' });
        updateTranslatorResultDisplay();
        addRecentItem(clean, bnMatch, '');
        return;
      }
    }

    // 4. Server API call
    if (activeTransAbort) {
      activeTransAbort.abort();
    }
    activeTransAbort = new AbortController();

    const resBox = $('#trans-result-output');
    const statusMsg = $('#trans-status-msg');
    if (resBox) {
      resBox.classList.add('trans-loading-shimmer');
      resBox.style.opacity = '0.65';
    }
    if (statusMsg) statusMsg.textContent = 'Translating...';

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: clean, from, to }),
        signal: activeTransAbort.signal,
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.translatedText) {
          transState.tgtText = data.translatedText;
          transState.pronText = data.pronunciation || '';
          clientTransCache.set(cacheKey, {
            translatedText: data.translatedText,
            pronunciation: data.pronunciation || '',
          });
          updateTranslatorResultDisplay();
          addRecentItem(clean, data.translatedText, data.pronunciation || '');
          return;
        }
      }
    } catch (e) {
      if (e.name === 'AbortError') return;
      console.warn('[Translator] Server API request failed, trying client fallback', e);
    }

    // 5. Client fallback via askGemini
    try {
      const prompt = `Translate the phrase "${clean}" accurately from ${getLangName(from)} to ${getLangName(to)}. Return ONLY the translated phrase, nothing else.`;
      const fallback = await askGemini([{ role: 'user', text: prompt }]);
      if (fallback && fallback.reply) {
        const replyClean = fallback.reply.replace(/^["']|["']$/g, '').trim();
        transState.tgtText = replyClean;
        transState.pronText = '';
        clientTransCache.set(cacheKey, { translatedText: replyClean, pronunciation: '' });
        updateTranslatorResultDisplay();
        addRecentItem(clean, replyClean, '');
        return;
      }
    } catch (e) {
      console.warn('[Translator] Fallback failed', e);
    }

    // Final fallback
    transState.tgtText = clean;
    updateTranslatorResultDisplay();
  }

  // Adds translation to recent history
  function addRecentItem(src, tgt, pron = '') {
    if (!src || !tgt) return;
    const existingIdx = transState.recent.findIndex((r) => r.src.toLowerCase() === src.toLowerCase());
    if (existingIdx !== -1) {
      const existing = transState.recent[existingIdx];
      transState.recent.splice(existingIdx, 1);
      transState.recent.unshift({
        ...existing,
        tgt,
        pron: pron || existing.pron,
      });
    } else {
      transState.recent.unshift({
        id: 'r_' + Date.now(),
        src,
        tgt,
        pron,
        starred: false,
      });
    }
    if (transState.recent.length > 8) transState.recent.pop();
    saveRecentTranslations(transState.recent);
    const wrap = $('#trans-recent-list-wrap');
    if (wrap) wrap.innerHTML = renderRecentListMarkup();
  }

  // Native Speech Audio output
  function speakTranslation(text, langCode, triggerBtn) {
    if (!text) return;

    if (activeTransAudio) {
      try {
        activeTransAudio.pause();
        activeTransAudio.currentTime = 0;
      } catch (e) {}
      activeTransAudio = null;
      if (triggerBtn) triggerBtn.classList.remove('is-speaking');
      showToast('🔇 Audio stopped.');
      return;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      if (triggerBtn) triggerBtn.classList.remove('is-speaking');
      showToast('🔇 Audio stopped.');
      return;
    }

    if (triggerBtn) triggerBtn.classList.add('is-speaking');

    const audioUrl = `/api/tts?text=${encodeURIComponent(text)}&lang=${encodeURIComponent(langCode)}`;
    const audio = new Audio(audioUrl);
    activeTransAudio = audio;

    audio.onended = () => {
      if (triggerBtn) triggerBtn.classList.remove('is-speaking');
      activeTransAudio = null;
    };

    audio.onerror = () => {
      activeTransAudio = null;
      fallbackBrowserSpeech(text, langCode, triggerBtn);
    };

    audio.play().then(() => {
      showToast(`🔊 Speaking ${getLangName(langCode)}: "${text}"`);
    }).catch(() => {
      activeTransAudio = null;
      fallbackBrowserSpeech(text, langCode, triggerBtn);
    });
  }

  function fallbackBrowserSpeech(text, langCode, triggerBtn) {
    if (!('speechSynthesis' in window)) {
      if (triggerBtn) triggerBtn.classList.remove('is-speaking');
      showToast('Audio playback not supported in this browser.');
      return;
    }
    updateVoicesCache();
    const voices = cachedVoices.length ? cachedVoices : (window.speechSynthesis.getVoices() || []);
    const isBangla = (langCode === 'bn' || langCode === 'syl' || langCode === 'ctg');
    const bnVoice = voices.find(
      (v) =>
        (v.lang && (v.lang.toLowerCase().startsWith('bn') || v.lang.toLowerCase().replace('_', '-').startsWith('bn'))) ||
        (v.name && (v.name.toLowerCase().includes('bengali') || v.name.toLowerCase().includes('bangla')))
    );

    const u = new SpeechSynthesisUtterance(text);
    u.lang = isBangla ? (bnVoice ? bnVoice.lang : 'bn-BD') : (langCode === 'en' ? 'en-US' : langCode);
    if (bnVoice) u.voice = bnVoice;
    u.rate = 0.9;

    if (triggerBtn) triggerBtn.classList.add('is-speaking');
    u.onend = () => {
      if (triggerBtn) triggerBtn.classList.remove('is-speaking');
    };
    u.onerror = () => {
      if (triggerBtn) triggerBtn.classList.remove('is-speaking');
    };
    try {
      window.speechSynthesis.speak(u);
    } catch (e) {
      if (triggerBtn) triggerBtn.classList.remove('is-speaking');
    }
  }

  // Voice dictation microphone handler
  function toggleTranslatorVoiceInput() {
    const Recog = window.SpeechRecognition || window.webkitSpeechRecognition;
    const micBtn = $('#trans-mic-btn');
    const micLabel = $('#trans-mic-label');
    const srcName = getLangName(transState.srcLang);

    if (!Recog) {
      showToast('Microphone voice recognition is not supported in this browser.');
      return;
    }

    if (transState.isListening) {
      if (activeTransRecognition) {
        try { activeTransRecognition.abort(); } catch {}
        activeTransRecognition = null;
      }
      transState.isListening = false;
      if (micBtn) micBtn.classList.remove('is-listening');
      if (micLabel) micLabel.textContent = `Tap to speak in ${srcName}`;
      showToast('🔇 Microphone turned off.');
      return;
    }

    try {
      const rec = new Recog();
      activeTransRecognition = rec;
      rec.lang = transState.srcLang === 'bn' ? 'bn-BD' : (transState.srcLang === 'en' ? 'en-US' : transState.srcLang);
      rec.interimResults = true;
      rec.continuous = false;
      transState.isListening = true;
      if (micBtn) micBtn.classList.add('is-listening');
      if (micLabel) micLabel.textContent = `Listening in ${srcName}... Speak now!`;
      showToast(`🎙️ Listening in ${srcName}... Speak now`);

      rec.onresult = (e) => {
        let finalTranscript = '';
        let interimTranscript = '';
        for (let i = e.resultIndex; i < e.results.length; ++i) {
          if (e.results[i].isFinal) {
            finalTranscript += e.results[i][0].transcript;
          } else {
            interimTranscript += e.results[i][0].transcript;
          }
        }
        const textToUse = finalTranscript || interimTranscript;
        if (textToUse) {
          const srcInput = $('#trans-src-input');
          const charCount = $('#trans-char-count');
          const clearBtn = $('#trans-clear-src');
          transState.srcText = textToUse;
          if (srcInput) srcInput.value = textToUse;
          if (charCount) charCount.textContent = `${textToUse.length} / 500`;
          if (clearBtn) clearBtn.style.display = 'inline-flex';
          if (finalTranscript) {
            performTranslation(finalTranscript, transState.srcLang, transState.tgtLang);
            showToast(`Heard: "${finalTranscript}"`);
          }
        }
      };

      rec.onend = () => {
        transState.isListening = false;
        activeTransRecognition = null;
        if (micBtn) micBtn.classList.remove('is-listening');
        if (micLabel) micLabel.textContent = `Tap to speak in ${srcName}`;
      };

      rec.onerror = (err) => {
        transState.isListening = false;
        activeTransRecognition = null;
        if (micBtn) micBtn.classList.remove('is-listening');
        if (micLabel) micLabel.textContent = `Tap to speak in ${srcName}`;
        if (err && err.error && err.error !== 'aborted') {
          showToast(`Microphone notice: ${err.error}`);
        }
      };

      rec.start();
    } catch (e) {
      transState.isListening = false;
      activeTransRecognition = null;
      if (micBtn) micBtn.classList.remove('is-listening');
      if (micLabel) micLabel.textContent = `Tap to speak in ${srcName}`;
      showToast(`Could not start microphone: ${e.message}`);
    }
  }

  // Language Picker Modal Dialog
  function openLanguagePicker(type) {
    let modal = $('#trans-lang-picker-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'trans-lang-picker-modal';
      modal.className = 'trans-lang-picker-modal';
      document.body.appendChild(modal);
    }

    const isSrc = type === 'src';
    const currentCode = isSrc ? transState.srcLang : transState.tgtLang;
    const modalTitle = isSrc ? 'Choose Source Language' : 'Choose Target Language';

    modal.innerHTML = `
      <div class="trans-lang-picker-card" role="dialog" aria-modal="true" aria-labelledby="tlp-title">
        <div class="trans-lang-picker-header">
          <h2 class="trans-lang-picker-title" id="tlp-title">${modalTitle}</h2>
          <button class="trans-lang-picker-close" type="button" id="tlp-close" aria-label="Close dialog">
            <svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="trans-lang-list">
          ${TRANSLATOR_LANGS.map(
            (l) => `
            <button type="button" class="trans-lang-option-btn ${l.code === currentCode ? 'is-selected' : ''}" data-lang="${l.code}">
              <span>${esc(l.name)}</span>
              ${l.code === currentCode ? '<span>✓</span>' : ''}
            </button>`
          ).join('')}
        </div>
      </div>`;

    modal.style.display = 'flex';

    const closeBtn = modal.querySelector('#tlp-close');
    if (closeBtn) closeBtn.onclick = () => { modal.style.display = 'none'; };
    modal.onclick = (e) => {
      if (e.target === modal) modal.style.display = 'none';
    };

    modal.querySelectorAll('.trans-lang-option-btn').forEach((btn) => {
      btn.onclick = () => {
        const selectedCode = btn.dataset.lang;
        modal.style.display = 'none';
        if (isSrc) {
          if (selectedCode === transState.tgtLang) {
            // Swap if picked same language as target
            const oldSrc = transState.srcLang;
            transState.srcLang = selectedCode;
            transState.tgtLang = oldSrc;
          } else {
            transState.srcLang = selectedCode;
          }
        } else {
          if (selectedCode === transState.srcLang) {
            // Swap if picked same language as source
            const oldTgt = transState.tgtLang;
            transState.tgtLang = selectedCode;
            transState.srcLang = oldTgt;
          } else {
            transState.tgtLang = selectedCode;
          }
        }
        renderTranslator();
        if (transState.srcText) {
          performTranslation(transState.srcText, transState.srcLang, transState.tgtLang);
        }
        showToast(`Selected: ${getLangName(selectedCode)}`);
      };
    });
  }

  /* ============================================================
     SAVED & FAVORITES MODULE
     ============================================================ */

  const SAVED_PLACES_KEY = 'banglapath_saved_places_v2';
  const SAVED_TRIPS_KEY = 'banglapath_saved_trips_v2';

  const defaultSavedTrips = [
    {
      id: 'trip_sundarban',
      name: 'Sundarban Mangrove & Tiger Trail',
      dates: '3 Days • Deep Forest Reserve',
      district: 'Khulna',
      tag: 'Mangrove Safari',
      places: ['sundarbans'],
      tasks: [
        { text: 'Wooden boat cruise through narrow mangrove canals', done: true },
        { text: 'Kotka wildlife watchtower trek at dawn', done: true },
        { text: 'Search for Royal Bengal Tiger & spotted deer pugmarks', done: false },
        { text: 'Fresh Sundari wildflower honey & seafood tasting', done: false },
      ],
    },
    {
      id: 'trip_sajek',
      name: 'Sajek Valley Cloud Kingdom Escape',
      dates: '4 Days • Hill Station',
      district: 'Rangamati',
      tag: 'Cloud Peaks',
      places: ['sajek'],
      tasks: [
        { text: 'Chander Gari open-top jeep climb from Khagrachhari', done: true },
        { text: 'Watch white cloud blanket roll over Konglak peak', done: true },
        { text: 'Visit Ruilui Para ethnic village & church', done: false },
        { text: 'Helipad stargazing & indigenous bamboo chicken dinner', done: false },
      ],
    },
    {
      id: 'trip_sreemangal',
      name: 'Sreemangal Tea Country & Rain Forest',
      dates: '3 Days • Eco Highlands',
      district: 'Moulvibazar',
      tag: 'Tea Estates',
      places: ['srimangal', 'ratargul'],
      tasks: [
        { text: 'Seven-layer tea tasting at Nilkantha Tea Cabin', done: true },
        { text: 'Lawachara National Park hoolock gibbon trail', done: false },
        { text: 'Silent wooden boat through Ratargul freshwater swamp', done: false },
        { text: 'Cycling through emerald green tea garden slopes', done: false },
      ],
    },
  ];

  const defaultStarredPhrases = [
    { id: 'ph_1', bn: 'কত দাম?', pron: 'Koto daam?', en: 'How much does this cost?', starred: true },
    { id: 'ph_2', bn: 'আমাকে সাহায্য করবেন?', pron: 'Amake sahajjo korben?', en: 'Can you please help me?', starred: true },
    { id: 'ph_3', bn: 'এই রাস্তা কোথায় যায়?', pron: 'Ei rasta kothay jaay?', en: 'Where does this road go?', starred: true },
    { id: 'ph_4', bn: 'খাবারটা খুব সুস্বাদু!', pron: 'Khabarta khub shushadhu!', en: 'The food is very delicious!', starred: true },
    { id: 'ph_5', bn: 'ধন্যবাদ ভাই!', pron: 'Dhonnobad bhai!', en: 'Thank you brother!', starred: true },
  ];

  const SAVED_COLLECTIONS_KEY = 'banglapath_saved_collections_v2';
  const SAVED_TIPS_KEY = 'banglapath_saved_tips_v2';

  const defaultCollections = [
    { id: 'nature', title: 'Nature & Wildlife', count: '8 places', image: 'images/categories/nature.jpg' },
    { id: 'historical', title: 'Historical Places', count: '6 places', image: 'images/categories/historical.jpg' },
    { id: 'beaches', title: 'Beaches', count: '4 places', image: 'images/categories/beaches.jpg' },
    { id: 'weekend', title: 'Weekend Trips', count: '5 places', image: 'images/categories/hills.jpg' },
  ];

  const defaultSavedPlacesFull = [
    {
      id: 'sundarbans',
      name: 'Sundarbans',
      district: 'Khulna, Bangladesh',
      blurb: "The world's largest mangrove forest and a UNESCO site.",
      rating: '4.7',
      image: 'images/places/sundarbans.jpg',
    },
    {
      id: 'coxsbazar',
      name: "Cox's Bazar Beach",
      district: "Cox's Bazar, Bangladesh",
      blurb: 'The longest natural sea beach in the world.',
      rating: '4.8',
      image: 'images/places/coxsbazar.jpg',
    },
    {
      id: 'paharpur',
      name: 'Paharpur',
      district: 'Naogaon, Bangladesh',
      blurb: 'Ancient Buddhist vihara and UNESCO World Heritage site.',
      rating: '4.6',
      image: 'images/places/paharpur.jpg',
    },
    {
      id: 'sajek',
      name: 'Sajek Valley',
      district: 'Rangamati, Bangladesh',
      blurb: 'Queen of hills and kingdoms of clouds.',
      rating: '4.8',
      image: 'images/places/sajek.jpg',
    },
    {
      id: 'srimangal',
      name: 'Sreemangal Tea Gardens',
      district: 'Moulvibazar, Bangladesh',
      blurb: 'The tea capital of Bangladesh surrounded by rainforest.',
      rating: '4.9',
      image: 'images/places/srimangal.jpg',
    },
    {
      id: 'saintmartin',
      name: 'Saint Martin Island',
      district: "Cox's Bazar, Bangladesh",
      blurb: 'Only coral island in Bangladesh with turquoise waters.',
      rating: '4.7',
      image: 'images/places/saintmartin.jpg',
    },
  ];

  const defaultSavedTripsFull = [
    {
      id: 'sundarban-adv',
      title: 'Sundarban Adventure',
      status: 'UPCOMING',
      statusClass: 'badge-upcoming',
      dates: 'Aug 14 - Aug 17, 2026',
      duration: '4 Days • 3 Nights',
      image: 'images/places/sundarbans.jpg',
      saved: true,
    },
    {
      id: 'cox-getaway',
      title: "Cox's Bazar Getaway",
      status: 'PLANNED',
      statusClass: 'badge-planned',
      dates: 'Aug 21 - Aug 24, 2026',
      duration: '4 Days • 3 Nights',
      image: 'images/places/coxsbazar.jpg',
      saved: true,
    },
    {
      id: 'sylhet-trails',
      title: 'Sylhet Tea Trails',
      status: 'COMPLETED',
      statusClass: 'badge-completed',
      dates: 'Jul 10 - Jul 13, 2026',
      duration: '4 Days • 3 Nights',
      image: 'images/places/srimangal.jpg',
      saved: true,
    },
    {
      id: 'sajek-cloud',
      title: 'Sajek Cloud Kingdom',
      status: 'PLANNED',
      statusClass: 'badge-planned',
      dates: 'Sep 05 - Sep 08, 2026',
      duration: '3 Days • 2 Nights',
      image: 'images/places/sajek.jpg',
      saved: true,
    },
    {
      id: 'dhaka-heritage',
      title: 'Old Dhaka Heritage Walk',
      status: 'COMPLETED',
      statusClass: 'badge-completed',
      dates: 'Jun 01 - Jun 03, 2026',
      duration: '2 Days • 1 Night',
      image: 'images/places/lalbagh.jpg',
      saved: true,
    },
    {
      id: 'stmartin-coral',
      title: 'Saint Martin Coral Escape',
      status: 'PLANNED',
      statusClass: 'badge-planned',
      dates: 'Nov 12 - Nov 16, 2026',
      duration: '5 Days • 4 Nights',
      image: 'images/places/saintmartin.jpg',
      saved: true,
    },
  ];

  const defaultSavedTips = [
    {
      id: 'tip-sundarban-time',
      icon: 'calendar',
      title: 'Best time to visit Sundarbans',
      desc: 'October to March is ideal for wildlife spotting and pleasant weather.',
      saved: true,
    },
    {
      id: 'tip-safety',
      icon: 'shield',
      title: 'Travel safety tips for Bangladesh',
      desc: 'Keep your belongings safe, use trusted transport and stay aware.',
      saved: true,
    },
    {
      id: 'tip-transport',
      icon: 'exchange',
      title: 'How to travel around Bangladesh',
      desc: 'Trains, buses, launches or flights—choose what fits your journey best.',
      saved: true,
    },
    {
      id: 'tip-food',
      icon: 'cutlery',
      title: 'Must try local foods in Bangladesh',
      desc: 'From Hilsa and Panta Bhat to street food—treat your taste buds!',
      saved: true,
    },
  ];

  const defaultRecents = [
    { id: 'ratargul', title: 'Ratargul Swamp Forest', subtitle: 'Sylhet • Saved 2h ago', image: 'images/places/ratargul.jpg', active: true },
    { id: 'himchari', title: 'Himchari Sunset Point', subtitle: "Cox's Bazar • Saved 1d ago", image: 'images/places/himchari.jpg', active: true },
    { id: 'ahsanmanzil', title: 'Ahsan Manzil', subtitle: 'Dhaka • Saved 2d ago', image: 'images/places/ahsanmanzil.jpg', active: false },
    { id: 'jaflong', title: 'Jaflong', subtitle: 'Sylhet • Saved 3d ago', image: 'images/places/jaflong.jpg', active: false },
  ];

  function getSavedPlaceIds() {
    try {
      const raw = localStorage.getItem(SAVED_PLACES_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    const init = ['sundarbans', 'coxsbazar', 'paharpur', 'sajek', 'srimangal', 'saintmartin', 'ratargul', 'jaflong', 'ahsanmanzil', 'lalbagh', 'bagerhat', 'sonargaon'];
    localStorage.setItem(SAVED_PLACES_KEY, JSON.stringify(init));
    return init;
  }

  function saveSavedPlaceIds(ids) {
    try {
      localStorage.setItem(SAVED_PLACES_KEY, JSON.stringify(ids));
    } catch (e) {}
  }

  function isSavedPlace(id) {
    return getSavedPlaceIds().includes(id);
  }

  function toggleSavedPlace(id) {
    const list = getSavedPlaceIds();
    const idx = list.indexOf(id);
    let isNowSaved = false;
    if (idx >= 0) {
      list.splice(idx, 1);
      isNowSaved = false;
    } else {
      list.push(id);
      isNowSaved = true;
    }
    saveSavedPlaceIds(list);
    return isNowSaved;
  }

  function getSavedCollections() {
    try {
      const raw = localStorage.getItem(SAVED_COLLECTIONS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    localStorage.setItem(SAVED_COLLECTIONS_KEY, JSON.stringify(defaultCollections));
    return defaultCollections;
  }

  function saveSavedCollections(cols) {
    try {
      localStorage.setItem(SAVED_COLLECTIONS_KEY, JSON.stringify(cols));
    } catch (e) {}
  }

  function getSavedTipsList() {
    try {
      const raw = localStorage.getItem(SAVED_TIPS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    localStorage.setItem(SAVED_TIPS_KEY, JSON.stringify(defaultSavedTips));
    return defaultSavedTips;
  }

  function saveSavedTipsList(tips) {
    try {
      localStorage.setItem(SAVED_TIPS_KEY, JSON.stringify(tips));
    } catch (e) {}
  }

  let savedFilterTab = 'all';

  function renderSaved() {
    const root = $('#page-saved');
    if (!root) return;

    if (savedFilterTab !== 'places' && savedFilterTab !== 'trips') {
      savedFilterTab = 'all';
    }

    const savedPlaceIds = getSavedPlaceIds();
    const places = savedPlaceIds.map((id) => byId.get(id) || defaultSavedPlacesFull.find((p) => p.id === id)).filter(Boolean);
    const trips = defaultSavedTripsFull;
    const collections = getSavedCollections();
    const recents = defaultRecents;

    const totalCount = places.length + trips.length;

    root.innerHTML = `
      <div class="saved-screen-layout">
        <!-- Left Main Panel -->
        <div class="saved-main-content">
          <!-- Page Header -->
          <div class="saved-page-header">
            <div class="saved-header-text">
              <h1 class="saved-page-title">Saved</h1>
              <p class="saved-page-desc">All the places and trips you've saved for your journey.</p>
            </div>
            <button type="button" class="saved-new-col-btn" id="saved-new-col-btn-top">
              <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              <span>New Collection</span>
            </button>
          </div>

          <!-- Filter Pills Bar -->
          <div class="saved-pills-bar" role="tablist">
            <button type="button" class="saved-pill-btn ${savedFilterTab === 'all' ? 'is-active' : ''}" data-sfilter="all">
              All (${totalCount})
            </button>
            <button type="button" class="saved-pill-btn ${savedFilterTab === 'places' ? 'is-active' : ''}" data-sfilter="places">
              Places (${places.length})
            </button>
            <button type="button" class="saved-pill-btn ${savedFilterTab === 'trips' ? 'is-active' : ''}" data-sfilter="trips">
              Trips (${trips.length})
            </button>
          </div>

          <!-- Section 1: Saved Places -->
          <div class="saved-section-block ${savedFilterTab !== 'all' && savedFilterTab !== 'places' ? 'is-hidden' : ''}" id="saved-sec-places">
            <div class="saved-sec-header">
              <div class="saved-sec-title-wrap">
                <span class="saved-sec-icon-circle">
                  <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>
                </span>
                <h2 class="saved-sec-title">Saved Places (${places.length})</h2>
              </div>
              <button type="button" class="saved-view-all-link" data-viewall="places">View all</button>
            </div>

            <div class="saved-carousel-wrapper">
              <div class="saved-places-track" id="saved-places-track">
                ${places
                  .map(
                    (p) => `
                  <div class="saved-place-card" data-explore="${p.id}">
                    <div class="saved-place-img-wrap">
                      <img src="${esc(p.image)}" alt="${esc(p.name)}" />
                      <div class="saved-place-gradient"></div>
                      <span class="saved-rating-badge">
                        <svg viewBox="0 0 24 24"><path d="m12 2.5 2.8 6 6.6.9-4.8 4.6 1.2 6.5-5.8-3.1-5.8 3.1 1.2-6.5L2.6 9.4l6.6-.9z" fill="currentColor"/></svg>
                        <span>${p.rating || '4.8'}</span>
                      </span>
                      <button type="button" class="saved-heart-btn" data-toggle-heart="${p.id}" title="Remove from saved">
                        <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                      </button>
                    </div>
                    <div class="saved-place-details">
                      <h3 class="saved-place-name">${esc(p.name)}</h3>
                      <p class="saved-place-desc">${esc(p.blurb || 'Iconic landmark destination in Bangladesh.')}</p>
                      <div class="saved-place-loc">
                        <svg viewBox="0 0 24 24"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" fill="currentColor"/></svg>
                        <span>${esc(p.district || 'Bangladesh')}</span>
                      </div>
                    </div>
                  </div>`
                  )
                  .join('')}
              </div>
              <button type="button" class="saved-carousel-arrow next" id="saved-places-next-btn" aria-label="Next places">
                <svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
            </div>
          </div>

          <!-- Section 2: Saved Trips -->
          <div class="saved-section-block ${savedFilterTab !== 'all' && savedFilterTab !== 'trips' ? 'is-hidden' : ''}" id="saved-sec-trips">
            <div class="saved-sec-header">
              <div class="saved-sec-title-wrap">
                <span class="saved-sec-icon-circle">
                  <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" stroke-width="1.8"/><line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" stroke-width="1.8"/><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" stroke-width="1.8"/></svg>
                </span>
                <h2 class="saved-sec-title">Saved Trips (${trips.length})</h2>
              </div>
              <button type="button" class="saved-view-all-link" data-viewall="trips">View all</button>
            </div>

            <div class="saved-carousel-wrapper">
              <div class="saved-trips-track" id="saved-trips-track">
                ${trips
                  .map(
                    (t) => `
                  <div class="saved-trip-card" data-trip-id="${t.id}">
                    <div class="saved-trip-img-wrap">
                      <img src="${esc(t.image)}" alt="${esc(t.title)}" />
                      <span class="saved-trip-badge ${t.statusClass}">${esc(t.status)}</span>
                      <button type="button" class="saved-trip-menu-btn" title="Options">•••</button>
                    </div>
                    <div class="saved-trip-body">
                      <h3 class="saved-trip-name">${esc(t.title)}</h3>
                      <div class="saved-trip-date">${esc(t.dates)}</div>
                      <div class="saved-trip-footer">
                        <span class="saved-trip-dur">${esc(t.duration)}</span>
                        <button type="button" class="saved-trip-bookmark-btn ${t.saved ? 'is-saved' : ''}" data-toggle-trip-bm="${t.id}" title="Bookmark">
                          <svg viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" fill="${t.saved ? '#15803d' : 'none'}" stroke="${t.saved ? '#15803d' : '#94a3b8'}" stroke-width="2"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>`
                  )
                  .join('')}
              </div>
              <button type="button" class="saved-carousel-arrow next" id="saved-trips-next-btn" aria-label="Next trips">
                <svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Right Side Panel -->
        <div class="saved-side-column">
          <!-- My Collections -->
          <div class="saved-side-card">
            <div class="saved-side-head">
              <h3 class="saved-side-title">My Collections</h3>
              <button type="button" class="saved-side-view-all" data-viewall="collections">View all</button>
            </div>
            <div class="saved-collections-list">
              ${collections
                .map(
                  (col) => `
                <div class="saved-col-item" data-col-id="${col.id}">
                  <div class="saved-col-thumb">
                    <img src="${esc(col.image)}" alt="${esc(col.title)}" />
                  </div>
                  <div class="saved-col-info">
                    <h4 class="saved-col-name">${esc(col.title)}</h4>
                    <span class="saved-col-count">${esc(col.count)}</span>
                  </div>
                  <button type="button" class="saved-col-more-btn" title="Collection settings">⋮</button>
                </div>`
                )
                .join('')}
            </div>
            <button type="button" class="saved-create-col-btn" id="saved-create-col-btn">
              <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              <span>Create new collection</span>
            </button>
          </div>

          <!-- Recently Saved -->
          <div class="saved-side-card">
            <div class="saved-side-head">
              <h3 class="saved-side-title">Recently Saved</h3>
              <button type="button" class="saved-side-view-all" data-viewall="recents">View all</button>
            </div>
            <div class="saved-recents-list">
              ${recents
                .map(
                  (r) => `
                <div class="saved-recent-item" data-explore="${r.id}">
                  <div class="saved-recent-thumb">
                    <img src="${esc(r.image)}" alt="${esc(r.title)}" />
                  </div>
                  <div class="saved-recent-info">
                    <h4 class="saved-recent-name">${esc(r.title)}</h4>
                    <span class="saved-recent-sub">${esc(r.subtitle)}</span>
                  </div>
                  <button type="button" class="saved-recent-bm-btn" data-toggle-recent-bm="${r.id}">
                    <svg viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" fill="${r.active ? '#15803d' : 'none'}" stroke="${r.active ? '#15803d' : '#94a3b8'}" stroke-width="2"/></svg>
                  </button>
                </div>`
                )
                .join('')}
            </div>
          </div>

          <!-- Promo Box -->
          <div class="saved-promo-card">
            <div class="saved-promo-text">
              <h4 class="saved-promo-title">Keep your travel ideas organized!</h4>
              <p class="saved-promo-sub">Save places and trips to plan your journey across Bangladesh.</p>
            </div>
            <div class="saved-promo-icon-badge">
              <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            </div>
          </div>
        </div>
      </div>
    `;

    wireSavedEvents();
  }

  function wireSavedEvents() {
    const root = $('#page-saved');
    if (!root) return;

    // Filter pills
    root.querySelectorAll('[data-sfilter]').forEach((btn) => {
      btn.onclick = () => {
        savedFilterTab = btn.dataset.sfilter;
        renderSaved();
      };
    });

    // Places scroll carousel
    $('#saved-places-next-btn')?.addEventListener('click', () => {
      const track = $('#saved-places-track');
      if (track) track.scrollBy({ left: 240, behavior: 'smooth' });
    });

    // Trips scroll carousel
    $('#saved-trips-next-btn')?.addEventListener('click', () => {
      const track = $('#saved-trips-track');
      if (track) track.scrollBy({ left: 240, behavior: 'smooth' });
    });

    // Heart toggles on place cards
    root.querySelectorAll('[data-toggle-heart]').forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const id = btn.dataset.toggleHeart;
        toggleSavedPlace(id);
        showToast('❤️ Saved items updated');
        renderSaved();
      };
    });

    // Recent bookmark toggle
    root.querySelectorAll('[data-toggle-recent-bm]').forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const id = btn.dataset.toggleRecentBm;
        const item = defaultRecents.find((r) => r.id === id);
        if (item) {
          item.active = !item.active;
          showToast(item.active ? '📌 Item saved' : 'Item removed');
          renderSaved();
        }
      };
    });

    // Create / New Collection button triggers modal
    const openCollectionModal = () => {
      const name = prompt('Enter a name for your new collection (e.g., "Tea Estates & Rain", "Old Dhaka Food Walk"):');
      if (name && name.trim()) {
        const cols = getSavedCollections();
        cols.push({
          id: 'col-' + Date.now(),
          title: name.trim(),
          count: '0 places',
          image: 'images/categories/nature.jpg',
        });
        saveSavedCollections(cols);
        showToast(`✨ Collection "${name.trim()}" created!`);
        renderSaved();
      }
    };

    $('#saved-new-col-btn-top')?.addEventListener('click', openCollectionModal);
    $('#saved-create-col-btn')?.addEventListener('click', openCollectionModal);

    // Trip card click opens planner
    root.querySelectorAll('.saved-trip-card').forEach((card) => {
      card.onclick = () => {
        setView('planner');
        showToast('🗺️ Opening Trip in Planner');
      };
    });
  }

  /* ============================================================
     AI ASSISTANT DEDICATED PAGE MODULE (EXACT SCREENSHOT LAYOUT)
     ============================================================ */

  const assistantPrompts = [
    {
      id: 'best_places',
      iconClass: 'gray',
      iconSvg: '<svg viewBox="0 0 24 24"><path d="M12 2a8 8 0 0 0-8 8c0 5.4 7 11.4 7.4 11.7.3.3.9.3 1.2 0 .4-.3 7.4-6.3 7.4-11.7a8 8 0 0 0-8-8zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/></svg>',
      text: 'Best places to visit in Bangladesh',
      query: 'What are the best places to visit in Bangladesh?',
    },
    {
      id: 'sylhet_trip',
      iconClass: 'green',
      iconSvg: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
      text: 'Plan a 3-day trip in Sylhet',
      query: 'Plan a 3-day trip in Sylhet',
    },
    {
      id: 'hidden_gems',
      iconClass: 'pink',
      iconSvg: '<svg viewBox="0 0 24 24"><path d="m21.12 6.4-9-5a2 2 0 0 0-2 0l-9 5A2 2 0 0 0 0 8.14v7.72a2 2 0 0 0 1.12 1.74l9 5a2 2 0 0 0 2 0l9-5a2 2 0 0 0 1.12-1.74V8.14a2 2 0 0 0-1.12-1.74zM12 3.1l7.08 3.93-7.08 3.93-7.08-3.93L12 3.1z"/></svg>',
      text: 'Hidden gems off the beaten path',
      query: 'Hidden gems off the beaten path in Bangladesh',
    },
    {
      id: 'budget_tips',
      iconClass: 'gold',
      iconSvg: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8M12 6v12"/></svg>',
      text: 'Budget travel tips for Bangladesh',
      query: 'Budget travel tips for Bangladesh',
    },
  ];

  const assistantChips = [
    { label: '✨ Suggest a 5-day itinerary', query: 'Suggest a 5-day itinerary for Bangladesh' },
    { label: '🍃 Best time to visit Sylhet?', query: 'What is the best time to visit Sylhet?' },
    { label: '💧 Hidden waterfalls in BD', query: 'Tell me about hidden waterfalls in Bangladesh' },
    { label: '🍴 Local food to try', query: 'What are the top local foods to try in Bangladesh?' },
  ];

  let assistantChat = [
    {
      role: 'bot',
      text: "Assalamu alaikum! I am your BanglaPath AI travel companion. Ask me anything about Bangladesh's 64 districts, authentic cuisine, itineraries, or local customs.",
      time: 'Just now',
      places: undefined,
      reaction: null,
    },
  ];

  let asstDictationRecog = null;

  function renderAssistant() {
    const root = $('#page-assistant');
    if (!root) return;

    root.innerHTML = `
      <div class="asst-screen-card">
        <!-- Header with Mascot & Reset -->
        <div class="asst-header-block">
          <div class="asst-mascot-circle">
            <img src="images/bot-avatar.png" alt="BanglaPath AI Mascot" />
          </div>
          <h1 class="asst-screen-title">BanglaPath AI</h1>
          <p class="asst-screen-subtitle">Hey Fahim! আমি আপনার ভ্রমণ সঙ্গী । আপনি কী জানতে চান?</p>
          <div style="margin-top: 10px; display: flex; justify-content: center;">
            <button type="button" class="asst-reset-chat-btn" id="asst-reset-chat-btn" title="Start fresh conversation">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
              <span>New Conversation</span>
            </button>
          </div>
        </div>

        <!-- Top Prompts Carousel -->
        <div class="asst-prompts-carousel">
          <div class="asst-prompts-track" id="asst-prompts-track">
            ${assistantPrompts
              .map(
                (p) => `
              <button type="button" class="asst-prompt-box" data-asst-query="${esc(p.query)}">
                <span class="asst-prompt-icon ${p.iconClass}">
                  ${p.iconSvg}
                </span>
                <span class="asst-prompt-text">${esc(p.text)}</span>
              </button>`
              )
              .join('')}
          </div>
          <button type="button" class="asst-carousel-next" id="asst-prompts-next" aria-label="Scroll prompts">
            <svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>

        <!-- Chat Messages Stream -->
        <div class="asst-chat-stream" id="asst-chat-stream">
          ${renderAssistantStreamHtml()}
        </div>

        <!-- Sticky Consistent Bottom Bar -->
        <div class="asst-sticky-bottom-bar" id="asst-sticky-bottom-bar">
          <!-- Bottom Suggestions Chips -->
          <div class="asst-chips-row">
            ${assistantChips
              .map(
                (c) => `
              <button type="button" class="asst-chip-btn" data-asst-query="${esc(c.query)}">
                ${esc(c.label)}
              </button>`
              )
              .join('')}
          </div>

          <!-- Bottom Input Bar -->
          <form class="asst-input-container" id="asst-page-form">
            <input type="text" id="asst-page-input" placeholder="Ask me anything about Bangladesh..." autocomplete="off" />
            <button type="button" class="asst-mic-btn" id="asst-page-mic" title="Voice input">
              <svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5.5 11.4a6.5 6.5 0 0 0 13 0M12 18v3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            </button>
            <button type="submit" class="asst-send-btn" title="Send message">
              <svg viewBox="0 0 24 24"><path d="M4.4 11.4 20 4.6l-6.8 15.5-2.3-6.6z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </form>
        </div>
      </div>
    `;

    wireAssistantPageEvents();
    const stream = $('#asst-chat-stream');
    if (stream) {
      setTimeout(() => { stream.scrollTop = stream.scrollHeight; }, 60);
    }
  }

  function renderAssistantStreamHtml() {
    return assistantChat
      .map((msg, idx) => {
        if (msg.role === 'user') {
          return `
          <div class="asst-stream-user" data-msg-idx="${idx}">
            <div class="asst-user-bubble">
              <div>${esc(msg.text)}</div>
              <div class="asst-user-meta">
                <span>${esc(msg.time || '10:30 AM')}</span>
                <span class="asst-checkmarks">✓✓</span>
              </div>
            </div>
            <div class="asst-user-avi">
              <span class="user-avatar" style="width:100%;height:100%;display:block;"></span>
            </div>
          </div>`;
        }

        if (msg.role === 'bot-loading') {
          return `
          <div class="asst-stream-ai asst-stream-loading" data-msg-idx="${idx}">
            <div class="asst-bot-small-avi">
              <img src="images/bot-avatar.png" alt="" />
            </div>
            <div class="asst-ai-content">
              <div class="asst-ai-bubble asst-loading-bubble">
                <span class="asst-dot-pulse"></span>
                <span class="asst-dot-pulse"></span>
                <span class="asst-dot-pulse"></span>
                <span style="margin-left: 8px; font-size: 13px; color: #64748b;">Finding Bangladesh travel insights...</span>
              </div>
            </div>
          </div>`;
        }

        const formattedText = paragraphs(msg.text);
        const placesHtml =
          msg.places && msg.places.length > 0
            ? `
          <div class="asst-places-carousel">
            <div class="asst-places-track" id="asst-places-track-${idx}">
              ${msg.places
                .map(
                  (pl) => `
                <div class="asst-place-card" data-explore="${esc(pl.id)}">
                  <img src="${esc(pl.image)}" alt="${esc(pl.title)}" />
                  <div class="asst-place-grad"></div>
                  <div class="asst-place-info">
                    <h4 class="asst-place-title">${esc(pl.title)}</h4>
                    <p class="asst-place-sub">${esc(pl.sub)}</p>
                  </div>
                </div>`
                )
                .join('')}
            </div>
            <button type="button" class="asst-places-next" data-scroll-places="asst-places-track-${idx}" aria-label="Scroll places">
              <svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>`
            : '';

        return `
        <div class="asst-stream-ai" data-msg-idx="${idx}">
          <div class="asst-bot-small-avi">
            <img src="images/bot-avatar.png" alt="" />
          </div>
          <div class="asst-ai-content">
            <div class="asst-ai-bubble">
              ${formattedText}
              <div class="asst-ai-meta">${esc(msg.time || '10:30 AM')}</div>
            </div>
            ${placesHtml}
            <div class="asst-reactions-row">
              <button type="button" class="asst-react-btn ${msg.reaction === 'up' ? 'is-active' : ''}" data-react="up" data-idx="${idx}" title="Helpful">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.3a2 2 0 0 0 2-1.7l1.4-8A2 2 0 0 0 19.7 9H14zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
              </button>
              <button type="button" class="asst-react-btn ${msg.reaction === 'down' ? 'is-active' : ''}" data-react="down" data-idx="${idx}" title="Not helpful">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.7a2 2 0 0 0-2 1.7l-1.4 8A2 2 0 0 0 4.3 15H10zM17 2h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"/></svg>
              </button>
            </div>
          </div>
        </div>`;
      })
      .join('');
  }

  function wireAssistantPageEvents() {
    const root = $('#page-assistant');
    if (!root) return;

    // Carousel next button
    $('#asst-prompts-next')?.addEventListener('click', () => {
      const track = $('#asst-prompts-track');
      if (track) track.scrollBy({ left: 240, behavior: 'smooth' });
    });

    // Prompt clicks & chip clicks
    root.querySelectorAll('[data-asst-query]').forEach((btn) => {
      btn.onclick = () => {
        const query = btn.dataset.asstQuery;
        if (query) sendAssistantPageMessage(query);
      };
    });

    // Place card scroll next
    root.querySelectorAll('[data-scroll-places]').forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const targetId = btn.dataset.scrollPlaces;
        const target = document.getElementById(targetId);
        if (target) target.scrollBy({ left: 200, behavior: 'smooth' });
      };
    });

    // Reaction clicks
    root.querySelectorAll('[data-react]').forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const react = btn.dataset.react;
        const idx = parseInt(btn.dataset.idx, 10);
        if (assistantChat[idx]) {
          assistantChat[idx].reaction = assistantChat[idx].reaction === react ? null : react;
          const stream = $('#asst-chat-stream');
          if (stream) stream.innerHTML = renderAssistantStreamHtml();
          wireAssistantPageEvents();
          if (react === 'up') showToast('👍 Thank you for your feedback!');
          else showToast('🙏 We will improve our travel suggestions.');
        }
      };
    });

    // Form submit
    $('#asst-page-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const inp = $('#asst-page-input');
      const val = inp?.value.trim();
      if (!val) return;
      inp.value = '';
      sendAssistantPageMessage(val);
    });

    // Voice dictation on assistant page
    $('#asst-page-mic')?.addEventListener('click', () => {
      const Recog = window.SpeechRecognition || window.webkitSpeechRecognition;
      const micBtn = $('#asst-page-mic');
      if (!Recog) {
        showToast('Microphone dictation is not supported in this browser.');
        return;
      }
      if (asstDictationRecog) {
        try { asstDictationRecog.abort(); } catch (e) {}
        asstDictationRecog = null;
        micBtn?.classList.remove('is-recording');
        showToast('🔇 Microphone stopped.');
        return;
      }
      try {
        const rec = new Recog();
        asstDictationRecog = rec;
        rec.lang = 'en-US';
        rec.interimResults = true;
        micBtn?.classList.add('is-recording');
        showToast('🎙️ Listening... (Speak your question)');

        rec.onresult = (e) => {
          let str = '';
          for (let i = e.resultIndex; i < e.results.length; ++i) {
            str += e.results[i][0].transcript;
          }
          if (str && $('#asst-page-input')) {
            $('#asst-page-input').value = str;
          }
        };

        rec.onend = () => {
          asstDictationRecog = null;
          micBtn?.classList.remove('is-recording');
        };

        rec.onerror = () => {
          asstDictationRecog = null;
          micBtn?.classList.remove('is-recording');
        };

        rec.start();
      } catch (e) {
        asstDictationRecog = null;
        micBtn?.classList.remove('is-recording');
      }
    });

    // Reset/New Conversation button on assistant page
    $('#asst-reset-chat-btn')?.addEventListener('click', () => {
      assistantChat = [
        {
          role: 'bot',
          text: "Assalamu alaikum! Fresh conversation started. Ask me anything about Bangladesh's destinations, traditional dishes, itineraries, or travel tips!",
          time: 'Just now',
          reaction: null,
        },
      ];
      const stream = $('#asst-chat-stream');
      if (stream) {
        stream.innerHTML = renderAssistantStreamHtml();
        wireAssistantPageEvents();
      }
      showToast('✨ Started fresh conversation');
    });
  }

  function getCurrentTimeStr() {
    const d = new Date();
    let hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minStr = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minStr} ${ampm}`;
  }

  async function sendAssistantPageMessage(userText) {
    const timeStr = getCurrentTimeStr();
    assistantChat.push({ role: 'user', text: userText, time: timeStr });
    // Push bot loading state
    assistantChat.push({ role: 'bot-loading', text: 'Thinking...', time: timeStr });

    const stream = $('#asst-chat-stream');
    if (stream) {
      stream.innerHTML = renderAssistantStreamHtml();
      wireAssistantPageEvents();
      stream.scrollTop = stream.scrollHeight;
    }

    try {
      // Find matching destination places based on keywords
      const detectedPlaces = [];
      const lower = userText.toLowerCase();
      if (lower.includes('cox') || lower.includes('beach') || lower.includes('inani') || lower.includes('himchari')) {
        detectedPlaces.push(
          { id: 'coxsbazar', title: "Cox's Bazar Beach", sub: 'The longest natural sea beach in the world.', image: 'images/places/coxsbazar.jpg' },
          { id: 'himchari', title: 'Himchari', sub: 'Stunning hills and sunset views.', image: 'images/places/himchari.jpg' },
          { id: 'inani', title: 'Inani Beach', sub: 'Peaceful beach with coral stones.', image: 'images/places/inani.jpg' }
        );
      } else if (lower.includes('sylhet') || lower.includes('sreemangal') || lower.includes('tea') || lower.includes('waterfall') || lower.includes('ratargul')) {
        detectedPlaces.push(
          { id: 'ratargul', title: 'Ratargul Swamp Forest', sub: 'Freshwater swamp forest of the Amazon in Sylhet.', image: 'images/places/ratargul.jpg' },
          { id: 'srimangal', title: 'Sreemangal Tea Gardens', sub: 'The tea capital of Bangladesh.', image: 'images/places/srimangal.jpg' },
          { id: 'jaflong', title: 'Jaflong & Zero Point', sub: 'Stone collection & Dawki river border.', image: 'images/places/jaflong.jpg' }
        );
      } else if (lower.includes('sajek') || lower.includes('hill') || lower.includes('cloud')) {
        detectedPlaces.push(
          { id: 'sajek', title: 'Sajek Valley', sub: 'Queen of hills and kingdoms of clouds.', image: 'images/places/sajek.jpg' },
          { id: 'saintmartin', title: 'Saint Martin Island', sub: 'Only coral island in Bangladesh.', image: 'images/places/saintmartin.jpg' }
        );
      } else if (lower.includes('sundarban') || lower.includes('tiger') || lower.includes('mangrove')) {
        detectedPlaces.push(
          { id: 'sundarbans', title: 'Sundarbans Mangrove', sub: 'UNESCO heritage home of the Royal Bengal Tiger.', image: 'images/places/sundarbans.jpg' },
          { id: 'bagerhat', title: 'Sixty Dome Mosque', sub: 'Historical 15th-century sultanate architecture.', image: 'images/places/bagerhat.jpg' }
        );
      } else if (lower.includes('dhaka') || lower.includes('food') || lower.includes('kacchi') || lower.includes('lalbagh') || lower.includes('history')) {
        detectedPlaces.push(
          { id: 'lalbagh', title: 'Lalbagh Fort', sub: '17th-century Mughal fortress in Old Dhaka.', image: 'images/places/lalbagh.jpg' },
          { id: 'ahsanmanzil', title: 'Ahsan Manzil (Pink Palace)', sub: 'Official palace of the Nawabs of Dhaka.', image: 'images/places/ahsanmanzil.jpg' },
          { id: 'sonargaon', title: 'Panam City, Sonargaon', sub: 'Ancient lost capital of historic Bengal.', image: 'images/places/sonargaon.jpg' }
        );
      }

      // Call Gemini backend with Google Grounding and persona
      const turns = assistantChat
        .filter(m => m.role !== 'bot-loading')
        .map((m) => ({ role: m.role === 'bot' ? 'model' : 'user', text: m.text }));
      const response = await askGemini(turns);
      const botReply = response.reply || 'Here are some recommendations and travel tips for you in Bangladesh!';
      
      // Remove loading placeholder
      const loadIdx = assistantChat.findIndex(m => m.role === 'bot-loading');
      if (loadIdx !== -1) assistantChat.splice(loadIdx, 1);

      // If Gemini suggested specific places in its payload, map those to place objects
      if (response.places && response.places.length > 0) {
        response.places.forEach((pid) => {
          const p = byId.get(pid);
          if (p && !detectedPlaces.some((dp) => dp.id === pid)) {
            detectedPlaces.push({
              id: p.id,
              title: p.name,
              sub: p.blurb || `${p.district}, Bangladesh`,
              image: p.image,
            });
          }
        });
      }

      assistantChat.push({
        role: 'bot',
        text: botReply,
        time: getCurrentTimeStr(),
        places: detectedPlaces.length > 0 ? detectedPlaces : undefined,
        reaction: null,
      });
    } catch (err) {
      const loadIdx = assistantChat.findIndex(m => m.role === 'bot-loading');
      if (loadIdx !== -1) assistantChat.splice(loadIdx, 1);

      assistantChat.push({
        role: 'bot',
        text: `I had trouble connecting: ${err.message}. Please try asking about Cox's Bazar beaches, Sylhet tea estates, or Sajek valley!`,
        time: getCurrentTimeStr(),
        reaction: null,
      });
    }

    if (stream) {
      stream.innerHTML = renderAssistantStreamHtml();
      wireAssistantPageEvents();
      stream.scrollTop = stream.scrollHeight;
    }
  }

  /* ============================================================
     MINIMALIST PROFILE PAGE MODULE
     ============================================================ */

  const DEFAULT_PROFILE = {
    name: 'Fayezul Islam',
    handle: 'fayezuli9',
    email: 'fayezuli9@gmail.com',
    location: 'Dhaka, Bangladesh',
    bio: 'Exploring river bends, historic trails, and quiet tea hills across Bangladesh.',
    memberSince: 'October 2024',
    travelStyle: 'Heritage & Nature Explorer',
    transitPreference: 'Subarna Express & River Launches',
    languages: 'English, বাংলা (Bangla)',
    dietary: 'Authentic Local Cuisine, Halal',
    pace: 'Slow & Immersive',
    avatar: '',
    offlineMode: true,
    notifications: true,
    currency: 'BDT (৳) Bangladeshi Taka',
    aiGuide: 'Gemini Live Grounded (Active)',
  };

  function getStoredProfile() {
    try {
      const d = localStorage.getItem('banglapath_user_profile');
      if (d) return Object.assign({}, DEFAULT_PROFILE, JSON.parse(d));
    } catch (e) {}
    return Object.assign({}, DEFAULT_PROFILE);
  }

  function saveStoredProfile(p) {
    try {
      localStorage.setItem('banglapath_user_profile', JSON.stringify(p));
    } catch (e) {}
  }

  function getInitials(name) {
    if (!name) return 'FI';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function syncTopbarUser() {
    const prof = getStoredProfile();
    const firstName = (prof.name || 'Traveler').trim().split(/\s+/)[0] || 'Traveler';
    const userBtn = $('#btn-user-profile');
    if (userBtn) {
      const nameEl = userBtn.querySelector('.user-name');
      if (nameEl) {
        nameEl.textContent = `Hi, ${firstName}`;
      }
      const avi = userBtn.querySelector('.user-avatar');
      if (avi) {
        if (prof.avatar) {
          avi.style.backgroundImage = `url("${prof.avatar}")`;
          avi.style.backgroundSize = 'cover';
          avi.style.backgroundPosition = 'center';
          avi.textContent = '';
        } else {
          avi.style.backgroundImage = '';
          avi.textContent = getInitials(prof.name);
        }
      }
    }
    const discName = $('#disc-name');
    if (discName) {
      discName.textContent = firstName;
    }
  }

  /* ============================================================
     TRAVEL MEMORY BOOK & EMERGENCY HOSPITAL RADAR MODULES
     (Implemented with 100% fidelity to /book and /Hospital finding in modules.js)
     ============================================================ */
  const soundFx = window.soundFx;
  const getStoredAlbum = window.getStoredAlbum;
  const saveStoredAlbum = window.saveStoredAlbum;
  let currentAlbumSpreadIndex = window.currentAlbumSpreadIndex || 0;
  const renderMemoryBookSpreadHTML = window.renderMemoryBookSpreadHTML;
  const wireMemoryBookControls = window.wireMemoryBookControls;
  const showDummy999CallModal = window.showDummy999CallModal;
  const initHospitalRadar = window.initHospitalRadar;
  /* ============================================================
     PROFILE PAGE RENDERER (Cleanly arranged sub-modules)
     ============================================================ */
  let activeProfileTab = 'book'; // 'book' | 'emergency' | 'preferences'

  const MOBILE_TRIP_SCHEDULE = [
    { day: 1, title: "Day 1: Historic Dhaka & Ahsan Manzil", desc: "Heritage walk in Old Dhaka, Lalbagh Fort & Buriganga river cruise." },
    { day: 2, title: "Day 2: Ancient Panam City & Sonargaon", desc: "Centuries-old brick mansions, Folk Art Museum & Meghna river breeze." },
    { day: 3, title: "Day 3: Sreemangal Emerald Tea Estates", desc: "Rolling green hill plantations, 7-color tea tasting & Lawachara rainforest." },
    { day: 4, title: "Day 4: Sylhet & Ratargul Swamp Forest", desc: "Freshwater swamp canoe safari and crystal-clear Jaflong pebble streams." },
    { day: 5, title: "Day 5: Chittagong & Kaptai Lake Hills", desc: "Scenic mountain boating, indigenous floating bazaars & sunset ridge." },
    { day: 6, title: "Day 6: Cox's Bazar Marine Drive", desc: "World's longest natural sea beach, Inani coral reefs & Himchari falls." },
    { day: 7, title: "Day 7: Saint Martin's Coral Island", desc: "Turquoise waters, coconut palms, sea-turtle sanctuary & starry shores." }
  ];
  let activeMobileTripDay = parseInt(localStorage.getItem('banglapath_active_trip_day') || '1', 10);
  if (isNaN(activeMobileTripDay) || activeMobileTripDay < 1 || activeMobileTripDay > 7) activeMobileTripDay = 1;

  const DEFAULT_CHECKLIST_ITEMS = [
    { id: 'item-1', text: 'Passport or National ID card', done: true },
    { id: 'item-2', text: 'Train / Launch / Flight tickets', done: true },
    { id: 'item-3', text: 'Rain gear & compact umbrella', done: false },
    { id: 'item-4', text: 'Emergency medical kit & saline', done: true },
    { id: 'item-5', text: 'High-capacity power bank', done: true },
    { id: 'item-6', text: 'Local cash (BDT) for village bazaars', done: false },
    { id: 'item-7', text: 'Comfortable trekking footwear', done: false }
  ];

  function getStoredChecklist() {
    try {
      const saved = localStorage.getItem('banglapath_trip_checklist');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_CHECKLIST_ITEMS.map(i => ({ ...i }));
  }

  function saveStoredChecklist(items) {
    try {
      localStorage.setItem('banglapath_trip_checklist', JSON.stringify(items));
    } catch (e) {}
  }

  const SCENIC_AVATAR_PRESETS = [
    { id: 'sajek', title: 'Sajek Valley', sub: 'Queen of Hills & Clouds', img: 'images/places/sajek.jpg' },
    { id: 'srimangal', title: 'Sreemangal Tea', sub: 'Lush Green Tea Terraces', img: 'images/places/srimangal.jpg' },
    { id: 'inani', title: 'Inani Coral Beach', sub: 'Coral Rocks & Golden Coast', img: 'images/places/inani.jpg' },
    { id: 'coxsbazar', title: "Cox's Bazar", sub: 'Longest Natural Sea Beach', img: 'images/places/coxsbazar.jpg' },
    { id: 'ratargul', title: 'Ratargul Swamp', sub: 'Freshwater Green Canopy', img: 'images/places/ratargul.jpg' },
    { id: 'lalbagh', title: 'Lalbagh Fort', sub: 'Mughal Heritage of Old Dhaka', img: 'images/places/lalbagh.jpg' },
  ];

  function compressAndStoreAvatar(file, callback) {
    if (!file || !file.type.startsWith('image/')) {
      showToast('⚠️ Please choose an image file (PNG, JPG, WebP)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 320;
        let w = img.width;
        let h = img.height;
        if (w > h) {
          if (w > maxDim) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          }
        } else {
          if (h > maxDim) {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        callback(dataUrl);
      };
      img.onerror = () => {
        showToast('⚠️ Could not process image format');
      };
      img.src = e.target.result;
    };
    reader.onerror = () => {
      showToast('⚠️ Failed reading image file');
    };
    reader.readAsDataURL(file);
  }

  function renderProfile() {
    const root = $('#page-profile');
    if (!root) return;

    const prof = getStoredProfile();
    const initials = getInitials(prof.name);
    const savedPlaceIds = getSavedPlaceIds();
    const trips = defaultSavedTripsFull;
    const album = getStoredAlbum();

    root.innerHTML = `
      <div class="profile-desktop-layout profile-screen-layout">
        <!-- Top Minimalist Profile Card with Scenic Cover -->
        <div class="profile-card-minimal">
          <!-- Executive Scenic Cover Banner -->
          <div class="profile-cover-banner">
            <img src="images/places/srimangal.jpg" alt="Bangladesh Explorer Banner" class="profile-cover-img" />
            <div class="profile-cover-overlay"></div>
            <div class="profile-cover-badge">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              <span>Verified Pioneer 2026</span>
            </div>
          </div>

          <div class="profile-header-wrap">
            <div class="profile-identity-group">
              <div class="profile-avatar-circle" id="prof-avatar-display-box">
                ${prof.avatar ? `<img src="${esc(prof.avatar)}" class="profile-avatar-img" alt="${esc(prof.name)}" />` : `<span class="profile-avatar-initials">${esc(initials)}</span>`}
                <label class="profile-avatar-camera-btn" for="prof-direct-avatar-input" title="Upload new profile photo">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                </label>
                <input type="file" id="prof-direct-avatar-input" accept="image/*" style="display:none;" />
                <div class="profile-avatar-badge" title="Verified Bangladesh Explorer">
                  <svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </div>
              </div>
              <div class="profile-identity-text">
                <div class="profile-meta-title-row">
                  <h1 class="profile-name">${esc(prof.name)}</h1>
                  <span class="profile-verified-tag">
                    <svg viewBox="0 0 24 24" width="12" height="12"><path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    Explorer
                  </span>
                </div>
                <div class="profile-handle">
                  <span class="profile-handle-email">${esc(prof.email)}</span>
                  <span class="profile-handle-sep">•</span>
                  <span class="profile-handle-loc">
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a8 8 0 0 0-8 8c0 5.4 7 11.4 7.4 11.7.3.3.9.3 1.2 0 .4-.3 7.4-6.3 7.4-11.7a8 8 0 0 0-8-8zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/></svg>
                    ${esc(prof.location)}
                  </span>
                </div>
                <p class="profile-bio">${esc(prof.bio)}</p>

                <!-- Professional Photo Quick Tools -->
                <div class="profile-photo-tools">
                  <label class="profile-photo-tool-btn" for="prof-direct-avatar-input" title="Upload custom photo">
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                    <span>Upload Photo</span>
                  </label>
                  <button type="button" class="profile-photo-tool-btn" id="prof-btn-presets" title="Choose scenic Bangladesh avatar">
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                    <span>Scenic Presets</span>
                  </button>
                  ${prof.avatar ? `
                  <button type="button" class="profile-photo-tool-btn danger" id="prof-btn-remove-photo" title="Remove custom photo">
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    <span>Remove</span>
                  </button>` : ''}
                </div>
              </div>
            </div>
            <div class="profile-header-actions">
              <button type="button" class="profile-btn-minimal" id="prof-sos-quick-btn" style="color: #dc2626; border-color: #fecaca; background: #fff5f5;">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v20M2 12h20"/><circle cx="12" cy="12" r="9"/></svg>
                <span>Call 999</span>
              </button>
              <button type="button" class="profile-btn-minimal" id="prof-share-btn">
                <svg viewBox="0 0 24 24"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <span>Share</span>
              </button>
              <button type="button" class="profile-btn-minimal primary" id="prof-edit-btn">
                <svg viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <span>Edit Profile</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Minimal Stats Grid -->
        <div class="profile-stats-grid">
          <div class="profile-stat-cell">
            <div class="profile-stat-number">14</div>
            <div class="profile-stat-label">Places Explored</div>
          </div>
          <div class="profile-stat-cell">
            <div class="profile-stat-number">${album.pages.length}</div>
            <div class="profile-stat-label">Memory Keepsakes</div>
          </div>
          <div class="profile-stat-cell">
            <div class="profile-stat-number">${savedPlaceIds.length}</div>
            <div class="profile-stat-label">Saved Favorites</div>
          </div>
          <div class="profile-stat-cell">
            <div class="profile-stat-number">4 of 8</div>
            <div class="profile-stat-label">Divisions Visited</div>
          </div>
        </div>

        <!-- Sub-Navigation Segment Tabs -->
        <div class="profile-subnav-bar">
          <button type="button" class="profile-subnav-btn ${activeProfileTab === 'book' ? 'is-active' : ''}" data-tab="book" title="Click to view & open /book/ in a new tab">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z"/></svg>
            <span>Travel Memory Book</span>
            <span class="profile-subnav-badge" style="background: rgba(4, 120, 87, 0.15); color: #047857; font-weight: 600;">${album.pages.length} Pages • ↗ New Tab</span>
          </button>

          <button type="button" class="profile-subnav-btn emergency-tab ${activeProfileTab === 'emergency' ? 'is-active' : ''}" data-tab="emergency" title="Click to view & open /Hospital finding/ in a new tab">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
            <span>Emergency 999 & Hospital Radar</span>
            <span class="profile-subnav-badge" style="background: rgba(220, 38, 38, 0.2); color: #dc2626; font-weight: 600;">Active Radar • ↗ New Tab</span>
          </button>

          <button type="button" class="profile-subnav-btn ${activeProfileTab === 'preferences' ? 'is-active' : ''}" data-tab="preferences">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            <span>Explorer Preferences</span>
          </button>
        </div>

        <!-- Dynamic Content Container -->
        <div id="profile-dynamic-content">
          ${renderActiveTabContent(activeProfileTab, album, prof)}
        </div>

        <!-- Minimal Footer Bar -->
        <div class="profile-footer-bar">
          <div class="profile-footer-status">
            <div class="profile-footer-status-dot"></div>
            <span>BanglaPath Live Guide Synchronized • Connected to Gemini Engine</span>
          </div>
          <div class="profile-footer-actions">
            <button type="button" class="profile-subtle-btn" id="prof-clear-cache-btn">Clear Offline Cache</button>
            <button type="button" class="profile-danger-btn" id="prof-logout-btn">Log Out</button>
          </div>
        </div>
      </div>

      <!-- PIXEL-PERFECT MOBILE PROFILE LAYOUT -->
      <div class="profile-mobile-layout">
        <!-- Top Leaf Banner Image -->
        <div class="pm-banner">
          <img src="https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&auto=format&fit=crop&q=80" alt="BanglaPath Banner" />
          <div class="pm-banner-overlay"></div>
        </div>

        <!-- Avatar & User Info -->
        <div class="pm-user-header">
          <div class="pm-avatar-circle">
            ${prof.avatar ? `<img src="${esc(prof.avatar)}" alt="${esc(prof.name)}" />` : `<span>${esc(initials)}</span>`}
            <label class="pm-avatar-camera-overlay" for="pm-direct-avatar-input" title="Upload profile picture">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </label>
            <input type="file" id="pm-direct-avatar-input" accept="image/*" style="display:none;" />
            <div class="pm-avatar-verified-dot" title="Verified Bangladesh Explorer">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg>
            </div>
          </div>
          <h1 class="pm-user-name">${esc(prof.name)}</h1>
          <div class="pm-user-sub">${esc(prof.email || 'traveler@banglapath.com')} • ${esc(prof.location || 'Dhaka, Bangladesh')}</div>
          <div class="pm-header-action-row" style="display: flex; gap: 8px; justify-content: center; margin-top: 10px;">
            <button type="button" class="pm-edit-btn" id="pm-btn-edit">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              <span>Edit Profile</span>
            </button>
            <label class="pm-edit-btn" for="pm-direct-avatar-input" style="cursor: pointer; display: inline-flex; align-items: center; gap: 5px; background: rgba(20, 83, 45, 0.08); color: #166534; border: 1px solid rgba(22, 101, 52, 0.2);">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              <span>Upload Photo</span>
            </label>
          </div>
        </div>

        <!-- 7 Days Trip Stepper Tracker -->
        <div class="pm-trip-tracker">
          <div class="pm-stepper-container" id="pm-stepper-row">
            <div class="pm-stepper-line"></div>
            <div class="pm-stepper-progress" id="pm-stepper-progress-bar" style="width: ${((activeMobileTripDay - 1) / 6) * 100}%;"></div>
            
            ${[1, 2, 3, 4, 5, 6, 7].map(day => `
              <div class="pm-step-node ${day === activeMobileTripDay ? 'is-active' : ''} ${day < activeMobileTripDay ? 'is-passed' : ''}" data-day="${day}">
                ${day === activeMobileTripDay ? '<span class="pm-flame-icon">🔥</span>' : ''}
                <div class="pm-step-circle">${day}</div>
              </div>
            `).join('')}
          </div>
          <div class="pm-trip-title" id="pm-trip-title-text">${MOBILE_TRIP_SCHEDULE[activeMobileTripDay - 1].title}</div>
          <div class="pm-trip-desc" id="pm-trip-desc-text">${MOBILE_TRIP_SCHEDULE[activeMobileTripDay - 1].desc}</div>
        </div>

        <!-- Section: My Album -->
        <div class="pm-section">
          <h2 class="pm-section-heading">My Album</h2>
          <div class="pm-book-cover-card" id="pm-book-card">
            <div class="pm-book-corner top-left"></div>
            <div class="pm-book-corner top-right"></div>
            <div class="pm-book-corner bottom-left"></div>
            <div class="pm-book-corner bottom-right"></div>
            
            <div class="pm-book-emblem">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#f59e0b" stroke-width="2"><path d="M12 2l2.4 4.8 5.3.8-3.8 3.7.9 5.3-4.8-2.5-4.8 2.5.9-5.3-3.8-3.7 5.3-.8z"/></svg>
            </div>
            <div class="pm-book-tag">MEMORY KEEPSAKE • ${album && album.pages ? album.pages.length : 0} PAGES READY</div>

            <div class="pm-book-dashed-box">
              <div class="pm-book-main-title">Journey of Bangladesh</div>
              <div class="pm-book-sub-title">A Collection of Cherished Memories & Wanderlust</div>
              <div class="pm-book-divider"></div>
              <div class="pm-book-compiled">COMPILED BY ${esc(prof.name).toUpperCase()}</div>
            </div>

            <button type="button" class="pm-book-open-btn" id="pm-btn-open-book">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z"/></svg>
              <span>OPEN PHOTO ALBUM (NEW TAB)</span>
            </button>

            <div class="pm-book-ribbon"></div>
          </div>
        </div>

        <!-- Section: Emergency -->
        <div class="pm-section">
          <h2 class="pm-section-heading">Emergency</h2>
          <div class="pm-emergency-row">
            <button type="button" class="pm-999-btn" id="pm-btn-999">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              <span>999</span>
            </button>
          </div>
          <p class="pm-emergency-text">
            Call 999 for immediate Police, Ambulance, or Fire Service in Bangladesh.
          </p>
        </div>

        <!-- Section: Hospital finding map -->
        <div class="pm-section">
          <div class="pm-map-card" id="pm-hosp-map-card">
            <div class="pm-map-bg">
              <div class="pm-map-pin" style="top: 15%; left: 45%;">
                <span class="pm-pin-dot"></span>
                <span class="pm-pin-tag">Valley Child... <small>2.4 km • 7 min</small></span>
              </div>
              <div class="pm-map-pin" style="top: 28%; left: 20%;">
                <span class="pm-pin-dot"></span>
                <span class="pm-pin-tag">Metropolita... <small>1.9 km • 5 min</small></span>
              </div>
              <div class="pm-map-pin" style="top: 42%; right: 25%;">
                <span class="pm-pin-dot"></span>
                <span class="pm-pin-tag">City Memori... <small>3.2 km • 9 min</small></span>
              </div>
              <div class="pm-map-pin" style="top: 60%; left: 18%;">
                <span class="pm-pin-dot"></span>
                <span class="pm-pin-tag">University H... <small>1.7 km • 4 min</small></span>
              </div>
              <div class="pm-map-pin" style="top: 72%; right: 28%;">
                <span class="pm-pin-dot"></span>
                <span class="pm-pin-tag">St. Jude-Ene... <small>2.1 km • 5 min</small></span>
              </div>
              <div class="pm-map-pin" style="top: 84%; right: 12%;">
                <span class="pm-pin-dot"></span>
                <span class="pm-pin-tag">Northgate U... <small>2.7 km • 8 min</small></span>
              </div>
            </div>
            <div class="pm-map-overlay-badge">
              <span>Open Hospital Radar & Map ↗</span>
            </div>
          </div>
          <div class="pm-map-caption">Hospital finding map</div>
        </div>

        <!-- Footer Actions: Log Out + Checklist -->
        <div class="pm-footer-row">
          <button type="button" class="pm-logout-btn" id="pm-btn-logout">
            <span>Log out</span>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
          </button>
          <button type="button" class="pm-checklist-btn" id="pm-btn-checklist" title="Travel Checklist">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          </button>
        </div>
      </div>
    `;

    wireProfileEvents();
  }

  function renderActiveTabContent(tab, album, prof) {
    if (tab === 'book') {
      return `
        <div class="standalone-book-launch-card" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 36px 24px; text-align: center; box-shadow: 0 4px 24px -2px rgba(0,0,0,0.06); max-width: 760px; margin: 0 auto;">
          <div class="keepsake-book-showcase">
            <!-- Clickable 3D Keepsake Book Album Cover -->
            <a href="/book/" target="_blank" rel="noopener noreferrer" class="keepsake-book-cover-link" title="Click to open 3D Travel Memory Keepsake Album in a new tab">
              <div class="keepsake-book-3d" aria-label="Chapters of Life - 3D Travel Memory Keepsake Album">
                <div class="keepsake-book-spine"></div>
                
                <!-- Ornate Gold Filigree Corners -->
                <div class="keepsake-corner keepsake-corner-tl"></div>
                <div class="keepsake-corner keepsake-corner-tr"></div>
                <div class="keepsake-corner keepsake-corner-bl"></div>
                <div class="keepsake-corner keepsake-corner-br"></div>

                <!-- Hanging Gold Satin Ribbon Bookmark -->
                <div class="keepsake-ribbon"></div>

                <!-- Circular Gold Star Medallion -->
                <div class="keepsake-badge">
                  <div class="keepsake-badge-circle">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 2l2.6 6.8 7.4.4-5.6 4.8 1.8 7.2L12 17.5 5.8 21.2l1.8-7.2L2 9.2l7.4-.4z"/></svg>
                  </div>
                  <span class="keepsake-badge-label">MEMORY KEEPSAKE</span>
                </div>

                <!-- Ornate Border Box with Title & Subtitle -->
                <div class="keepsake-ornate-box">
                  <span class="keepsake-box-star keepsake-star-tl">✦</span>
                  <span class="keepsake-box-star keepsake-star-tr">✦</span>
                  <span class="keepsake-box-star keepsake-star-bl">✦</span>
                  <span class="keepsake-box-star keepsake-star-br">✦</span>
                  <h2 class="keepsake-book-title">Chapters of Life</h2>
                  <p class="keepsake-book-subtitle">A Collection of Cherished Memories &amp; Wanderlust</p>
                  <div class="keepsake-book-divider"></div>
                  <p class="keepsake-book-author">COMPILED BY OUR STORY</p>
                </div>

                <!-- Bottom Button on Book Cover -->
                <div>
                  <button type="button" class="keepsake-open-btn" tabindex="-1">
                    <span>📖 OPEN PHOTO ALBUM</span>
                  </button>
                </div>
              </div>
            </a>

            <h3 style="font-size: 22px; font-weight: 700; color: #0f172a; margin: 12px 0 8px 0; font-family: var(--font-display, inherit);">
              3D Travel Memory Keepsake Album
            </h3>
            <p style="font-size: 14.5px; color: #64748b; line-height: 1.6; max-width: 540px; margin: 0 auto 20px auto;">
              Click the keepsake book image above to open your interactive 3D scrapbooking album in a full dedicated tab with realistic page-turning physics, photo customization, stickers, and keepsake exports.
            </p>
            <div style="display: flex; align-items: center; justify-content: center; gap: 12px; flex-wrap: wrap;">
              <a href="/book/" target="_blank" rel="noopener noreferrer" style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #ffffff; font-weight: 600; font-size: 15px; text-decoration: none; padding: 12px 24px; border-radius: 12px; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 4px 14px rgba(5,150,105,0.3); transition: transform 0.15s ease;" title="Open 3D Memory Book in New Tab">
                <span>Open 3D Memory Book in New Tab</span>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>
              </a>
            </div>
            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: center; gap: 20px; font-size: 13px; color: #94a3b8; flex-wrap: wrap;">
              <span>📖 ${album.pages ? album.pages.length : 0} Pages Configured</span>
              <span>•</span>
              <span>✨ 3D Realistic Turn Engine</span>
              <span>•</span>
              <span>💾 Keepsake Export Ready</span>
            </div>
          </div>
        </div>
      `;
    }

    if (tab === 'emergency') {
      return `
        <div class="standalone-tab-banner" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 12px 18px; margin-bottom: 16px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 32px; height: 32px; border-radius: 8px; background: #fee2e2; display: flex; align-items: center; justify-content: center; color: #dc2626;">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v12M6 12h12"/></svg>
            </div>
            <div>
              <div style="font-weight: 700; color: #991b1b; font-size: 14px;">Original /Hospital finding Folder Experience Ready</div>
              <div style="color: #b91c1c; font-size: 12px;">Full standalone CuraMap Hospital Finder & Live Road Navigator with real-time Leaflet routing & search.</div>
            </div>
          </div>
          <a href="/hospital/" target="_blank" rel="noopener noreferrer" style="background: #dc2626; color: #ffffff; font-weight: 600; font-size: 13px; text-decoration: none; padding: 8px 16px; border-radius: 8px; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 4px rgba(220,38,38,0.2); white-space: nowrap; flex-shrink: 0;" title="Open exact Hospital Finding folder in a new tab">
            <span>Open in New Tab</span>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>
          </a>
        </div>

        <div class="emergency-dashboard-grid">
          <!-- 999 SOS Hero Card -->
          <div class="emergency-sos-hero-card">
            <div class="emergency-hero-text-block">
              <div class="emergency-sos-icon-pulse">
                <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </div>
              <div>
                <div class="emergency-hero-title">
                  <span>National Emergency 999</span>
                  <span class="emergency-badge-tag">Toll Free 24/7</span>
                </div>
                <p class="emergency-hero-desc">
                  Police Dispatch, Ambulance Response & Fire Emergency Service across all 64 districts of Bangladesh.
                </p>
              </div>
            </div>
            <button type="button" class="emergency-sos-trigger-btn" id="btn-call-999-hero">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              <span>Call 999 (Simulated)</span>
            </button>
          </div>

          <!-- Bangladesh Emergency Quick Hotlines -->
          <div class="emergency-hotlines-bar">
            <div class="emergency-hotline-card" id="hotline-tourist-police">
              <div class="emergency-hotline-icon">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div class="emergency-hotline-info">
                <span class="emergency-hotline-name">Tourist Police Helpline</span>
                <span class="emergency-hotline-num">01320-000888</span>
              </div>
            </div>

            <div class="emergency-hotline-card" id="hotline-health-call">
              <div class="emergency-hotline-icon">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              </div>
              <div class="emergency-hotline-info">
                <span class="emergency-hotline-name">National Health Center</span>
                <span class="emergency-hotline-num">16263</span>
              </div>
            </div>

            <div class="emergency-hotline-card" id="hotline-fire-service">
              <div class="emergency-hotline-icon">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
              </div>
              <div class="emergency-hotline-info">
                <span class="emergency-hotline-name">Fire & Rescue Service</span>
                <span class="emergency-hotline-num">16163</span>
              </div>
            </div>
          </div>

          <!-- Hospital Finding Radar & Interactive Map -->
          <div class="hospital-radar-card" id="hospital-radar-container">
            <div class="hospital-radar-header-row">
              <div class="hospital-radar-title-wrap">
                <h3>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#dc2626" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v12M6 12h12"/></svg>
                  <span>Emergency Hospital Radar & Route Navigation</span>
                </h3>
                <p>Live medical centers, trauma units, ICU facilities, and turn-by-turn routing.</p>
              </div>

              <div class="hospital-city-presets">
                <button type="button" class="hospital-preset-btn is-active" data-preset="dhaka">Dhaka Central</button>
                <button type="button" class="hospital-preset-btn" data-preset="chittagong">Chittagong</button>
                <button type="button" class="hospital-preset-btn" data-preset="sylhet">Sylhet</button>
                <button type="button" class="hospital-preset-btn" data-preset="coxsbazar">Cox's Bazar</button>
                <button type="button" class="hospital-preset-btn" data-preset="sreemangal">Sreemangal</button>
                <button type="button" class="hospital-preset-btn" data-preset="gps" style="font-weight: 700; color: #15803d;">🎯 My GPS</button>
              </div>
            </div>

            <!-- Filter Strip -->
            <div class="hospital-filter-strip">
              <div class="hospital-search-box">
                <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                <input type="text" id="hospital-search-input" placeholder="Search hospitals, trauma centers, or specialties..." />
              </div>

              <label class="hospital-toggle-label">
                <input type="checkbox" id="hospital-emergency-only" checked />
                <span>24/7 Emergency Only</span>
              </label>
            </div>

            <!-- Grid: Leaflet Map + Hospital List Sidebar -->
            <div class="hospital-radar-grid">
              <div class="hospital-map-container-wrap">
                <div id="hospital-leaflet-map"></div>
              </div>

              <div class="hospital-sidebar-list" id="hospital-sidebar-list">
                <!-- Dynamically populated -->
              </div>
            </div>

            <!-- Route directions drawer -->
            <div class="hospital-route-panel" id="hospital-route-panel" style="display: none;"></div>
          </div>
        </div>
      `;
    }

    // Default: 'preferences' (Minimalist settings & info)
    return `
      <div class="profile-two-columns">
        <!-- Card 1: Traveler Details -->
        <div class="profile-section-card">
          <h3>Traveler Information</h3>
          <div class="profile-info-list">
            <div class="profile-info-row">
              <span class="profile-info-key">Full Name</span>
              <span class="profile-info-val">${esc(prof.name)}</span>
            </div>
            <div class="profile-info-row">
              <span class="profile-info-key">Email Address</span>
              <span class="profile-info-val">${esc(prof.email)}</span>
            </div>
            <div class="profile-info-row">
              <span class="profile-info-key">Home Base</span>
              <span class="profile-info-val">${esc(prof.location)}</span>
            </div>
            <div class="profile-info-row">
              <span class="profile-info-key">Travel Archetype</span>
              <span class="profile-info-val">${esc(prof.travelStyle)}</span>
            </div>
            <div class="profile-info-row">
              <span class="profile-info-key">Member Since</span>
              <span class="profile-info-val">${esc(prof.memberSince)}</span>
            </div>
          </div>
        </div>

        <!-- Card 2: Travel Preferences -->
        <div class="profile-section-card">
          <h3>Travel Preferences</h3>
          <div class="profile-info-list">
            <div class="profile-info-row">
              <span class="profile-info-key">Preferred Transit</span>
              <span class="profile-info-val">${esc(prof.transitPreference)}</span>
            </div>
            <div class="profile-info-row">
              <span class="profile-info-key">Primary Languages</span>
              <span class="profile-info-val">${esc(prof.languages)}</span>
            </div>
            <div class="profile-info-row">
              <span class="profile-info-key">Food & Dining</span>
              <span class="profile-info-val">${esc(prof.dietary)}</span>
            </div>
            <div class="profile-info-row">
              <span class="profile-info-key">Exploration Pace</span>
              <span class="profile-info-val">${esc(prof.pace)}</span>
            </div>
            <div class="profile-info-row">
              <span class="profile-info-key">Currency Display</span>
              <span class="profile-info-val">${esc(prof.currency)}</span>
            </div>
          </div>
        </div>

        <!-- Card 3: App & Offline Preferences -->
        <div class="profile-section-card">
          <h3>Application & Offline</h3>
          <div class="profile-info-list">
            <div class="profile-toggle-row">
              <div class="profile-toggle-text-group">
                <span class="profile-toggle-title">Offline Places Catalog</span>
                <span class="profile-toggle-desc">Saved database available without internet (18 MB)</span>
              </div>
              <button type="button" class="profile-switch-btn ${prof.offlineMode ? 'is-on' : ''}" id="prof-offline-toggle" aria-label="Toggle offline mode">
                <div class="profile-switch-knob"></div>
              </button>
            </div>
            <div class="profile-toggle-row">
              <div class="profile-toggle-text-group">
                <span class="profile-toggle-title">Seasonal Trip Advisories</span>
                <span class="profile-toggle-desc">Monsoon river safety & festival alerts</span>
              </div>
              <button type="button" class="profile-switch-btn ${prof.notifications ? 'is-on' : ''}" id="prof-notif-toggle" aria-label="Toggle notifications">
                <div class="profile-switch-knob"></div>
              </button>
            </div>
            <div class="profile-info-row" style="margin-top: 6px;">
              <span class="profile-info-key">AI Guide Engine</span>
              <span class="profile-info-val">${esc(prof.aiGuide)}</span>
            </div>
          </div>
        </div>

        <!-- Card 4: Recent Explorer Milestones -->
        <div class="profile-section-card">
          <h3>Recent Milestones</h3>
          <div class="profile-info-list">
            <div class="profile-activity-item">
              <div class="profile-activity-dot"></div>
              <div class="profile-activity-info">
                <div class="profile-activity-title">Lalbagh Fort & Old Dhaka Walk</div>
                <div class="profile-activity-sub">Visited Mughal heritage site • Dhaka Division</div>
              </div>
            </div>
            <div class="profile-activity-item">
              <div class="profile-activity-dot"></div>
              <div class="profile-activity-info">
                <div class="profile-activity-title">Subarna Express Rail Route</div>
                <div class="profile-activity-sub">Dhaka to Chittagong journey planned</div>
              </div>
            </div>
            <div class="profile-activity-item">
              <div class="profile-activity-dot"></div>
              <div class="profile-activity-info">
                <div class="profile-activity-title">Ratargul Freshwater Swamp</div>
                <div class="profile-activity-sub">Added to seasonal monsoon wishlist • Sylhet</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function wireProfileEvents() {
    const root = $('#page-profile');
    if (!root) return;

    // Quick SOS 999 Call Button in Header
    $('#prof-sos-quick-btn')?.addEventListener('click', () => {
      soundFx.playClick();
      showDummy999CallModal();
    });

    // Subnav tabs
    root.querySelectorAll('.profile-subnav-btn').forEach(btn => {
      btn.onclick = () => {
        const tab = btn.dataset.tab;
        if (!tab || tab === activeProfileTab) return;
        activeProfileTab = tab;
        soundFx.playClick();
        renderProfile();
      };
    });

    // Wire active tab contents
    if (activeProfileTab === 'book') {
      const bookContainer = root.querySelector('#book-album-container');
      if (bookContainer) {
        wireMemoryBookControls(bookContainer, getStoredAlbum());
      }
    } else if (activeProfileTab === 'emergency') {
      // 999 Call Hero button
      $('#btn-call-999-hero')?.addEventListener('click', () => {
        soundFx.playClick();
        showDummy999CallModal();
      });

      // Quick hotline clicks
      $('#hotline-tourist-police')?.addEventListener('click', () => {
        soundFx.playClick();
        showToast('📞 Tourist Police Hotline: 01320-000888 (24/7 Traveler Protection)');
      });
      $('#hotline-health-call')?.addEventListener('click', () => {
        soundFx.playClick();
        showToast('📞 National Health Call Center: 16263 (Ministry of Health)');
      });
      $('#hotline-fire-service')?.addEventListener('click', () => {
        soundFx.playClick();
        showToast('📞 Fire & Civil Defense Control: 16163');
      });

      // Init Hospital Radar & Map
      const radarCard = root.querySelector('#hospital-radar-container');
      if (radarCard) {
        initHospitalRadar(radarCard);
      }
    }

    // Edit Profile
    $('#prof-edit-btn')?.addEventListener('click', openEditProfileModal);

    // Share Profile
    $('#prof-share-btn')?.addEventListener('click', () => {
      const prof = getStoredProfile();
      if (navigator.clipboard) {
        navigator.clipboard.writeText(`BanglaPath Explorer: ${prof.name} (${prof.travelStyle}) based in ${prof.location}`);
        showToast('✓ Profile link copied to clipboard');
      } else {
        showToast(`👤 ${prof.name} • ${prof.location}`);
      }
    });

    // Offline mode toggle
    $('#prof-offline-toggle')?.addEventListener('click', () => {
      const prof = getStoredProfile();
      prof.offlineMode = !prof.offlineMode;
      saveStoredProfile(prof);
      const btn = $('#prof-offline-toggle');
      if (btn) btn.classList.toggle('is-on', prof.offlineMode);
      showToast(prof.offlineMode ? '✓ Offline places catalog enabled' : 'Offline cache disabled');
    });

    // Notification toggle
    $('#prof-notif-toggle')?.addEventListener('click', () => {
      const prof = getStoredProfile();
      prof.notifications = !prof.notifications;
      saveStoredProfile(prof);
      const btn = $('#prof-notif-toggle');
      if (btn) btn.classList.toggle('is-on', prof.notifications);
      showToast(prof.notifications ? '✓ Travel advisories active' : 'Travel advisories muted');
    });

    // Clear offline cache
    $('#prof-clear-cache-btn')?.addEventListener('click', () => {
      showToast('✓ Offline places database refreshed & cached cleaned');
    });

    // Logout
    $('#prof-logout-btn')?.addEventListener('click', () => {
      if (confirm('Are you sure you want to log out?')) {
        showToast('👋 Logged out. Returning to home...');
        setTimeout(() => location.reload(), 600);
      }
    });

    // Mobile Profile Wire Actions
    const pmOpenBook = () => {
      soundFx.playClick();
      window.open('/book/', '_blank');
    };
    $('#pm-book-card')?.addEventListener('click', pmOpenBook);
    $('#pm-btn-open-book')?.addEventListener('click', (e) => {
      e.stopPropagation();
      pmOpenBook();
    });

    // Mobile edit profile button
    $('#pm-btn-edit')?.addEventListener('click', () => {
      soundFx.playClick();
      openEditProfileModal();
    });

    // Mobile 7 Days Stepper Interactive Nodes
    root.querySelectorAll('.pm-step-node').forEach(node => {
      node.addEventListener('click', () => {
        const day = parseInt(node.getAttribute('data-day') || '1', 10);
        if (day >= 1 && day <= 7) {
          activeMobileTripDay = day;
          try {
            localStorage.setItem('banglapath_active_trip_day', String(day));
          } catch (e) {}
          soundFx.playClick();

          // Update Progress Bar
          const progressEl = $('#pm-stepper-progress-bar');
          if (progressEl) {
            progressEl.style.width = `${((day - 1) / 6) * 100}%`;
          }

          // Update all nodes
          root.querySelectorAll('.pm-step-node').forEach(n => {
            const d = parseInt(n.getAttribute('data-day') || '1', 10);
            n.classList.toggle('is-active', d === day);
            n.classList.toggle('is-passed', d < day);

            // Re-position flame icon
            const existingFlame = n.querySelector('.pm-flame-icon');
            if (d === day) {
              if (!existingFlame) {
                const fl = document.createElement('span');
                fl.className = 'pm-flame-icon';
                fl.textContent = '🔥';
                n.insertBefore(fl, n.firstChild);
              }
            } else if (existingFlame) {
              existingFlame.remove();
            }
          });

          // Update Title and Subtitle Description
          const sched = MOBILE_TRIP_SCHEDULE[day - 1];
          if (sched) {
            const titleEl = $('#pm-trip-title-text');
            const descEl = $('#pm-trip-desc-text');
            if (titleEl) titleEl.textContent = sched.title;
            if (descEl) descEl.textContent = sched.desc;
          }
          showToast(`📍 Day ${day}: ${sched ? sched.title.split(':')[1]?.trim() || sched.title : 'Trip itinerary updated'}`);
        }
      });
    });

    // Emergency 999
    $('#pm-btn-999')?.addEventListener('click', () => {
      soundFx.playClick();
      if (typeof showDummy999CallModal === 'function') {
        showDummy999CallModal();
      } else {
        window.location.href = 'tel:999';
      }
    });

    // Hospital Finding Radar Card
    $('#pm-hosp-map-card')?.addEventListener('click', () => {
      soundFx.playClick();
      window.open('/hospital/', '_blank');
    });

    // Logout
    $('#pm-btn-logout')?.addEventListener('click', () => {
      soundFx.playClick();
      if (confirm('Are you sure you want to log out?')) {
        showToast('👋 Logged out. Returning to home...');
        setTimeout(() => location.reload(), 600);
      }
    });

    // Travel Checklist Button
    $('#pm-btn-checklist')?.addEventListener('click', () => {
      soundFx.playClick();
      openTravelChecklistModal();
    });

    // Direct Profile Photo Upload (Desktop)
    $('#prof-direct-avatar-input')?.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        compressAndStoreAvatar(file, (dataUrl) => {
          const prof = getStoredProfile();
          prof.avatar = dataUrl;
          saveStoredProfile(prof);
          syncTopbarUser();
          renderProfile();
          soundFx.playClick();
          showToast('📸 Profile photo updated successfully!');
        });
      }
    });

    // Direct Profile Photo Upload (Mobile)
    $('#pm-direct-avatar-input')?.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        compressAndStoreAvatar(file, (dataUrl) => {
          const prof = getStoredProfile();
          prof.avatar = dataUrl;
          saveStoredProfile(prof);
          syncTopbarUser();
          renderProfile();
          soundFx.playClick();
          showToast('📸 Profile photo updated successfully!');
        });
      }
    });

    // Scenic Presets Picker
    $('#prof-btn-presets')?.addEventListener('click', () => {
      soundFx.playClick();
      openScenicPresetModal();
    });

    // Remove Custom Photo
    $('#prof-btn-remove-photo')?.addEventListener('click', () => {
      soundFx.playClick();
      if (confirm('Remove profile photo and restore initials?')) {
        const prof = getStoredProfile();
        prof.avatar = '';
        saveStoredProfile(prof);
        syncTopbarUser();
        renderProfile();
        showToast('✓ Profile picture removed');
      }
    });
  }

  function openScenicPresetModal() {
    let modal = $('#scenic-presets-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'scenic-presets-modal';
      modal.className = 'modal-backdrop';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-card" role="dialog" aria-modal="true" style="max-width: 520px; border-radius: 16px; overflow: hidden; background: #ffffff; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.15);">
        <div style="background: linear-gradient(135deg, #14532d 0%, #166534 100%); padding: 18px 22px; color: #ffffff; position: relative;">
          <button type="button" id="scenic-modal-close" style="position: absolute; top: 16px; right: 16px; background: rgba(255,255,255,0.15); border: 0; color: #fff; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <svg viewBox="0 0 24 24" width="16" height="16"><path d="M18 6L6 18M6 6l12 12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>
          </button>
          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.85;">Scenic Bangladesh Avatars</div>
          <h3 style="font-size: 18px; font-weight: 700; margin: 4px 0 0; color: #ffffff;">Choose an Iconic BD Location</h3>
        </div>
        <div style="padding: 20px 22px;">
          <p style="font-size: 13px; color: #64748b; margin: 0 0 16px 0;">Select an authentic landmark or nature reserve to represent your Bangladesh explorer identity:</p>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 18px;">
            ${SCENIC_AVATAR_PRESETS.map(preset => `
              <div class="scenic-preset-card" data-preset-img="${esc(preset.img)}" data-preset-title="${esc(preset.title)}" style="display: flex; align-items: center; gap: 12px; padding: 10px; border: 1px solid #e2e8f0; border-radius: 12px; cursor: pointer; transition: all 0.15s ease; background: #f8fafc;">
                <img src="${esc(preset.img)}" alt="${esc(preset.title)}" style="width: 46px; height: 46px; border-radius: 50%; object-fit: cover; flex-shrink: 0; border: 2px solid #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" />
                <div style="overflow: hidden;">
                  <div style="font-size: 13px; font-weight: 700; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${esc(preset.title)}</div>
                  <div style="font-size: 11px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${esc(preset.sub)}</div>
                </div>
              </div>
            `).join('')}
          </div>
          <div style="display: flex; justify-content: flex-end;">
            <button type="button" id="scenic-modal-cancel" style="padding: 8px 18px; border: 1px solid #cbd5e1; border-radius: 8px; background: #ffffff; color: #475569; font-size: 13.5px; font-weight: 600; cursor: pointer;">Close</button>
          </div>
        </div>
      </div>
    `;

    modal.classList.add('is-open');
    modal.querySelector('#scenic-modal-close').onclick = () => modal.classList.remove('is-open');
    modal.querySelector('#scenic-modal-cancel').onclick = () => modal.classList.remove('is-open');
    modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('is-open'); };
    modal.querySelectorAll('.scenic-preset-card').forEach(card => {
      card.onclick = () => {
        const imgPath = card.getAttribute('data-preset-img');
        const title = card.getAttribute('data-preset-title');
        const prof = getStoredProfile();
        prof.avatar = imgPath;
        saveStoredProfile(prof);
        modal.classList.remove('is-open');
        syncTopbarUser();
        renderProfile();
        soundFx.playClick();
        showToast(`🌄 Avatar set to ${title}!`);
      };
    });
  }

  function openEditProfileModal() {
    const prof = getStoredProfile();
    let tempAvatar = prof.avatar || '';
    let modal = $('#profile-edit-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'profile-edit-modal';
      modal.className = 'modal-backdrop';
      document.body.appendChild(modal);
    }
    const initials = getInitials(prof.name);

    modal.innerHTML = `
      <div class="modal-card" role="dialog" aria-modal="true" style="max-width: 500px; border-radius: 16px; overflow: hidden; background: #ffffff; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);">
        <div style="background: #14532d; padding: 20px 24px; color: #ffffff; position: relative;">
          <button type="button" id="prof-modal-close" style="position: absolute; top: 16px; right: 16px; background: rgba(255,255,255,0.15); border: 0; color: #fff; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <svg viewBox="0 0 24 24" width="16" height="16"><path d="M18 6L6 18M6 6l12 12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>
          </button>
          <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; opacity: 0.85;">Edit Traveler Profile</div>
          <h3 style="font-size: 18px; font-weight: 700; margin: 4px 0 0; color: #ffffff;">Personal & Explorer Information</h3>
        </div>
        <form id="prof-edit-form" style="padding: 22px 24px;">
          <!-- Profile Photo Upload Box -->
          <div style="display: flex; align-items: center; gap: 16px; padding: 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 18px;">
            <div id="modal-avatar-preview-circle" style="width: 64px; height: 64px; border-radius: 50%; overflow: hidden; background: #14532d; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 20px; flex-shrink: 0; box-shadow: 0 2px 6px rgba(0,0,0,0.12); position: relative;">
              ${tempAvatar ? `<img id="modal-avatar-img" src="${esc(tempAvatar)}" style="width: 100%; height: 100%; object-fit: cover;" />` : `<span id="modal-avatar-initials">${esc(initials)}</span>`}
            </div>
            <div style="flex: 1;">
              <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">Profile Photo</div>
              <div style="font-size: 11.5px; color: #64748b; margin-bottom: 8px;">Upload a custom image or pick a scenic Bangladesh preset.</div>
              <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
                <label for="modal-avatar-file-input" style="display: inline-flex; align-items: center; gap: 5px; padding: 6px 12px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 12px; font-weight: 600; color: #1e293b; cursor: pointer; transition: all 0.15s ease;">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                  <span>Upload Picture</span>
                </label>
                <input type="file" id="modal-avatar-file-input" accept="image/*" style="display: none;" />
                <button type="button" id="modal-btn-scenic-choose" style="padding: 6px 10px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 12px; font-weight: 600; color: #15803d; cursor: pointer;">
                  Scenic BD
                </button>
                <button type="button" id="modal-btn-remove-avatar" style="padding: 6px 10px; background: transparent; border: 1px solid #fecaca; border-radius: 8px; font-size: 12px; font-weight: 600; color: #dc2626; cursor: pointer; ${tempAvatar ? '' : 'display: none;'}">
                  Remove
                </button>
              </div>
            </div>
          </div>

          <div style="margin-bottom: 14px;">
            <label style="display: block; font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 5px;">Full Name</label>
            <input type="text" id="prof-input-name" value="${esc(prof.name)}" required style="width: 100%; box-sizing: border-box; padding: 9px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px;" />
          </div>
          <div style="margin-bottom: 14px;">
            <label style="display: block; font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 5px;">Home Base / City</label>
            <input type="text" id="prof-input-loc" value="${esc(prof.location)}" required style="width: 100%; box-sizing: border-box; padding: 9px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px;" />
          </div>
          <div style="margin-bottom: 14px;">
            <label style="display: block; font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 5px;">Short Bio</label>
            <textarea id="prof-input-bio" rows="3" style="width: 100%; box-sizing: border-box; padding: 9px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; resize: none;">${esc(prof.bio)}</textarea>
          </div>
          <div style="margin-bottom: 14px;">
            <label style="display: block; font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 5px;">Travel Archetype</label>
            <input type="text" id="prof-input-style" value="${esc(prof.travelStyle)}" style="width: 100%; box-sizing: border-box; padding: 9px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px;" />
          </div>
          <div style="margin-bottom: 20px;">
            <label style="display: block; font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 5px;">Preferred Transit</label>
            <input type="text" id="prof-input-transit" value="${esc(prof.transitPreference)}" style="width: 100%; box-sizing: border-box; padding: 9px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px;" />
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 10px;">
            <button type="button" id="prof-modal-cancel" style="padding: 8px 16px; border: 1px solid #cbd5e1; border-radius: 8px; background: #ffffff; color: #475569; font-size: 13.5px; font-weight: 500; cursor: pointer;">Cancel</button>
            <button type="submit" style="padding: 8px 18px; border-radius: 8px; background: #14532d; color: #ffffff; border: 0; font-size: 13.5px; font-weight: 600; cursor: pointer;">Save Changes</button>
          </div>
        </form>
      </div>
    `;

    modal.classList.add('is-open');
    modal.querySelector('#prof-modal-close').onclick = () => modal.classList.remove('is-open');
    modal.querySelector('#prof-modal-cancel').onclick = () => modal.classList.remove('is-open');
    modal.onclick = (e) => {
      if (e.target === modal) modal.classList.remove('is-open');
    };

    // Modal Photo Upload Handling
    const modalFileInput = modal.querySelector('#modal-avatar-file-input');
    const previewCircle = modal.querySelector('#modal-avatar-preview-circle');
    const removeBtn = modal.querySelector('#modal-btn-remove-avatar');

    modalFileInput?.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        compressAndStoreAvatar(file, (dataUrl) => {
          tempAvatar = dataUrl;
          previewCircle.innerHTML = `<img id="modal-avatar-img" src="${dataUrl}" style="width: 100%; height: 100%; object-fit: cover;" />`;
          if (removeBtn) removeBtn.style.display = 'inline-block';
          showToast('📷 Photo loaded! Click Save Changes to apply.');
        });
      }
    });

    // Scenic Presets in Modal
    modal.querySelector('#modal-btn-scenic-choose')?.addEventListener('click', () => {
      openScenicPresetModal();
    });

    // Remove in Modal
    removeBtn?.addEventListener('click', () => {
      tempAvatar = '';
      const curName = $('#prof-input-name')?.value || prof.name;
      previewCircle.innerHTML = `<span id="modal-avatar-initials">${esc(getInitials(curName))}</span>`;
      removeBtn.style.display = 'none';
    });

    modal.querySelector('#prof-edit-form').onsubmit = (e) => {
      e.preventDefault();
      const updated = getStoredProfile();
      updated.name = ($('#prof-input-name')?.value || updated.name).trim();
      updated.location = ($('#prof-input-loc')?.value || updated.location).trim();
      updated.bio = ($('#prof-input-bio')?.value || updated.bio).trim();
      updated.travelStyle = ($('#prof-input-style')?.value || updated.travelStyle).trim();
      updated.transitPreference = ($('#prof-input-transit')?.value || updated.transitPreference).trim();
      updated.avatar = tempAvatar;
      saveStoredProfile(updated);
      modal.classList.remove('is-open');
      syncTopbarUser();
      renderProfile();
      showToast('✓ Profile updated successfully');
    };
  }

  function openTravelChecklistModal() {
    let modal = $('#travel-checklist-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'travel-checklist-modal';
      modal.className = 'modal-backdrop';
      document.body.appendChild(modal);
    }

    const renderChecklistUI = () => {
      const items = getStoredChecklist();
      const completedCount = items.filter(i => i.done).length;
      const pct = items.length ? Math.round((completedCount / items.length) * 100) : 0;

      modal.innerHTML = `
        <div class="modal-card" role="dialog" aria-modal="true" style="max-width: 440px; border-radius: 16px; overflow: hidden; background: #ffffff; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);">
          <div style="background: linear-gradient(135deg, #14532d 0%, #166534 100%); padding: 20px 22px; color: #ffffff; position: relative;">
            <button type="button" id="checklist-modal-close" style="position: absolute; top: 16px; right: 16px; background: rgba(255,255,255,0.18); border: 0; color: #fff; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer;">
              <svg viewBox="0 0 24 24" width="16" height="16"><path d="M18 6L6 18M6 6l12 12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>
            </button>
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.85;">BanglaPath Travel Essentials</div>
            <h3 style="font-size: 19px; font-weight: 800; margin: 4px 0 0; color: #ffffff;">🎒 Expedition Checklist</h3>
            <div style="margin-top: 12px;">
              <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 600; margin-bottom: 5px; opacity: 0.95;">
                <span>Progress: ${completedCount} of ${items.length} items packed</span>
                <span>${pct}%</span>
              </div>
              <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.25); border-radius: 999px; overflow: hidden;">
                <div style="width: ${pct}%; height: 100%; background: #22c55e; transition: width 0.3s ease;"></div>
              </div>
            </div>
          </div>
          
          <div style="padding: 16px 20px; max-height: 52vh; overflow-y: auto;">
            <div id="checklist-items-list" style="display: flex; flex-direction: column; gap: 8px;">
              ${items.map(item => `
                <div class="checklist-item-row" data-id="${item.id}" style="display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 10px; background: ${item.done ? '#f0fdf4' : '#f8fafc'}; border: 1px solid ${item.done ? '#bbf7d0' : '#e2e8f0'}; cursor: pointer; transition: all 0.15s ease;">
                  <div style="width: 20px; height: 20px; border-radius: 6px; border: 2px solid ${item.done ? '#16a34a' : '#94a3b8'}; background: ${item.done ? '#16a34a' : '#ffffff'}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    ${item.done ? `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#ffffff" stroke-width="3.2"><path d="M20 6L9 17l-5-5"/></svg>` : ''}
                  </div>
                  <span style="font-size: 13.5px; font-weight: 500; color: ${item.done ? '#166534' : '#1e293b'}; text-decoration: ${item.done ? 'line-through' : 'none'}; flex: 1;">
                    ${esc(item.text)}
                  </span>
                </div>
              `).join('')}
            </div>

            <!-- Add new item form -->
            <form id="checklist-add-form" style="display: flex; gap: 8px; margin-top: 16px;">
              <input type="text" id="checklist-new-text" placeholder="Add extra item (e.g., Camera SD card)..." style="flex: 1; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px;" />
              <button type="submit" style="padding: 8px 14px; background: #15803d; color: #ffffff; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer;">Add</button>
            </form>
          </div>

          <div style="padding: 12px 20px; background: #f8fafc; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;">
            <button type="button" id="checklist-reset-btn" style="background: none; border: none; font-size: 12px; color: #64748b; cursor: pointer; text-decoration: underline;">Reset to Default</button>
            <button type="button" id="checklist-done-btn" style="padding: 7px 18px; border-radius: 8px; background: #14532d; color: #ffffff; border: 0; font-size: 13px; font-weight: 600; cursor: pointer;">Done</button>
          </div>
        </div>
      `;

      modal.classList.add('is-open');

      // Wire items click
      modal.querySelectorAll('.checklist-item-row').forEach(row => {
        row.onclick = () => {
          const id = row.dataset.id;
          const curItems = getStoredChecklist();
          const target = curItems.find(i => i.id === id);
          if (target) {
            target.done = !target.done;
            saveStoredChecklist(curItems);
            soundFx.playClick();
            renderChecklistUI();
          }
        };
      });

      // Wire add item
      const addForm = modal.querySelector('#checklist-add-form');
      if (addForm) {
        addForm.onsubmit = (e) => {
          e.preventDefault();
          const input = modal.querySelector('#checklist-new-text');
          const val = input ? input.value.trim() : '';
          if (val) {
            const curItems = getStoredChecklist();
            curItems.push({ id: 'item-' + Date.now(), text: val, done: false });
            saveStoredChecklist(curItems);
            soundFx.playClick();
            renderChecklistUI();
          }
        };
      }

      // Reset
      const resetBtn = modal.querySelector('#checklist-reset-btn');
      if (resetBtn) {
        resetBtn.onclick = () => {
          if (confirm('Reset checklist to default Bangladesh travel items?')) {
            saveStoredChecklist(DEFAULT_CHECKLIST_ITEMS.map(i => ({ ...i })));
            soundFx.playClick();
            renderChecklistUI();
          }
        };
      }

      // Close
      const close = () => {
        modal.classList.remove('is-open');
      };
      const closeBtn = modal.querySelector('#checklist-modal-close');
      if (closeBtn) closeBtn.onclick = close;
      const doneBtn = modal.querySelector('#checklist-done-btn');
      if (doneBtn) doneBtn.onclick = close;
      modal.onclick = (e) => {
        if (e.target === modal) close();
      };
    };

    renderChecklistUI();
  }

  /* ---------------- wiring ---------------- */

  function wire() {
    $('#chat-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const input = $('#chat-text');
      const text = input.value;
      input.value = '';
      send(text);
    });

    $('#chat-reset').addEventListener('click', resetChat);

    // On narrow screens the panel is a drawer over the map, so it needs a way out.
    $('#chat-close').addEventListener('click', closeChat);
    $('#chat-scrim').addEventListener('click', closeChat);

    $('#chat-hide').addEventListener('click', hideChat);
    $('#chat-reveal').addEventListener('click', openChat);
    wireChatResize();
    restoreChatWidth();

    $('#chat-mic').addEventListener('click', startDictation);

    const btnNotif = $('#btn-notifications');
    if (btnNotif) {
      btnNotif.addEventListener('click', () => {
        showToast('🔔 You have 2 updates: New seasonal boat routes in Ratargul & winter beach packages in Cox’s Bazar!');
      });
    }

    const btnUser = $('#btn-user-profile');
    if (btnUser) {
      btnUser.addEventListener('click', () => {
        document.querySelectorAll('.rail-item').forEach((i) => i.classList.toggle('is-active', i.dataset.view === 'profile'));
        setView('profile');
      });
    }

    document.addEventListener('click', (e) => {
      const explore = e.target.closest('[data-explore]');
      if (explore) return openPlace(explore.dataset.explore);

      const ask = e.target.closest('[data-ask]');
      if (ask) {
        const p = byId.get(ask.dataset.ask);
        closeSheet();
        openChat();
        return send(`Tell me more about ${p.name} in ${p.district}.`, { display: `Tell me more about ${p.name}` });
      }

      const card = e.target.closest('.place-card') || e.target.closest('.mh-place-card') || e.target.closest('.sug-card');
      if (card && card.dataset.id) return openPlace(card.dataset.id);

      const viewMapBtn = e.target.closest('#pdp-view-map');
      if (viewMapBtn) {
        const placeId = viewMapBtn.dataset.id;
        const p = placeId ? byId.get(placeId) : null;
        if (p) {
          showMap(p);
          if (window.innerWidth <= 768) {
            showToast(`📍 Map centered on ${p.name}`);
          }
        }
        return;
      }

      if (e.target.closest('#pdp-back')) {
        if (window.innerWidth <= 768) {
          const mhEl = document.getElementById('mobile-home');
          const appEl = document.getElementById('app');
          if (appEl) appEl.style.removeProperty('display');
          if (mhEl) {
            mhEl.style.removeProperty('display');
            mhEl.querySelectorAll('.mh-nav-item').forEach((b) =>
              b.classList.toggle('is-active', b.dataset.mhView === 'home')
            );
          }
          setView('home');
          return;
        }
        return setView(lastView || 'home');
      }

      const shot = e.target.closest('[data-shot]');
      if (shot) {
        $('#pdp-shot').src = shot.dataset.shot;
        document.querySelectorAll('.pdp-thumbs button').forEach((b) => b.classList.toggle('is-active', b === shot));
        return;
      }

      const save = e.target.closest('#pdp-save');
      if (save) {
        const placeId = save.dataset.placeId;
        if (placeId) {
          const isNowSaved = toggleSavedPlace(placeId);
          save.classList.toggle('is-on', isNowSaved);
          showToast(isNowSaved ? '❤️ Saved to your favorite places!' : 'Removed from favorites.');
        } else {
          const isOn = save.classList.toggle('is-on');
          showToast(isOn ? '❤️ Saved to your favorite places!' : 'Removed from favorites.');
        }
        return;
      }

      const trip = e.target.closest('#pdp-trip');
      if (trip) {
        trip.classList.toggle('is-on');
        const isNowOn = trip.classList.contains('is-on');
        const p = trip.dataset.id ? byId.get(trip.dataset.id) : null;
        const isFood = p && p.isFood;
        const label = trip.querySelector('.pdp-pill-label') || trip.querySelector('.pdp-lead');
        if (label) {
          label.textContent = isNowOn
            ? (isFood ? 'Added to Food Tour' : 'Added to trip')
            : (isFood ? 'Add to food tour' : 'Add to trip');
        }
        showToast(
          isNowOn
            ? (isFood ? '🍲 Added to your Food Tour!' : '✈️ Added to your trip planner!')
            : (isFood ? 'Removed from food tour.' : 'Removed from trip.')
        );
        return;
      }

      const share = e.target.closest('#pdp-share');
      if (share) {
        const url = location.href;
        if (navigator.share) navigator.share({ title: document.title, url }).catch(() => {});
        else {
          navigator.clipboard?.writeText(url);
          showToast('🔗 Link copied to clipboard!');
        }
        return;
      }

      const askAi = e.target.closest('#pdp-ask-ai');
      if (askAi) {
        const placeId = askAi.dataset.id;
        const place = byId.get(placeId);
        if (place) {
          openChat();
          if (place.isFood) {
            send(`Tell me about authentic ${place.name} — its history, traditional preparation, secret spices, and the top iconic stalls or restaurants to eat it in ${place.district}, ${place.division || 'Bangladesh'}.`, {
              display: `Food guide for ${place.name}`
            });
          } else {
            send(`Tell me the best travel tips, hidden secrets, and top local food for ${place.name} in ${place.district}, ${place.division || 'Bangladesh'}.`, {
              display: `Travel guide for ${place.name}`
            });
          }
        }
        return;
      }

      const hit = e.target.closest('.search-results button');
      if (hit) {
        const si = $('#search-input');
        if (si) si.value = '';
        const sr = $('#search-results');
        if (sr) sr.hidden = true;
        const di = $('#disc-input');
        if (di) di.value = '';
        const dr = $('#disc-results');
        if (dr) dr.hidden = true;
        return openPlace(hit.dataset.id);
      }

      const placeSearch = $('#place-search');
      if (!placeSearch || !e.target.closest('#place-search')) {
        const sr = $('#search-results');
        if (sr) sr.hidden = true;
      }
      if (!e.target.closest('#disc-search')) {
        const dr = $('#disc-results');
        if (dr) dr.hidden = true;
      }

      const cat = e.target.closest('.cat');
      if (cat) return showCategory(cat.dataset.cat);

      const catAsk = e.target.closest('[data-cat-ask]');
      if (catAsk) {
        const found = (catalog.categories || []).find((c) => c.id === catAsk.dataset.catAsk);
        if (found) {
          openChat();
          send(found.prompt, { display: `Tell me about ${found.label.toLowerCase()}` });
        }
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeSheet();
        closeChat();
        const sr = $('#search-results');
        if (sr) sr.hidden = true;
        const dr = $('#disc-results');
        if (dr) dr.hidden = true;
        document.querySelectorAll('.modal-backdrop').forEach((m) => m.remove());
      }
    });

    [
      ['#reco-rail', '#reco-prev', '#reco-next'],
      ['#disc-rail', '#disc-prev', '#disc-next'],
    ].forEach(([railSel, prevSel, nextSel]) => {
      const rail = $(railSel);
      if (!rail) return;
      rail.addEventListener('scroll', updateRailButtons, { passive: true });
      $(prevSel)?.addEventListener('click', () => rail.scrollBy({ left: -railStep(railSel), behavior: 'smooth' }));
      $(nextSel)?.addEventListener('click', () => rail.scrollBy({ left: railStep(railSel), behavior: 'smooth' }));
    });
    window.addEventListener('resize', updateRailButtons);

    $('#disc-view-all')?.addEventListener('click', resetDiscover);

    $('#disc-division-filter')?.addEventListener('click', (e) => {
      const pill = e.target.closest('.disc-div-pill');
      if (!pill) return;
      document.querySelectorAll('.disc-div-pill').forEach((b) => b.classList.toggle('is-active', b === pill));
      currentDiscoverFilter.division = pill.dataset.div || 'all';
      updateDiscoverCards();
    });

    $('#disc-show-all-btn')?.addEventListener('click', () => {
      $('#disc-show-all-btn')?.classList.add('is-active');
      $('#disc-show-foods-btn')?.classList.remove('is-active');
      $('#disc-show-reco-btn')?.classList.remove('is-active');
      currentDiscoverFilter.mode = 'all';
      currentDiscoverFilter.division = 'all';
      currentDiscoverFilter.category = null;
      document.querySelectorAll('.disc-div-pill').forEach((b) => b.classList.toggle('is-active', b.dataset.div === 'all'));
      document.querySelectorAll('.cat').forEach((el) => el.classList.remove('is-active'));
      updateDiscoverCards();
    });

    $('#disc-show-foods-btn')?.addEventListener('click', () => {
      $('#disc-show-foods-btn')?.classList.add('is-active');
      $('#disc-show-all-btn')?.classList.remove('is-active');
      $('#disc-show-reco-btn')?.classList.remove('is-active');
      currentDiscoverFilter.mode = 'foods';
      currentDiscoverFilter.division = 'all';
      currentDiscoverFilter.category = null;
      document.querySelectorAll('.disc-div-pill').forEach((b) => b.classList.toggle('is-active', b.dataset.div === 'all'));
      document.querySelectorAll('.cat').forEach((el) => el.classList.remove('is-active'));
      updateDiscoverCards();
    });

    $('#disc-show-reco-btn')?.addEventListener('click', () => {
      $('#disc-show-reco-btn')?.classList.add('is-active');
      $('#disc-show-all-btn')?.classList.remove('is-active');
      $('#disc-show-foods-btn')?.classList.remove('is-active');
      currentDiscoverFilter.mode = 'reco';
      updateDiscoverCards();
    });

    $('#disc-search')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = $('#disc-input').value.trim();
      if (!q) return;
      const exact = catalog.places.find((p) => p.name.toLowerCase() === q.toLowerCase());
      $('#disc-input').value = '';
      $('#disc-results').hidden = true;
      if (exact) return openPlace(exact.id);
      openChat();
      send(`Tell me about ${q} in Bangladesh.`);
    });

    $('#disc-input')?.addEventListener('input', (e) => {
      renderSearch(e.target.value, '#disc-results');
      currentDiscoverFilter.search = e.target.value;
      updateDiscoverCards();
    });

    $('#view-all')?.addEventListener('click', () => {
      setView('explore');
      document.querySelectorAll('.rail-item').forEach((i) => i.classList.toggle('is-active', i.dataset.view === 'explore'));
    });

    $('#plan-trip')?.addEventListener('click', () => {
      setView('planner');
      document.querySelectorAll('.rail-item').forEach((i) => i.classList.toggle('is-active', i.dataset.view === 'planner'));
    });

    const ps = $('#place-search');
    if (ps) {
      ps.addEventListener('submit', (e) => {
        e.preventDefault();
        const si = $('#search-input');
        const q = si ? si.value.trim() : '';
        if (!q) return;
        const exact = catalog.places.find((p) => p.name.toLowerCase() === q.toLowerCase());
        if (si) si.value = '';
        if ($('#search-results')) $('#search-results').hidden = true;
        if (exact) return openPlace(exact.id);
        openChat();
        send(`Tell me about ${q} in Bangladesh.`);
      });
    }

    const si = $('#search-input');
    if (si) si.addEventListener('input', (e) => renderSearch(e.target.value));

    document.querySelectorAll('.rail-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        if (item.classList.contains('rail-ext-link') || item.tagName === 'A') {
          // Native anchor handles target="_blank"
          return;
        }
        if (item.dataset.view === 'logout') return location.reload();
        if (item.dataset.view === 'profile') {
          document.querySelectorAll('.rail-item').forEach((i) => i.classList.toggle('is-active', i === item));
          setView('profile');
          return;
        }
        if (item.dataset.view === 'settings') {
          showToast('⚙️ Settings • AI Model: Gemini 3.7 with Live Grounding • Voice: Authentic Bangladeshi');
          return;
        }
        document.querySelectorAll('.rail-item').forEach((i) => i.classList.toggle('is-active', i === item));
        setView(item.dataset.view);
      });
    });
  }

  /* Optional voice input where the browser supports it (Toggle on / off). */
  let activeChatRecog = null;
  function startDictation() {
    const Recog = window.SpeechRecognition || window.webkitSpeechRecognition;
    const mic = $('#chat-mic');
    if (!Recog) {
      $('#chat-text').placeholder = 'Voice input is not supported in this browser';
      showToast('Microphone is not supported in this browser environment.');
      return;
    }
    if (activeChatRecog) {
      try { activeChatRecog.abort(); } catch (e) {}
      activeChatRecog = null;
      if (mic) mic.classList.remove('is-recording');
      showToast('🔇 Chat microphone turned off.');
      return;
    }
    try {
      const rec = new Recog();
      activeChatRecog = rec;
      rec.lang = 'en-US';
      rec.interimResults = true;
      if (mic) mic.classList.add('is-recording');
      showToast('🎙️ Listening... (tap mic again to stop)');
      rec.onresult = (e) => {
        let transcript = '';
        for (let i = e.resultIndex; i < e.results.length; ++i) {
          transcript += e.results[i][0].transcript;
        }
        if (transcript) {
          $('#chat-text').value = transcript;
        }
      };
      rec.onend = () => {
        activeChatRecog = null;
        if (mic) mic.classList.remove('is-recording');
      };
      rec.onerror = () => {
        activeChatRecog = null;
        if (mic) mic.classList.remove('is-recording');
      };
      rec.start();
    } catch (e) {
      activeChatRecog = null;
      if (mic) mic.classList.remove('is-recording');
    }
  }

  /* ---------------- boot ---------------- */

  async function load() {
    const res = await fetch('places.json');
    catalog = await res.json();
    byId = new Map(catalog.places.map((p) => [p.id, p]));
  }

  const ready = load().catch((err) => {
    console.error('[BanglaPath] could not load places.json', err);
  });

  /** Called by the intro sequence once the foliage covers the screen. */
  async function enterHome() {
    if (started) return;
    started = true;
    await ready;
    const app = document.getElementById('app');
    app.hidden = false;
    renderPins();
    renderRail();
    renderCats();
    wire();
    syncTopbarUser();
    initChatHistory();
    openChat();
    setupMobileMyPlan();
    requestAnimationFrame(() => app.classList.add('is-open'));
    // Boot mobile home (only activates on ≤768px via CSS)
    initMobileHome();
  }

  /* ================================================================
     MOBILE HOME — complete logic
     Only runs on mobile (≤768px). All desktop logic above is
     completely untouched.
     ================================================================ */

  function initMobileHome() {
    const mhEl = document.getElementById('mobile-home');
    if (!mhEl) return;

    // Show the mobile home element (CSS hides it on desktop automatically)
    mhEl.hidden = false;
    requestAnimationFrame(() => mhEl.classList.add('is-open'));

    // Reveal mobile bottom navigation once inside the app
    const mobileNav = document.querySelector('.mh-bottom-nav');
    if (mobileNav) {
      mobileNav.style.removeProperty('display');
      mobileNav.classList.remove('is-hidden');
    }

    // ---- Helpers ----

    const mhEsc = (s) => String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

    function mhScrollBottom() {
      const scroll = document.getElementById('mh-scroll');
      if (scroll) scroll.scrollTo({ top: scroll.scrollHeight, behavior: 'smooth' });
    }

    // Simple inline markdown parser for mobile bubbles
    function mhParagraphs(text) {
      if (!text) return '';
      const lines = text.split('\n');
      const out = [];
      let inList = false;
      const parseInline = (s) => {
        let r = mhEsc(s);
        r = r.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        r = r.replace(/\*(.+?)\*/g, '<em>$1</em>');
        return r;
      };
      for (const raw of lines) {
        const line = raw.trim();
        if (!line) { if (inList) { out.push('</ul>'); inList = false; } continue; }
        const bm = line.match(/^[-*•]\s+(.*)/);
        if (bm) {
          if (!inList) { out.push('<ul class="mh-list">'); inList = true; }
          out.push(`<li>${parseInline(bm[1])}</li>`);
        } else {
          if (inList) { out.push('</ul>'); inList = false; }
          out.push(`<p>${parseInline(line)}</p>`);
        }
      }
      if (inList) out.push('</ul>');
      return out.join('');
    }

    // ---- Map pins on mobile map ----

    function renderMobilePins() {
      const frame = document.getElementById('mh-map-frame');
      if (!frame) return;
      frame.querySelectorAll('.mh-pin').forEach((el) => el.remove());

      const DEFAULT_PINS = [
        { id: 'paharpur', label: 'Paharpur Vihara', x: 27.5, y: 20.5 },
        { id: 'tanguarhaor', label: 'Tanguar Haor', x: 60.0, y: 20.5 },
        { id: 'lalbagh', label: 'Dhaka & Lalbagh Fort', x: 45.8, y: 35.5 },
        { id: 'sundarbans', label: 'Sundarbans', x: 28.8, y: 56.5 },
        { id: 'sajek', label: 'Sajek Valley', x: 75.2, y: 53.5 },
        { id: 'coxsbazar', label: "Cox's Bazar", x: 73.2, y: 69.0 },
        { id: 'saintmartin', label: "Saint Martin's Island", x: 98.0, y: 83.0 }
      ];
      const pins = (catalog.pins && catalog.pins.length) ? catalog.pins : DEFAULT_PINS;

      pins.forEach((pin) => {
        const place = byId.get(pin.id);
        const label = pin.label || pin.name || (place && place.name) || 'Destination';
        const x = typeof pin.x === 'number' ? pin.x : 50;
        const y = typeof pin.y === 'number' ? pin.y : 50;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'mh-pin';
        btn.style.left = `${x}%`;
        btn.style.top = `${y}%`;
        btn.dataset.id = pin.id;
        btn.setAttribute('aria-label', `Explore ${label}`);
        btn.innerHTML =
          `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.6c-4.1 0-7.4 3.3-7.4 7.4 0 5.3 6.5 12.6 6.8 12.9a.8.8 0 0 0 1.2 0c.3-.3 6.8-7.6 6.8-12.9 0-4.1-3.3-7.4-7.4-7.4z"/><circle cx="12" cy="9" r="2.7" fill="#fff" stroke="none"/></svg>` +
          `<span class="mh-pin-tooltip">${mhEsc(label)}</span>`;

        btn.addEventListener('click', () => {
          // Deactivate all pins
          frame.querySelectorAll('.mh-pin').forEach((el) => el.classList.remove('is-active'));
          btn.classList.add('is-active');
          // Scroll to chat
          mhScrollBottom();
          const name = place ? `${place.name}, ${place.district}` : label;
          // Send to the shared AI
          send(
            `I just tapped the map pin on ${name}. Tell me about this place in your own voice — what it feels like, what I would see and do there, and the best time to come.`,
            { display: `Tell me about ${label} 📍` }
          );
        });

        frame.appendChild(btn);
      });
    }

    // ---- Chat message rendering ----

    function mhAddMessage(role, text) {
      const log = document.getElementById('mh-chat-log');
      if (!log) return;
      const row = document.createElement('div');
      row.className = `mh-msg from-${role}`;

      const avatarHtml = role === 'user'
        ? `<span class="mh-msg-avatar user-avi"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.4"/><path d="M5 20c.7-3.6 3.5-5.4 7-5.4s6.3 1.8 7 5.4"/></svg></span>`
        : `<span class="mh-msg-avatar"><img src="images/bot-avatar.png" alt="" /></span>`;

      row.innerHTML = `${avatarHtml}<div class="mh-bubble">${mhParagraphs(text)}</div>`;
      log.appendChild(row);
      mhScrollBottom();
      return row;
    }

    function mhAddTyping() {
      const log = document.getElementById('mh-chat-log');
      if (!log) return null;
      const row = document.createElement('div');
      row.className = 'mh-msg from-bot mh-is-typing';
      row.innerHTML =
        `<span class="mh-msg-avatar"><img src="images/bot-avatar.png" alt="" /></span>` +
        `<div class="mh-bubble"><span class="mh-typing"><i></i><i></i><i></i></span></div>`;
      log.appendChild(row);
      mhScrollBottom();
      return row;
    }

    // ---- Place cards carousel ----

    function mhRenderCards(places) {
      const row = document.getElementById('mh-cards-row');
      if (!row) return;
      if (!places || !places.length) { row.hidden = true; row.innerHTML = ''; return; }

      row.innerHTML = places
        .map((id) => byId.get(id))
        .filter(Boolean)
        .map((p) => `
          <button class="mh-place-card" type="button" data-id="${p.id}" aria-label="${mhEsc(p.name)}, ${mhEsc(p.district)}">
            <img src="${mhEsc(p.image)}" alt="${mhEsc(p.name)}" loading="lazy" />
            <div class="mh-card-grad"></div>
            <div class="mh-card-top">
              <span class="mh-card-badge">
                <span class="mh-card-badge-icon">★</span>
                ${mhEsc(p.tag)}
              </span>
              <span class="mh-card-rating">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3.2 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.7l6.1-.9z"/></svg>
                ${p.rating}
              </span>
            </div>
            <div class="mh-card-bottom">
              <h3 class="mh-card-name">${mhEsc(p.name)}</h3>
              <p class="mh-card-blurb">${mhEsc(p.blurb)}</p>
              <div class="mh-card-actions">
                <button class="mh-card-explore" type="button" data-explore="${p.id}">
                  Explore
                </button>
                <button class="mh-card-arrow" type="button" data-explore="${p.id}" aria-label="Open ${mhEsc(p.name)}">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                </button>
              </div>
            </div>
          </button>`)
        .join('');

      row.hidden = false;
      mhScrollBottom();
    }

    // ---- Intercept send() to mirror messages to mobile UI ----

    const _origSend = send;

    async function mobileSend(text, opts) {
      if (!text.trim()) return;
      const displayText = (opts && opts.display) ? opts.display : text;
      mhAddMessage('user', displayText);

      const typing = mhAddTyping();
      try {
        // Reuse the original desktop send() logic but also mirror output here
        // We hook into the shared history + askGemini flow
        if (busy) return;
        history.push({ role: 'user', text });
        saveChatHistory();
        document.querySelector('.chips')?.remove();
        busy = true;
        const { reply, places } = await askGemini(history.slice(-30));
        if (typing) typing.remove();
        mhAddMessage('bot', reply);
        history.push({ role: 'model', text: reply });
        saveChatHistory();
        mhRenderCards(places);
        // Also update desktop chat log in background
        addMessage('bot', reply);
        renderSuggestions(places);
      } catch (err) {
        if (typing) typing.remove();
        const errRow = mhAddMessage('bot', `Ish, my line dropped (；一_一)\n\n${err.message}\n\nTry again in a moment?`);
        if (errRow) errRow.classList.add('is-error');
        console.error('[BanglaPath Mobile]', err);
      } finally {
        busy = false;
        const sendBtn = document.querySelector('.mh-send-btn');
        if (sendBtn) sendBtn.disabled = false;
      }
    }

    // ---- Input bar ----

    const form = document.getElementById('mh-chat-form');
    const input = document.getElementById('mh-chat-input');
    const sendBtn = mhEl.querySelector('.mh-send-btn');

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text || busy) return;
        input.value = '';
        mobileSend(text);
      });
    }

    // ---- Mic button ----

    const micBtn = document.getElementById('mh-mic-btn');
    let mhRecog = null;
    if (micBtn) {
      micBtn.addEventListener('click', () => {
        const Recog = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!Recog) { if (input) input.placeholder = 'Voice not supported'; return; }
        if (mhRecog) {
          try { mhRecog.abort(); } catch(e) {}
          mhRecog = null;
          micBtn.classList.remove('is-recording');
          return;
        }
        const rec = new Recog();
        mhRecog = rec;
        rec.lang = 'en-US';
        rec.interimResults = true;
        micBtn.classList.add('is-recording');
        rec.onresult = (e) => {
          let t = '';
          for (let i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript;
          if (t && input) input.value = t;
        };
        rec.onend = () => { mhRecog = null; micBtn.classList.remove('is-recording'); };
        rec.onerror = () => { mhRecog = null; micBtn.classList.remove('is-recording'); };
        rec.start();
      });
    }

    // ---- Bottom nav ----

    document.querySelectorAll('.mh-nav-item[data-mh-view]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.mhView;
        if (!view) return;
        setView(view);
      });
    });

    // Wire desktop nav back button / home button to restore mobile home
    document.querySelectorAll('.rail-item[data-view="home"]').forEach((item) => {
      item.addEventListener('click', () => {
        if (window.innerWidth > 768) return; // desktop handles its own
        const appEl = document.getElementById('app');
        if (appEl) appEl.style.removeProperty('display');
        mhEl.style.removeProperty('display');
        document.querySelectorAll('.mh-nav-item').forEach((b) =>
          b.classList.toggle('is-active', b.dataset.mhView === 'home')
        );
        setView('home');
      });
    });

    // Sync mobile bottom nav active state on browser Back / Forward buttons
    window.addEventListener('popstate', () => {
      if (window.innerWidth > 768) return;
      const currentView = activeView || 'home';
      document.querySelectorAll('.mh-nav-item').forEach((b) => {
        b.classList.toggle('is-active', b.dataset.mhView === currentView);
      });
    });

    // ---- Notification button ----

    const notifBtn = document.getElementById('mh-btn-notif');
    if (notifBtn) {
      notifBtn.addEventListener('click', () => {
        // Reuse desktop toast
        showToast('🔔 2 updates: New seasonal boat routes in Ratargul & winter beach packages in Cox\'s Bazar!');
      });
    }

    // ---- Profile button ----

    const profileBtn = document.getElementById('mh-btn-profile');
    if (profileBtn) {
      profileBtn.addEventListener('click', () => {
        document.querySelectorAll('.mh-nav-item').forEach((b) =>
          b.classList.toggle('is-active', b.dataset.mhView === 'profile')
        );
        document.querySelectorAll('.rail-item').forEach((i) =>
          i.classList.toggle('is-active', i.dataset.view === 'profile')
        );
        setView('profile');
        const appEl = document.getElementById('app');
        if (appEl) { appEl.style.setProperty('display', 'flex', 'important'); appEl.hidden = false; }
      });
    }

    // ---- Explore-card clicks ----

    document.getElementById('mh-cards-row')?.addEventListener('click', (e) => {
      const card = e.target.closest('.mh-place-card') || e.target.closest('[data-id]') || e.target.closest('[data-explore]');
      if (card) {
        const id = card.dataset.explore || card.dataset.id;
        if (id) openPlace(id);
      }
    });

    // ---- Initial greeting ----

    // Show opening greeting messages in mobile chat
    setTimeout(() => {
      mhAddMessage(
        'bot',
        "Assalamu alaikum, and welcome (◕‿◕) I am Bangladesh — all 64 districts of me, right here.\n\nTap any red pin on my map and I'll tell you what that place feels like. Or just ask me anything, bhai."
      );
      // Show opening suggestion cards
      mhRenderCards(catalog.openingSuggestions);
    }, 400);

    // ---- Render pins ----

    renderMobilePins();
  }

  return { enterHome, send, openPlace };
})();

window.BanglaPath = BanglaPath;

