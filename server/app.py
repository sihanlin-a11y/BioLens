"""
BioLens — Secure AI Relay Server
=================================

A tiny Flask server that sits between the BioLens browser app and
Google Gemini. Its ONLY job is to keep your API key secret and relay
requests.

WHY THIS EXISTS:
  - API keys must NEVER appear in frontend JavaScript (anyone can read it).
  - This server reads the key from an environment variable (.env file),
    which stays on your Mac and is never committed to git.

WHAT IT DOES:
  - POST /api/notes  → turns lecture text into structured study notes
  - POST /api/quiz   → turns lecture text into MCQ questions + explanations
  - POST /api/ask    → answers a question grounded in the lecture text
  - GET  /api/health → quick check that the server + key are working

RUN IT:
  cd server
  python3 -m venv venv
  source venv/bin/activate
  pip install -r requirements.txt
  cp .env.example .env         # then paste your key into .env
  python app.py

The server runs at http://localhost:5001
"""

import os
import json
import re
import time
import random
from flask import Flask, request, jsonify
from flask_cors import CORS

# google-genai is the current official Gemini SDK (supports both AIza and AQ keys)
from google import genai

# ─── Load the API key from .env (never hard-coded) ──────────────────
from dotenv import load_dotenv
# override=True ensures the .env file wins over any stale shell variable
# (e.g. a GEMINI_API_KEY exported earlier in your terminal session).
load_dotenv(override=True)

API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
MODEL_NAME = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash").strip()


def _validate_key_format(key):
    """
    Checks the key's SHAPE only. Never logs or returns the key value.
    Returns (is_valid, reason).

    Google AI Studio issues two key formats:
      - Legacy "Standard" keys: start with 'AIza', ~39 chars (being retired)
      - New "Auth" keys:        start with 'AQ.',  longer (default since 2026)
    Both are accepted here. The new google-genai SDK handles both.
    """
    if not key:
        return False, "missing"
    # Must be pure ASCII (catches smart-quotes, CJK punctuation, BOM, etc.)
    try:
        key.encode("ascii")
    except UnicodeEncodeError:
        return False, "contains non-ASCII characters (likely a copy-paste artifact)"
    if any(ch.isspace() for ch in key):
        return False, "contains whitespace"

    is_legacy = key.startswith("AIza")
    is_auth   = key.startswith("AQ.") or key.startswith("AQ")
    if not (is_legacy or is_auth):
        return False, "does not start with a recognized prefix ('AIza' or 'AQ')"

    # Sanity bound on length — both formats fall comfortably inside this range.
    if not (30 <= len(key) <= 120):
        return False, f"unexpected length ({len(key)} chars)"

    return True, "ok"


_KEY_VALID, _KEY_REASON = _validate_key_format(API_KEY)

app = Flask(__name__)
# Allow the browser (opened from file:// or localhost) to call this server
CORS(app)

# Configure Gemini only if a key is present AND well-formed.
# The new SDK uses a Client object instead of the old configure()/GenerativeModel().
_client = None
if API_KEY and _KEY_VALID:
    _client = genai.Client(api_key=API_KEY)
elif API_KEY and not _KEY_VALID:
    # Loud, safe startup warning — reason only, never the value.
    print("=" * 60)
    print("  WARNING: GEMINI_API_KEY is present but looks malformed.")
    print(f"  Reason: {_KEY_REASON}")
    print("  Re-copy the key from https://aistudio.google.com/app/apikey")
    print("  It should start with 'AIza' or 'AQ'.")
    print("=" * 60)


# ─── Model discovery + fallback selection ───────────────────────────
# At startup we ask the API which models this key can use for
# generateContent, then build an ordered list:
#   1. The user's configured model (if it supports generateContent)
#   2. A short list of known-good fallbacks, kept ONLY if the API
#      confirms they are actually available to this key.
# We never assume a fallback exists — it must appear in the live list.

# Preference order for fallbacks (fast, free-tier-friendly first).
_FALLBACK_PREFERENCE = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-001",
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro",
]

# The resolved, ordered list of models we will actually try (primary first).
_MODEL_CHAIN = [MODEL_NAME]
# Cache of available model names (short names, no "models/" prefix).
_AVAILABLE_MODELS = []


def _normalize_model_name(name):
    """Strip the 'models/' prefix the API returns, for easy comparison."""
    return name.split("/", 1)[1] if name.startswith("models/") else name


def discover_models():
    """
    Query the models this key can use and build _MODEL_CHAIN.
    Safe to call at startup; failures are swallowed so the server
    still boots (we fall back to just the configured model).
    Never logs the key.
    """
    global _MODEL_CHAIN, _AVAILABLE_MODELS
    if _client is None:
        return

    try:
        available = []
        for m in _client.models.list():
            # Only keep models that support generateContent.
            actions = getattr(m, "supported_actions", None) or \
                      getattr(m, "supported_generation_methods", None) or []
            name = _normalize_model_name(getattr(m, "name", ""))
            if not name:
                continue
            if not actions or "generateContent" in actions:
                available.append(name)

        _AVAILABLE_MODELS = available

        chain = []
        # 1. User's configured model first, but only if actually available.
        if MODEL_NAME in available or not available:
            chain.append(MODEL_NAME)
        # 2. Add confirmed fallbacks, in preference order, skipping dupes.
        for cand in _FALLBACK_PREFERENCE:
            if cand in available and cand not in chain:
                chain.append(cand)
        # 3. If the configured model wasn't available, make sure the chain
        #    still has something: fall back to the first available model.
        if not chain and available:
            chain = available[:3]

        _MODEL_CHAIN = chain or [MODEL_NAME]
        print(f"Model chain resolved: {_MODEL_CHAIN}")

    except Exception as e:  # noqa: BLE001 — never crash startup on discovery
        # Keep the single configured model; log reason only (no key).
        print(f"Model discovery skipped ({str(e)[:120]}). Using: {MODEL_NAME}")
        _MODEL_CHAIN = [MODEL_NAME]


if _client is not None:
    discover_models()


# ─── Error classification ───────────────────────────────────────────
# A 429 has TWO very different meanings that must be handled differently:
#   - per-minute RATE LIMIT  → temporary; a short backoff fixes it.
#   - daily QUOTA EXHAUSTED   → not temporary; retrying is pointless today.
# A 503 means the model is overloaded (temporary; retry helps).

# Markers for transient server-side conditions worth retrying.
_RETRYABLE_MARKERS = ("503", "unavailable", "overloaded", "500", "internal",
                      "deadline", "timeout", "temporarily")

# Phrases Google uses when the DAILY quota (not the per-minute rate) is gone.
_DAILY_QUOTA_MARKERS = (
    "perday", "per day", "quota_exceeded", "quotaexceeded",
    "daily limit", "exceeded your current quota", "free_tier",
    "generativelanguage.googleapis.com/generate_content_free_tier",
)


def _extract_status_code(err):
    """Best-effort HTTP status code from a google-genai exception. No key exposure."""
    for attr in ("code", "status_code", "http_status"):
        v = getattr(err, attr, None)
        if isinstance(v, int):
            return v
    # Some SDK errors carry a .response with a status code.
    resp = getattr(err, "response", None)
    if resp is not None:
        v = getattr(resp, "status_code", None)
        if isinstance(v, int):
            return v
    # Fall back to scanning the message for a leading HTTP code.
    m = re.search(r"\b(4\d\d|5\d\d)\b", str(err))
    return int(m.group(1)) if m else None


def _extract_retry_after_seconds(err):
    """
    Look for a server-provided retry delay (RetryInfo.retryDelay like '37s',
    or a Retry-After header). Returns float seconds or None.
    """
    text = str(err)
    # RetryInfo style: "retryDelay": "37s"  or  retry_delay { seconds: 37 }
    m = re.search(r'retry[_-]?delay["\':\s]+["\']?(\d+(?:\.\d+)?)\s*s', text, re.IGNORECASE)
    if m:
        return float(m.group(1))
    m = re.search(r'retry_delay\s*\{\s*seconds:\s*(\d+)', text, re.IGNORECASE)
    if m:
        return float(m.group(1))
    # Retry-After header (seconds)
    resp = getattr(err, "response", None)
    if resp is not None:
        headers = getattr(resp, "headers", None)
        if headers:
            try:
                ra = headers.get("Retry-After") or headers.get("retry-after")
                if ra and str(ra).strip().isdigit():
                    return float(str(ra).strip())
            except Exception:  # noqa: BLE001
                pass
    return None


def _classify_error(err):
    """
    Returns a dict describing how to handle an exception:
      {
        "kind": "rate_limit" | "daily_quota" | "overloaded" | "auth" | "other",
        "retryable": bool,
        "retry_after": float | None,
        "status": int | None,
        "raw": str,          # truncated, safe (no key)
      }
    Logs the real code + message to the server console for debugging.
    """
    msg = str(err)
    low = msg.lower()
    status = _extract_status_code(err)
    retry_after = _extract_retry_after_seconds(err)

    # Server-side log (console only; never sent to the browser, never the key).
    print(f"[Gemini error] status={status} retry_after={retry_after} :: {msg[:300]}")

    # Auth problems — not retryable.
    if "access_token_type_unsupported" in low or "unauthenticated" in low or status == 401:
        return {"kind": "auth", "retryable": False, "retry_after": None, "status": 401, "raw": msg[:300]}

    # Access denied / project blocked (403) — not retryable, not the key's format.
    if status == 403 or "permission_denied" in low or "permission denied" in low \
            or "has been denied access" in low or "consumer" in low and "denied" in low:
        return {"kind": "permission_denied", "retryable": False, "retry_after": None,
                "status": 403, "raw": msg[:300]}

    # 429 family — split rate-limit vs daily quota.
    is_429 = (status == 429) or ("429" in msg) or ("resource_exhausted" in low) \
             or ("rate limit" in low) or ("quota" in low)
    if is_429:
        is_daily = any(marker in low for marker in _DAILY_QUOTA_MARKERS)
        if is_daily:
            return {"kind": "daily_quota", "retryable": False, "retry_after": retry_after,
                    "status": 429, "raw": msg[:300]}
        # Otherwise treat as a temporary per-minute rate limit (retryable).
        return {"kind": "rate_limit", "retryable": True, "retry_after": retry_after,
                "status": 429, "raw": msg[:300]}

    # 5xx / transient overload — retryable.
    if (status in (500, 503)) or any(m in low for m in _RETRYABLE_MARKERS):
        return {"kind": "overloaded", "retryable": True, "retry_after": retry_after,
                "status": status or 503, "raw": msg[:300]}

    return {"kind": "other", "retryable": False, "retry_after": None,
            "status": status, "raw": msg[:300]}


# Cap any server-provided retry delay so the browser never hangs too long.
_MAX_RETRY_WAIT = 8.0  # seconds


def _generate_with_resilience(prompt, max_retries_per_model=3):
    """
    Try each model in _MODEL_CHAIN. Retry only TEMPORARY errors
    (per-minute rate limit, 503 overload, 500, timeout) with exponential
    backoff + jitter, honoring a server-provided Retry-After when present.

    Daily-quota and auth errors stop immediately (retrying is pointless).

    Returns (text, error_dict). Exactly one is None.
    error_dict (when set): {"error", "message", "status"}.
    Never raises; never exposes the key.
    """
    if _client is None:
        return None, {"error": "no_api_key", "message": "No usable API key.", "status": 503}

    last_err_kind = "model_error"
    last_err_msg = "The AI request failed."

    for model_name in _MODEL_CHAIN:
        for attempt in range(max_retries_per_model):
            try:
                resp = _client.models.generate_content(
                    model=model_name, contents=prompt
                )
                text = resp.text or ""
                if text.strip():
                    return text, None
                raise RuntimeError("empty_response")

            except Exception as e:  # noqa: BLE001
                # Empty-response is a local retryable signal, not a real API error.
                if str(e) == "empty_response":
                    last_err_kind = "overloaded"
                    last_err_msg = "The model returned an empty response."
                    if attempt < max_retries_per_model - 1:
                        time.sleep((2 ** attempt) * 0.5 + random.uniform(0, 0.4))
                        continue
                    break

                info = _classify_error(e)

                # Auth — stop immediately.
                if info["kind"] == "auth":
                    return None, {
                        "error": "auth_unsupported",
                        "message": (
                            "Gemini rejected the key as an unsupported token type. "
                            "Ensure the google-genai SDK is installed and the "
                            "Generative Language API is enabled."
                        ),
                        "status": 401,
                    }

                # Access denied / project blocked (403) — stop; steer to Demo Mode.
                if info["kind"] == "permission_denied":
                    return None, {
                        "error": "permission_denied",
                        "message": (
                            "Live AI is currently unavailable for this project "
                            "(access denied by the provider). You can continue the "
                            "demo using saved example results — switch to Demo Mode."
                        ),
                        "status": 403,
                    }

                # Daily quota exhausted — DO NOT retry (req #3).
                if info["kind"] == "daily_quota":
                    return None, {
                        "error": "daily_quota_exhausted",
                        "message": (
                            "You have used up today's free Gemini quota. "
                            "This resets about once every 24 hours — try again later. "
                            "No changes to your key or billing are needed."
                        ),
                        "status": 429,
                    }

                # Temporary rate limit or overload — retry with backoff.
                if info["retryable"]:
                    last_err_kind = "rate_limit" if info["kind"] == "rate_limit" else "overloaded"
                    last_err_msg = info["raw"]
                    if attempt < max_retries_per_model - 1:
                        # Honor server Retry-After if given, else exponential backoff.
                        if info["retry_after"] is not None:
                            delay = min(info["retry_after"], _MAX_RETRY_WAIT)
                        else:
                            delay = (2 ** attempt) * 0.5 + random.uniform(0, 0.4)
                        time.sleep(delay)
                        continue
                    break  # out of retries → try next model

                # Unknown/other — record and try the next model.
                last_err_kind = "other"
                last_err_msg = info["raw"]
                break

    # All models + retries exhausted.
    if last_err_kind == "rate_limit":
        return None, {
            "error": "rate_limited",
            "message": (
                "Gemini is temporarily busy (per-minute rate limit). "
                "We retried automatically — please wait a few seconds and try again. "
                "Your daily quota is NOT used up."
            ),
            "status": 429,
        }
    if last_err_kind == "overloaded":
        return None, {
            "error": "overloaded",
            "message": (
                "The AI service is busy right now (high demand). "
                "We retried automatically and tried backup models. "
                "Please wait a few seconds and try again."
            ),
            "status": 503,
        }
    return None, {
        "error": "model_error",
        "message": f"The AI request failed after retries: {last_err_msg[:200]}",
        "status": 502,
    }


# ─── Helpers ────────────────────────────────────────────────────────

def _key_missing_response():
    """Standard error when no usable API key is configured. Never exposes the key."""
    if API_KEY and not _KEY_VALID:
        return jsonify({
            "error": "malformed_api_key",
            "message": (
                f"GEMINI_API_KEY is present but malformed: {_KEY_REASON}. "
                "Re-copy it from https://aistudio.google.com/app/apikey — "
                "it should be ~39 ASCII characters starting with 'AIza'."
            ),
        }), 503
    return jsonify({
        "error": "no_api_key",
        "message": (
            "No GEMINI_API_KEY found. Copy server/.env.example to server/.env "
            "and paste your free key from https://aistudio.google.com/app/apikey"
        ),
    }), 503


def _extract_json(raw_text):
    """
    Gemini sometimes wraps JSON in ```json ... ``` fences or adds prose.
    This pulls out the first valid JSON object/array it can find.
    """
    # Strip code fences
    cleaned = re.sub(r"^```(?:json)?\s*", "", raw_text.strip())
    cleaned = re.sub(r"\s*```$", "", cleaned)

    # Try direct parse first
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Fall back: find the first {...} or [...] block
    match = re.search(r"(\{.*\}|\[.*\])", cleaned, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass
    return None


def _call_gemini(prompt):
    """
    Calls Gemini (with retries + model fallback) and returns
    (parsed_json, error_response). Exactly one of the two is None.
    The error_response is a ready-to-return (jsonify, status) tuple.
    """
    if _client is None:
        return None, _key_missing_response()

    text, err = _generate_with_resilience(prompt)
    if err is not None:
        # Convert the plain error dict into a Flask response with a friendly message.
        return None, (jsonify({
            "error": err["error"],
            "message": err["message"],
        }), err["status"])

    parsed = _extract_json(text)
    if parsed is None:
        return None, (jsonify({
            "error": "bad_model_output",
            "message": "The AI responded, but its answer could not be read as valid data. Please try again.",
            "raw": text[:500],
        }), 502)
    return parsed, None


def _trim(text, max_chars=14000):
    """Send only what we need to the model (cost + privacy)."""
    if not text:
        return ""
    return text[:max_chars]


# ─── Routes ─────────────────────────────────────────────────────────

@app.route("/api/health", methods=["GET"])
def health():
    # key_configured stays true only when the key is present AND well-formed,
    # so the frontend "AI" badge won't turn on with a broken key.
    result = {
        "ok": True,
        "key_present": bool(API_KEY),
        "key_valid_format": bool(_KEY_VALID),
        "key_format_issue": None if _KEY_VALID else _KEY_REASON,
        "key_configured": bool(API_KEY and _KEY_VALID),
        "model": MODEL_NAME,
        "model_chain": _MODEL_CHAIN,
        "available_models": _AVAILABLE_MODELS,
    }

    # Add ?test=1 to make one real call (with retries + fallback) and report
    # the outcome. Confirms an actual AI response succeeds end-to-end.
    if request.args.get("test") == "1":
        if _client is None:
            result["live_test"] = "skipped — no usable key configured"
        else:
            text, err = _generate_with_resilience("Reply with the single word: ok")
            if err is None:
                result["live_test"] = "success"
            else:
                result["live_test"] = "failed"
                result["live_test_error"] = err["error"]
                result["live_test_message"] = err["message"]

    return jsonify(result)


@app.route("/api/notes", methods=["POST"])
def notes():
    """
    Body: { "lectureText": "...", "language": "en" }
    Returns structured study notes grounded in the lecture text.
    """
    data = request.get_json(silent=True) or {}
    lecture_text = _trim(data.get("lectureText", ""))
    language = data.get("language", "en")

    if len(lecture_text) < 50:
        return jsonify({
            "error": "insufficient_text",
            "message": "Not enough lecture text to generate notes.",
        }), 400

    prompt = f"""You are a precise biology study assistant. Based ONLY on the lecture text below, produce structured study notes.

STRICT RULES:
- Use ONLY information present in the lecture text. Do NOT add outside facts.
- If something is unclear or missing, say so in the "uncertainty" field rather than inventing.
- Preserve important scientific terms in their original English form.
- Write explanations in this language code: {language} (but keep scientific term names in English).

Return ONLY valid JSON in exactly this shape:
{{
  "title": "short topic title",
  "topics": [
    {{
      "heading": "topic name",
      "keyPoints": ["concise point", "..."],
      "terms": [{{"term": "Name", "definition": "short definition from the text"}}],
      "groundedInText": true
    }}
  ],
  "takeaways": ["exam-relevant point", "..."],
  "uncertainty": "note any gaps, ambiguous content, or things not covered in the text (or empty string)"
}}

LECTURE TEXT:
\"\"\"
{lecture_text}
\"\"\""""

    parsed, err = _call_gemini(prompt)
    if err:
        return err
    return jsonify({"ok": True, "notes": parsed})


@app.route("/api/quiz", methods=["POST"])
def quiz():
    """
    Body: { "lectureText": "...", "count": 3, "difficulty": "medium", "language": "en" }
    Returns MCQs with explanations for correct AND incorrect options.
    """
    data = request.get_json(silent=True) or {}
    lecture_text = _trim(data.get("lectureText", ""))
    count = max(1, min(int(data.get("count", 3)), 8))
    difficulty = data.get("difficulty", "medium")
    language = data.get("language", "en")

    if len(lecture_text) < 50:
        return jsonify({
            "error": "insufficient_text",
            "message": "Not enough lecture text to generate questions.",
        }), 400

    prompt = f"""You are a biology exam question writer. Based ONLY on the lecture text below, write {count} multiple-choice questions at {difficulty} difficulty.

STRICT RULES:
- Every question MUST be answerable from the lecture text alone.
- Exactly ONE correct option per question. Four options total (A-D).
- Distractors must be plausible but clearly wrong based on the text.
- If you cannot write {count} solid questions from the text, return FEWER. Never invent content to hit the count.
- Explanations must say WHY the correct answer is right and WHY each wrong option is wrong.
- Write in language code: {language} (keep scientific terms in English).

Return ONLY valid JSON in exactly this shape:
{{
  "questions": [
    {{
      "question": "full question sentence",
      "concept": "the short concept/topic this question tests (2-4 words, e.g. 'Allopatric speciation')",
      "options": {{"A": "...", "B": "...", "C": "...", "D": "..."}},
      "correct": "A",
      "explanation": "why the correct answer is right",
      "whyWrong": {{"B": "why B is wrong", "C": "...", "D": "..."}},
      "sourceHint": "short quote or paraphrase from the text supporting the answer"
    }}
  ],
  "note": "any caveat about coverage or empty string"
}}

LECTURE TEXT:
\"\"\"
{lecture_text}
\"\"\""""

    parsed, err = _call_gemini(prompt)
    if err:
        return err
    return jsonify({"ok": True, "quiz": parsed})


@app.route("/api/ask", methods=["POST"])
def ask():
    """
    Body: { "question": "...", "context": "...", "language": "en" }
    Answers a question grounded in the provided context (selected text / notes).
    """
    data = request.get_json(silent=True) or {}
    question = (data.get("question") or "").strip()
    context = _trim(data.get("context", ""), 8000)
    language = data.get("language", "en")

    if not question:
        return jsonify({"error": "no_question", "message": "No question provided."}), 400

    prompt = f"""You are a biology tutor. Answer the student's question using ONLY the lecture context provided.

STRICT RULES:
- If the answer is in the context, answer clearly and cite the relevant part.
- If the context does NOT contain the answer, say so honestly and give only general, clearly-labeled background.
- Never invent citations or page numbers.
- Answer in language code: {language} (keep scientific terms in English).

Return ONLY valid JSON:
{{
  "answer": "your answer",
  "groundedInContext": true,
  "caveat": "note if the answer relied on general knowledge not in the context (or empty string)"
}}

LECTURE CONTEXT:
\"\"\"
{context}
\"\"\"

STUDENT QUESTION: {question}"""

    parsed, err = _call_gemini(prompt)
    if err:
        return err
    return jsonify({"ok": True, "response": parsed})


@app.route("/api/visualize", methods=["POST"])
def visualize():
    """
    Body: { "lectureText": "...", "language": "en" }
    Returns STRUCTURED visualization data only — never code or HTML.
    The frontend renders it with trusted, fixed components.

    Supported "type" values (the frontend knows how to draw each):
      - "phylo_tree"   : phylogenetic tree (nodes, clades, outgroup)
      - "process_flow" : ordered step-by-step process / flowchart
      - "comparison"   : two-column comparison of concepts
      - "labeled_diagram": a concept with labeled parts
      - "none"         : not enough info to visualize (honest fallback)
    """
    data = request.get_json(silent=True) or {}
    lecture_text = _trim(data.get("lectureText", ""))
    language = data.get("language", "en")

    if len(lecture_text) < 50:
        return jsonify({
            "error": "insufficient_text",
            "message": "Not enough lecture text to build a visualization.",
        }), 400

    prompt = f"""You are a biology visualization designer. Analyze the lecture text and produce STRUCTURED DATA (never code, never HTML) describing ONE visualization that best represents a key concept in the text.

Choose the single most appropriate "type":
- "phylo_tree": use ONLY if the text is about phylogenetics, evolutionary trees, clades, common ancestors, sister taxa, or outgroups.
- "process_flow": for a sequence of steps or a mechanism (e.g. speciation process, a pathway).
- "comparison": for two contrasting concepts (e.g. allopatric vs sympatric speciation).
- "labeled_diagram": for one structure/concept with labeled parts.
- "none": if the text does NOT contain enough concrete information to build an accurate visualization. Do NOT invent relationships.

STRICT RULES:
- Use ONLY information in the lecture text. Never invent taxa, steps, or relationships.
- If the text is insufficient or ambiguous, return type "none" with an honest reason.
- Include a short "explanation" and, when the text supports it, a "sourcePage" (integer) or null.
- Keep scientific terms in English. Write explanation in language code: {language}.
- Output ONLY valid JSON. No prose outside the JSON.

INTERACTIVITY RULE:
- Every node, step, row, and part MUST include its own short "explanation"
  (1-2 sentences, grounded in the text) so the student can click it to learn more.
- Each element MAY include its own "page" (integer) when the text supports it, else null.
- Never invent an explanation or page number. If you don't know, use "" or null.

JSON shapes by type:

phylo_tree (for evolutionary relationships — represent TRUE common ancestry:
every internal node is the most recent common ancestor of all taxa below it;
taxa that share a more recent internal node are more closely related):
{{
  "type": "phylo_tree",
  "title": "...",
  "explanation": "...",
  "sourcePage": 3 or null,
  "outgroup": "taxon name or null",
  "tree": {{
    "name": "root / common ancestor label",
    "explanation": "what this ancestor represents, from the text",
    "page": 3 or null,
    "children": [
      {{ "name": "clade or taxon", "explanation": "...", "page": null,
         "children": [ {{ "name": "taxon", "explanation": "...", "page": null }} ] }}
    ]
  }},
  "notes": ["optional fact grounded in text", "..."]
}}

process_flow (for a sequence/mechanism such as speciation):
{{
  "type": "process_flow",
  "title": "...",
  "explanation": "...",
  "sourcePage": 2 or null,
  "steps": [ {{ "label": "step name", "detail": "one sentence overview",
               "explanation": "deeper 1-2 sentence explanation for click", "page": 2 or null }} ]
}}

comparison:
{{
  "type": "comparison",
  "title": "...",
  "explanation": "...",
  "sourcePage": 5 or null,
  "leftTitle": "...",
  "rightTitle": "...",
  "rows": [ {{ "aspect": "...", "left": "...", "right": "...",
              "explanation": "1-2 sentence note about this aspect for click", "page": null }} ]
}}

labeled_diagram:
{{
  "type": "labeled_diagram",
  "title": "...",
  "explanation": "...",
  "sourcePage": 1 or null,
  "centerLabel": "the concept",
  "parts": [ {{ "label": "part name", "description": "short label text",
               "explanation": "1-2 sentence explanation for click", "page": null }} ]
}}

none:
{{
  "type": "none",
  "title": "No visualization available",
  "explanation": "honest reason why the text can't be visualized reliably",
  "sourcePage": null
}}

LECTURE TEXT:
\"\"\"
{lecture_text}
\"\"\""""

    parsed, err = _call_gemini(prompt)
    if err:
        return err
    return jsonify({"ok": True, "visualization": parsed})


@app.route("/api/models", methods=["GET"])
def models():
    """
    Lists the generateContent-capable models available to this key,
    and the resolved try-order (primary + confirmed fallbacks).
    Never exposes the key.
    """
    if _client is None:
        return _key_missing_response()
    return jsonify({
        "ok": True,
        "configured_model": MODEL_NAME,
        "model_chain": _MODEL_CHAIN,
        "available_models": _AVAILABLE_MODELS,
    })


if __name__ == "__main__":
    # Port 5001 to avoid clashing with macOS AirPlay on 5000
    print("BioLens AI relay running at http://localhost:5001")
    print(f"API key configured: {bool(API_KEY and _KEY_VALID)}")
    print(f"Model chain: {_MODEL_CHAIN}")
    app.run(host="127.0.0.1", port=5001, debug=True)
