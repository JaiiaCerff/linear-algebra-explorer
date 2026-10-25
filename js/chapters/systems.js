/* Chapter: Inverses, rank, column space, null space — solving Ax = b */
(function () {
  'use strict';
  const LA = window.LA; const m = LA.m; const ui = LA.ui; const el = ui.el; const T = LA.theme;
  LA.chapters.push({
    id: 'systems', title: 'Inverses, rank & null space', group: 'Foundations', order: 6, summary: 'Solving Ax = b as "which x lands on b?" — row picture, column picture, and what happens when A squashes space',
    mount(ctx) {
      const S = { mode: '2d', A: [[2, 1], [1, 3]], b: [3, 4], A3: [[1, 1, 0], [0, 1, 1], [1, 0, 1]], b3: [1, 2, 3], t: 1, showNull: true };
      let scenes = [], player = null;
      const chips = el('div', { class: 'chips' });
      const setMode = (mode) => { S.mode = mode; chips.querySelectorAll('.chip').forEach((c) => c.classList.toggle('active', c.dataset.m === mode)); build(); };
      for (const [k, l] of [['2d', '2 equations, 2 unknowns'], ['3d', '3 equations, 3 unknowns']]) chips.appendChild(el('button', { class: 'chip' + (S.mode === k ? ' active' : ''), 'data-m': k, text: l, on: { click: () => setMode(k) } }));
      function destroy() { scenes.forEach((s) => s.destroy()); scenes = []; if (player) player.stop(); }
      function build() { destroy(); ctx.stage.innerHTML = ''; ctx.controls.innerHTML = ''; ctx.controls.appendChild(ui.group('System', chips)); S.mode === '2d' ? build2D() : build3D(); }
      const analyse = (A, b) => {
        const n = m.cols(A); const det = m.det(A), r = m.rank(A), N = m.nullspace(A), inv = m.inverse(A); const x = m.solve(A, b); const C = m.colspace(A);
        return { det, r, N, inv, x, C, n, nullity: n - r, consistent: x !== null };
      };
      const solutionText = (an) => an.r === an.n ? `unique: x = A⁻¹b = ${m.fmtVec(an.x)}` : an.consistent ? `infinitely many: x = ${m.fmtVec(an.x)} + t·${m.fmtVec(an.N[0])}${an.N[1] ? ' + s·' + m.fmtVec(an.N[1]) : ''}` : 'none — b is not in the column space';
      function build2D() {
        const rowV = ctx.view('<b>Row picture</b> — each equation is a line; the solution is where they cross');
        const colV = ctx.view('<b>Column picture</b> — find x₁, x₂ with x₁·<b style="color:#83c167">a₁</b> + x₂·<b style="color:#fc6255">a₂</b> = <b style="color:#f5d547">b</b>');
        const sRow = new LA.Scene2D(rowV.canvas, { scale: 48 }), sCol = new LA.Scene2D(colV.canvas, { scale: 48 }); scenes = [sRow, sCol];
        const ed = ui.matrixEditor({ matrix: S.A, label: 'A', onChange: (A) => { S.A = A; refresh(); } });
        const bEd = ui.vectorEditor({ vector: S.b, color: T.vec, onChange: (b) => { S.b = b; refresh(); } });
        player = ui.player({ label: 'Animate the column picture: x is carried to b', value: S.t, onChange: (t) => { S.t = t; refresh(); } });
        const nullT = ui.toggle({ label: 'Show null space & column space when singular', value: S.showNull, onChange: (v) => { S.showNull = v; refresh(); } });
        const ro = ui.readout([]); const disp = ui.matDisplay();
        ctx.controls.appendChild(ui.group('A x = b', ui.row(ed.el, el('span', { class: 'mlabel', html: '<b class="v">b</b> =' }), bEd.el), ui.row(ui.button('Random', () => { S.A = m.randMat(2, 2, -3, 3, 1); S.b = m.randMat(1, 2, -3, 3, 1)[0]; ed.update(S.A); bEd.update(S.b); refresh(); }, { small: true }), ui.button('Singular, consistent', () => { S.A = [[1, 2], [2, 4]]; S.b = [2, 4]; ed.update(S.A); bEd.update(S.b); refresh(); }, { small: true }), ui.button('Singular, no solution', () => { S.A = [[1, 2], [2, 4]]; S.b = [2, 3]; ed.update(S.A); bEd.update(S.b); refresh(); }, { small: true }), ui.button('Default', () => { S.A = [[2, 1], [1, 3]]; S.b = [3, 4]; ed.update(S.A); bEd.update(S.b); refresh(); }, { small: true }))));
        ctx.controls.appendChild(ui.group('Animation', player.el, ui.row(nullT.el)));
        ctx.controls.appendChild(ui.group('Analysis', ro.el, disp.el));
        sCol.addHandle({ get: () => S.b, set: (p) => { S.b = p; bEd.update(S.b); refresh(); }, color: T.vec });
        sCol.addHandle({ get: () => m.col(S.A, 0), set: (p) => { m.setCol(S.A, 0, p); ed.refresh(); refresh(); }, color: T.i, hidden: () => S.t < 1 });
        sCol.addHandle({ get: () => m.col(S.A, 1), set: (p) => { m.setCol(S.A, 1, p); ed.refresh(); refresh(); }, color: T.j, hidden: () => S.t < 1 });
        let an = analyse(S.A, S.b);
        function refresh() {
          ed.update(S.A); an = analyse(S.A, S.b); const A = S.A;
          ro.update([
            { label: 'det A', value: m.fmt(an.det) }, { label: 'rank / nullity', value: `${an.r} / ${an.nullity}  (rank + nullity = ${an.n} = number of columns)` },
            { label: 'column space', value: an.r === 2 ? 'all of ℝ² — every b is reachable' : an.r === 1 ? 'the line spanned by ' + m.fmtVec(an.C[0]) : 'just the origin', color: an.r === 2 ? T.good : T.colsp },
            { label: 'null space', value: an.nullity === 0 ? 'only the zero vector (A is one-to-one)' : 'the line spanned by ' + m.fmtVec(an.N[0]), color: an.nullity ? T.nul : undefined },
            { label: 'solutions of Ax = b', value: solutionText(an), color: an.consistent ? (an.r === an.n ? T.good : T.vec) : T.warn },
          ]);
          const [[a, b], [c, d]] = A;
          disp.set(an.inv ? `A⁻¹ = <span class="m">1/det</span>·${ui.mhtml([[d, -b], [-c, a]])} = ${ui.mhtml(an.inv)} &nbsp; so &nbsp; x = A⁻¹b = ${ui.vhtml(an.x)}` : `A has no inverse (det = 0). ${an.consistent ? 'b lies in the column space, so solutions exist but are not unique.' : 'b is off the column space, so nothing lands on it.'}`);
          sRow.requestDraw(); sCol.requestDraw();
        }
        sRow.onDraw = (s) => {
          s.baseGrid(); const A = S.A, b = S.b;
          for (let i = 0; i < 2; i++) { const row = A[i]; const col = i ? T.j : T.i; if (m.vnorm(row) < 1e-9) continue; const p0 = m.vscale(row, b[i] / m.vdot(row, row)); s.infiniteLine(p0, m.perp2(row), { color: col, width: 2.5, alpha: 0.9 }); s.text(m.vadd(p0, m.vscale(m.vnormalize(m.perp2(row)), 2.2)), `${m.fmt(row[0])}x₁ + ${m.fmt(row[1])}x₂ = ${m.fmt(b[i])}`, { color: col, dy: -8 }); }
          if (an.consistent) { if (an.r === 2) s.point(an.x, { color: T.white, r: 6, label: 'x = ' + m.fmtVec(an.x) }); else { s.infiniteLine(an.x, an.N[0], { color: T.white, width: 3, alpha: 0.5 }); s.caption('the two lines coincide — a whole line of solutions', { y: 36, color: T.vec }); } }
          else s.caption('parallel lines never meet — no solution', { y: 36, color: T.warn });
        };
        sCol.onDraw = (s) => {
          const A = S.A, M = m.lerp(m.identity(2), A, S.t);
          s.baseGrid(); s.grid(M, { alpha: 0.5 });
          if (S.showNull && an.r < 2) { if (an.r === 1) s.subspaceLine(an.C[0], { color: T.colsp, width: 3, alpha: 0.6 }); if (an.nullity) s.subspaceLine(m.apply(M, an.N[0]).some((x) => Math.abs(x) > 1e-6) ? m.apply(M, an.N[0]) : an.N[0], { color: T.nul, width: 2, dash: [6, 5] }); }
          if (an.consistent) {
            const x = an.x; const Mx = m.apply(M, x); const c1 = m.vscale(m.col(M, 0), x[0]), c2 = m.vscale(m.col(M, 1), x[1]);
            s.polygon([[0, 0], c1, Mx, c2], { fill: 'rgba(245,213,71,0.08)', stroke: 'rgba(245,213,71,0.35)', width: 1, dash: [4, 4] });
            s.vector(c1, { color: T.i, alpha: 0.6, width: 2, label: 'x₁a₁' }); s.vector(Mx, { from: c1, color: T.j, alpha: 0.6, width: 2, label: 'x₂a₂' });
            s.vector(Mx, { color: S.t < 1 ? 'rgba(255,255,255,0.8)' : T.vec, width: 2.5, label: S.t < 1 ? 'x' : null });
          }
          s.basis(M, { names: ['a₁', 'a₂'] }); s.vector(S.b, { color: T.vec, width: 3, label: 'b' });
          s.caption(S.t < 1 ? 'the grey vector x is being carried by A… it must end on b' : an.consistent ? (an.r === 2 ? 'x = A⁻¹b: the unique input that lands on b' : 'b is reachable, but a whole line of inputs lands on it') : 'b is not in the column space (teal line): unreachable', { y: 36, color: an.consistent ? T.text : T.warn });
        };
        refresh();
        ctx.hint('Drag b (yellow) and the columns a₁, a₂ in the column picture · the row picture updates live');
      }
      function build3D() {
        const rowV = ctx.view('<b>Row picture</b> — three planes; the solution is their common point');
        const colV = ctx.view('<b>Column picture</b> — x₁a₁ + x₂a₂ + x₃a₃ = b');
        const sRow = new LA.Scene3D(rowV.canvas, { dist: 11 }), sCol = new LA.Scene3D(colV.canvas, { dist: 11 }); scenes = [sRow, sCol];
        const ed = ui.matrixEditor({ matrix: S.A3, label: 'A', onChange: (A) => { S.A3 = A; refresh(); } });
        const bEd = ui.vectorEditor({ vector: S.b3, color: T.vec, onChange: (b) => { S.b3 = b; refresh(); } });
        const ro = ui.readout([]);
        ctx.controls.appendChild(ui.group('A x = b', ui.row(ed.el, el('span', { class: 'mlabel', html: '<b class="v">b</b> =' }), bEd.el), ui.row(ui.button('Random', () => { S.A3 = m.randMat(3, 3, -2, 2, 1); S.b3 = m.randMat(1, 3, -3, 3, 1)[0]; ed.update(S.A3); bEd.update(S.b3); refresh(); }, { small: true }), ui.button('Rank 2 (planes meet in a line)', () => { S.A3 = [[1, 1, 0], [0, 1, 1], [1, 2, 1]]; S.b3 = [1, 1, 2]; ed.update(S.A3); bEd.update(S.b3); refresh(); }, { small: true }), ui.button('Rank 2, inconsistent', () => { S.A3 = [[1, 1, 0], [0, 1, 1], [1, 2, 1]]; S.b3 = [1, 1, 3]; ed.update(S.A3); bEd.update(S.b3); refresh(); }, { small: true }), ui.button('Default', () => { S.A3 = [[1, 1, 0], [0, 1, 1], [1, 0, 1]]; S.b3 = [1, 2, 3]; ed.update(S.A3); bEd.update(S.b3); refresh(); }, { small: true }))));
        ctx.controls.appendChild(ui.group('Analysis', ro.el));
        let an = analyse(S.A3, S.b3);
        function refresh() {
          an = analyse(S.A3, S.b3);
          ro.update([
            { label: 'det A', value: m.fmt(an.det) }, { label: 'rank / nullity', value: `${an.r} / ${an.nullity}` },
            { label: 'column space', value: an.r === 3 ? 'all of ℝ³' : an.r === 2 ? 'a plane' : an.r === 1 ? 'a line' : 'origin', color: an.r === 3 ? T.good : T.colsp },
            { label: 'null space', value: an.nullity === 0 ? '{0}' : an.N.map((v) => m.fmtVec(v)).join(', ') + (an.nullity === 1 ? ' (a line)' : ' (a plane)'), color: an.nullity ? T.nul : undefined },
            { label: 'solutions', value: solutionText(an), color: an.consistent ? (an.r === 3 ? T.good : T.vec) : T.warn },
            an.inv ? { label: 'A⁻¹', value: ui.frag(ui.mhtml(an.inv, { small: true })) } : null,
          ]);
          sRow.requestDraw(); sCol.requestDraw();
        }
        const planeThrough = (s, nrm, off, color) => { if (m.vnorm(nrm) < 1e-9) return; const p0 = m.vscale(nrm, off / m.vdot(nrm, nrm)); const [u, w] = m.complement([nrm], 3); const Sz = 3.5; const P = (a, b) => m.vadd(p0, m.vadd(m.vscale(u, a), m.vscale(w, b))); s.polygon([P(-Sz, -Sz), P(Sz, -Sz), P(Sz, Sz), P(-Sz, Sz)], { fill: color, alpha: 0.28, stroke: color, strokeAlpha: 0.6 }); };
        sRow.onDraw = (s) => {
          s.axes({ length: 4 }); const cols = [T.i, T.j, T.k];
          for (let i = 0; i < 3; i++) planeThrough(s, S.A3[i], S.b3[i], cols[i]);
          if (an.consistent) { if (an.r === 3) s.point(an.x, { color: T.white, r: 6, label: 'x = ' + m.fmtVec(an.x) }); else if (an.r === 2) { const d = an.N[0]; s.line(m.vadd(an.x, m.vscale(d, -5)), m.vadd(an.x, m.vscale(d, 5)), { color: T.white, width: 3 }); s.caption('planes share a whole line of solutions', { y: 36, color: T.vec }); } else s.caption('planes coincide — a plane of solutions', { y: 36, color: T.vec }); }
          else s.caption('no common point — no solution', { y: 36, color: T.warn });
        };
        sCol.onDraw = (s) => {
          s.axes({ length: 4 }); const A = S.A3; const r = an.r;
          if (r === 2) s.planePatch(an.C[0], an.C[1], { size: 4, fill: 'rgba(78,205,196,0.15)', lineColor: 'rgba(78,205,196,0.3)' }); if (r === 1) s.lineSpan(an.C[0], { color: T.colsp, size: 7 });
          if (an.nullity) for (const nv of an.N) s.lineSpan(nv, { color: T.nul, size: 6, dash: [6, 5] });
          if (an.consistent) { const x = an.x; const p1 = m.vscale(m.col(A, 0), x[0]), p2 = m.vadd(p1, m.vscale(m.col(A, 1), x[1])), p3 = m.vadd(p2, m.vscale(m.col(A, 2), x[2])); s.vector(p1, { color: T.i, alpha: 0.5, width: 2 }); s.vector(p2, { from: p1, color: T.j, alpha: 0.5, width: 2 }); s.vector(p3, { from: p2, color: T.k, alpha: 0.5, width: 2 }); }
          for (let j = 0; j < 3; j++) s.vector(m.col(A, j), { color: [T.i, T.j, T.k][j], width: 3, label: 'a' + '₁₂₃'[j] });
          s.vector(S.b3, { color: T.vec, width: 3, label: 'b' });
          s.caption(an.consistent ? (r === 3 ? 'b = x₁a₁ + x₂a₂ + x₃a₃ with x = ' + m.fmtVec(an.x) : 'b lies in the column space (teal) — many combinations reach it') : 'b is outside the column space (teal) — unreachable', { y: 36, color: an.consistent ? T.text : T.warn });
        };
        refresh();
        ctx.hint('Drag to orbit · each coloured plane is one equation · teal = column space, purple = null space');
      }
      build();
      ctx.onUnmount(destroy);
      ctx.notes.appendChild(ui.prose(`
<h2>Two pictures of a linear system</h2>
<p><span class="m">A<b>x</b> = <b>b</b></span> asks: <em>which input vector <b>x</b> does the transformation <span class="m">A</span> carry onto <b class="v">b</b>?</em> If <span class="m">A</span> does not squash space (det ≠ 0), you can run it backwards: the <b>inverse</b> <span class="m">A⁻¹</span> is the transformation that undoes <span class="m">A</span>, so <span class="m"><b>x</b> = A⁻¹<b>b</b></span>. In 2D,</p>
<div class="formula">A⁻¹ = <span class="m">1/(ad − bc)</span> ${ui.mhtml([['d', '−b'], ['−c', 'a']])}</div>
<p>The <b>row picture</b> reads each equation as a line (plane in 3D) and looks for the crossing point. The <b>column picture</b> reads the system as "which combination of the columns gives <b>b</b>?" — the coefficients of that combination are the unknowns.</p>
<div class="def"><h4>Rank, column space, null space</h4>
<ul><li>The <b>column space</b> is the set of all outputs <span class="m">A<b>x</b></span> — the span of the columns. <b>b</b> is reachable exactly when it lies there.</li>
<li>The <b>rank</b> is the dimension of the column space: 2 for a plane-to-plane map, 1 if everything lands on a line, 0 if everything lands on the origin.</li>
<li>The <b>null space</b> (kernel) is the set of inputs sent to <b>0</b>. If <b>x</b> is a solution and <b>n</b> is in the null space, <span class="m">A(<b>x</b> + <b>n</b>) = <b>b</b></span> too — so solutions, when they exist, form a copy of the null space shifted to <b>x</b>.</li>
<li><b>Rank–nullity theorem:</b> rank + dim null = number of columns. Dimensions that are not squashed away must show up in the output.</li></ul></div>
<h4>The three outcomes</h4>
<ul>
<li><b>det ≠ 0</b> (full rank): one solution, the null space is {0}, <span class="m">A⁻¹</span> exists.</li>
<li><b>det = 0</b> and <b>b</b> in the column space: infinitely many solutions — a line (or plane) of inputs collapses onto <b>b</b>.</li>
<li><b>det = 0</b> and <b>b</b> outside the column space: no solution. In practice one then asks for the <em>closest</em> reachable point — least squares, which the <a href="#svd">SVD</a> handles.</li>
</ul>
<div class="try"><h4>Try this</h4><ul>
<li>Play the animation: the grey vector <b>x</b> rides along with the grid until it sits exactly on <b class="v">b</b>. That is what "solving" means geometrically.</li>
<li>Load <em>Singular, consistent</em>: the columns are parallel, <b class="v">b</b> lies on their line, and the purple null-space line shows all the inputs sent to zero. Drag <b class="v">b</b> off the teal line — suddenly no solution.</li>
<li>In 3D, load <em>Rank 2</em>: the three planes share a line, and the column picture shows the columns trapped in a plane.</li>
</ul></div>`));
    },
  });
})();
