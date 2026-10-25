/* Chapter: Change of basis */
(function () {
  'use strict';
  const LA = window.LA; const m = LA.m; const ui = LA.ui; const el = ui.el; const T = LA.theme;
  const C1 = '#ff9f43', C2 = '#c39bd3';
  LA.chapters.push({
    id: 'basis', title: 'Change of basis', group: 'Geometry', order: 11, summary: 'The same vector, the same transformation, described in two coordinate languages',
    mount(ctx) {
      const S = { P: [[2, -1], [1, 1]], v: [3, 1], A: [[0, -1], [1, 0]], t: 0, showA: false, tA: 0 };
      const view = ctx.view('<b>Two grids</b> — grey: standard basis; coloured: the basis <b style="color:#ff9f43">b₁</b>, <b style="color:#c39bd3">b₂</b>. Drag b₁, b₂ and <b style="color:#f5d547">v</b>');
      const scene = new LA.Scene2D(view.canvas, { scale: 56 });
      const ed = ui.matrixEditor({ matrix: S.P, label: 'P — columns are b₁, b₂ written in standard coordinates', onChange: (P) => { S.P = P; refresh(); }, colColors: false });
      ed.el.querySelectorAll('input').forEach((inp, k) => (inp.style.color = k % 2 ? C2 : C1));
      const vEd = ui.vectorEditor({ vector: S.v, color: T.vec, onChange: (v) => { S.v = v; refresh(); } });
      const player = ui.player({ label: "Animate into B's point of view (apply P⁻¹ to the picture)", value: 0, duration: 1800, onChange: (t) => { S.t = t; scene.requestDraw(); } });
      const edA = ui.matrixEditor({ matrix: S.A, label: 'A — a transformation in standard coordinates', onChange: (A) => { S.A = A; refresh(); } });
      const showA = ui.toggle({ label: 'Show a transformation A and its matrix in the B basis', value: S.showA, onChange: (val) => { S.showA = val; refresh(); } });
      const playerA = ui.player({ label: 'Apply A (watch both grids move together)', value: 0, duration: 1600, onChange: (t) => { S.tA = t; scene.requestDraw(); } });
      const ro = ui.readout([]); const disp = ui.matDisplay(); const dispA = ui.matDisplay();
      ctx.controls.appendChild(ui.group('Basis B', ed.el, ui.row(ui.button('Default', () => { S.P = [[2, -1], [1, 1]]; ed.update(S.P); refresh(); }, { small: true }), ui.button('Rotated 30°', () => { S.P = m.rot2(Math.PI / 6); ed.update(S.P); refresh(); }, { small: true }), ui.button('Scaled', () => { S.P = [[2, 0], [0, 0.5]]; ed.update(S.P); refresh(); }, { small: true }), ui.button('Random', () => { do { S.P = m.randMat(2, 2, -2, 2, 0.5); } while (Math.abs(m.det(S.P)) < 0.5); ed.update(S.P); refresh(); }, { small: true })), ui.row(el('span', { class: 'mlabel', html: '<b class="v">v</b> (standard coords) =' }), vEd.el)));
      ctx.controls.appendChild(ui.group('Translate', player.el, ro.el, disp.el));
      ctx.controls.appendChild(ui.group('Same transformation, other language', ui.row(showA.el), edA.el, playerA.el, dispA.el));
      scene.addHandle({ get: () => m.col(S.P, 0), set: (p) => { m.setCol(S.P, 0, p); ed.refresh(); refresh(); }, color: C1, hidden: () => S.t > 0 });
      scene.addHandle({ get: () => m.col(S.P, 1), set: (p) => { m.setCol(S.P, 1, p); ed.refresh(); refresh(); }, color: C2, hidden: () => S.t > 0 });
      scene.addHandle({ get: () => S.v, set: (p) => { S.v = p; vEd.update(S.v); refresh(); }, color: T.vec, hidden: () => S.t > 0 });
      function refresh() {
        ed.update(S.P); const P = S.P, Pi = m.inverse(P); const vB = Pi ? m.apply(Pi, S.v) : null;
        ro.update([
          { label: 'det P', value: m.fmt(m.det(P)) + (Pi ? '' : ' — b₁, b₂ are dependent: not a basis!'), color: Pi ? undefined : T.warn },
          { label: '<b class="v">v</b> in standard coords', value: m.fmtVec(S.v) + ' = ' + m.fmt(S.v[0]) + '·î + ' + m.fmt(S.v[1]) + '·ĵ' },
          vB ? { label: '<b class="v">v</b> in B coords', value: `[v]<sub>B</sub> = P⁻¹v = ${m.fmtVec(vB)} = ${m.fmt(vB[0])}·b₁ + ${m.fmt(vB[1])}·b₂` } : null,
        ]);
        disp.set(Pi ? `P⁻¹ = ${ui.mhtml(Pi)} &nbsp; translates standard → B; &nbsp; P = ${ui.mhtml(P)} translates B → standard.` : '');
        edA.el.style.display = S.showA ? '' : 'none'; playerA.el.style.display = S.showA ? '' : 'none';
        if (S.showA && Pi) { const AB = m.mul(m.mul(Pi, S.A), P); dispA.set(`[A]<sub>B</sub> = P⁻¹ A P = ${ui.mhtml(Pi)}${ui.mhtml(S.A)}${ui.mhtml(P)} = ${ui.mhtml(AB)} <br><span class="note">tr: ${m.fmt(m.trace(S.A))} = ${m.fmt(m.trace(AB))}, det: ${m.fmt(m.det(S.A))} = ${m.fmt(m.det(AB))} — the same transformation has the same invariants in any basis.</span>`); } else dispA.set('');
        scene.requestDraw();
      }
      scene.onDraw = (s) => {
        const P = S.P, Pi = m.inverse(P); const view = Pi ? m.lerp(m.identity(2), Pi, S.t) : m.identity(2);
        const A = S.showA ? m.lerp(m.identity(2), S.A, S.tA) : m.identity(2);
        const Mstd = m.mul(view, A), MB = m.mul(Mstd, P);
        s.baseGrid({ labels: S.t === 0 });
        if (S.t > 0 || S.tA > 0) s.grid(Mstd, { color: 'rgba(255,255,255,0.18)', axisColor: 'rgba(255,255,255,0.4)' });
        s.grid(MB, { color: 'rgba(255,159,67,0.4)', axisColor: 'rgba(255,159,67,0.9)' });
        s.polygon(m.squarePts().map((p) => m.apply(MB, p)), { fill: 'rgba(255,159,67,0.12)' });
        s.vector(m.apply(Mstd, [1, 0]), { color: T.i, width: 2, label: 'î' }); s.vector(m.apply(Mstd, [0, 1]), { color: T.j, width: 2, label: 'ĵ' });
        s.vector(m.col(MB, 0), { color: C1, width: 3, label: 'b₁' }); s.vector(m.col(MB, 1), { color: C2, width: 3, label: 'b₂' });
        const vv = m.apply(Mstd, S.v); s.vector(vv, { color: T.vec, width: 3, label: S.tA > 0 ? 'Av' : 'v' });
        if (Pi) { const vB = m.apply(Pi, S.v); s.caption(`v = ${m.fmtVec(S.v)} in standard coords = ${m.fmtVec(vB)} in B coords`, { y: 36, color: T.text }); }
        s.caption(S.t > 0.99 ? "B's point of view: b₁, b₂ look like the standard grid; the grey grid is how B sees ours" : S.t > 0 ? 'translating…' : 'our point of view', { y: 52 });
      };
      refresh();
      ctx.onUnmount(() => { player.stop(); playerA.stop(); scene.destroy(); });
      ctx.hint('Drag b₁, b₂ and v · play to see the plane from the other basis’s point of view');
      ctx.notes.appendChild(ui.prose(`
<h2>Coordinates are a language</h2>
<p>To write <b class="v">v</b> = (3, 1) you have implicitly chosen <b class="i">î</b> and <b class="j">ĵ</b> as your yardsticks. Someone else — call her Jennifer — may use different basis vectors <b style="color:#ff9f43">b₁</b>, <b style="color:#c39bd3">b₂</b>. The same arrow has different coordinates in her language, and her grid is skewed relative to ours (though to her, it is ours that is skewed).</p>
<div class="def"><h4>Translating</h4>
<p>Put Jennifer's basis vectors, written in our coordinates, as the columns of <span class="m">P</span>. Then <span class="m">P</span> converts <em>her</em> coordinates into <em>ours</em>: <span class="m"><b>v</b> = P [<b>v</b>]<sub>B</sub></span>, because <span class="m">c₁<b>b₁</b> + c₂<b>b₂</b></span> is exactly what multiplying by <span class="m">P</span> computes. Going the other way is <span class="m">P⁻¹</span>: <span class="m">[<b>v</b>]<sub>B</sub> = P⁻¹<b>v</b></span>. The animation applies <span class="m">P⁻¹</span> to the whole picture so that her grid becomes square — that is literally what the world looks like in her coordinates.</p></div>
<div class="def"><h4>The same transformation in another basis</h4>
<p>Suppose <span class="m">A</span> describes a transformation in our coordinates (a 90° rotation, say). How does Jennifer write it? Take her vector, translate it to our language (<span class="m">P</span>), apply <span class="m">A</span>, translate back (<span class="m">P⁻¹</span>):</p>
<div class="formula">[A]<sub>B</sub> = P⁻¹ A P</div>
<p>Matrices related this way are called <b>similar</b>. They describe one and the same geometric map, so everything intrinsic to the map agrees: determinant, trace, rank, eigenvalues, characteristic polynomial. Only the numbers in the matrix change.</p></div>
<h4>Why this matters</h4>
<p>Choosing a good basis can make a transformation look simple. The best case is a basis of <a href="#eigen">eigenvectors</a>, in which the transformation is diagonal — pure scaling along each axis. Computing <span class="m">A¹⁰⁰</span> is then trivial. The <a href="#svd">SVD</a> is the same idea with <em>two</em> bases, one for the input and one for the output, that works for any matrix.</p>
<div class="try"><h4>Try this</h4><ul>
<li>Drag <b class="v">v</b> onto <b style="color:#ff9f43">b₁</b>. Its B-coordinates become (1, 0) no matter what its standard coordinates are.</li>
<li>Press play. The orange grid becomes square and the grey grid skews: this is Jennifer's view. The arrow <b class="v">v</b> does not move relative to the orange grid.</li>
<li>Turn on the transformation with A = 90° rotation and the default P. Jennifer's matrix for the rotation looks nothing like a rotation matrix, yet its determinant is 1 and its trace 0, and applying it still turns everything by 90°.</li>
<li>Pick a basis that is rotated 30°: a rotation commutes with rotations, so <span class="m">P⁻¹AP = A</span>.</li>
</ul></div>`));
    },
  });
})();
