/* Chapter: Least squares & projection onto the column space */
(function () {
  'use strict';
  const LA = window.LA; const m = LA.m; const ui = LA.ui; const el = ui.el; const T = LA.theme;
  const designRow = (x, model) => (model === 'const' ? [1] : model === 'line' ? [1, x] : [1, x, x * x]);
  const evalModel = (p, x) => p.reduce((s, c, k) => s + c * Math.pow(x, k), 0);
  const modelStr = (p) => p.length === 1 ? `y = ${m.fmt(p[0])}` : p.length === 2 ? `y = ${m.fmt(p[0])} + ${m.fmt(p[1])}·x` : `y = ${m.fmt(p[0])} + ${m.fmt(p[1])}·x + ${m.fmt(p[2])}·x²`;
  LA.chapters.push({
    id: 'leastsquares', title: 'Least squares', group: 'Geometry', order: 11.7, summary: 'When Ax = b has no solution, project b onto the column space and solve that instead',
    mount(ctx) {
      const S = { pts: [[-1.5, 0], [0.5, 2], [2, 1.5]], model: 'line', user: null, squares: true };
      let scenes = [];
      const roundPt = (p) => p.map((v) => Math.round(v * 20) / 20);
      const ro = ui.readout([]); const disp = ui.matDisplay();
      const nStep = ui.stepper({ label: 'number of data points', value: S.pts.length, min: 2, max: 8, onChange: (n) => { while (S.pts.length < n) S.pts.push(roundPt([-2 + Math.random() * 5, -1 + Math.random() * 4])); S.pts.length = n; S.user = null; build(); } });
      const modelSel = ui.select({ label: 'Model to fit', options: [{ value: 'const', label: 'constant  y = c  (1 parameter)' }, { value: 'line', label: 'line  y = c + m·x  (2 parameters)' }, { value: 'quad', label: 'parabola  y = c + m·x + q·x²  (3 parameters)' }], value: S.model, onChange: (v) => { S.model = v; S.user = null; build(); } });
      const sqT = ui.toggle({ label: 'Draw the squared residuals as squares', value: S.squares, onChange: (v) => { S.squares = v; redraw(); } });
      const snapBtn = ui.button('Snap to the least-squares fit', () => { S.user = null; refresh(); }, { small: true, primary: true });
      ctx.controls.appendChild(ui.group('Data & model', ui.row(nStep.el), ui.row(modelSel.el), ui.row(ui.button('Random data', () => { S.pts = S.pts.map(() => roundPt([-2 + Math.random() * 5, -1 + Math.random() * 4])); S.user = null; refresh(); }, { small: true }), ui.button('Collinear data', () => { S.pts = S.pts.map((p, i) => [p[0], Math.round((0.5 + 0.6 * p[0]) * 20) / 20]); S.user = null; refresh(); }, { small: true }), snapBtn), ui.row(sqT.el), ui.note('Drag the yellow points. For the constant and line models you can also drag the teal handles on the curve to try to beat least squares by hand.')));
      ctx.controls.appendChild(ui.group('The computation', ro.el, disp.el));
      const redraw = () => scenes.forEach((s) => s.requestDraw());
      let L = null, A = null, b = null, userParams = null, sseUser = null;
      function compute() {
        A = S.pts.map((p) => designRow(p[0], S.model)); b = S.pts.map((p) => p[1]); L = m.lstsq(A, b);
        userParams = S.user; sseUser = userParams ? S.pts.reduce((s, p) => s + Math.pow(p[1] - evalModel(userParams, p[0]), 2), 0) : null;
      }
      function refresh() {
        compute(); const n = S.pts.length, k = A[0].length; const ybar = b.reduce((s, y) => s + y, 0) / n; const sst = b.reduce((s, y) => s + (y - ybar) * (y - ybar), 0);
        const { Q, R, ok } = m.qr(A); const Qtb = m.apply(m.transpose(Q), b);
        ro.update([
          { label: 'A (n×k design matrix)', value: ui.frag(ui.mhtml(A, { small: true })) }, { label: 'b (observed y)', value: m.fmtVec(b) },
          { label: 'normal equations', value: `AᵀA x̂ = Aᵀb: ${ui.mhtml(m.round(L.AtA, 0.001), { small: true })} x̂ = ${ui.vhtml(L.Atb, { small: true })}` },
          { label: 'x̂ = (AᵀA)⁻¹Aᵀb', value: m.fmtVec(L.x) + '  →  ' + modelStr(L.x), color: T.colsp },
          { label: 'sum of squared residuals', value: `${m.fmt(L.sse, 3)} (minimum)${sseUser !== null ? `  vs your line: ${m.fmt(sseUser, 3)}` : ''}`, color: sseUser !== null && sseUser > L.sse + 1e-9 ? T.warn : T.good },
          { label: 'R²', value: sst > 1e-12 ? m.fmt(1 - L.sse / sst, 3) : '— (all y equal)' },
          { label: 'residual r = b − Ax̂', value: m.fmtVec(L.r) + '   Aᵀr = ' + m.fmtVec(m.apply(m.transpose(A), L.r)) + ' (orthogonal to every column)' },
          { label: 'via QR', value: ok ? `R x̂ = Qᵀb: ${ui.mhtml(m.round(R, 0.001), { small: true })} x̂ = ${ui.vhtml(Qtb.slice(0, k), { small: true })}` : 'A has dependent columns' },
          L.ok ? null : { label: 'warning', value: 'AᵀA is singular (not enough distinct x values for this model): the fit is not unique; the pseudoinverse picks the shortest x̂', color: T.warn },
        ]);
        disp.set(`P = A(AᵀA)⁻¹Aᵀ = ${ui.mhtml(m.round(L.P, 0.001), { small: true })} &nbsp; projects any b onto the column space: &nbsp; p = Pb = ${ui.vhtml(L.p, { small: true })}, &nbsp; P² = P, Pᵀ = P, rank P = ${m.rank(L.P)}`);
        redraw();
      }
      function build() {
        scenes.forEach((s) => s.destroy()); scenes = []; ctx.stage.innerHTML = '';
        const n = S.pts.length; compute();
        const dv = ctx.view('<b>Data view</b> — yellow points (xᵢ, yᵢ), teal: least-squares fit, red: residuals' + (S.model !== 'quad' ? ', white: your own guess' : ''));
        const s2 = new LA.Scene2D(dv.canvas, { scale: 70 }); scenes.push(s2);
        let s3 = null;
        if (n === 3) { const v3 = ctx.view('<b>Column-space view in ℝ³</b> — b = (y₁, y₂, y₃), teal = column space of A, p = projection, red = residual'); s3 = new LA.Scene3D(v3.canvas, { dist: 9 }); scenes.push(s3); }
        S.pts.forEach((p, i) => s2.addHandle({ get: () => S.pts[i], set: (q) => { S.pts[i] = q; refresh(); }, color: T.vec }));
        if (S.model !== 'quad') {
          const hx = S.model === 'const' ? [0.5] : [-2, 3];
          const active = () => userParams || L.x;
          hx.forEach((x0, hi) => s2.addHandle({ get: () => [x0, evalModel(active(), x0)], set: (q) => { const cur = active(); if (S.model === 'const') S.user = [q[1]]; else { const ys = hx.map((x, j) => (j === hi ? q[1] : evalModel(cur, x))); const mm = (ys[1] - ys[0]) / (hx[1] - hx[0]); S.user = [ys[0] - mm * hx[0], mm]; } refresh(); }, color: T.colsp, r: 6 }));
        }
        s2.onDraw = (s) => {
          s.baseGrid(); const bd = s.bounds(); const xs = Array.from({ length: 121 }, (_, i) => bd.xmin + ((bd.xmax - bd.xmin) * i) / 120);
          const act = userParams || L.x;
          s.polyline(xs.map((x) => [x, evalModel(L.x, x)]), { color: T.colsp, width: 2.5 });
          if (userParams) s.polyline(xs.map((x) => [x, evalModel(userParams, x)]), { color: 'rgba(255,255,255,0.8)', width: 2, dash: [6, 5] });
          S.pts.forEach((p) => { const yf = evalModel(act, p[0]); const r = p[1] - yf; if (S.squares) { const side = Math.abs(r); const x0 = r >= 0 ? p[0] : p[0] - side; s.polygon([[x0, Math.min(p[1], yf)], [x0 + side, Math.min(p[1], yf)], [x0 + side, Math.max(p[1], yf)], [x0, Math.max(p[1], yf)]], { fill: 'rgba(252,98,85,0.18)', stroke: 'rgba(252,98,85,0.5)', width: 1 }); } s.line([p[0], yf], p, { color: T.j, width: 2 }); });
          S.pts.forEach((p, i) => s.point(p, { color: T.vec, r: 5, label: `(${m.fmt(p[0])}, ${m.fmt(p[1])})`, math: false }));
          s.caption(`least squares: ${modelStr(L.x)},  Σr² = ${m.fmt(L.sse, 3)}${userParams ? `   your guess: Σr² = ${m.fmt(sseUser, 3)}` : ''}`, { y: 36, color: T.text });
        };
        if (s3) s3.onDraw = (s) => {
          s.axes({ length: 3.5, labels: false }); s.text([3.7, 0, 0], 'y₁', { color: T.muted }); s.text([0, 3.7, 0], 'y₂', { color: T.muted }); s.text([0, 0, 3.7], 'y₃', { color: T.muted });
          const cols = [...Array(A[0].length).keys()].map((j) => m.col(A, j)); const C = m.colspace(A);
          if (C.length === 1) s.lineSpan(C[0], { color: T.colsp, size: 6, width: 2.5, alpha: 0.7 }); else if (C.length === 2) s.planePatch(C[0], C[1], { size: 4, fill: 'rgba(78,205,196,0.14)', lineColor: 'rgba(78,205,196,0.28)' });
          cols.forEach((c, j) => s.vector(c, { color: LA.basisColor(j), width: 2, alpha: 0.6, label: 'a' + '₁₂₃'[j] }));
          s.vector(b, { color: T.vec, width: 3, label: 'b' }); s.vector(L.p, { color: T.colsp, width: 3, label: 'p = Ax̂' }); s.vector(b, { from: L.p, color: T.j, width: 2.5, label: 'r' });
          if (userParams) { const pu = m.apply(A, userParams); s.vector(pu, { color: 'rgba(255,255,255,0.8)', width: 2, dash: [5, 4], label: 'A·(your x)' }); s.vector(b, { from: pu, color: 'rgba(252,98,85,0.6)', width: 1.5, dash: [4, 4] }); }
          s.caption(C.length === 3 ? 'three parameters, three points: the column space is all of ℝ³, so the fit is exact (r = 0)' : `|r| = ${m.fmt(Math.sqrt(L.sse), 3)} is the shortest distance from b to the ${C.length === 1 ? 'line' : 'plane'}`, { y: 36, color: T.text });
        };
        refresh();
        ctx.hint(n === 3 ? 'Drag the data points and the teal handles · in ℝ³ the residual is perpendicular to the column space' : 'Drag the data points and the teal handles · set the point count to 3 to see the picture in ℝ³');
      }
      build();
      ctx.onUnmount(() => scenes.forEach((s) => s.destroy()));
      ctx.notes.appendChild(ui.prose(`
<h2>Too many equations</h2>
<p>Fitting a line <span class="m">y = c + m·x</span> through <span class="m">n</span> data points asks for <span class="m">c + m·xᵢ = yᵢ</span> for every <span class="m">i</span>: that is <span class="m">A<b>x</b> = <b>b</b></span> with an <span class="m">n × 2</span> matrix (a column of 1s and a column of x's), unknowns <span class="m"><b>x</b> = (c, m)</span> and right-hand side <span class="m"><b>b</b> = (y₁, …, yₙ)</span>. With more than two points there is usually no solution: <b>b</b> is not in the column space of <span class="m">A</span>, which is only a plane inside ℝⁿ.</p>
<div class="def"><h4>The least-squares idea</h4>
<p>If you cannot reach <b>b</b>, reach the point of the column space that is <em>closest</em> to it. That point is the orthogonal projection <b>p</b>, and the shortfall <span class="m"><b>r</b> = <b>b</b> − <b>p</b></span> is perpendicular to every column of <span class="m">A</span>. The coefficients <span class="m"><b>x̂</b></span> with <span class="m">A<b>x̂</b> = <b>p</b></span> minimise the squared length <span class="m">|<b>b</b> − A<b>x</b>|² = Σ(yᵢ − c − m·xᵢ)²</span>: the sum of squared vertical residuals in the data view. The red squares make that sum visible — drag the teal handles and watch it grow.</p>
<div class="formula">Aᵀ(<b>b</b> − A<b>x̂</b>) = 0 &nbsp;&nbsp;⇔&nbsp;&nbsp; AᵀA <b>x̂</b> = Aᵀ<b>b</b> &nbsp;&nbsp;(the normal equations)</div></div>
<h4>Three points, one picture</h4>
<p>With exactly three points, <b>b</b> lives in ℝ³ and everything can be drawn: the two columns of <span class="m">A</span> span a plane, <b>b</b> floats above it, <b>p</b> is its shadow and <b>r</b> is the perpendicular drop. For the constant model the column space is just the line through (1, 1, 1) and the projection is the mean. For a parabola the three columns span all of ℝ³ and the fit is exact — three parameters can always interpolate three points.</p>
<h4>Ways to compute it</h4>
<ul>
<li><b>Normal equations:</b> <span class="m"><b>x̂</b> = (AᵀA)⁻¹Aᵀ<b>b</b></span>. Simple, but squaring <span class="m">A</span> squares its condition number.</li>
<li><b>QR:</b> with <span class="m">A = QR</span>, the projection is <span class="m">QQᵀ<b>b</b></span> and the normal equations collapse to <span class="m">R<b>x̂</b> = Qᵀ<b>b</b></span> — triangular, stable.</li>
<li><b>SVD / pseudoinverse:</b> <span class="m"><b>x̂</b> = A⁺<b>b</b></span>, which also handles the case where <span class="m">AᵀA</span> is singular (all x's equal, say) by returning the shortest of the many minimisers.</li>
</ul>
<p>The <b>projection matrix</b> <span class="m">P = A(AᵀA)⁻¹Aᵀ</span> maps any <b>b</b> straight to its projection; it is symmetric, idempotent (<span class="m">P² = P</span>) and has rank equal to the number of parameters. In statistics it is the "hat matrix", since <span class="m">ŷ = P<b>y</b></span>.</p>
<div class="try"><h4>Try this</h4><ul>
<li>Drag a teal handle to tilt the line. The white dashed line's Σr² is always larger than the teal one's. Press <em>Snap</em> to return.</li>
<li>Move a data point far away: a single outlier swings the fit a lot — squared residuals punish large errors heavily.</li>
<li>Choose <em>Collinear data</em>: the residual vanishes and <b>b</b> lies exactly in the column space.</li>
<li>With 3 points, switch models and watch the column space go from a line (constant) to a plane (line) to all of space (parabola).</li>
</ul></div>`));
    },
  });
})();
