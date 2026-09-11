---
name: testing-banglapath
description: How to run and end-to-end test the standalone BanglaPath app (intro cinematic, leaf auth handoff, home dashboard, map pins, Gemini chat) in a browser.
---

# Testing BanglaPath

## Run it
```bash
cd /home/ubuntu/banglapath
setsid nohup node server.js > /tmp/bp.log 2>&1 < /dev/null &
sleep 2 && curl -s -o /dev/null -w '%{http_code}\n' http://localhost:5173/   # expect 200
```
`lsof` may not be installed, so probe with `curl` rather than `lsof -i :5173`.
Plain backgrounded `npm start` can die with the shell — `setsid nohup` is reliable.
Server-side chat diagnostics (`[chat] <model> <status>: ...`) land in `/tmp/bp.log`.
No npm dependencies. Node 18+. `server.js` reads `GEMINI_API_KEY` from
`/home/ubuntu/banglapath/.env` (gitignored) and proxies `POST /api/chat`.
If `.env` is missing, every chat turn returns an error — never hardcode a key.

## Getting to the dashboard
The app opens on a scroll-driven intro cinematic (tiger video → eye zoom →
deer scene → auth card). You must scroll to the bottom of the track before the
auth card is reachable. Any of "Continue with Google", "Continue with Apple" or
the Create-account submit triggers a leaf-sweep transition into the home screen.
`scrollRestoration` is manual, so reloading always returns to the top tiger shot.

## Things that make browser testing awkward
- **Always measure chat panel layout, don't eyeball it.** A long conversation
  used to push the composer off-screen (content-sized grid row). Verify with:
  ```js
  const a=document.querySelector('aside[aria-label="BanglaPath AI"]');
  const b=a.querySelector('.chat-body'), f=a.querySelector('form');
  ({asideH:a.getBoundingClientRect().height, vh:innerHeight,
    composerVisible:f.getBoundingClientRect().bottom<=innerHeight,
    logScrolls:b.scrollHeight>b.clientHeight})
  ```
  Healthy state: `asideH === vh`, `composerVisible true`, `logScrolls true`
  (the log scrolls internally instead of the panel growing).
- **Gemini replies are intermittently slow or failing.** `server.js` retries
  across models with a ~60s overall deadline and a ~25s cap per attempt. Retry a
  query 2-3 times before concluding the UI is broken, and always report which
  variant you saw. Check `/tmp/bp.log` or curl `/api/chat` directly to see the
  real cause. The "You might also like" place cards are computed client-side and
  still render correctly even when the reply text fails.
- **Error copy that reaches the bubble.** `home.js` parses the proxy's JSON body
  on the error path and shows `detail.error`, falling back to the generic
  `Guide service replied ${status}` only when the body isn't JSON. So these are
  all *expected* bubbles, not defects:
  - `The Gemini key has run out of free quota for now — try again in a minute.` (429)
  - `That answer is taking longer than usual — ask me once more?` (upstream timeout)
  - `Gemini said: <upstream message>` (upstream 4xx, e.g. an invalid key)

  Seeing a bare `Guide service replied 502.` again would be a regression of this
  fix. Raw `{ "reply": ...` JSON or an empty `...` bubble are always defects.
- **Force a deterministic chat failure** (much better than waiting for a flaky
  timeout). `server.js` also serves the static app and reads `PORT` /
  `GEMINI_API_KEY` from the environment, and `.env` only fills *unset* vars, so a
  second full instance with a bad key needs no source or `.env` changes:
  ```bash
  cd /home/ubuntu/banglapath
  GEMINI_API_KEY=bogus-key-for-testing PORT=5174 setsid nohup node server.js \
    > /tmp/bp5174.log 2>&1 < /dev/null &
  ```
  Drive the UI on <http://localhost:5174> — `PROXY_URL` is relative, so the page
  talks to whichever origin served it, and every chat turn fails with
  `Gemini said: API key not valid. Please pass a valid API key.`
  To test **in-session recovery without reloading**, kill that PID and restart the
  same port with the real key; the loaded page keeps its history and the next turn
  succeeds. Note `pkill -f "GEMINI_API_KEY=bogus"` does **not** match (the key is
  in the environment, not argv) — find the PID and confirm which port it owns via:
  ```bash
  ps aux | grep "[n]ode server.js"
  tr '\0' '\n' < /proc/<PID>/environ | grep -E '^(PORT|GEMINI_API_KEY)='
  ```
- **Reproduce chat failures without the browser** (fast, avoids burning UI turns):
  ```bash
  curl -s -w '\nHTTP %{http_code}\n' -X POST http://localhost:5173/api/chat \
    -H 'Content-Type: application/json' \
    -d '{"turns":[{"role":"user","parts":[{"text":"Tell me about Dhaka"}]}],"systemPrompt":"You are Bangladesh. Reply in first person with a kaomoji."}'
  ```
  Run it 3+ times — failures are intermittent, not deterministic.
- **Resizing the window** for the responsive drawer test (`<=980px`) requires
  un-maximizing first:
  ```bash
  wmctrl -r :ACTIVE: -b remove,maximized_vert,maximized_horz
  xdotool getactivewindow windowsize 900 1100
  # restore afterwards:
  wmctrl -r :ACTIVE: -b add,maximized_vert,maximized_horz
  ```
  `xdotool windowsize` alone is a no-op on a maximized window.
- The narrow-width (`<=980px`) chat drawer closes three ways: the `#chat-close`
  X in the chat header, clicking `#chat-scrim` (the dimmed map area left of the
  drawer), and pressing Escape. It opens from the "AI Assistant" rail item and
  from any map pin. If a close path stops working, check that `closeChat()` is
  still wired to all three in `home.js`.

## Useful selectors
- Map pins: `button[aria-label^="Ask about"]`
- Chat reset: `button[aria-label="Start a new conversation"]`
- Composer: `aside[aria-label="BanglaPath AI"] input[aria-label="Message BanglaPath AI"]`
- Header search: `input[aria-label="Search a place"]`
- Drawer close (narrow widths): `#chat-close` / scrim `#chat-scrim`

## Devin Secrets Needed
None — the Gemini key is a local `.env` file, not a Devin secret.
