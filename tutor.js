// =============================================
//  BioLens — Study Assistant (Phase 1, A–C)
//
//  PART 1: TAB SWITCHING (PDF / Paste)
//  PART 2: PDF UPLOAD & EXTRACTION  ← Phase A rewrite
//  PART 3: PASTE NOTES
//  PART 4: EXTRACTED TEXT PREVIEW
//  PART 5: KEYWORD SEARCH Q&A
//  PART 6: QUIZ GENERATOR           ← Phase B rewrite
//           └ GRADING & FEEDBACK    ← Phase C rewrite
//
//  HONESTY RULES:
//  - Never claim AI when pattern matching is used.
//  - Never invent page numbers.
//  - Never pad with "(not mentioned in notes)".
//  - Never mark a question correct unless the source sentence
//    is a complete, validated sentence from a reliable page.
//  - Show fewer questions rather than bad questions.
// =============================================

// ─── MODULE STATE ────────────────────────────────────────────────
// notesPages: Array<{ pageNum, text, reliable, warningReason }>
let notesPages  = [];
let notesSource = '';   // 'pdf' | 'paste'

// Stores the last generated question set so Try Again can reuse it
let _lastQuizQuestions = [];
// Stores the distractor pool map for the last quiz
let _lastDistractorMap = new Map();


// =============================================
//  PART 1: TAB SWITCHING
// =============================================

const tabPdf   = document.getElementById('tab-pdf');
const tabPaste = document.getElementById('tab-paste');
const panelPdf   = document.getElementById('panel-pdf');
const panelPaste = document.getElementById('panel-paste');

function switchTab(active) {
  const isPdf = (active === 'pdf');
  tabPdf.classList.toggle('active', isPdf);
  tabPaste.classList.toggle('active', !isPdf);
  tabPdf.setAttribute('aria-selected', isPdf);
  tabPaste.setAttribute('aria-selected', !isPdf);
  panelPdf.classList.toggle('active', isPdf);
  panelPaste.classList.toggle('active', !isPdf);
}

tabPdf.addEventListener('click',   () => switchTab('pdf'));
tabPaste.addEventListener('click', () => switchTab('paste'));


// =============================================
//  PART 2: PDF UPLOAD & EXTRACTION  (Phase A)
// =============================================

const uploadZone   = document.getElementById('uploadZone');
const pdfInput     = document.getElementById('pdfInput');
const uploadStatus = document.getElementById('uploadStatus');

pdfInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (file) handlePdfFile(file);
});

uploadZone.addEventListener('dragover', e => {
  e.preventDefault();
  uploadZone.classList.add('drag-over');
});
uploadZone.addEventListener('dragleave', () => {
  uploadZone.classList.remove('drag-over');
});
uploadZone.addEventListener('drop', e => {
  e.preventDefault();
  uploadZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file && file.type === 'application/pdf') {
    handlePdfFile(file);
  } else {
    setStatus('⚠️ Please drop a PDF file.', 'error');
  }
});

uploadZone.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    pdfInput.click();
  }
});

// ─── Phase A: improved extraction ────────────────────────────────

/**
 * Reads a PDF and extracts text using positioning data so items are
 * processed in visual reading order (top→bottom, left→right).
 * Filters headers, footers, slide numbers, and isolated label fragments.
 * Tags each page with a reliability assessment.
 */
async function handlePdfFile(file) {
  if (typeof pdfjsLib === 'undefined') {
    setStatus(
      '⚠️ PDF reader failed to load. Make sure you\'re connected to the internet the first time, then refresh.',
      'error'
    );
    return;
  }

  setStatus('⏳ Reading PDF… this may take a few seconds for large files.', 'loading');

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc      = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const totalPages  = pdfDoc.numPages;

    const pages        = [];
    let pagesWithText  = 0;
    let unreliableCount = 0;

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page    = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1 });
      const content = await page.getTextContent();

      const result = extractPageText(content.items, viewport);
      pages.push({ pageNum, ...result });

      if (result.text.length > 10) pagesWithText++;
      if (!result.reliable)        unreliableCount++;
    }

    if (pagesWithText === 0) {
      setStatus(
        '⚠️ No text could be extracted. This PDF appears to be a scanned image. ' +
        'Export your slides as a text-based PDF from PowerPoint or Keynote.',
        'error'
      );
      return;
    }

    notesPages  = pages;
    notesSource = 'pdf';

    const reliablePagesCount = pages.filter(p => p.reliable && p.text.length > 10).length;
    let statusMsg = `✅ Extracted text from ${pagesWithText} of ${totalPages} page(s).`;
    if (unreliableCount > 0) {
      statusMsg += ` ⚠️ ${unreliableCount} page(s) flagged as complex layout — see Notes tab for details.`;
    }
    setStatus(statusMsg, unreliableCount > 0 ? 'loading' : 'success');

    showPreview(`${file.name} — ${totalPages} page(s)`, pages);

  } catch (err) {
    console.error('PDF extraction error:', err);
    setStatus(
      '⚠️ Could not read this PDF. It may be password-protected or corrupted. ' +
      'Try opening it in Preview on your Mac and exporting a fresh copy.',
      'error'
    );
  }
}

/**
 * Phase A core: reconstruct reading order from PDF.js item positions,
 * filter junk, detect unreliable pages.
 *
 * @param {Array}  items    - PDF.js text content items
 * @param {Object} viewport - PDF.js viewport (for page dimensions)
 * @returns {{ text, reliable, warningReason }}
 */
function extractPageText(items, viewport) {
  if (!items || items.length === 0) {
    return { text: '', reliable: false, warningReason: 'No text items found — image-only slide.' };
  }

  const pageH = viewport.height;
  const pageW = viewport.width;

  // ── Step 1: Collect items with their bounding boxes ──────────────
  // PDF coordinate system: origin at bottom-left, y increases upward.
  // transform = [scaleX, skewX, skewY, scaleY, translateX, translateY]
  const richItems = items
    .filter(item => typeof item.str === 'string' && item.str.trim().length > 0)
    .map(item => {
      const [, , , scaleY, tx, ty] = item.transform;
      const fontSize = Math.abs(scaleY);
      const x = tx;
      // Convert PDF y (bottom-up) to screen y (top-down)
      const y = pageH - ty;
      const width = item.width || 0;
      return { str: item.str, x, y, fontSize, width };
    });

  // ── Step 2: Filter header / footer / slide-number items ──────────
  const edgeThreshold = pageH * 0.08;   // top/bottom 8% of page

  const filteredItems = richItems.filter(item => {
    // Remove items in page header/footer band
    if (item.y < edgeThreshold || item.y > pageH - edgeThreshold) return false;

    const s = item.str.trim();

    // Remove slide-number patterns: "3", "3/24", "Slide 3", "- 3 -"
    if (/^\d+$/.test(s)) return false;
    if (/^\d+\s*[/\-]\s*\d+$/.test(s)) return false;
    if (/^-?\s*\d+\s*-?$/.test(s)) return false;
    if (/^(slide|page)\s+\d+$/i.test(s)) return false;

    // Remove very short isolated fragments likely to be diagram labels
    // (single letters, numbers with apostrophes, arrows, etc.)
    if (s.length <= 2 && !/^[A-Z][a-z]$/.test(s)) return false;
    if (/^[^\w]+$/.test(s)) return false;  // only punctuation/symbols

    return true;
  });

  if (filteredItems.length === 0) {
    return { text: '', reliable: false, warningReason: 'All text was in header/footer areas or was diagram labels.' };
  }

  // ── Step 3: Sort items into reading order (top→bottom, left→right) ──
  // Group items into "lines" by proximity of y coordinate.
  // Items whose y values differ by less than (avgFontSize * 0.6) are on same line.
  const avgFontSize = filteredItems.reduce((sum, i) => sum + i.fontSize, 0) / filteredItems.length;
  const lineThreshold = Math.max(avgFontSize * 0.6, 4);

  // Sort by y first (top to bottom), then x (left to right)
  const sorted = [...filteredItems].sort((a, b) =>
    Math.abs(a.y - b.y) < lineThreshold ? a.x - b.x : a.y - b.y
  );

  // ── Step 4: Join items into text, repairing split characters ─────
  // If two consecutive items have no whitespace gap between them
  // (gap ≤ half the font size), join without a space.
  const tokens = [];
  for (let i = 0; i < sorted.length; i++) {
    const cur  = sorted[i];
    const prev = sorted[i - 1];

    if (!prev) {
      tokens.push(cur.str);
      continue;
    }

    // Check if we're on the same line
    const sameLine = Math.abs(cur.y - prev.y) < lineThreshold;

    if (sameLine) {
      const gap = cur.x - (prev.x + prev.width);
      const joinThreshold = prev.fontSize * 0.5;

      if (gap <= joinThreshold && gap > -prev.fontSize) {
        // Very close: join without space (repairs "H e l i c a s e" → "Helicase")
        const lastToken = tokens[tokens.length - 1];
        tokens[tokens.length - 1] = lastToken + cur.str;
      } else {
        // Normal gap: add a space
        tokens.push(cur.str);
      }
    } else {
      // New line: always add a space (will be cleaned up below)
      tokens.push(cur.str);
    }
  }

  // ── Step 5: Produce clean text ───────────────────────────────────
  let text = tokens
    .join(' ')
    .replace(/\s{2,}/g, ' ')      // collapse multiple spaces
    .replace(/\s([.,;:!?])/g, '$1') // remove space before punctuation
    .trim();

  // ── Step 6: Reliability assessment ──────────────────────────────
  // Assess whether this page's text is usable for quiz generation.
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const totalWords = words.length;

  if (totalWords < 10) {
    return {
      text,
      reliable: false,
      warningReason: `Only ${totalWords} word(s) extracted — likely an image-only or title slide.`
    };
  }

  // Check average word length (garbled text has many short "words")
  const avgWordLen = words.reduce((s, w) => s + w.replace(/[^a-zA-Z]/g, '').length, 0) / totalWords;

  // Check single-character token ratio
  const singleCharCount = words.filter(w => w.replace(/[^a-zA-Z0-9]/g, '').length <= 1).length;
  const singleCharRatio = singleCharCount / totalWords;

  // Check for common PDF garbling patterns
  const hasUnderscores = (text.match(/_{2,}/g) || []).length > 1;
  const hasFragmentedLetters = singleCharRatio > 0.30;
  const hasVeryShortWords = avgWordLen < 3.0;

  let warningReason = null;

  if (hasFragmentedLetters && hasVeryShortWords) {
    warningReason = `High proportion of single characters (${Math.round(singleCharRatio * 100)}%) — text may be fragmented. Verify extracted content manually.`;
  } else if (hasUnderscores) {
    warningReason = 'Page contains fill-in-the-blank patterns or formatting artifacts.';
  } else if (avgWordLen < 3.5 && totalWords > 15) {
    warningReason = `Average word length is short (${avgWordLen.toFixed(1)} chars) — page may contain diagram labels or code.`;
  }

  return {
    text,
    reliable: warningReason === null,
    warningReason
  };
}

function setStatus(message, type) {
  uploadStatus.textContent = message;
  uploadStatus.className   = `upload-status ${type}`;
}


// =============================================
//  PART 3: PASTE NOTES
// =============================================

const pasteArea   = document.getElementById('pasteArea');
const charCount   = document.getElementById('charCount');
const useNotesBtn = document.getElementById('useNotesBtn');

pasteArea.addEventListener('input', () => {
  const len = pasteArea.value.length;
  charCount.textContent = `${len.toLocaleString()} character${len !== 1 ? 's' : ''}`;
});

useNotesBtn.addEventListener('click', () => {
  const raw = pasteArea.value.trim();
  if (raw.length < 30) {
    alert('Please paste at least a few sentences before continuing.');
    return;
  }
  // Pasted text: treat as one reliable page (user is responsible for quality)
  notesPages  = [{ pageNum: null, text: raw, reliable: true, warningReason: null }];
  notesSource = 'paste';
  showPreview('Pasted notes', notesPages);
});


// =============================================
//  PART 4: EXTRACTED TEXT PREVIEW
// =============================================

const previewCard    = document.getElementById('previewCard');
const sourceBadge    = document.getElementById('sourceBadge');
const extractedPages = document.getElementById('extractedPages');
const clearBtn       = document.getElementById('clearBtn');
const qaCard         = document.getElementById('qaCard');
const quizGenCard    = document.getElementById('quizGenCard');

/**
 * Renders the extracted text preview with Phase A reliability indicators.
 * @param {string} badgeText
 * @param {Array}  pages     - Array of { pageNum, text, reliable, warningReason }
 */
function showPreview(badgeText, pages) {
  sourceBadge.textContent = badgeText;
  extractedPages.innerHTML = '';

  let anyText       = false;
  let unreliableCount = 0;
  let totalPages    = pages.length;

  // ── Top-level reliability summary ────────────────────────────────
  const unreliablePages = pages.filter(p => !p.reliable && p.text.length > 0);
  const emptyPages      = pages.filter(p => p.text.length <= 10);

  if (unreliablePages.length > 0 || emptyPages.length > 0) {
    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'reliability-summary';

    let summaryHtml = '';
    if (unreliablePages.length > 0) {
      const pageNums = unreliablePages
        .filter(p => p.pageNum !== null)
        .map(p => p.pageNum)
        .join(', ');
      summaryHtml += `
        <div class="reliability-warning">
          <span class="rel-icon">⚠️</span>
          <div>
            <strong>${unreliablePages.length} page(s) have uncertain text quality</strong>
            ${pageNums ? `(pages: ${pageNums})` : ''} — these pages will not be used for quiz generation.
            Scroll down to review the flagged content.
          </div>
        </div>`;
    }
    if (emptyPages.length > 0) {
      summaryHtml += `
        <div class="reliability-info">
          <span class="rel-icon">ℹ️</span>
          <div>${emptyPages.length} page(s) had no readable text — likely image-only slides.</div>
        </div>`;
    }
    summaryDiv.innerHTML = summaryHtml;
    extractedPages.appendChild(summaryDiv);
  }

  // ── Per-page blocks ───────────────────────────────────────────────
  pages.forEach(({ pageNum, text, reliable, warningReason }) => {
    const block = document.createElement('div');
    block.className = 'page-block';

    // Page label row
    const labelRow = document.createElement('div');
    labelRow.className = 'page-label-row';

    if (pageNum !== null) {
      const label = document.createElement('span');
      label.className   = 'page-label';
      label.textContent = `Page ${pageNum}`;
      labelRow.appendChild(label);
    }

    // Reliability badge
    if (!reliable) {
      const badge = document.createElement('span');
      badge.className   = 'page-reliability-badge unreliable';
      badge.textContent = '⚠️ Uncertain quality';
      badge.title       = warningReason || 'This page was flagged as potentially unreliable.';
      labelRow.appendChild(badge);
    }

    block.appendChild(labelRow);

    // Warning reason detail
    if (warningReason && text.length > 0) {
      const reasonEl = document.createElement('p');
      reasonEl.className   = 'page-warning-reason';
      reasonEl.textContent = warningReason;
      block.appendChild(reasonEl);
    }

    // Text content or empty-page message
    if (text && text.length > 10) {
      anyText = true;
      const pre = document.createElement('p');
      pre.className = 'page-text' + (reliable ? '' : ' page-text-uncertain');
      pre.textContent = text;
      block.appendChild(pre);

      if (!reliable) {
        const disclaimer = document.createElement('p');
        disclaimer.className   = 'page-fallback-label';
        disclaimer.textContent = 'Shown as raw unprocessed text. Do not use for study without manual review.';
        block.appendChild(disclaimer);
      }
    } else {
      const warn = document.createElement('p');
      warn.className   = 'no-text-warning';
      warn.textContent = '(No readable text — may be an image-only slide)';
      block.appendChild(warn);
    }

    extractedPages.appendChild(block);
  });

  if (!anyText) return;

  previewCard.style.display  = 'block';
  qaCard.style.display       = 'block';
  quizGenCard.style.display  = 'block';

  previewCard.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Reset Q&A and quiz
  document.getElementById('qaResult').innerHTML      = '';
  document.getElementById('questionInput').value     = '';
  document.getElementById('generatedQuiz').innerHTML = '';
  _lastQuizQuestions = [];
  _lastDistractorMap = new Map();

  const genBtn = document.getElementById('generateQuizBtn');
  genBtn.disabled      = false;
  genBtn.style.display = 'block';
}

clearBtn.addEventListener('click', () => {
  notesPages  = [];
  notesSource = '';
  _lastQuizQuestions = [];
  _lastDistractorMap = new Map();

  previewCard.style.display  = 'none';
  qaCard.style.display       = 'none';
  quizGenCard.style.display  = 'none';

  pdfInput.value         = '';
  setStatus('', '');
  uploadZone.classList.remove('drag-over');

  pasteArea.value       = '';
  charCount.textContent = '0 characters';

  document.getElementById('qaResult').innerHTML      = '';
  document.getElementById('questionInput').value     = '';
  document.getElementById('generatedQuiz').innerHTML = '';

  const genBtn = document.getElementById('generateQuizBtn');
  genBtn.disabled      = false;
  genBtn.style.display = 'block';
});


// =============================================
//  PART 5: KEYWORD SEARCH Q&A
// =============================================

const searchBtn     = document.getElementById('searchBtn');
const questionInput = document.getElementById('questionInput');
const qaResult      = document.getElementById('qaResult');

searchBtn.addEventListener('click', runSearch);
questionInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') runSearch();
});

function runSearch() {
  const query = questionInput.value.trim();
  if (!query) {
    qaResult.innerHTML = '<p class="qa-no-result">Please type a question or concept first.</p>';
    return;
  }
  if (notesPages.length === 0) {
    qaResult.innerHTML = '<p class="qa-no-result">No notes loaded yet.</p>';
    return;
  }

  // Search reliable pages first; fall back to all pages if no result
  const reliablePages = notesPages.filter(p => p.reliable && p.text.length > 10);
  let result = findBestPassage(query, reliablePages.length > 0 ? reliablePages : notesPages);

  if (!result) {
    qaResult.innerHTML =
      '<p class="qa-no-result">No relevant passage found. ' +
      'Try different keywords, or check that the concept appears in your notes.</p>';
    return;
  }

  const sourceText = (result.pageNum !== null)
    ? `Found on Page ${result.pageNum} of your PDF`
    : 'Found in your pasted notes';

  const reliabilityNote = result.reliable === false
    ? '<p class="qa-method-note">⚠️ This passage is from a page flagged as uncertain quality.</p>'
    : '';

  const highlightedPassage = highlightKeywords(result.passage, query);

  qaResult.innerHTML = `
    <div class="qa-answer-card">
      <p class="qa-source-line">${escapeHtml(sourceText)}</p>
      <p class="qa-passage">${highlightedPassage}</p>
      ${reliabilityNote}
      <p class="qa-method-note">
        Keyword search — not AI. Returns the highest-scoring passage from your notes.
        Does not reason, summarize, or know biology independently.
      </p>
    </div>`;
}

function findBestPassage(query, pages) {
  const stopWords = new Set([
    'a','an','the','is','are','was','were','be','been','being',
    'have','has','had','do','does','did','will','would','could','should',
    'may','might','shall','can','of','in','on','at','to','for','with',
    'by','from','about','as','into','through','during','what','which',
    'who','whom','this','that','these','those','i','you','he','she','it',
    'we','they','me','him','her','us','them','my','your','his','its','our',
    'and','but','or','nor','so','yet','if','then','than','when','how'
  ]);

  const queryWords = tokenize(query).filter(w => !stopWords.has(w) && w.length > 1);
  if (queryWords.length === 0) return null;

  let bestScore   = 0;
  let bestPassage = null;
  let bestPage    = null;
  let bestReliable = true;

  pages.forEach(({ pageNum, text, reliable }) => {
    if (!text || text.length < 10) return;
    const sentences = splitSentences(text);

    sentences.forEach((sentence, idx) => {
      const sentWords = new Set(tokenize(sentence));
      let score = 0;

      queryWords.forEach(qw => {
        if (sentWords.has(qw)) {
          score += 2;
        } else {
          for (const sw of sentWords) {
            if (sw.includes(qw) || qw.includes(sw)) { score += 1; break; }
          }
        }
      });
      if (sentence.length > 80) score += 0.5;

      if (score > bestScore) {
        bestScore    = score;
        bestPassage  = sentences.slice(idx, idx + 2).join(' ').trim();
        bestPage     = pageNum;
        bestReliable = reliable !== false;
      }
    });
  });

  if (bestScore === 0 || !bestPassage) return null;
  return { passage: bestPassage, pageNum: bestPage, reliable: bestReliable };
}

function tokenize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
}

function splitSentences(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 10);
}

function highlightKeywords(text, query) {
  const safe = escapeHtml(text);
  const words = tokenize(query).filter(w => w.length > 2);
  if (words.length === 0) return safe;
  const pattern = new RegExp(`\\b(${words.map(escapeRegex).join('|')})\\b`, 'gi');
  return safe.replace(pattern, '<mark>$1</mark>');
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Expose the extracted lecture text to the AI controller (index.html).
// Returns all page text joined, so AI features operate on the SAME text
// the rule-based features use. Returns '' when nothing is loaded.
window.getNotesText = function () {
  if (!Array.isArray(notesPages) || notesPages.length === 0) return '';
  return notesPages
    .filter(p => p.text && p.text.length > 0)
    .map(p => (p.pageNum !== null ? `[Page ${p.pageNum}] ` : '') + p.text)
    .join('\n\n');
};

// Demo Mode helper: seed a lecture WITHOUT a PDF, so the offline/static
// demo can run. Sets notesPages to a single page and renders the preview
// through the normal path (which the App Controller wraps to open the
// workspace). Never calls the backend.
window.__setDemoLectureText = function (label, text) {
  notesPages  = [{ pageNum: null, text: String(text || ''), reliable: true, warningReason: null }];
  notesSource = 'demo';
  showPreview(String(label || 'Demo lecture'), notesPages);
};


// =============================================
//  PART 6: QUIZ GENERATOR  (Phase B + C)
// =============================================

const generateQuizBtn = document.getElementById('generateQuizBtn');
const generatedQuiz   = document.getElementById('generatedQuiz');

generateQuizBtn.addEventListener('click', generateQuiz);

// ─────────────────────────────────────────────────────────────────
//  Phase B: SENTENCE VALIDATION
//  A sentence must pass ALL validators before any pattern is applied.
// ─────────────────────────────────────────────────────────────────

// Biology-relevant verbs that signal a meaningful statement
const BIO_VERBS = new Set([
  'is', 'are', 'was', 'were', 'refers', 'functions', 'serves', 'acts',
  'enables', 'allows', 'produces', 'catalyzes', 'inhibits', 'regulates',
  'synthesizes', 'binds', 'cleaves', 'activates', 'transports', 'converts',
  'forms', 'breaks', 'connects', 'encodes', 'expresses', 'transcribes',
  'translates', 'replicates', 'divides', 'differentiates', 'migrates',
  'signals', 'releases', 'absorbs', 'generates', 'maintains', 'stabilizes',
  'degrades', 'phosphorylates', 'dephosphorylates', 'mediates', 'promotes',
  'prevents', 'triggers', 'initiates', 'terminates', 'elongates', 'unwinds',
  'seals', 'removes', 'replaces', 'joins', 'copies', 'reads', 'writes',
  'codes', 'controls', 'determines', 'carries', 'moves', 'enters', 'exits',
  'crosses', 'passes', 'contains', 'consists', 'includes', 'involves',
  'requires', 'uses', 'needs', 'makes', 'creates', 'builds', 'forms',
  'causes', 'results', 'leads', 'affects', 'changes', 'increases', 'decreases'
]);

// Patterns that indicate a sentence is NOT usable for quiz generation
const JUNK_PATTERNS = [
  /_{2,}/,                          // fill-in-the-blank blanks
  /\[.*?\]/,                        // bracket annotations
  /^\s*\d+[\.\)]\s/,                // numbered list items starting a sentence
  /^\s*[•\-\*]\s/,                  // bullet-started fragments
  /\?\s*$/,                         // ends in a question mark
  /^\s*(?:fig|figure|table|chart|diagram|example|note|see|cf\.)\s/i, // figure refs
  /\b(?:click|next|previous|back|menu|slide|chapter|section)\b/i,    // navigation text
  /^\s*(?:i\.e\.|e\.g\.|etc\.)/i,   // abbreviation-started fragments
  /[<>{}|\\]/,                      // HTML or code artifacts
  /\b\d{4,}\b/,                     // long number sequences (table data)
];

/**
 * Returns true if the sentence is clean enough to be used as a quiz source.
 * This is the primary quality gate — anything that fails here is silently dropped.
 */
function isSentenceUsable(sentence) {
  // Length: between 45 and 350 characters
  if (sentence.length < 45 || sentence.length > 350) return false;

  // Must start with a capital letter (not a continuation fragment)
  if (!/^[A-Z]/.test(sentence)) return false;

  // Must not match any junk patterns
  if (JUNK_PATTERNS.some(p => p.test(sentence))) return false;

  const words = sentence.split(/\s+/).filter(Boolean);

  // Minimum 8 distinct words
  if (new Set(words.map(w => w.toLowerCase())).size < 8) return false;

  // Average word length ≥ 3.8 characters (filters garbled spacing artifacts)
  const avgWordLen = words.reduce((s, w) => s + w.replace(/[^a-zA-Z]/g, '').length, 0) / words.length;
  if (avgWordLen < 3.8) return false;

  // Must contain at least one bio-relevant verb
  const wordSet = new Set(words.map(w => w.toLowerCase().replace(/[^a-z]/g, '')));
  const hasBioVerb = [...wordSet].some(w => BIO_VERBS.has(w));
  if (!hasBioVerb) return false;

  // Must not be more than 40% single-character tokens (fragmented text check)
  const singleCharRatio = words.filter(w => w.replace(/[^a-zA-Z0-9]/g, '').length <= 1).length / words.length;
  if (singleCharRatio > 0.3) return false;

  return true;
}

/**
 * Returns true if a candidate's subject is a clean, usable term.
 */
function isSubjectUsable(subject) {
  if (subject.length < 3 || subject.length > 65) return false;
  // No all-caps words longer than 5 chars (filters "SLIDE 3", "CHAPTER TWO")
  if (/\b[A-Z]{6,}\b/.test(subject)) return false;
  // No digits at the start
  if (/^\d/.test(subject)) return false;
  // No colons (heading artifacts)
  if (subject.includes(':')) return false;
  // No question marks
  if (subject.includes('?')) return false;
  // Ends with a word character (not a preposition dangling)
  if (!/\w$/.test(subject)) return false;
  // Average word length ≥ 3.5
  const words = subject.split(/\s+/).filter(Boolean);
  const avgLen = words.reduce((s, w) => s + w.replace(/[^a-zA-Z]/g, '').length, 0) / words.length;
  if (avgLen < 3.5) return false;
  return true;
}

/**
 * Returns true if a candidate's answer is a clean, usable definition/description.
 */
function isAnswerUsable(answer) {
  if (answer.length < 10 || answer.length > 200) return false;
  // No fill-in-the-blank
  if (/_{2,}/.test(answer)) return false;
  // No bracket artifacts
  if (/\[.*?\]/.test(answer)) return false;
  // Must not start with a lowercase conjunction
  if (/^(and|but|or|so|yet|nor|for|because|since|although|while)\b/i.test(answer)) return false;
  // Average word length ≥ 3.8
  const words = answer.split(/\s+/).filter(Boolean);
  if (words.length < 2) return false;
  const avgLen = words.reduce((s, w) => s + w.replace(/[^a-zA-Z]/g, '').length, 0) / words.length;
  if (avgLen < 3.8) return false;
  return true;
}

// ─────────────────────────────────────────────────────────────────
//  Phase B: DEFINITION PATTERNS
// ─────────────────────────────────────────────────────────────────

const DEFINITION_PATTERNS = [
  {
    id: 'defined-as',
    regex: /([A-Z][^.!?]{3,55}?)\s+(?:is|are)\s+defined as\s+([^.!?]{12,180})/g,
    getSubject: m => m[1].trim(),
    getAnswer:  m => m[2].trim(),
    template:   subj => `How is "${trimArticles(subj)}" defined?`,
  },
  {
    id: 'called-known',
    regex: /([A-Z][^.!?]{3,55}?)\s+(?:is|are)\s+(?:called|known as|termed)\s+([^.!?]{8,150})/g,
    getSubject: m => m[1].trim(),
    getAnswer:  m => m[2].trim(),
    template:   subj => `What is "${trimArticles(subj)}" also known as or called?`,
  },
  {
    id: 'refers-to',
    regex: /([A-Z][^.!?]{3,55}?)\s+refers to\s+([^.!?]{12,180})/g,
    getSubject: m => m[1].trim(),
    getAnswer:  m => m[2].trim(),
    template:   subj => `What does "${trimArticles(subj)}" refer to?`,
  },
  {
    id: 'functions-as',
    regex: /([A-Z][^.!?]{3,55}?)\s+(?:functions as|acts as|serves as)\s+([^.!?]{8,150})/g,
    getSubject: m => m[1].trim(),
    getAnswer:  m => m[2].trim(),
    template:   subj => `What is the function of "${trimArticles(subj)}"?`,
  },
  {
    id: 'responsible-for',
    regex: /([A-Z][^.!?]{3,55}?)\s+(?:is|are)\s+responsible for\s+([^.!?]{12,180})/g,
    getSubject: m => m[1].trim(),
    getAnswer:  m => m[2].trim(),
    template:   subj => `What is "${trimArticles(subj)}" responsible for?`,
  },
  {
    id: 'verb-action',
    regex: /([A-Z][^.!?]{3,55}?)\s+(?:enables|allows|catalyzes|produces|synthesizes|unwinds|removes|joins|copies|seals|regulates|inhibits|activates|transports|converts)\s+([^.!?]{10,180})/g,
    getSubject: m => m[1].trim(),
    getAnswer:  m => m[2].trim(),
    template:   subj => `What does "${trimArticles(subj)}" do?`,
  },
];

// ─────────────────────────────────────────────────────────────────
//  Phase B: CANDIDATE EXTRACTION
// ─────────────────────────────────────────────────────────────────

/**
 * Extracts validated question candidates from reliable pages only.
 * Returns { candidates, skippedCount, rejectedReasons }
 */
function extractCandidates(pages) {
  const candidates      = [];
  const seenSubjects    = new Set();
  let totalAttempts     = 0;
  let skippedCount      = 0;
  const rejectedReasons = [];

  // Only use reliable pages
  const reliablePages = pages.filter(p => p.reliable && p.text && p.text.length > 40);

  reliablePages.forEach(({ pageNum, text }) => {
    // Split the page text into sentences first
    const sentences = splitSentences(text);

    sentences.forEach(sentence => {
      // Gate 1: sentence-level quality check
      if (!isSentenceUsable(sentence)) {
        return;  // silently skip — not counted as attempted
      }

      // Run all patterns on this validated sentence
      DEFINITION_PATTERNS.forEach(({ id, regex, getSubject, getAnswer, template }) => {
        regex.lastIndex = 0;
        let match;

        while ((match = regex.exec(sentence)) !== null) {
          totalAttempts++;
          const subject    = getSubject(match);
          const answer     = getAnswer(match);
          const fullSentence = sentence.trim();
          const subjectKey = subject.toLowerCase().trim();

          // Gate 2: subject quality
          if (!isSubjectUsable(subject)) {
            skippedCount++;
            rejectedReasons.push(`Rejected subject: "${subject.slice(0, 40)}" (failed subject validation)`);
            continue;
          }

          // Gate 3: answer quality
          if (!isAnswerUsable(answer)) {
            skippedCount++;
            rejectedReasons.push(`Rejected answer for "${subject.slice(0, 30)}": "${answer.slice(0, 40)}" (failed answer validation)`);
            continue;
          }

          // Gate 4: deduplicate by subject
          if (seenSubjects.has(subjectKey)) {
            skippedCount++;
            continue;
          }

          // Gate 5: answer must not substantially overlap the question subject
          if (answer.toLowerCase().includes(subject.toLowerCase().slice(0, 12))) {
            skippedCount++;
            rejectedReasons.push(`Rejected: answer overlaps subject for "${subject.slice(0, 30)}"`);
            continue;
          }

          // Find 2 sentences of surrounding context from this page
          const sentIdx = sentences.indexOf(sentence);
          const ctxStart = Math.max(0, sentIdx - 1);
          const ctxEnd   = Math.min(sentences.length, sentIdx + 3);
          const contextWindow = sentences.slice(ctxStart, ctxEnd).join(' ').trim();

          seenSubjects.add(subjectKey);
          candidates.push({
            subject,
            answer:        truncate(answer, 160),
            question:      template(subject),
            sourceSentence: truncate(fullSentence, 220),
            contextWindow: truncate(contextWindow, 450),
            pageNum,
            patternId: id,
          });
        }
      });
    });
  });

  return { candidates, skippedCount, rejectedReasons, reliablePageCount: reliablePages.length };
}

// ─────────────────────────────────────────────────────────────────
//  Phase B: DISTRACTOR BUILDING
//  Distractors come ONLY from other validated answers in this session.
//  Never from arbitrary text fragments.
// ─────────────────────────────────────────────────────────────────

/**
 * Build a per-question distractor map.
 * Each question gets distractors from the answers of OTHER candidates,
 * ensuring grammatical and structural similarity.
 *
 * @param {Array} picked     - questions selected for this quiz
 * @param {Array} allCandidates - full pool of validated candidates
 * @returns {Map} index → Array<string>
 */
function buildDistractorMap(picked, allCandidates) {
  const map = new Map();

  picked.forEach((q, idx) => {
    const correctNorm = q.answer.toLowerCase().slice(0, 45);

    const pool = allCandidates
      .filter(other => {
        const otherNorm = other.answer.toLowerCase().slice(0, 45);
        if (otherNorm === correctNorm) return false;
        // Avoid near-duplicates
        if (otherNorm.slice(0, 20) === correctNorm.slice(0, 20)) return false;
        // Must be a sensible length
        if (other.answer.length < 8 || other.answer.length > 200) return false;
        return true;
      })
      .map(other => truncate(other.answer, 130));

    // Deduplicate
    map.set(idx, [...new Set(pool)]);
  });

  return map;
}

// ─────────────────────────────────────────────────────────────────
//  Phase B: MAIN QUIZ GENERATION
// ─────────────────────────────────────────────────────────────────

function generateQuiz() {
  if (notesPages.length === 0) {
    generatedQuiz.innerHTML = '<p class="gen-no-questions">No notes loaded yet.</p>';
    return;
  }

  const reliablePages = notesPages.filter(p => p.reliable && p.text && p.text.length > 40);

  if (reliablePages.length === 0) {
    // Raw text fallback
    generatedQuiz.innerHTML = buildNoReliableContentMessage(notesPages);
    return;
  }

  const { candidates, skippedCount, reliablePageCount } = extractCandidates(notesPages);

  if (candidates.length === 0) {
    generatedQuiz.innerHTML = buildNoQuestionsMessage(reliablePageCount, skippedCount, notesPages);
    return;
  }

  // Pick up to 3; shuffle so we get different questions each run
  const picked = shuffleArray(candidates).slice(0, 3);
  _lastQuizQuestions = picked;

  // Build distractor map using the full candidate pool
  _lastDistractorMap = buildDistractorMap(picked, candidates);

  // Keep only questions that have ≥ 3 valid distractors
  const viable = picked.filter((_, idx) => (_lastDistractorMap.get(idx) || []).length >= 3);

  if (viable.length === 0) {
    generatedQuiz.innerHTML = `
      <div class="gen-no-questions">
        <p><strong>Not enough distinct answer choices could be found.</strong></p>
        <p style="margin-top:8px;">
          The quiz generator found candidate questions but could not find 3 distinct
          distractor answers for each. This happens when notes contain only a few
          definition sentences. Upload notes with more concept explanations and try again.
        </p>
        <p style="margin-top:8px; font-size:12px; color:#9B9B97;">
          ${candidates.length} candidate question(s) found, ${skippedCount} rejected.
          ${reliablePageCount} reliable page(s) used.
        </p>
      </div>`;
    return;
  }

  renderQuiz(viable, candidates, skippedCount, reliablePageCount);
  generateQuizBtn.disabled = true;
}

/**
 * Renders question cards, quality notice, and action buttons.
 */
function renderQuiz(questions, allCandidates, skippedCount, reliablePageCount) {
  const qualityNotice = `
    <div class="gen-quality-notice">
      Showing ${questions.length} question${questions.length !== 1 ? 's' : ''}
      from ${allCandidates.length} usable passage${allCandidates.length !== 1 ? 's' : ''}
      across ${reliablePageCount} reliable page${reliablePageCount !== 1 ? 's' : ''}.
      ${skippedCount > 0 ? `${skippedCount} candidate${skippedCount !== 1 ? 's' : ''} rejected (fragmented, ambiguous, or too short).` : ''}
      <span class="gen-quality-method">Rule-based — not AI.</span>
    </div>`;

  const cardsHtml = questions.map((q, idx) =>
    buildQuestionCard(q, idx, _lastDistractorMap)
  ).join('');

  generatedQuiz.innerHTML = qualityNotice + cardsHtml + `
    <div class="gen-action-row">
      <button class="gen-check-btn" id="genCheckBtn">Check My Answers</button>
    </div>
    <div class="gen-score-banner" id="genScoreBanner" style="display:none;"></div>
    <div class="gen-post-quiz-actions" id="genPostActions" style="display:none;">
      <button class="gen-retry-btn" id="genRetryBtn">↺ Try Again</button>
      <button class="gen-new-btn"   id="genNewBtn">↻ New Questions</button>
    </div>`;

  document.getElementById('genCheckBtn').addEventListener('click', gradeQuiz);
  document.getElementById('genRetryBtn').addEventListener('click', retryQuiz);
  document.getElementById('genNewBtn').addEventListener('click', () => {
    generateQuizBtn.disabled = false;
    _lastQuizQuestions = [];
    _lastDistractorMap = new Map();
    generateQuiz();
  });
}

// ─────────────────────────────────────────────────────────────────
//  Phase B: QUESTION CARD BUILDER
// ─────────────────────────────────────────────────────────────────

function buildQuestionCard(q, idx, distMap) {
  const pool       = distMap.get(idx) || [];
  const distractors = shuffleArray(pool).slice(0, 3);

  // This should never trigger if renderQuiz filters correctly, but guard anyway
  if (distractors.length < 3) return '';

  const allOptions = shuffleArray([
    { text: q.answer, isCorrect: true  },
    { text: distractors[0], isCorrect: false },
    { text: distractors[1], isCorrect: false },
    { text: distractors[2], isCorrect: false },
  ]);

  const letters = ['A', 'B', 'C', 'D'];
  const correctLetter = letters[allOptions.findIndex(o => o.isCorrect)];

  const optionsHtml = allOptions.map((opt, i) => `
    <label class="gen-option" id="gopt-${idx}-${i}">
      <input type="radio" name="gq${idx}" value="${letters[i]}"
             aria-label="Option ${letters[i]}: ${escapeHtml(opt.text)}" />
      <span>${letters[i]}) ${escapeHtml(opt.text)}</span>
    </label>`).join('');

  const sourceLabel = q.pageNum !== null ? `Page ${q.pageNum}` : 'Pasted notes';

  return `
    <div class="gen-question-card"
         id="gqcard-${idx}"
         data-correct="${correctLetter}"
         data-correct-text="${escapeHtml(q.answer)}"
         data-source-sentence="${escapeHtml(q.sourceSentence)}"
         data-context-window="${escapeHtml(q.contextWindow)}"
         data-page="${q.pageNum !== null ? q.pageNum : ''}"
         data-idx="${idx}">

      <div class="gen-question-header">
        <span class="gen-source-line">${escapeHtml(sourceLabel)} · pattern match</span>
      </div>

      <p class="question-text">
        <strong>Q${idx + 1}.</strong> ${escapeHtml(q.question)}
      </p>

      <div class="gen-options">${optionsHtml}</div>

      <!-- Phase C: feedback panel — populated after submission -->
      <div class="gen-feedback-panel" id="gfeedback-${idx}"
           aria-live="polite" style="display:none;"></div>
    </div>`;
}

// ─────────────────────────────────────────────────────────────────
//  Phase C: GRADING & RICH FEEDBACK
// ─────────────────────────────────────────────────────────────────

function gradeQuiz() {
  const cards = document.querySelectorAll('.gen-question-card');
  let score = 0;

  cards.forEach(card => {
    const idx            = card.getAttribute('data-idx');
    const correctLetter  = card.getAttribute('data-correct');
    const correctText    = card.getAttribute('data-correct-text');
    const sourceSentence = card.getAttribute('data-source-sentence');
    const contextWindow  = card.getAttribute('data-context-window');
    const pageAttr       = card.getAttribute('data-page');
    const pageNum        = pageAttr ? parseInt(pageAttr, 10) : null;

    const selected   = card.querySelector(`input[name="gq${idx}"]:checked`);
    const feedbackEl = document.getElementById(`gfeedback-${idx}`);

    // Reset option highlight classes
    card.querySelectorAll('.gen-option').forEach(opt =>
      opt.classList.remove('gen-correct', 'gen-incorrect')
    );

    // Always highlight the correct answer
    const correctInput = card.querySelector(`input[value="${correctLetter}"]`);
    if (correctInput) correctInput.closest('.gen-option').classList.add('gen-correct');

    let isCorrect = false;
    let statusHtml = '';

    if (!selected) {
      statusHtml = `<p class="gf-status gf-warn">⚠ No answer selected.</p>`;
    } else if (selected.value === correctLetter) {
      isCorrect = true;
      score++;
      statusHtml = `<p class="gf-status gf-correct">✓ Correct.</p>`;
    } else {
      // Mark chosen wrong option
      selected.closest('.gen-option').classList.add('gen-incorrect');

      // Get the text of what the student chose
      const chosenText = selected.closest('.gen-option')
        .querySelector('span').textContent.replace(/^[A-D]\)\s*/, '');

      statusHtml = `
        <p class="gf-status gf-incorrect">✗ Incorrect.</p>
        <div class="gf-wrong-block">
          <p class="gf-wrong-label">YOUR ANSWER</p>
          <p class="gf-wrong-text">${escapeHtml(chosenText)}</p>
          <p class="gf-wrong-note">
            This option comes from a different part of your notes and does not answer
            this question. See the source excerpt below to understand why the correct
            answer is different.
          </p>
        </div>`;
    }

    // Correct answer block (always shown)
    const correctAnswerHtml = `
      <div class="gf-correct-answer ${isCorrect ? 'gf-ca-correct' : 'gf-ca-show'}">
        <p class="gf-ca-label">${isCorrect ? 'CORRECT ANSWER' : 'CORRECT ANSWER'}</p>
        <p class="gf-ca-text">${escapeHtml(correctText)}</p>
      </div>`;

    // Source evidence block
    const citationText = pageNum !== null
      ? `From your notes — Page ${pageNum}`
      : 'From your pasted notes';

    const sourceHtml = `
      <div class="gf-source-block">
        <p class="gf-source-label">SOURCE EXCERPT <span class="gf-citation">${escapeHtml(citationText)}</span></p>
        <blockquote class="gf-source-sentence">${escapeHtml(sourceSentence)}</blockquote>
        <details class="gf-context-details">
          <summary>Show surrounding context</summary>
          <p class="gf-context-text">${escapeHtml(contextWindow)}</p>
        </details>
        <p class="gf-method-note">
          Explanation is based on what your source text says — not generated by AI.
          This system uses keyword patterns, not biological reasoning.
        </p>
      </div>`;

    feedbackEl.innerHTML  = statusHtml + correctAnswerHtml + sourceHtml;
    feedbackEl.style.display = 'block';

    // Disable all radios for this question
    card.querySelectorAll('input[type="radio"]').forEach(i => { i.disabled = true; });
  });

  // Score banner
  const total  = cards.length;
  const pct    = score / total;
  const banner = document.getElementById('genScoreBanner');

  if (pct === 1) {
    banner.textContent = `Perfect — ${score}/${total}. All correct.`;
    banner.className   = 'gen-score-banner perfect';
  } else if (pct >= 0.5) {
    banner.textContent = `${score}/${total} correct. Review the source excerpts above for the questions you missed.`;
    banner.className   = 'gen-score-banner good';
  } else {
    banner.textContent = `${score}/${total} correct. Read the source excerpts carefully and try again.`;
    banner.className   = 'gen-score-banner tryagain';
  }

  banner.style.display = 'block';

  // Swap Check button → post-quiz actions
  const checkRow = document.getElementById('genCheckBtn').closest('.gen-action-row');
  if (checkRow) checkRow.style.display = 'none';
  const postActions = document.getElementById('genPostActions');
  if (postActions) postActions.style.display = 'flex';

  banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/**
 * Try Again: reset inputs and feedback without regenerating questions.
 */
function retryQuiz() {
  const cards = document.querySelectorAll('.gen-question-card');

  cards.forEach(card => {
    card.querySelectorAll('input[type="radio"]').forEach(i => {
      i.disabled = false;
      i.checked  = false;
    });
    card.querySelectorAll('.gen-option').forEach(opt =>
      opt.classList.remove('gen-correct', 'gen-incorrect')
    );
    const idx = card.getAttribute('data-idx');
    const fp  = document.getElementById(`gfeedback-${idx}`);
    if (fp) { fp.innerHTML = ''; fp.style.display = 'none'; }
  });

  const banner = document.getElementById('genScoreBanner');
  if (banner) banner.style.display = 'none';

  const postActions = document.getElementById('genPostActions');
  if (postActions) postActions.style.display = 'none';

  const checkRow = document.getElementById('genCheckBtn')?.closest('.gen-action-row');
  if (checkRow) checkRow.style.display = 'block';

  const firstCard = document.querySelector('.gen-question-card');
  if (firstCard) firstCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ─── No-content fallback messages ────────────────────────────────

function buildNoReliableContentMessage(pages) {
  const unreliableWithText = pages.filter(p => !p.reliable && p.text.length > 10);
  let fallbackHtml = '';

  if (unreliableWithText.length > 0) {
    fallbackHtml = `
      <div class="gen-fallback-block">
        <p class="gen-fallback-label">Raw extracted text (unprocessed — not verified for quiz use):</p>
        ${unreliableWithText.map(p => `
          <div class="gen-fallback-page">
            <p class="page-label">${p.pageNum !== null ? `Page ${p.pageNum}` : 'Notes'} ⚠️ ${escapeHtml(p.warningReason || 'Uncertain quality')}</p>
            <p class="gen-fallback-text">${escapeHtml(truncate(p.text, 600))}</p>
          </div>`).join('')}
      </div>`;
  }

  return `
    <div class="gen-no-questions">
      <p><strong>No reliable content found for quiz generation.</strong></p>
      <p style="margin-top:8px;">
        All pages were flagged as uncertain quality (complex layout, fragmented text,
        or image-heavy slides). The quiz generator only creates questions from text it
        can verify is complete and readable.
      </p>
      <p style="margin-top:8px; font-size:12px; color:#9B9B97;">
        Try uploading a PDF exported as text from PowerPoint or Keynote.
        Scanned or image-based slides cannot be processed.
      </p>
    </div>
    ${fallbackHtml}`;
}

function buildNoQuestionsMessage(reliablePageCount, skippedCount, pages) {
  // Show raw text from reliable pages as a fallback for study
  const reliableWithText = pages.filter(p => p.reliable && p.text.length > 10);

  let fallbackHtml = '';
  if (reliableWithText.length > 0) {
    fallbackHtml = `
      <div class="gen-fallback-block">
        <p class="gen-fallback-label">
          Extracted text from reliable pages (not generated questions — raw source text for manual review):
        </p>
        ${reliableWithText.map(p => `
          <div class="gen-fallback-page">
            <p class="page-label">${p.pageNum !== null ? `Page ${p.pageNum}` : 'Notes'}</p>
            <p class="gen-fallback-text">${escapeHtml(truncate(p.text, 500))}</p>
          </div>`).join('')}
      </div>`;
  }

  return `
    <div class="gen-no-questions">
      <p><strong>No usable questions could be generated from this material.</strong></p>
      <p style="margin-top:8px;">
        The quiz generator looks for complete definition-style sentences like:
      </p>
      <ul style="margin: 8px 0 8px 20px; font-size:13px; color:#525252;">
        <li><em>"Helicase is the enzyme responsible for unwinding the DNA double helix."</em></li>
        <li><em>"DNA Polymerase is defined as the enzyme that synthesizes new DNA strands."</em></li>
        <li><em>"The lagging strand refers to the discontinuously synthesized strand."</em></li>
      </ul>
      <p style="font-size:12px; color:#9B9B97; margin-top:8px;">
        ${reliablePageCount} reliable page(s) were found.
        ${skippedCount > 0 ? `${skippedCount} sentence(s) were checked and rejected — too short, fragmented, or ambiguous.` : ''}
        No sentence passed all quality requirements.
      </p>
    </div>
    ${fallbackHtml}`;
}


// =============================================
//  UTILITIES
// =============================================

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function trimArticles(str) {
  return str.replace(/^(The|A|An)\s+/i, '').trim();
}

function truncate(str, max) {
  if (!str || str.length <= max) return str || '';
  return str.slice(0, max).replace(/\s+\S*$/, '') + '…';
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
