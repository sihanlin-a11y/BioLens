# BioLens AI Relay Server

This small server keeps your Gemini API key secret. The browser never sees it.

## One-time setup (about 5 minutes)

### 1. Get a free Gemini API key
- Go to https://aistudio.google.com/app/apikey
- Sign in with a Google account
- Click **Create API key** → copy it
- Free tier: 15 requests/minute, 1 million tokens/day, no credit card

### 2. Install and configure (in Terminal)

```bash
cd /Users/sihanlin/BioLearn/server
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

### 3. Paste your key
Open `server/.env` in any editor and replace `paste-your-key-here` with your real key.

## Run the server

```bash
cd /Users/sihanlin/BioLearn/server
source venv/bin/activate
python app.py
```

You should see:
```
BioLens AI relay running at http://localhost:5001
API key configured: True  |  Model: gemini-2.0-flash
```

> Note: Google AI Studio now issues keys starting with `AQ.` (the new "Auth key"
> format) instead of the older `AIza` format. Both work — this server uses the
> current `google-genai` SDK, which supports both.

Leave this Terminal window open while you use BioLens.

## Check it works
Open http://localhost:5001/api/health in your browser. You should see
`"key_configured": true` and `"key_valid_format": true`.

To test the actual Gemini connection, open:
http://localhost:5001/api/health?test=1
You should see `"live_test": "success"`.

### See which models your key supports
Open http://localhost:5001/api/models — it lists every generateContent-capable
model available to your key, plus the resolved try-order (primary + fallbacks).

### Reliability behaviour
- **503 / overloaded / timeout:** the server retries automatically with
  exponential backoff (about 0.5s, 1s, 2s) before giving up.
- **Model fallback:** if the primary model stays unavailable, the server
  automatically tries the next confirmed-available model in the chain.
- **Rate limit / quota (429):** not retried (waiting won't help instantly) —
  you'll get a clear "try again in a minute" message.
- All errors shown to you are friendly messages; raw API errors are never
  surfaced to the browser, and your key is never logged or returned.

## Security notes
- `.env` holds your key and is git-ignored — it will never be committed.
- The server only runs on your Mac (localhost). Nobody else can reach it.
- Only lecture text you choose to process is sent to Google Gemini.
- If the server is off, BioLens falls back to its built-in rule-based features.

## Cost
Gemini's free tier is enough for a hackathon. You will not be charged unless you
enable billing and exceed the free limits.
