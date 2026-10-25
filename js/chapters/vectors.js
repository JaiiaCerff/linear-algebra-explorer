/* Chapter: Vectors, linear combinations, span, basis */
(function () {
  'use strict';
  const LA = window.LA; const m = LA.m; const ui = LA.ui; const el = ui.el; const T = LA.theme;
  LA.chapters.push({
    id: 'vectors', title: 'Vectors, span & basis', group: 'Foundations', order: 2, summary: 'Arrows, lists of numbers, linear combinations and the space they reach',
    mount(ctx) {
      const S = { mode: '2d', v: [2, 1], w: [-1, 1.5], a: 1, b: 1, lattice: false, shade: true, M3: [[2, 0, 1], [1, 2, 0], [0, 1, 1]], c: 1 };
      let scene = null;
      const notes = ui.prose(`
<h2>Vectors and the space they span</h2>
<p>A vector can be seen three ways: a physicist's <em>arrow</em> with length and direction, a computer scientist's <em>list of numbers</em>, and a mathematician's <em>element of a vector space</em> — anything you can add and scale. The bridge between the first two is a coordinate system: the arrow <b class="v">v</b> = (2, 1) means "2 steps along <b class="i">î</b>, 1 step along <b class="j">ĵ</b>".</p>
<div class="def"><h4>Two operations</h4><p><b>Addition</b> <span class="m"><b>v</b> + <b>w</b></span>: place <b>w</b>'s tail at <b>v</b>'s tip. <b>Scaling</b> <span class="m">c<b>v</b></span>: stretch by |c| and flip if c &lt; 0. Numbers that scale vectors are called <em>scalars</em>. Everything in linear algebra is built from these two moves.</p></div>
<div class="def"><h4>Linear combination, span, independence</h4>
<p>A <b>linear combination</b> of <b>v</b> and <b>w</b> is <span class="m">a<b>v</b> + b<b>w</b></span> for scalars <span class="m">a, b</span>. The <b>span</b> is the set of all such combinations — every point you can reach. Vectors are <b>linearly independent</b> when none of them lies in the span of the others, i.e. the only way to combine them to get <b>0</b> is with all coefficients zero.</p>
<p>A <b>basis</b> of a space is a set of independent vectors that spans it; the number of vectors in any basis is the <b>dimension</b>. In ℝ² two independent vectors always form a basis; in ℝ³ you need three.</p></div>
<div class="try"><h4>Try this</h4><ul>
<li>Drag <b class="v">w</b> until it points along <b class="v">v</b>. The span collapses from the whole plane to a <em>line</em>; the parallelogram area (the determinant of [<b>v</b> <b>w</b>]) hits 0. That is what "dependent" looks like.</li>
<li>Turn on the <em>lattice</em>: the dots are all integer combinations <span class="m">i<b>v</b> + j<b>w</b></span>. Any basis tiles the plane with its own skewed grid — the standard grid is just the special case <b>v</b> = <b class="i">î</b>, <b>w</b> = <b class="j">ĵ</b>.</li>
<li>Switch to 3D. Make the third vector a combination of the first two (e.g. <b>w</b> = <b>u</b> + <b>v</b>) and watch the span drop to a plane — the three arrows are "stuck" in a sheet.</li>
</ul></div>
<p class="note">Area and volume of the spanned parallelogram/parallelepiped will return as the <a href="#determinant">determinant</a>; the dimension of a span returns as <a href="#systems">rank</a>.</p>`);
      ctx.notes.appendChild(notes);

      const modeBtns = el('div', { class: 'chips' });
      const setMode = (mode) => { S.mode = mode; modeBtns.querySelectorAll('.chip').forEach((c) => c.classList.toggle('active', c.dataset.m === mode)); build(); };
      for (const [k, l] of [['2d', 'Plane ℝ²'], ['3d', 'Space ℝ³']]) modeBtns.appendChild(el('button', { class: 'chip' + (S.mode === k ? ' active' : ''), 'data-m': k, text: l, on: { click: () => setMode(k) } }));

      function build() {
        if (scene) { scene.destroy(); scene = null; }
        ctx.stage.innerHTML = ''; ctx.controls.innerHTML = '';
        ctx.controls.appendChild(ui.group('Space', modeBtns));
        if (S.mode === '2d') build2D(); else build3D();
      }
      function build2D() {
        const view = ctx.view('<b>ℝ²</b> — drag the tips of <b style="color:#f5d547">v</b> and <b style="color:#f08fc0">w</b>');
        scene = new LA.Scene2D(view.canvas, { scale: 60 });
        const vEd = ui.vectorEditor({ vector: S.v, color: T.vec, onChange: (v) => { S.v = v; refresh(); } });
        const wEd = ui.vectorEditor({ vector: S.w, color: T.vec2, onChange: (w) => { S.w = w; refresh(); } });
        const aS = ui.slider({ label: 'a (scales <b style="color:#f5d547">v</b>)', min: -3, max: 3, step: 0.05, value: S.a, onChange: (v) => { S.a = v; refresh(); } });
        const bS = ui.slider({ label: 'b (scales <b style="color:#f08fc0">w</b>)', min: -3, max: 3, step: 0.05, value: S.b, onChange: (v) => { S.b = v; refresh(); } });
        const latT = ui.toggle({ label: 'Show lattice of integer combinations', value: S.lattice, onChange: (v) => { S.lattice = v; refresh(); } });
        const shT = ui.toggle({ label: 'Shade the span', value: S.shade, onChange: (v) => { S.shade = v; refresh(); } });
        const ro = ui.readout([]);
        ctx.controls.appendChild(ui.group('Vectors', ui.row(el('span', { class: 'mlabel', html: '<b class="v">v</b> =' }), vEd.el, el('span', { class: 'mlabel', html: '<b class="p">w</b> =' }), wEd.el), ui.row(ui.button('Random', () => { S.v = m.randMat(1, 2, -3, 3, 0.5)[0]; S.w = m.randMat(1, 2, -3, 3, 0.5)[0]; vEd.update(S.v); wEd.update(S.w); refresh(); }, { small: true }), ui.button('Standard basis', () => { S.v = [1, 0]; S.w = [0, 1]; vEd.update(S.v); wEd.update(S.w); refresh(); }, { small: true }), ui.button('Make dependent', () => { S.w = m.vscale(S.v, -1.5); wEd.update(S.w); refresh(); }, { small: true }))));
        ctx.controls.appendChild(ui.group('Linear combination a·v + b·w', aS.el, bS.el, ui.row(latT.el), ui.row(shT.el)));
        ctx.controls.appendChild(ui.group('Readout', ro.el));
        scene.addHandle({ get: () => S.v, set: (p) => { S.v = p; vEd.update(S.v); refresh(); }, color: T.vec });
        scene.addHandle({ get: () => S.w, set: (p) => { S.w = p; wEd.update(S.w); refresh(); }, color: T.vec2 });
        function refresh() {
          const det = m.det([[S.v[0], S.w[0]], [S.v[1], S.w[1]]]); const r = m.rank([S.v, S.w]);
          const comb = m.vadd(m.vscale(S.v, S.a), m.vscale(S.w, S.b));
          ro.update([
            { label: '<b class="v">v</b>', value: m.fmtVec(S.v) + '  |v| = ' + m.fmt(m.vnorm(S.v)) }, { label: '<b class="p">w</b>', value: m.fmtVec(S.w) + '  |w| = ' + m.fmt(m.vnorm(S.w)) },
            { label: 'angle v,w', value: Number.isNaN(m.angle(S.v, S.w)) ? '—' : m.fmt(m.deg(m.angle(S.v, S.w)), 1) + '°' },
            { label: 'a·v + b·w', value: m.fmtVec(comb) }, { label: 'parallelogram area', value: m.fmt(Math.abs(det)) + ' (det [v w] = ' + m.fmt(det) + ')' },
            { label: 'span', value: r === 2 ? 'all of ℝ² — v, w independent (a basis)' : r === 1 ? 'a line — v, w dependent' : 'just the origin', color: r === 2 ? T.good : T.warn },
          ]);
          scene.requestDraw();
        }
        scene.onDraw = (s) => {
          s.baseGrid(); const r = m.rank([S.v, S.w]);
          if (S.shade) { if (r === 2) s.shadeAll(T.accent, 0.05); else if (r === 1) s.subspaceLine(m.vnorm(S.v) > 1e-9 ? S.v : S.w, { color: T.accent, width: 3, alpha: 0.5 }); }
          if (S.lattice) { for (let i = -8; i <= 8; i++) for (let j = -8; j <= 8; j++) { const p = m.vadd(m.vscale(S.v, i), m.vscale(S.w, j)); s.point(p, { color: i === 0 && j === 0 ? T.white : T.accent, r: 2.5, alpha: 0.7 }); } }
          s.basis(m.identity(2), { width: 2, labels: true });
          const av = m.vscale(S.v, S.a), bw = m.vscale(S.w, S.b), sum = m.vadd(av, bw);
          s.polygon([[0, 0], av, sum, bw], { fill: 'rgba(245,213,71,0.10)', stroke: 'rgba(255,255,255,0.25)', width: 1, dash: [4, 4] });
          s.vector(av, { color: T.vec, alpha: 0.45, width: 2, label: S.a !== 1 ? m.fmt(S.a) + 'v' : null });
          s.vector(sum, { from: av, color: T.vec2, alpha: 0.45, width: 2, label: S.b !== 1 ? m.fmt(S.b) + 'w' : null });
          s.vector(S.v, { color: T.vec, label: 'v' }); s.vector(S.w, { color: T.vec2, label: 'w' });
          s.vector(sum, { color: T.white, width: 3, label: 'av + bw' });
        };
        refresh();
        ctx.hint('Drag v and w · Shift snaps to the half-grid · scroll to zoom · double-click to reset view');
      }
      function build3D() {
        const view = ctx.view('<b>ℝ³</b> — columns of the matrix are <b style="color:#83c167">u</b>, <b style="color:#fc6255">v</b>, <b style="color:#58c4dd">w</b>; drag to orbit');
        scene = new LA.Scene3D(view.canvas, { dist: 10 });
        const ed = ui.matrixEditor({ matrix: S.M3, label: 'Columns are the three vectors u, v, w', onChange: (A) => { S.M3 = A; refresh(); } });
        const aS = ui.slider({ label: 'a (scales <b style="color:#83c167">u</b>)', min: -2, max: 2, step: 0.05, value: S.a, onChange: (v) => { S.a = v; refresh(); } });
        const bS = ui.slider({ label: 'b (scales <b style="color:#fc6255">v</b>)', min: -2, max: 2, step: 0.05, value: S.b, onChange: (v) => { S.b = v; refresh(); } });
        const cS = ui.slider({ label: 'c (scales <b style="color:#58c4dd">w</b>)', min: -2, max: 2, step: 0.05, value: S.c, onChange: (v) => { S.c = v; refresh(); } });
        const latT = ui.toggle({ label: 'Show integer combinations', value: S.lattice, onChange: (v) => { S.lattice = v; refresh(); } });
        const rotT = ui.toggle({ label: 'Auto-rotate', value: false, onChange: (v) => { scene.autoRotate = v; scene.requestDraw(); } });
        const ro = ui.readout([]);
        ctx.controls.appendChild(ui.group('Vectors', ed.el, ui.row(ui.button('Random', () => { S.M3 = m.randMat(3, 3, -2, 2, 0.5); ed.update(S.M3); refresh(); }, { small: true }), ui.button('Standard basis', () => { S.M3 = m.identity(3); ed.update(S.M3); refresh(); }, { small: true }), ui.button('Coplanar (w = u + v)', () => { const A = m.clone(S.M3); m.setCol(A, 2, m.vadd(m.col(A, 0), m.col(A, 1))); S.M3 = A; ed.update(A); refresh(); }, { small: true }), ui.button('Collinear', () => { const A = m.clone(S.M3); m.setCol(A, 1, m.vscale(m.col(A, 0), -1)); m.setCol(A, 2, m.vscale(m.col(A, 0), 2)); S.M3 = A; ed.update(A); refresh(); }, { small: true }))));
        ctx.controls.appendChild(ui.group('Linear combination a·u + b·v + c·w', aS.el, bS.el, cS.el, ui.row(latT.el, rotT.el)));
        ctx.controls.appendChild(ui.group('Readout', ro.el));
        function refresh() {
          const r = m.rank(S.M3); const comb = m.apply(S.M3, [S.a, S.b, S.c]);
          ro.update([{ label: 'a·u + b·v + c·w', value: m.fmtVec(comb) }, { label: 'volume of parallelepiped', value: m.fmt(Math.abs(m.det(S.M3))) + ' (det = ' + m.fmt(m.det(S.M3)) + ')' }, { label: 'span', value: r === 3 ? 'all of ℝ³ — a basis' : r === 2 ? 'a plane — dependent' : r === 1 ? 'a line — dependent' : 'the origin', color: r === 3 ? T.good : T.warn }, { label: 'dimension of span', value: r }]);
          scene.requestDraw();
        }
        scene.onDraw = (s) => {
          s.axes({ length: 4 }); s.grid(m.identity(3), { range: 4, color: 'rgba(255,255,255,0.08)', axisColor: 'rgba(255,255,255,0.18)' });
          const cols = [0, 1, 2].map((j) => m.col(S.M3, j)); const r = m.rank(S.M3);
          if (r === 2) { const B = m.colspace(S.M3); s.planePatch(B[0], B[1], { size: 4, fill: 'rgba(88,196,221,0.12)', lineColor: 'rgba(88,196,221,0.3)' }); }
          if (r === 1) { const B = m.colspace(S.M3); s.lineSpan(B[0], { color: T.accent, size: 8, alpha: 0.6 }); }
          if (S.lattice) for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) for (let k = -2; k <= 2; k++) s.point(m.apply(S.M3, [i, j, k]), { color: T.accent, r: 2, alpha: 0.6 });
          const au = m.vscale(cols[0], S.a), bv = m.vscale(cols[1], S.b), cw = m.vscale(cols[2], S.c); const p1 = au, p2 = m.vadd(au, bv), p3 = m.vadd(p2, cw);
          s.vector(p1, { color: T.i, alpha: 0.4, width: 2 }); s.vector(p2, { from: p1, color: T.j, alpha: 0.4, width: 2 }); s.vector(p3, { from: p2, color: T.k, alpha: 0.4, width: 2 });
          s.vector(cols[0], { color: T.i, label: 'u', width: 3 }); s.vector(cols[1], { color: T.j, label: 'v', width: 3 }); s.vector(cols[2], { color: T.k, label: 'w', width: 3 });
          s.vector(p3, { color: T.white, width: 3, label: 'au + bv + cw' });
        };
        refresh();
        ctx.hint('Drag to orbit · scroll to zoom · Shift-drag to pan · double-click to reset view');
      }
      build();
      ctx.onUnmount(() => scene && scene.destroy());
    },
  });
})();
