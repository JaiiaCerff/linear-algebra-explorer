/* Chapter: Non-square matrices — maps between spaces of different dimension */
(function () {
  'use strict';
  const LA = window.LA; const m = LA.m; const ui = LA.ui; const el = ui.el; const T = LA.theme;
  const PRESETS = [
    { label: '2×3  flatten space onto the plane (drop z)', M: [[1, 0, 0], [0, 1, 0]] }, { label: '2×3  oblique flattening', M: [[1, 0, 0.6], [0, 1, 0.4]] }, { label: '2×3  rank 1: space onto a line', M: [[1, 2, 0], [2, 4, 0]] },
    { label: '3×2  embed the plane as the floor', M: [[1, 0], [0, 1], [0, 0]] }, { label: '3×2  tilted plane in space', M: [[1, 0], [0, 1], [0.5, 0.7]] }, { label: '3×2  rank 1: plane onto a line in space', M: [[1, 2], [1, 2], [0, 0]] },
    { label: '1×3  space onto a number line (dot with (1,2,3))', M: [[1, 2, 3]] }, { label: '3×1  number line into space', M: [[1], [2], [0.5]] },
    { label: '1×2  plane onto a number line (dot with (2,1))', M: [[2, 1]] }, { label: '2×1  number line into the plane', M: [[1], [0.5]] },
    { label: '2×2  square, for comparison', M: [[1, 1], [0, 1]] }, { label: '3×3  square, rank 2', M: [[1, 0, 1], [0, 1, 1], [1, 1, 2]] },
  ];
  LA.chapters.push({
    id: 'nonsquare', title: 'Non-square matrices', group: 'Dimension', order: 8, summary: 'An m×n matrix sends ℝⁿ into ℝᵐ — dimensions get created, flattened or lost',
    mount(ctx) {
      const S = { A: [[1, 0, 0.6], [0, 1, 0.4]], x: [1, 1, 1], t: 1, view: 'split', fiber: true, rowsp: false, lattice: true };
      const nIn = () => m.cols(S.A), mOut = () => m.rows(S.A);
      let scenes = [], player = null;
      const stepN = ui.stepper({ label: 'input dimension n', value: nIn(), min: 1, max: 3, onChange: (n) => setDims(mOut(), n) });
      const stepM = ui.stepper({ label: 'output dimension m', value: mOut(), min: 1, max: 3, onChange: (mm) => setDims(mm, nIn()) });
      const sel = ui.select({ label: 'Preset', options: [{ value: '', label: '— choose —' }].concat(PRESETS.map((p, i) => ({ value: i, label: p.label }))), value: '', onChange: (i) => { if (i === '') return; S.A = m.clone(PRESETS[i].M); S.x = m.vpad(S.x, nIn()).map((v, k) => (v === 0 ? 1 : v)); stepN.set(nIn()); stepM.set(mOut()); build(); } });
      let ed, xEd;
      const viewBtns = el('div', { class: 'chips' });
      const setView = (v) => { S.view = v; build(); };
      const mkChips = () => { viewBtns.innerHTML = ''; for (const [k, l] of [['split', 'Input ↔ Output'], ['combined', 'Combined view (animate)']]) viewBtns.appendChild(el('button', { class: 'chip' + (S.view === k ? ' active' : ''), text: l, on: { click: () => setView(k) } })); };
      function setDims(mm, n) { S.A = m.resize(S.A, mm, n); S.x = m.vpad(S.x, n).map((v, k) => (k >= 0 && v === 0 && k >= S.x.length ? 1 : v)); stepN.set(n); stepM.set(mm); build(); }
      const ro = ui.readout([]); const disp = ui.matDisplay(); const story = el('p', { class: 'note' });
      const tg = (k, label) => ui.toggle({ label, value: S[k], onChange: (v) => { S[k] = v; redraw(); } });
      const ctrlTop = ui.group('Shape of the matrix', ui.row(stepM.el, el('span', { class: 'mlabel', text: '×' }), stepN.el), ui.row(sel.el, ui.button('Transpose (swap m and n)', () => { S.A = m.transpose(S.A); S.x = m.vpad(S.x, nIn()).map((v, k) => (v === 0 ? 1 : v)); stepN.set(nIn()); stepM.set(mOut()); build(); }, { small: true }), ui.button('Random', () => { S.A = m.randMat(mOut(), nIn(), -2, 2, 0.5); build(); }, { small: true })));
      const ctrlMat = el('div'); const ctrlView = el('div');
      ctx.controls.appendChild(ctrlTop); ctx.controls.appendChild(ctrlMat); ctx.controls.appendChild(ctrlView);
      ctx.controls.appendChild(ui.group('What this matrix does', story, ro.el, disp.el));
      const redraw = () => scenes.forEach((s) => s.requestDraw());

      function analyse() { const A = S.A; const r = m.rank(A); const N = m.nullspace(A); const C = m.colspace(A); return { r, N, C, nullity: nIn() - r, inj: nIn() - r === 0, surj: r === mOut() }; }
      function refresh() {
        const A = S.A, n = nIn(), mm = mOut(); const an = analyse(); const Ax = m.apply(A, S.x);
        const dimName = (d) => ['a point', 'a line', 'a plane', 'all of space'][d];
        const what = n === mm ? `A square ${mm}×${n} matrix maps ℝ${'⁰¹²³'[n]} to itself.` : n > mm ? `A ${mm}×${n} matrix takes ${n}-dimensional input and produces ${mm}-dimensional output: at least ${n - mm} dimension${n - mm > 1 ? 's' : ''} must be crushed.` : `A ${mm}×${n} matrix takes ${n}-dimensional input and places it inside ${mm}-dimensional space: the image can be at most ${n}-dimensional, so it never fills ℝ${'⁰¹²³'[mm]}.`;
        story.innerHTML = `${what} Here the image (column space) is <b class="c">${dimName(an.r)}</b> in ℝ${'⁰¹²³'[mm]} and the null space is <b class="n">${dimName(an.nullity)}</b> in ℝ${'⁰¹²³'[n]}: every input vector in that null space lands on the origin, and inputs that differ by a null-space vector land on the same output.`;
        ro.update([
          { label: 'map', value: `A : ℝ${'⁰¹²³'[n]} → ℝ${'⁰¹²³'[mm]}  (${mm} rows × ${n} columns; each column lives in ℝ${'⁰¹²³'[mm]})` },
          { label: 'rank', value: `${an.r} = dim of image` }, { label: 'nullity', value: `${an.nullity} = dim of null space` }, { label: 'rank + nullity', value: `${an.r} + ${an.nullity} = ${n} = n  (rank–nullity theorem)` },
          { label: 'one-to-one (injective)?', value: an.inj ? 'yes — distinct inputs stay distinct' : 'no — a whole ' + dimName(an.nullity) + ' collapses to each output', color: an.inj ? T.good : T.warn },
          { label: 'onto (surjective)?', value: an.surj ? 'yes — every output is hit' : 'no — image is only ' + dimName(an.r) + ' inside ℝ' + '⁰¹²³'[mm], color: an.surj ? T.good : T.warn },
          { label: 'invertible?', value: an.inj && an.surj ? 'yes (square and full rank)' : n !== mm ? 'never for a non-square matrix' : 'no', color: an.inj && an.surj ? T.good : T.warn },
          { label: 'column space basis', value: an.C.length ? an.C.map((v) => m.fmtVec(v)).join(', ') : '{0}', color: T.colsp }, { label: 'null space basis', value: an.N.length ? an.N.map((v) => m.fmtVec(v)).join(', ') : '{0}', color: T.nul },
        ]);
        disp.set(`A<b class="v">x</b> = ${ui.mhtml(A, { colColors: true })}${ui.vhtml(S.x)} = ${S.x.map((xi, j) => `<b class="v">${m.fmt(xi)}</b>·${ui.vhtml(m.col(A, j))}`).join(' + ')} = ${ui.vhtml(Ax)}`);
        if (ed) ed.update(A); if (xEd) xEd.update(S.x);
        redraw();
      }
      // ---------- drawing helpers for each dimension ----------
      const drawInput = (s, dim) => {
        const an = analyse(); const n = nIn(); const x = S.x;
        if (dim === 1) {
          s.baseGrid(); if (an.nullity === 1) s.shadeAll(T.nul, 0.12);
          s.polygon([[0, -0.12], [1, -0.12], [1, 0.12], [0, 0.12]], { fill: 'rgba(255,255,255,0.12)' }); s.vector1D(1, { level: 1, color: T.i, label: 'î' }); s.vector1D(x[0], { level: 0, color: T.vec, label: 'x' });
          s.caption(an.nullity ? 'the whole line is the null space (A = 0)' : 'input: the number line ℝ¹', { y: 36 });
        } else if (dim === 2) {
          s.baseGrid(); if (an.nullity === 2) s.shadeAll(T.nul, 0.12);
          if (an.nullity === 1) s.subspaceLine(an.N[0], { color: T.nul, width: 3 }); if (S.rowsp && an.r >= 1 && an.r < 2) s.subspaceLine(m.rowspace(S.A)[0], { color: T.rowsp, width: 2, dash: [8, 5] });
          if (S.fiber && an.nullity === 1 && m.vnorm(x) > 1e-9) s.infiniteLine(x, an.N[0], { color: T.nul, width: 1.5, dash: [5, 5], alpha: 0.8 });
          s.polygon(m.squarePts(), { fill: 'rgba(255,255,255,0.06)', stroke: 'rgba(255,255,255,0.3)', width: 1 }); s.basis(m.identity(2)); s.vector(x, { color: T.vec, label: 'x' });
          if (an.nullity === 1) s.text(m.vscale(m.vnormalize(an.N[0]), 3), 'null space', { color: T.nul, dy: -8 });
        } else {
          s.axes({ length: 4 }); s.grid(m.identity(3), { range: 3, color: 'rgba(255,255,255,0.08)', axisColor: 'rgba(255,255,255,0.18)' });
          if (an.nullity === 1) s.lineSpan(an.N[0], { color: T.nul, size: 5, width: 3 }); if (an.nullity === 2) s.planePatch(an.N[0], an.N[1], { size: 3, fill: 'rgba(214,120,255,0.18)', lineColor: 'rgba(214,120,255,0.4)' }); if (an.nullity === 3) s.lattice(m.identity(3), { range: 2, color: T.nul, alpha: 0.4 });
          if (S.rowsp && an.r === 1) s.lineSpan(m.rowspace(S.A)[0], { color: T.rowsp, size: 5, dash: [8, 5] }); if (S.rowsp && an.r === 2) { const R = m.rowspace(S.A); s.planePatch(R[0], R[1], { size: 3, fill: 'rgba(255,209,102,0.1)', lineColor: 'rgba(255,209,102,0.35)' }); }
          if (S.fiber && an.nullity === 1 && m.vnorm(x) > 1e-9) { const d = m.vnormalize(an.N[0]); s.line(m.vadd(x, m.vscale(d, -5)), m.vadd(x, m.vscale(d, 5)), { color: T.nul, width: 1.5, dash: [5, 5] }); }
          if (S.fiber && an.nullity === 2 && m.vnorm(x) > 1e-9) { const [u, w] = m.gramSchmidt(an.N); const P = (a, b) => m.vadd(x, m.vadd(m.vscale(u, a), m.vscale(w, b))); s.polygon([P(-2, -2), P(2, -2), P(2, 2), P(-2, 2)], { fill: 'rgba(214,120,255,0.12)', stroke: 'rgba(214,120,255,0.5)' }); }
          s.cube(m.identity(3), { faces: false, stroke: 'rgba(255,255,255,0.3)' }); s.basis(m.identity(3)); s.vector(x, { color: T.vec, width: 3, label: 'x' });
        }
      };
      const drawOutput = (s, dim) => {
        const A = S.A, n = nIn(), an = analyse(); const Ax = m.apply(A, S.x); const cols = [...Array(n).keys()].map((j) => m.col(A, j));
        const verts = n === 1 ? [[0], [1]] : n === 2 ? m.squarePts() : m.cubeVerts(); const img = verts.map((p) => m.apply(A, p));
        if (dim === 1) {
          s.baseGrid(); if (an.r === 1) s.shadeAll(T.colsp, 0.08);
          const lo = Math.min(...img.map((p) => p[0])), hi = Math.max(...img.map((p) => p[0])); s.polygon([[lo, -0.12], [hi, -0.12], [hi, 0.12], [lo, 0.12]], { fill: 'rgba(255,255,255,0.14)' });
          cols.forEach((c, j) => s.vector1D(c[0], { level: j + 1, color: LA.basisColor(j), label: 'A' + LA.basisName(j, n) + ' = ' + m.fmt(c[0]) }));
          s.vector1D(Ax[0], { level: 0, color: T.vec, label: 'Ax = ' + m.fmt(Ax[0]) });
          s.caption(an.r === 1 ? 'image = the whole line; the shaded interval is the image of the unit ' + ['', 'interval', 'square', 'cube'][n] : 'image = just the origin', { y: 36 });
        } else if (dim === 2) {
          s.baseGrid();
          if (n === 1) { if (an.r) { s.subspaceLine(cols[0], { color: T.colsp, width: 2.5, alpha: 0.6 }); for (let k = -8; k <= 8; k++) s.point(m.vscale(cols[0], k), { color: T.grid, r: 2.5 }); } }
          else if (n === 2) { s.grid(A, { alpha: 0.8 }); if (an.r === 1) s.subspaceLine(an.C[0], { color: T.colsp, width: 3, alpha: 0.6 }); }
          else { if (S.lattice) { const N = 2; for (let a = -N; a <= N; a++) for (let b = -N; b <= N; b++) { s.line(m.apply(A, [a, b, -N]), m.apply(A, [a, b, N]), { color: T.grid, width: 1, alpha: 0.35 }); s.line(m.apply(A, [a, -N, b]), m.apply(A, [a, N, b]), { color: T.grid, width: 1, alpha: 0.35 }); s.line(m.apply(A, [-N, a, b]), m.apply(A, [N, a, b]), { color: T.grid, width: 1, alpha: 0.35 }); } } if (an.r === 1) s.subspaceLine(an.C[0], { color: T.colsp, width: 3, alpha: 0.6 }); if (an.r === 2) s.shadeAll(T.colsp, 0.05); }
          if (n === 2) s.polygon(img, { fill: 'rgba(255,255,255,0.08)', stroke: 'rgba(255,255,255,0.45)', width: 1 });
          if (n === 3) for (const [a, b] of m.cubeEdges()) s.line(img[a], img[b], { color: 'rgba(255,255,255,0.5)', width: 1 });
          if (n === 1) s.line(img[0], img[1], { color: 'rgba(255,255,255,0.8)', width: 5, alpha: 0.5 });
          cols.forEach((c, j) => s.vector(c, { color: LA.basisColor(j), width: 3, label: 'A' + LA.basisName(j, n) })); s.vector(Ax, { color: T.vec, label: 'Ax' });
          s.caption(['image = origin only', 'image = the teal line (rank 1)', 'image = the whole plane (rank 2)'][an.r], { y: 36 });
        } else {
          s.axes({ length: 4 }); s.grid(m.identity(3), { range: 3, color: 'rgba(255,255,255,0.06)', axisColor: 'rgba(255,255,255,0.14)' });
          if (an.r === 2) s.planePatch(an.C[0], an.C[1], { size: 4, fill: 'rgba(78,205,196,0.14)', lineColor: 'rgba(78,205,196,0.25)' }); if (an.r === 1) s.lineSpan(an.C[0], { color: T.colsp, size: 7, width: 2.5 });
          if (n === 1) { if (an.r) for (let k = -6; k <= 6; k++) s.point(m.vscale(cols[0], k), { color: T.grid, r: 2.5 }); s.line(img[0], img[1], { color: 'rgba(255,255,255,0.8)', width: 5, alpha: 0.6 }); }
          if (n === 2) { s.grid(A, { range: 4, alpha: 0.8 }); s.polygon(img, { fill: 'rgba(255,255,255,0.15)' }); s.polyline(img, { close: true, color: 'rgba(255,255,255,0.6)', width: 1 }); }
          if (n === 3) { if (S.lattice) s.lattice(A, { range: 2, alpha: 0.3 }); s.cube(A, { alpha: 0.4 }); }
          cols.forEach((c, j) => s.vector(c, { color: LA.basisColor(j), width: 3, label: 'A' + LA.basisName(j, n) })); s.vector(Ax, { color: T.vec, width: 3, label: 'Ax' });
          s.caption(['image = origin only', 'image = the teal line (rank 1)', 'image = the teal plane (rank 2)', 'image = all of space (rank 3)'][an.r], { y: 36 });
        }
      };
      const drawCombined = (s, D) => {
        const n = nIn(), mm = mOut(); const At = m.pad(S.A, D, D); const M = m.lerp(m.identity(D), At, S.t); const an = analyse();
        if (D === 2) {
          s.baseGrid();
          if (mm === 1) { s.shadeAll(T.colsp, 0.03); s.infiniteLine([0, 0], [1, 0], { color: T.colsp, width: 4, alpha: 0.35 }); s.text([4, 0], 'output axis ℝ¹', { color: T.colsp, dy: -10 }); }
          if (n === 2) { s.grid(M, { alpha: 0.8 }); s.polygon(m.squarePts().map((p) => m.apply(M, p)), { fill: 'rgba(255,255,255,0.08)', stroke: 'rgba(255,255,255,0.4)' }); s.basis(M); if (an.nullity === 1) s.subspaceLine(an.N[0], { color: T.nul, width: 2, dash: [6, 5] }); }
          else { for (let k = -12; k <= 12; k++) { const p = m.apply(M, [k, 0]); s.point(p, { color: T.grid, r: 2.5 }); } s.line(m.apply(M, [-12, 0]), m.apply(M, [12, 0]), { color: T.gridAxis, width: 2 }); s.line(m.apply(M, [0, 0]), m.apply(M, [1, 0]), { color: 'rgba(255,255,255,0.8)', width: 5, alpha: 0.5 }); s.vector(m.apply(M, [1, 0]), { color: T.i, width: 3, label: 'î' }); }
          s.vector(m.apply(M, m.vpad(S.x, 2)), { color: T.vec, width: 3, label: S.t < 1 ? 'x' : 'Ax' });
        } else {
          s.axes({ length: 4 });
          if (mm === 2) s.planePatch([1, 0, 0], [0, 1, 0], { size: 4, fill: 'rgba(78,205,196,0.08)', lineColor: 'rgba(78,205,196,0.18)', step: 1 }); if (mm === 1) s.lineSpan([1, 0, 0], { color: T.colsp, size: 6, width: 4, alpha: 0.35 });
          if (mm < 3) s.text(mm === 2 ? [3.5, 3.5, 0] : [4.5, 0, 0], mm === 2 ? 'output plane ℝ²' : 'output axis ℝ¹', { color: T.colsp });
          if (n === 3) { if (S.lattice) s.lattice(M, { range: 2, alpha: 0.4 }); s.grid(M, { range: 3, alpha: 0.7 }); s.cube(M, { alpha: 0.4 }); s.basis(M); if (an.nullity === 1) s.lineSpan(an.N[0], { color: T.nul, size: 5, dash: [6, 5] }); if (an.nullity === 2) s.planePatch(an.N[0], an.N[1], { size: 3, fill: 'rgba(214,120,255,0.12)', lineColor: 'rgba(214,120,255,0.35)' }); }
          else if (n === 2) { s.grid(M, { range: 3, alpha: 0.8 }); const sq = m.squarePts().map((p) => m.apply(M, [p[0], p[1], 0])); s.polygon(sq, { fill: 'rgba(255,255,255,0.15)' }); s.polyline(sq, { close: true, color: 'rgba(255,255,255,0.6)', width: 1 }); s.basis(m.crop(M, 3, 2)); if (an.nullity === 1) s.lineSpan(m.vpad(an.N[0], 3), { color: T.nul, size: 5, dash: [6, 5] }); }
          else { for (let k = -6; k <= 6; k++) s.point(m.apply(M, [k, 0, 0]), { color: T.grid, r: 2.5 }); s.line(m.apply(M, [-6, 0, 0]), m.apply(M, [6, 0, 0]), { color: T.gridAxis, width: 2 }); s.line([0, 0, 0], m.apply(M, [1, 0, 0]), { color: 'rgba(255,255,255,0.8)', width: 5, alpha: 0.5 }); s.vector(m.apply(M, [1, 0, 0]), { color: T.i, width: 3, label: 'î' }); }
          s.vector(m.apply(M, m.vpad(S.x, 3)), { color: T.vec, width: 3, label: S.t < 1 ? 'x' : 'Ax' });
        }
        s.caption(S.t < 1 ? `morphing: input ℝ${'⁰¹²³'[n]} is being carried into the output ℝ${'⁰¹²³'[mm]} (teal)` : n > mm ? `done: ℝ${'⁰¹²³'[n]} has been flattened onto the teal ℝ${'⁰¹²³'[mm]}` : `done: ℝ${'⁰¹²³'[n]} now sits inside ℝ${'⁰¹²³'[mm]} as its image`, { y: 36, color: T.text });
      };
      const mkScene = (canvas, dim, extra = {}) => (dim === 3 ? new LA.Scene3D(canvas, { dist: 9, ...extra }) : new LA.Scene2D(canvas, { scale: dim === 1 ? 70 : 55, oneD: dim === 1, ...extra }));
      const sup = (d) => '⁰¹²³'[d];
      function build() {
        scenes.forEach((s) => s.destroy()); scenes = []; if (player) player.stop(); ctx.stage.innerHTML = ''; ctrlMat.innerHTML = ''; ctrlView.innerHTML = '';
        const n = nIn(), mm = mOut(); S.x = m.vpad(S.x, n); if (S.view === 'combined' && n === mm) S.view = 'split'; mkChips();
        ed = ui.matrixEditor({ matrix: S.A, label: `A is ${mm}×${n}: ${mm} rows, ${n} columns — column j is where ${n <= 3 ? 'the j-th basis vector' : 'eⱼ'} of ℝ${sup(n)} lands in ℝ${sup(mm)}`, onChange: (A) => { S.A = A; refresh(); } });
        xEd = ui.vectorEditor({ vector: S.x, color: T.vec, onChange: (x) => { S.x = x; refresh(); } });
        ctrlMat.appendChild(ui.group('Matrix', ed.el, ui.row(el('span', { class: 'mlabel', html: 'sample input <b class="v">x</b> =' }), xEd.el)));
        const viewGroup = ui.group('View', viewBtns);
        if (S.view === 'split') {
          const vin = ctx.view(`<b>Input space ℝ${sup(n)}</b> — purple = null space (sent to 0)${S.fiber ? ', dashed = all inputs that share x’s output' : ''}`);
          const vout = ctx.view(`<b>Output space ℝ${sup(mm)}</b> — columns of A, the image of the input grid, teal = column space`);
          const sIn = mkScene(vin.canvas, n), sOut = mkScene(vout.canvas, mm); scenes = [sIn, sOut];
          sIn.onDraw = (s) => drawInput(s, n); sOut.onDraw = (s) => drawOutput(s, mm);
          if (n <= 2) sIn.addHandle({ get: () => m.vpad(S.x, 2), set: (p) => { S.x = p.slice(0, n); refresh(); }, color: T.vec });
          viewGroup.appendChild(ui.row(tg('fiber', 'Show the set of inputs with the same output as x'), tg('rowsp', 'Show row space (⊥ null space)'), tg('lattice', 'Show lattice when input is 3D')));
          ctx.hint(n <= 2 ? 'Drag x in the input space · edit A on the right · teal = image, purple = null space' : 'Edit x and A on the right · drag to orbit the 3D views');
        } else {
          const D = Math.max(n, mm);
          const v = ctx.view(`<b>Combined view in ℝ${sup(D)}</b> — the input ℝ${sup(n)} is morphed by A; the teal ℝ${sup(mm)} is where outputs live`);
          const s = mkScene(v.canvas, D); scenes = [s]; s.onDraw = (sc) => drawCombined(sc, D);
          player = ui.player({ label: 'Animate identity → A (padded to a square matrix)', value: S.t, onChange: (t) => { S.t = t; redraw(); } });
          viewGroup.appendChild(player.el); viewGroup.appendChild(ui.row(tg('lattice', 'Show lattice when input is 3D')));
          viewGroup.appendChild(ui.note(n > mm ? `Flattening: a ${mm}×${n} matrix is padded with zero rows to ${D}×${D}; the extra output coordinates are crushed, so the input grid lands on the teal subspace.` : `Embedding: a ${mm}×${n} matrix is padded with zero columns; only the input subspace (first ${n} coordinates) is drawn, and it tilts into ℝ${sup(mm)}.`));
          ctx.hint('Press ▶ to watch the input space being carried into the output space');
        }
        ctrlView.appendChild(viewGroup);
        refresh();
      }
      build();
      ctx.onUnmount(() => { scenes.forEach((s) => s.destroy()); player && player.stop(); });
      ctx.notes.appendChild(ui.prose(`
<h2>Changing the number of dimensions</h2>
<p>An <span class="m">m × n</span> matrix has <span class="m">n</span> columns, each with <span class="m">m</span> entries. Read it as before — column <span class="m">j</span> is where the <span class="m">j</span>-th basis vector lands — and you see that the inputs live in ℝⁿ while the outputs live in ℝᵐ. A 2×3 matrix eats 3-vectors and returns 2-vectors: it is a map from space to the plane. A 3×2 matrix is a map from the plane into space.</p>
<div class="def"><h4>Square or not, the geometry is the same</h4>
<p>Linearity still forces the origin to stay put, lines to stay lines, and grid lines to stay parallel and evenly spaced. What changes is bookkeeping: the image of ℝⁿ is the <b>column space</b>, a subspace of ℝᵐ of dimension <b>rank</b> ≤ min(m, n). Whatever is not accounted for in the output must have been crushed: <span class="m">rank + nullity = n</span>.</p></div>
<h4>Tall versus wide</h4>
<ul>
<li><b>Wide (m &lt; n), e.g. 2×3.</b> Too many input dimensions to fit: at least <span class="m">n − m</span> dimensions collapse. The null space is never trivial, so the map is never one-to-one; a whole line (or plane) of inputs lands on each output. It <em>can</em> be onto.</li>
<li><b>Tall (m &gt; n), e.g. 3×2.</b> Too few columns to reach everything: the image is at most <span class="m">n</span>-dimensional inside ℝᵐ — a plane or line floating in space. The map is never onto; it <em>can</em> be one-to-one.</li>
<li><b>Neither can be inverted.</b> An inverse would have to be both one-to-one and onto. There are however one-sided inverses and a canonical "best effort" inverse, the pseudoinverse <span class="m">A⁺</span> (see <a href="#svd">SVD</a>).</li>
</ul>
<h4>Fibres: what "collapsing" looks like</h4>
<p>Pick an output <span class="m">A<b>x</b></span>. The set of all inputs with that same output is <span class="m"><b>x</b> + null(A)</span> — a copy of the null space shifted to <b>x</b> (the dashed line/plane in the input view). The input space is sliced into these parallel fibres, and the matrix sends each whole fibre to a single point. That is the precise sense in which a non-square matrix "changes the shape" of a space: it is a projection-like map whose fibres are affine copies of the null space, followed by an embedding of the quotient into ℝᵐ.</p>
<h4>The transpose goes back the other way</h4>
<p><span class="m">Aᵀ</span> is <span class="m">n × m</span>: it maps outputs back to inputs. Its column space is the <b>row space</b> of <span class="m">A</span>, which is exactly the orthogonal complement of the null space (toggle "row space"). This is the start of the <em>four fundamental subspaces</em>: row(A) ⊥ null(A) in ℝⁿ and col(A) ⊥ null(Aᵀ) in ℝᵐ.</p>
<div class="try"><h4>Try this</h4><ul>
<li>Load <em>2×3 flatten space</em>. In the input view the null space is the z-axis; drag the combined view's animation and watch the whole lattice fold onto the plane.</li>
<li>Switch to <em>3×2 tilted plane</em>. The image is a plane in space (teal). Change an entry and watch the plane tilt. Press <em>Transpose</em>: the 2×3 transpose has that plane as its row space.</li>
<li>Set 1×3. The matrix is a single row — a dot product with that row. Every plane perpendicular to the row vector is one fibre, crushed to one number. This is the <a href="#dot">duality</a> idea.</li>
<li>Make two columns parallel in a 3×2 matrix: rank drops to 1, the image becomes a line, and a null-space line appears in the input plane.</li>
</ul></div>`));
    },
  });
})();
