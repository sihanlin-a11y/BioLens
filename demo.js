// =============================================
//  BioLens — Demo Mode (offline AI replay)
//
//  PURPOSE:
//  When the Gemini quota is exhausted (or you want a guaranteed-stable
//  demo), Demo Mode replays REAL saved AI results from demo-data.js
//  instead of calling the server. Zero API calls.
//
//  HOW IT WORKS (smallest safe change):
//  - It wraps window.ai.{generateNotes,generateQuiz,generateVisualization,ask}.
//  - When Demo Mode is ON, those wrappers return the matching saved
//    snapshot (and a banner clearly says results are SAVED, not live).
//  - When OFF, the original live functions run unchanged.
//  - It never fabricates content: if no snapshot exists for the current
//    lecture, it throws a clear "no saved result" error.
//
//  HONESTY:
//  A persistent banner states whether you are in LIVE or SAVED (demo)
//  mode, and every replayed result keeps its "captured earlier" label.
// =============================================

(function () {
  const STORAGE_KEY = 'bl_demo_mode';

  // Keep references to the real (live) AI functions.
  let liveAi = null;
  let demoOn = false;

  // ─── snapshot matching ────────────────────────────────────────
  function norm(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, ''); }

  function currentLectureName() {
    // Prefer the breadcrumb filename; fall back to extracted text start.
    const fn = document.getElementById('navFilename');
    if (fn && fn.textContent.trim()) return fn.textContent.trim();
    if (window.getNotesText) {
      const t = window.getNotesText();
      if (t) return t.slice(0, 40);
    }
    return '';
  }

  function findSnapshot() {
    const snaps = window.DEMO_SNAPSHOTS || {};
    const keys = Object.keys(snaps);
    if (keys.length === 0) return null;

    const nameN = norm(currentLectureName());
    // 1) exact-ish match against key or label
    for (const k of keys) {
      const s = snaps[k];
      if (nameN && (norm(k).includes(nameN) || nameN.includes(norm(k)) ||
          (s.label && (norm(s.label).includes(nameN) || nameN.includes(norm(s.label)))))) {
        return { key: k, snap: s };
      }
    }
    // 2) if only one snapshot exists, use it
    if (keys.length === 1) return { key: keys[0], snap: snaps[keys[0]] };
    // 3) no confident match
    return null;
  }

  function noSnapshotError(kind) {
    const e = new Error(
      `Demo Mode is ON, but no saved ${kind} result was found for this lecture. ` +
      `Capture one while you have quota (use "Save for demo"), or switch Demo Mode off.`
    );
    e.code = 'no_snapshot';
    return e;
  }

  // ─── banner ───────────────────────────────────────────────────
  function renderBanner() {
    let bar = document.getElementById('demoBanner');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'demoBanner';
      bar.className = 'demo-banner';
      document.body.appendChild(bar);
    }
    bar.textContent = '';
    const dot = document.createElement('span');
    dot.className = 'demo-dot ' + (demoOn ? 'demo-dot-saved' : 'demo-dot-live');
    bar.appendChild(dot);
    const txt = document.createElement('span');
    txt.textContent = demoOn
      ? 'DEMO MODE — showing saved example results offline (no live AI calls).'
      : 'LIVE MODE — AI results are generated now via Google Gemini.';
    bar.appendChild(txt);

    // In Demo Mode, offer a one-click loader for the bundled BIO 280 example
    // so the static demo works without uploading a PDF.
    if (demoOn) {
      const load = document.createElement('button');
      load.className = 'demo-toggle-btn';
      load.textContent = 'Load BIO 280 example';
      load.addEventListener('click', loadBio280Example);
      bar.appendChild(load);
    }

    const btn = document.createElement('button');
    btn.className = 'demo-toggle-btn';
    btn.textContent = demoOn ? 'Switch to Live' : 'Switch to Demo';
    btn.addEventListener('click', () => setDemo(!demoOn));
    bar.appendChild(btn);

    bar.classList.toggle('demo-on', demoOn);
  }

  // Seeds the BIO 280 example so Demo Mode is usable with no PDF upload.
  // It sets the extracted-notes source used by the AI handlers and opens
  // the workspace. It does NOT call any backend.
  function loadBio280Example() {
    const snaps = window.DEMO_SNAPSHOTS || {};
    const key = Object.keys(snaps)[0];
    if (!key) return;
    const label = snaps[key].label || 'BIO 280 example';
    // Provide lecture text so the handlers' length check passes. This text is
    // a short, honest description of the example — not presented as AI output.
    const seedText =
      'BIO 280 example lecture: Species, Genes, and Trees. ' +
      'Core concepts: phylogenetic trees, common ancestry, nodes and clades, ' +
      'sister taxa, outgroups and rooting, and gene trees versus species trees. ' +
      'This is bundled example content for the offline demo.';
    if (window.__setDemoLectureText) {
      window.__setDemoLectureText(label, seedText);
    }
  }
  window.loadBio280Example = loadBio280Example;

  // ─── enable / disable ─────────────────────────────────────────
  function setDemo(on) {
    demoOn = !!on;
    try { localStorage.setItem(STORAGE_KEY, demoOn ? '1' : '0'); } catch (_) {}
    renderBanner();
    // Requirement #5: clear stale Live Mode error messages (and old results)
    // from every AI result area so they don't linger after switching modes.
    ['aiNotesResult', 'aiQuizResult', 'aiAskResult', 'vizContainer'].forEach(id => {
      const node = document.getElementById(id);
      if (node) node.innerHTML = '';
    });
    ['aiNotesStatus', 'aiQuizStatus', 'aiAskStatus', 'vizStatus'].forEach(id => {
      const node = document.getElementById(id);
      if (node) { node.textContent = ''; node.className = 'ai-status'; }
    });
  }

  // ─── wrap window.ai ───────────────────────────────────────────
  function wrapAi() {
    if (!window.ai) { setTimeout(wrapAi, 100); return; }
    if (liveAi) return; // already wrapped
    liveAi = {
      isAvailable: window.ai.isAvailable,
      generateNotes: window.ai.generateNotes,
      generateQuiz: window.ai.generateQuiz,
      generateVisualization: window.ai.generateVisualization,
      ask: window.ai.ask,
      AI_BASE: window.ai.AI_BASE,
    };

    window.ai.isAvailable = async function () {
      if (demoOn) return true; // demo is always "available"
      return liveAi.isAvailable();
    };

    window.ai.generateNotes = async function (text, lang) {
      if (!demoOn) return liveAi.generateNotes(text, lang);
      const m = findSnapshot();
      if (!m || !m.snap.notes) throw noSnapshotError('notes');
      window.__demoActiveCapturedAt = m.snap.capturedAt || '';
      window.__demoActiveSource = m.snap.source || 'saved';
      return m.snap.notes;
    };

    window.ai.generateQuiz = async function (opts) {
      if (!demoOn) return liveAi.generateQuiz(opts);
      const m = findSnapshot();
      if (!m || !m.snap.quiz) throw noSnapshotError('quiz');
      window.__demoActiveCapturedAt = m.snap.capturedAt || '';
      window.__demoActiveSource = m.snap.source || 'saved';
      return m.snap.quiz;
    };

    window.ai.generateVisualization = async function (text, lang) {
      if (!demoOn) return liveAi.generateVisualization(text, lang);
      const m = findSnapshot();
      if (!m || !m.snap.visualization) throw noSnapshotError('visualization');
      window.__demoActiveCapturedAt = m.snap.capturedAt || '';
      window.__demoActiveSource = m.snap.source || 'saved';
      return m.snap.visualization;
    };

    window.ai.ask = async function (q, ctx, lang) {
      if (!demoOn) return liveAi.ask(q, ctx, lang);
      // Ask AI is interactive and open-ended; we don't replay it.
      const e = new Error('Ask AI is a live-only feature and is paused in Demo Mode.');
      e.code = 'demo_live_only';
      throw e;
    };
  }

  // ─── capture helpers (populate demo-data.js) ──────────────────
  // Exposed so the "Save for demo" buttons can hand us real results.
  window.demoCapture = function (kind, data) {
    const name = currentLectureName() || 'lecture';
    const key = norm(name).slice(0, 24) || 'lecture';
    const today = new Date().toISOString().slice(0, 10);
    const block = {
      [key]: {
        capturedAt: today,
        label: name,
        notes: kind === 'notes' ? data : null,
        quiz: kind === 'quiz' ? data : null,
        visualization: kind === 'visualization' ? data : null,
      }
    };
    const json = JSON.stringify(block, null, 2);
    // Print + copy to clipboard for easy pasting into demo-data.js
    /* eslint-disable no-console */
    console.log('─── BioLens demo snapshot (' + kind + ') ───');
    console.log('Paste the inner entry into window.DEMO_SNAPSHOTS in demo-data.js.');
    console.log(json);
    /* eslint-enable no-console */
    try {
      navigator.clipboard.writeText(json);
      return 'Saved to clipboard + console. Paste it into demo-data.js.';
    } catch (_) {
      return 'Printed to console (clipboard blocked). Copy it from there.';
    }
  };

  window.isDemoMode = function () { return demoOn; };
  // Exposed so a "Switch to Demo" button (e.g. on a live-error message) works.
  window.setDemoMode = function (on) { setDemo(on); };

  // ─── init ─────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    try { demoOn = localStorage.getItem(STORAGE_KEY) === '1'; } catch (_) { demoOn = false; }
    wrapAi();
    renderBanner();
  });
}());
