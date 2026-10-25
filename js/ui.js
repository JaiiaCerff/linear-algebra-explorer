/* Linear Algebra Explorer — UI components */
(function () {
  'use strict';
  const LA = window.LA; const m = LA.m; const ui = (LA.ui = {});

  ui.el = function (tag, attrs = {}, ...children) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') e.className = v; else if (k === 'text') e.textContent = v; else if (k === 'html') e.innerHTML = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
      else if (k === 'on') for (const [ev, fn] of Object.entries(v)) e.addEventListener(ev, fn);
      else if (k in e && k !== 'list' && typeof v !== 'string') e[k] = v; else e.setAttribute(k, v);
    }
    for (let c of children.flat()) { if (c === null || c === undefined || c === false) continue; if (c && !(c instanceof Node) && c.el instanceof Node) c = c.el; e.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c); }
    return e;
  };
  const el = ui.el;
  ui.frag = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content; };
  ui.colorOf = LA.basisColor;

  // ---------- math display ----------
  ui.mhtml = function (A, o = {}) {
    const d = o.decimals === undefined ? 2 : o.decimals; const rows = Array.isArray(A[0]) ? A : A.map((x) => [x]);
    const cells = rows.map((r, i) => r.map((x, j) => { const hl = o.highlightCols && o.highlightCols.includes(j) ? ' hl' : ''; const col = o.colColors ? ` style="color:${LA.basisColor(j)}"` : o.rowColors ? ` style="color:${LA.basisColor(i)}"` : ''; const txt = typeof x === 'string' ? x : m.fmt(x, d); return `<span class="mc${hl}"${col}>${txt}</span>`; }).join('')).join('');
    const n = rows[0].length;
    return `<span class="mat${o.small ? ' small' : ''}${o.cls ? ' ' + o.cls : ''}"><span class="br l"></span><span class="mg" style="grid-template-columns:repeat(${n},auto)">${cells}</span><span class="br r"></span></span>`;
  };
  ui.matrixHTML = (A, o) => { const w = el('span', { class: 'mwrap' }); if (o && o.label) w.appendChild(el('span', { class: 'mlabel', html: o.label })); w.appendChild(ui.frag(ui.mhtml(A, o))); return w; };
  ui.vhtml = (v, o = {}) => ui.mhtml(v.map((x) => [x]), o);
  ui.math = (html) => `<span class="m">${html}</span>`;
  ui.formula = (html) => el('div', { class: 'formula', html });

  // ---------- matrix editor ----------
  ui.matrixEditor = function (o) {
    let A = m.clone(o.matrix); let rows = m.rows(A), cols = m.cols(A);
    const wrap = el('div', { class: 'mat-editor' + (o.small ? ' small' : '') });
    const grid = el('div', { class: 'mg' }); let inputs = [];
    const label = o.label ? el('div', { class: 'me-label', html: o.label }) : null;
    const body = el('div', { class: 'me-body' }, el('span', { class: 'br l' }), grid, el('span', { class: 'br r' }));
    if (label) wrap.appendChild(label); wrap.appendChild(body);
    function build() {
      grid.innerHTML = ''; inputs = []; grid.style.gridTemplateColumns = `repeat(${cols}, auto)`;
      for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
        const inp = el('input', { type: 'text', class: 'mcell', value: m.fmt(A[i][j], 3).replace('−', '-'), autocomplete: 'off', spellcheck: false, 'aria-label': `entry row ${i + 1} column ${j + 1}` });
        if (o.colColors !== false) inp.style.color = LA.basisColor(j);
        if (o.rowColors) inp.style.color = LA.basisColor(i);
        inp.addEventListener('input', () => { const v = m.parseNum(inp.value); if (Number.isNaN(v)) { inp.classList.add('bad'); return; } inp.classList.remove('bad'); A[i][j] = v; o.onChange && o.onChange(m.clone(A)); });
        inp.addEventListener('blur', () => { inp.value = m.fmt(A[i][j], 3).replace('−', '-'); inp.classList.remove('bad'); });
        inp.addEventListener('focus', () => inp.select());
        inp.addEventListener('keydown', (e) => {
          const step = e.altKey ? 0.01 : e.shiftKey ? 1 : 0.1;
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); A[i][j] = Math.round((A[i][j] + (e.key === 'ArrowUp' ? step : -step)) * 1000) / 1000; inp.value = m.fmt(A[i][j], 3).replace('−', '-'); o.onChange && o.onChange(m.clone(A)); }
          if (e.key === 'Enter') { inp.blur(); const nx = inputs[i * cols + j + 1]; if (nx) nx.focus(); }
        });
        inp.addEventListener('wheel', (e) => { if (document.activeElement !== inp) return; e.preventDefault(); const step = e.shiftKey ? 1 : 0.1; A[i][j] = Math.round((A[i][j] - Math.sign(e.deltaY) * step) * 1000) / 1000; inp.value = m.fmt(A[i][j], 3).replace('−', '-'); o.onChange && o.onChange(m.clone(A)); }, { passive: false });
        // drag-to-scrub on the cell with the pointer held for a moment
        let drag = null;
        inp.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, v: A[i][j], moved: false }; });
        inp.addEventListener('pointermove', (e) => { if (!drag || e.buttons === 0) return; const dx = e.clientX - drag.x; if (!drag.moved && Math.abs(dx) < 6) return; if (!drag.moved) { drag.moved = true; inp.setPointerCapture(e.pointerId); inp.blur(); } A[i][j] = Math.round((drag.v + dx * 0.02) * 100) / 100; inp.value = m.fmt(A[i][j], 3).replace('−', '-'); o.onChange && o.onChange(m.clone(A)); });
        inp.addEventListener('pointerup', (e) => { if (drag && drag.moved) { try { inp.releasePointerCapture(e.pointerId); } catch (_) {} } drag = null; });
        inputs.push(inp); grid.appendChild(inp);
      }
    }
    build();
    const api = {
      el: wrap,
      get: () => m.clone(A),
      set(B, silent) { A = m.clone(B); if (m.rows(A) !== rows || m.cols(A) !== cols) { rows = m.rows(A); cols = m.cols(A); build(); } else inputs.forEach((inp, k) => { if (document.activeElement !== inp) inp.value = m.fmt(A[Math.floor(k / cols)][k % cols], 3).replace('−', '-'); }); if (!silent && o.onChange) o.onChange(m.clone(A)); },
      refresh() { inputs.forEach((inp, k) => { if (document.activeElement !== inp) inp.value = m.fmt(A[Math.floor(k / cols)][k % cols], 3).replace('−', '-'); }); },
      update(B) { A = m.clone(B); api.refresh(); },
    };
    return api;
  };
  ui.vectorEditor = function (o) { const ed = ui.matrixEditor({ ...o, matrix: o.vector.map((x) => [x]), colColors: false, onChange: (A) => o.onChange && o.onChange(A.map((r) => r[0])) }); if (o.color) ed.el.querySelectorAll('input').forEach((i) => (i.style.color = o.color)); return { el: ed.el, get: () => ed.get().map((r) => r[0]), set: (v, s) => ed.set(v.map((x) => [x]), s), update: (v) => ed.update(v.map((x) => [x])) }; };

  // ---------- controls ----------
  ui.slider = function (o) {
    const val = el('span', { class: 'sl-val' }); const inp = el('input', { type: 'range', min: o.min, max: o.max, step: o.step || 0.01, value: o.value });
    const fmt = o.format || ((v) => m.fmt(v)); val.textContent = fmt(o.value);
    inp.addEventListener('input', () => { const v = parseFloat(inp.value); val.textContent = fmt(v); o.onChange && o.onChange(v); });
    const wrap = el('label', { class: 'slider' }, el('span', { class: 'sl-head' }, el('span', { class: 'sl-label', html: o.label || '' }), val), inp);
    return { el: wrap, get: () => parseFloat(inp.value), set(v) { inp.value = v; val.textContent = fmt(v); } };
  };
  ui.select = function (o) {
    const sel = el('select'); for (const op of o.options) sel.appendChild(el('option', { value: op.value, text: op.label, selected: op.value === o.value }));
    sel.addEventListener('change', () => o.onChange && o.onChange(sel.value));
    const wrap = el('label', { class: 'select' }, o.label ? el('span', { class: 'sl-label', html: o.label }) : null, sel);
    return { el: wrap, get: () => sel.value, set(v) { sel.value = v; } };
  };
  ui.button = (label, onClick, o = {}) => el('button', { class: 'btn' + (o.primary ? ' primary' : '') + (o.small ? ' small' : '') + (o.cls ? ' ' + o.cls : ''), html: label, title: o.title, on: { click: onClick } });
  ui.toggle = function (o) {
    const inp = el('input', { type: 'checkbox', checked: !!o.value }); inp.addEventListener('change', () => o.onChange && o.onChange(inp.checked));
    const wrap = el('label', { class: 'toggle' }, inp, el('span', { html: o.label }));
    return { el: wrap, get: () => inp.checked, set(v) { inp.checked = v; } };
  };
  ui.stepper = function (o) {
    let v = o.value; const val = el('span', { class: 'st-val', text: v });
    const upd = (nv) => { nv = m.clamp(nv, o.min, o.max); if (nv === v) return; v = nv; val.textContent = v; o.onChange && o.onChange(v); };
    const wrap = el('div', { class: 'stepper' }, el('span', { class: 'sl-label', html: o.label }), el('span', { class: 'st-ctl' }, ui.button('−', () => upd(v - 1), { small: true }), val, ui.button('+', () => upd(v + 1), { small: true })));
    return { el: wrap, get: () => v, set(nv) { v = nv; val.textContent = v; } };
  };
  ui.readout = function (rows) {
    const table = el('table', { class: 'readout' });
    const api = { el: table, update(rs) { table.innerHTML = ''; for (const r of rs) { if (!r) continue; const td = el('td', { class: 'rv' }); if (r.value instanceof Node) td.appendChild(r.value); else td.innerHTML = r.value === undefined ? '' : String(r.value); if (r.color) td.style.color = r.color; table.appendChild(el('tr', { class: r.cls }, el('td', { class: 'rk', html: r.label }), td)); } } };
    api.update(rows || []); return api;
  };
  ui.group = (title, ...children) => el('section', { class: 'group' }, title ? el('h3', { html: title }) : null, ...children);
  ui.row = (...children) => el('div', { class: 'row' }, ...children);
  ui.prose = (html) => el('div', { class: 'prose', html });
  ui.note = (html) => el('p', { class: 'note', html });
  ui.matDisplay = function () { const w = el('div', { class: 'mat-display' }); return { el: w, set(html) { w.innerHTML = html; } }; };

  // animation player: slider + play/reset
  ui.player = function (o) {
    const max = o.max || 1; let t = o.value || 0; let tw = null;
    const slider = ui.slider({ label: o.label || 'Animate', min: 0, max, step: 0.001, value: t, format: (v) => m.fmt(v, 2), onChange: (v) => { stop(); set(v); } });
    const playBtn = ui.button('▶ Play', () => (tw ? stop() : play()), { primary: true, small: true });
    const resetBtn = ui.button('↺ Reset', () => { stop(); set(0); }, { small: true });
    function set(v) { t = v; slider.set(v); o.onChange && o.onChange(t); }
    function stop() { if (tw) { tw.cancel(); tw = null; } playBtn.innerHTML = '▶ Play'; }
    function play() {
      stop(); const from = t >= max - 1e-6 ? 0 : t; const dur = (o.duration || 1800) * ((max - from) / max);
      playBtn.innerHTML = '❚❚ Pause';
      tw = LA.anim.tween({ duration: Math.max(200, dur), ease: o.ease || 'inOut', onUpdate: (u) => set(from + (max - from) * u), onDone: () => { tw = null; playBtn.innerHTML = '▶ Play'; } });
    }
    const wrap = el('div', { class: 'player' }, slider.el, el('div', { class: 'row' }, playBtn, resetBtn, ...(o.extra || [])));
    return { el: wrap, get t() { return t; }, set, play, stop, reset: () => { stop(); set(0); } };
  };

  // Formatting helpers for eigen / complex / vectors in HTML
  ui.fmtVecHTML = (v, color) => `<span class="m" style="${color ? 'color:' + color : ''}">(${v.map((x) => m.fmt(x)).join(', ')})</span>`;
  ui.sub = (s) => `<sub>${s}</sub>`;
  ui.sup = (s) => `<sup>${s}</sup>`;
})();
