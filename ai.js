// =============================================
//  BioLens — AI Client (frontend)
//
//  Talks to the local relay server (server/app.py).
//  NEVER contains an API key — the key lives only on the server.
//
//  Public API (window.ai):
//    ai.isAvailable()            → Promise<boolean>
//    ai.generateNotes(text, lang)→ Promise<notesObject>
//    ai.generateQuiz(opts)       → Promise<quizObject>
//    ai.ask(question, context, lang) → Promise<answerObject>
//
//  All methods throw an Error with a friendly .message on failure,
//  so callers can show a clean message and fall back to rule-based mode.
// =============================================

const AI_BASE = 'http://localhost:5001';

/** Quick health check. Resolves true only if the server is up AND a key is set. */
async function isAvailable() {
  try {
    const res = await fetch(`${AI_BASE}/api/health`, { method: 'GET' });
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data.ok && data.key_configured);
  } catch (_) {
    return false;  // server not running
  }
}

async function _post(path, body) {
  let res;
  try {
    res = await fetch(`${AI_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (_) {
    throw new Error(
      'Could not reach the AI server. Make sure it is running (see server/README). ' +
      'The app still works in rule-based mode.'
    );
  }

  let data = null;
  try { data = await res.json(); } catch (_) { data = null; }

  if (!res.ok) {
    const msg = (data && data.message) || `AI request failed (HTTP ${res.status}).`;
    const err = new Error(msg);
    err.code = (data && data.error) || 'http_error';
    throw err;
  }
  return data;
}

async function generateNotes(lectureText, language = 'en') {
  const data = await _post('/api/notes', { lectureText, language });
  return data.notes;
}

async function generateQuiz({ lectureText, count = 3, difficulty = 'medium', language = 'en' }) {
  const data = await _post('/api/quiz', { lectureText, count, difficulty, language });
  return data.quiz;
}

async function ask(question, context, language = 'en') {
  const data = await _post('/api/ask', { question, context, language });
  return data.response;
}

async function generateVisualization(lectureText, language = 'en') {
  const data = await _post('/api/visualize', { lectureText, language });
  return data.visualization;
}

window.ai = { isAvailable, generateNotes, generateQuiz, ask, generateVisualization, AI_BASE };
