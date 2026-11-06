# Museo

This is a lightweight Deriv bot-builder starter for the `Museo` repository.

Features:
- two bot slots / bot library cards
- active bot workspace with drag-free block style layout
- demo vs real account mode switching
- Deriv WebSocket connect form using App ID + API token
- import bot and save bot actions
- clean dashboard styling inspired by DBot-like builders

Run it locally:

1. Open `index.html` directly in a browser, or
2. Serve the folder locally with a quick HTTP server:

```bash
python3 -m http.server 8000
```

Then visit:

```text
http://localhost:8000
```

Notes:
- This is a front-end prototype only.
- In a real production setup, keep tokens server-side and avoid exposing live account credentials in the browser.
- Use the official Deriv endpoint:

```text
wss://ws.derivws.com/websockets/v3?app_id=YOUR_APP_ID
```

and authorize with:

```json
{ "authorize": "YOUR_API_TOKEN" }
```

This starter is designed to be extended into a full app with:
- backend token storage
- bot JSON import/export
- trade execution logic
- live account switching
- strategy blocks and execution engine

