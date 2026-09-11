# BanglaPath

A cinematic entry into a Bangladesh travel explorer.

You scroll into a tiger's eye, come out the other side among deer, sign up, and a
wall of foliage sweeps across the screen. Behind the leaves is the home screen:
an illustrated map of Bangladesh with tappable pins, a recommended-places rail,
and a chat guide that answers as the country itself.

## Run it

```bash
cp .env.example .env       # add your Gemini API key
npm start                  # http://localhost:5173
```

`server.js` is dependency-free (Node 18+): it serves the static files and proxies
`POST /api/chat` to Gemini so the API key never reaches the browser.

Add `#home` to the URL to skip the intro and land straight on the home screen.

## How it fits together

| File | Role |
| --- | --- |
| `index.html` | Intro scenes, auth card and the home screen markup |
| `style.css` | The intro: tiger/deer layers, auth card, foliage sweep |
| `script.js` | Scroll-driven zoom, the leaf transition, and the handoff to the home screen |
| `home.css` / `home.js` | The home screen: map pins, place rail, chat |
| `places.json` | Every destination, its pin coordinates and the rail order |
| `server.js` | Static server + Gemini proxy |
| `config.js` | Browser config (proxy URL, model). Never holds the key. |

The intro hands over in one place — `launch()` in `script.js` calls
`BanglaPath.enterHome()` while the leaves cover the screen, so the swap is never
seen.

### The guide

The system prompt in `home.js` puts Gemini in first person as Bangladesh: warm,
a bit proud, one or two kaomojis per reply, honest about traffic and monsoon.
It answers in JSON — `{ reply, places }` — and any ids in `places` are rendered
as cards under "You might also like". Ids are validated against `places.json`,
so a hallucinated place simply shows no card.

Tapping a map pin sends the same conversation a framed question about that
place, so pins and free chat share one thread.

## Adding a place

Add an entry to `places` in `places.json`, drop a square photo in
`images/places/`, and add the pin coordinates (percentages of the map image) to
`pins`. The rail, the search, the pins and the model's card vocabulary all read
from that one file.

## Credits

Destination photos come from Wikimedia Commons; see
`images/places/CREDITS.json` for the file, author and licence of each.
