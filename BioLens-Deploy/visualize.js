// =============================================
//  BioLens — Visualization Renderers (safe, interactive)
//
//  SECURITY MODEL:
//  The AI returns STRUCTURED DATA only. This file is the ONLY code that
//  turns that data into DOM. It never uses innerHTML with AI content,
//  never eval()s anything, and never injects AI-authored HTML/JS.
//  Every AI string reaches the page via textContent or SVG text nodes.
//
//  INTERACTIVITY:
//  Every visualization type supports click-to-explain. Clicking a node,
//  step, row, or part shows that element's own explanation (and page
//  reference when the PDF supports it) in a shared detail panel.
//
//  Public API (window.bioViz):
//    bioViz.render(container, vizData)
//    bioViz.clear(container)
// =============================================

(function () {

  // ─── safe DOM helpers ─────────────────────────────────────────
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = String(text);
    return node;
  }
  function svgEl(tag, attrs) {
    const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
    if (attrs) for (const k in attrs) node.setAttribute(k, attrs[k]);
    return node;
  }
  function svgText(x, y, str, opts) {
    const t = svgEl('text', Object.assign({ x, y }, opts || {}));
    t.textContent = String(str == null ? '' : str);
    return t;
  }
  function clear(container) {
    while (container.firstChild) container.removeChild(container.firstChild);
  }
  function hasNum(v) { return v != null && Number.isFinite(Number(v)); }

  // ─── shared detail panel (click-to-explain target) ────────────
  // Each render() call creates one panel and a setter the renderers use.
  function makeDetailPanel(container) {
    const panel = el('div', 'viz-detail');
    panel.appendChild(el('p', 'viz-detail-empty', 'Click any element above to see its explanation.'));
    container.appendChild(panel);

    return function show(title, explanation, page, role) {
      clear(panel);
      const head = el('div', 'viz-detail-head');
      head.appendChild(el('strong', 'viz-detail-title', title || ''));
      if (role) head.appendChild(el('span', 'viz-detail-role', ' — ' + role));
      panel.appendChild(head);

      if (explanation && String(explanation).trim()) {
        panel.appendChild(el('p', 'viz-detail-text', explanation));
      } else {
        panel.appendChild(el('p', 'viz-detail-text viz-detail-muted',
          'No explanation was provided for this element in the lecture text.'));
      }
      if (hasNum(page)) {
        panel.appendChild(el('span', 'viz-source', `Source: Page ${page}`));
      }
    };
  }

  // ─── shared header ────────────────────────────────────────────
  function renderHeader(container, viz) {
    const head = el('div', 'viz-head');
    if (viz.title) head.appendChild(el('h3', 'viz-title', viz.title));
    if (viz.explanation) head.appendChild(el('p', 'viz-explanation', viz.explanation));
    const meta = el('div', 'viz-meta');
    if (hasNum(viz.sourcePage)) {
      meta.appendChild(el('span', 'viz-source', `Source: Page ${viz.sourcePage}`));
    }
    meta.appendChild(el('span', 'viz-ai-note', 'Generated from your lecture by Google Gemini'));
    head.appendChild(meta);
    container.appendChild(head);
  }

  // ─── honest fallback ──────────────────────────────────────────
  function renderNone(container, viz) {
    const box = el('div', 'viz-none');
    box.appendChild(el('p', 'viz-none-title', viz.title || 'No visualization available'));
    box.appendChild(el('p', 'viz-none-text',
      viz.explanation ||
      'This lecture does not contain enough structured information to build an accurate visualization.'));
    container.appendChild(box);
  }

  // ─── PHYLOGENETIC TREE ────────────────────────────────────────
  function renderPhyloTree(container, viz) {
    const tree = viz.tree;
    if (!tree || typeof tree !== 'object') { renderNone(container, viz); return; }

    const leaves = [];
    const allNodes = [];
    let maxDepth = 0;

    (function assign(node, depth, parent) {
      node.__depth = depth;
      node.__parent = parent || null;
      node.__id = allNodes.length;
      allNodes.push(node);
      maxDepth = Math.max(maxDepth, depth);
      const kids = Array.isArray(node.children) ? node.children : [];
      if (kids.length === 0) { node.__leafIndex = leaves.length; leaves.push(node); }
      else kids.forEach(k => assign(k, depth + 1, node));
    })(tree, 0, null);

    (function computeY(node) {
      const kids = Array.isArray(node.children) ? node.children : [];
      if (kids.length === 0) { node.__y = node.__leafIndex; return node.__y; }
      const ys = kids.map(computeY);
      node.__y = ys.reduce((a, b) => a + b, 0) / ys.length;
      return node.__y;
    })(tree);

    const rowH = 36;
    const colW = Math.max(120, Math.min(200, 520 / (maxDepth + 1)));
    const padX = 20, padY = 26;
    const width = padX * 2 + colW * maxDepth + 170;
    const height = padY * 2 + rowH * Math.max(1, leaves.length - 1) + 24;

    const svg = svgEl('svg', {
      viewBox: `0 0 ${width} ${height}`, class: 'viz-svg viz-phylo',
      role: 'img', 'aria-label': viz.title || 'Phylogenetic tree',
    });
    const xOf = n => padX + n.__depth * colW;
    const yOf = n => padY + n.__y * rowH;

    // edges
    allNodes.forEach(node => {
      const kids = Array.isArray(node.children) ? node.children : [];
      if (kids.length === 0) return;
      const px = xOf(node), py = yOf(node);
      const childYs = kids.map(yOf);
      svg.appendChild(svgEl('line', { x1: px + colW, y1: Math.min(...childYs), x2: px + colW, y2: Math.max(...childYs), class: 'viz-edge' }));
      svg.appendChild(svgEl('line', { x1: px, y1: py, x2: px + colW, y2: py, class: 'viz-edge' }));
      kids.forEach(k => svg.appendChild(svgEl('line', { x1: px + colW, y1: yOf(k), x2: xOf(k), y2: yOf(k), class: 'viz-edge' })));
    });

    // detail panel is created after the SVG so it sits below the tree
    let showDetail = null;

    // nodes
    allNodes.forEach(node => {
      const cx = xOf(node), cy = yOf(node);
      const isLeaf = !(Array.isArray(node.children) && node.children.length);
      const isOutgroup = viz.outgroup &&
        String(node.name).trim().toLowerCase() === String(viz.outgroup).trim().toLowerCase();

      const g = svgEl('g', { class: 'viz-node' + (isOutgroup ? ' viz-outgroup' : ''), tabindex: '0',
        role: 'button', 'aria-label': String(node.name || 'node') });
      g.dataset.id = node.__id;
      g.appendChild(svgEl('circle', { cx, cy, r: isLeaf ? 4 : 5, class: 'viz-node-dot' }));
      g.appendChild(svgText(isLeaf ? cx + 10 : cx - 8, cy + (isLeaf ? 4 : -8), node.name,
        { class: 'viz-node-label', 'text-anchor': isLeaf ? 'start' : 'end' }));
      if (isOutgroup) g.appendChild(svgText(cx + 10, cy + 16, '(outgroup)', { class: 'viz-node-sub', 'text-anchor': 'start' }));

      const act = () => {
        highlightLineage(node, svg);
        const kids = Array.isArray(node.children) ? node.children : [];
        const role = kids.length
          ? 'Most recent common ancestor of the taxa below it'
          : 'Terminal taxon (leaf)';
        // Build a lineage-aware explanation grounded in the data.
        let extra = '';
        if (node.__parent) {
          const sisters = (node.__parent.children || []).filter(k => k.__id !== node.__id).map(k => k.name);
          if (sisters.length) extra = ' Sister group: ' + sisters.join(', ') + '.';
        }
        const expl = (node.explanation ? String(node.explanation) : '') + extra;
        if (showDetail) showDetail(node.name, expl.trim(), node.page, role);
      };
      g.addEventListener('click', act);
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); } });
      svg.appendChild(g);
    });

    const wrap = el('div', 'viz-scroll');
    wrap.appendChild(svg);
    container.appendChild(wrap);

    container.appendChild(el('p', 'viz-hint',
      'Click any node: the tree highlights it, its ancestors (back to the common ancestor), and its descendants. Each internal node is the most recent common ancestor of everything below it.'));

    showDetail = makeDetailPanel(container);

    if (Array.isArray(viz.notes) && viz.notes.length) {
      const ul = el('ul', 'viz-notes');
      viz.notes.forEach(n => ul.appendChild(el('li', null, n)));
      container.appendChild(ul);
    }
  }

  function highlightLineage(node, svg) {
    svg.querySelectorAll('.viz-node').forEach(g => g.classList.remove('sel', 'ancestor', 'descendant'));
    const ancestors = new Set();
    let p = node.__parent;
    while (p) { ancestors.add(p.__id); p = p.__parent; }
    const descendants = new Set();
    (function collect(n) {
      (Array.isArray(n.children) ? n.children : []).forEach(k => { descendants.add(k.__id); collect(k); });
    })(node);
    svg.querySelectorAll('.viz-node').forEach(g => {
      const id = Number(g.dataset.id);
      if (id === node.__id) g.classList.add('sel');
      else if (ancestors.has(id)) g.classList.add('ancestor');
      else if (descendants.has(id)) g.classList.add('descendant');
    });
  }

  // ─── PROCESS FLOW (click-to-explain) ──────────────────────────
  function renderProcessFlow(container, viz) {
    const steps = Array.isArray(viz.steps) ? viz.steps : [];
    if (!steps.length) { renderNone(container, viz); return; }

    const flow = el('ol', 'viz-flow');
    const showDetail = (() => null); // placeholder, set below
    const detailSetter = { fn: null };

    steps.forEach((s, i) => {
      const li = el('li', 'viz-flow-step viz-clickable');
      li.setAttribute('tabindex', '0');
      li.setAttribute('role', 'button');
      const num = el('span', 'viz-flow-num', i + 1);
      const body = el('div', 'viz-flow-body');
      body.appendChild(el('div', 'viz-flow-label', s.label || `Step ${i + 1}`));
      if (s.detail) body.appendChild(el('div', 'viz-flow-detail', s.detail));
      li.appendChild(num);
      li.appendChild(body);

      const act = () => {
        flow.querySelectorAll('.viz-flow-step').forEach(n => n.classList.remove('sel'));
        li.classList.add('sel');
        if (detailSetter.fn) detailSetter.fn(s.label || `Step ${i + 1}`, s.explanation || s.detail || '', s.page, `Step ${i + 1} of ${steps.length}`);
      };
      li.addEventListener('click', act);
      li.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); } });
      flow.appendChild(li);
    });
    container.appendChild(flow);
    container.appendChild(el('p', 'viz-hint', 'Click any step to see a deeper explanation.'));
    detailSetter.fn = makeDetailPanel(container);
  }

  // ─── COMPARISON (click-to-explain rows) ───────────────────────
  function renderComparison(container, viz) {
    const rows = Array.isArray(viz.rows) ? viz.rows : [];
    if (!rows.length) { renderNone(container, viz); return; }

    const table = el('table', 'viz-compare');
    const thead = el('thead');
    const htr = el('tr');
    htr.appendChild(el('th', 'viz-compare-aspect', ''));
    htr.appendChild(el('th', null, viz.leftTitle || 'A'));
    htr.appendChild(el('th', null, viz.rightTitle || 'B'));
    thead.appendChild(htr);
    table.appendChild(thead);

    const detailSetter = { fn: null };
    const tbody = el('tbody');
    rows.forEach(r => {
      const tr = el('tr', 'viz-compare-row');
      const hasExpl = r.explanation && String(r.explanation).trim();
      if (hasExpl) {
        tr.classList.add('viz-clickable');
        tr.setAttribute('tabindex', '0');
        tr.setAttribute('role', 'button');
      }
      tr.appendChild(el('td', 'viz-compare-aspect', r.aspect || ''));
      tr.appendChild(el('td', null, r.left || ''));
      tr.appendChild(el('td', null, r.right || ''));
      if (hasExpl) {
        const act = () => {
          tbody.querySelectorAll('tr').forEach(n => n.classList.remove('sel'));
          tr.classList.add('sel');
          if (detailSetter.fn) detailSetter.fn(r.aspect || 'Comparison', r.explanation, r.page, 'Comparison row');
        };
        tr.addEventListener('click', act);
        tr.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); } });
      }
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    const wrap = el('div', 'viz-scroll');
    wrap.appendChild(table);
    container.appendChild(wrap);

    const anyExpl = rows.some(r => r.explanation && String(r.explanation).trim());
    if (anyExpl) {
      container.appendChild(el('p', 'viz-hint', 'Click any row to see more about that comparison.'));
      detailSetter.fn = makeDetailPanel(container);
    }
  }

  // ─── LABELED DIAGRAM (click-to-explain parts) ─────────────────
  function renderLabeledDiagram(container, viz) {
    const parts = Array.isArray(viz.parts) ? viz.parts : [];
    if (!parts.length) { renderNone(container, viz); return; }

    if (viz.centerLabel) container.appendChild(el('div', 'viz-center-label', viz.centerLabel));

    const detailSetter = { fn: null };
    const list = el('div', 'viz-parts');
    parts.forEach(p => {
      const item = el('div', 'viz-part viz-clickable');
      item.setAttribute('tabindex', '0');
      item.setAttribute('role', 'button');
      item.appendChild(el('div', 'viz-part-term', p.label || ''));
      if (p.description) item.appendChild(el('div', 'viz-part-desc', p.description));
      const act = () => {
        list.querySelectorAll('.viz-part').forEach(n => n.classList.remove('sel'));
        item.classList.add('sel');
        if (detailSetter.fn) detailSetter.fn(p.label || 'Part', p.explanation || p.description || '', p.page, 'Labeled part');
      };
      item.addEventListener('click', act);
      item.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); } });
      list.appendChild(item);
    });
    container.appendChild(list);
    container.appendChild(el('p', 'viz-hint', 'Click any part to see its explanation.'));
    detailSetter.fn = makeDetailPanel(container);
  }

  // ─── dispatch ─────────────────────────────────────────────────
  const RENDERERS = {
    phylo_tree: renderPhyloTree,
    process_flow: renderProcessFlow,
    comparison: renderComparison,
    labeled_diagram: renderLabeledDiagram,
    none: renderNone,
  };

  function render(container, viz) {
    clear(container);
    if (!viz || typeof viz !== 'object' || !viz.type) {
      renderNone(container, { title: 'No visualization available',
        explanation: 'The AI did not return a recognizable visualization.' });
      return;
    }
    const type = String(viz.type);
    const fn = RENDERERS[type];
    if (!fn) {
      renderNone(container, { title: 'Unsupported visualization type',
        explanation: `This lecture suggested a "${type}" visualization, which isn't supported yet.` });
      return;
    }
    if (type !== 'none') renderHeader(container, viz);
    fn(container, viz);
  }

  window.bioViz = { render, clear };
}());
