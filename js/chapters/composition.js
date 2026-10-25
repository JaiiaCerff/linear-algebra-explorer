/* Chapter: Composition & matrix multiplication */
(function () {
  'use strict';
  const LA = window.LA; const m = LA.m; const ui = LA.ui; const el = ui.el; const T = LA.theme;
  const PAIRS = [
    { label: 'Rotate 90°, then shear', A: [[0, -1], [1, 0]], B: [[1, 1], [0, 1]] }, { label: 'Scale, then rotate 45°', A: [[2, 0], [0, 0.5]], B: m.rot2(Math.PI / 4) },
    { label: 'Two rotations (they commute)', A: m.rot2(Math.PI / 6), B: m.rot2(Math.PI / 3) }, { label: 'Reflect, then rotate 90°', A: [[1, 0], [0, -1]], B: [[0, -1], [1, 0]] },
    { label: 'Projection, then its own inverse attempt', A: [[1, 0], [0, 0]], B: [[1, 0], [0, 1]] }, { label: 'A and A⁻¹', A: [[2, 1], [1, 1]], B: [[1, -1], [-1, 2]] },
  ];
  LA.chapters.push({
    id: 'composition', title: 'Composition & multiplication', group: 'Foundations', order: 4, summary: 'Apply A, then B — the product BA is the single matrix that does both',
    mount(ctx) {
      const S = { A: PAIRS[0].A, B: PAIRS[0].B, t: 2 };
      const left = ctx.view('<b>A first, then B</b> — total effect is <b>BA</b>'); const right = ctx.view('<b>B first, then A</b> — total effect is <b>AB</b>');
      const sL = new LA.Scene2D(left.canvas, { scale: 50 }), sR = new LA.Scene2D(right.canvas, { scale: 50 });
      const edA = ui.matrixEditor({ matrix: S.A, label: 'A (applied first on the left)', onChange: (A) => { S.A = A; refresh(); } });
      const edB = ui.matrixEditor({ matrix: S.B, label: 'B (applied second on the left)', onChange: (B) => { S.B = B; refresh(); } });
      const sel = ui.select({ label: 'Preset pair', options: PAIRS.map((p, i) => ({ value: i, label: p.label })), value: 0, onChange: (i) => { S.A = m.clone(PAIRS[i].A); S.B = m.clone(PAIRS[i].B); edA.update(S.A); edB.update(S.B); refresh(); } });
      const player = ui.player({ label: 'Animate: 0→1 applies the first map, 1→2 applies the second', max: 2, duration: 3600, value: 2, onChange: (t) => { S.t = t; refresh(); } });
      const ro = ui.readout([]); const disp = ui.matDisplay();
      ctx.controls.appendChild(ui.group('Matrices', ui.row(edA.el, edB.el), ui.row(sel.el, ui.button('Swap A ↔ B', () => { const tmp = S.A; S.A = S.B; S.B = tmp; edA.update(S.A); edB.update(S.B); refresh(); }, { small: true }), ui.button('Random', () => { S.A = m.randMat(2, 2, -2, 2, 0.5); S.B = m.randMat(2, 2, -2, 2, 0.5); edA.update(S.A); edB.update(S.B); refresh(); }, { small: true }))));
      ctx.controls.appendChild(ui.group('Animation', player.el));
      ctx.controls.appendChild(ui.group('Products', disp.el, ro.el));
      const stage = (first, second, t) => (t <= 1 ? m.lerp(m.identity(2), first, t) : m.lerp(first, m.mul(second, first), t - 1));
      function refresh() {
        const BA = m.mul(S.B, S.A), AB = m.mul(S.A, S.B); const same = m.equal(AB, BA, 1e-9);
        disp.set(`BA = ${ui.mhtml(S.B)}${ui.mhtml(S.A, { colColors: true })} = ${ui.mhtml(BA, { colColors: true })}<br>AB = ${ui.mhtml(S.A)}${ui.mhtml(S.B, { colColors: true })} = ${ui.mhtml(AB, { colColors: true })}`);
        ro.update([
          { label: 'AB = BA?', value: same ? 'yes — these two commute' : 'no — order matters', color: same ? T.good : T.warn },
          { label: 'first column of BA', value: `B·(first column of A) = B${ui.vhtml(m.col(S.A, 0))} = ${ui.vhtml(m.col(BA, 0))}` },
          { label: 'det', value: `det A · det B = ${m.fmt(m.det(S.A))} · ${m.fmt(m.det(S.B))} = ${m.fmt(m.det(S.A) * m.det(S.B))} = det(BA)` },
        ]);
        sL.requestDraw(); sR.requestDraw();
      }
      const draw = (first, second, names) => (s) => {
        const M = stage(first, second, S.t); s.baseGrid(); s.grid(M); s.unitSquare(M); s.shapeF(M); s.basis(M);
        const phase = S.t <= 0.001 ? 'start (identity)' : S.t < 1 ? `applying ${names[0]}…` : S.t < 1.999 ? `${names[0]} done, applying ${names[1]}…` : `${names[1]}${names[0]} applied`;
        s.caption(phase, { y: 36, color: T.text }); s.caption('det = ' + m.fmt(m.det(M)), { y: 52 });
      };
      sL.onDraw = (s) => draw(S.A, S.B, ['A', 'B'])(s); sR.onDraw = (s) => draw(S.B, S.A, ['B', 'A'])(s);
      refresh();
      ctx.onUnmount(() => { player.stop(); sL.destroy(); sR.destroy(); });
      ctx.hint('Left: A then B. Right: B then A. Play the animation and compare the two final grids');
      ctx.notes.appendChild(ui.prose(`
<h2>Doing one transformation after another</h2>
<p>Apply <span class="m">A</span>, then apply <span class="m">B</span> to the result. The combined effect is again linear (lines stay lines, origin stays put), so it is some single matrix. That matrix is the <b>product</b> <span class="m">BA</span> — read right to left, like function composition <span class="m">B(A(<b>v</b>))</span>.</p>
<div class="def"><h4>Why the multiplication rule looks the way it does</h4>
<p>The first column of <span class="m">BA</span> is where <b class="i">î</b> ends up after both maps. <span class="m">A</span> sends <b class="i">î</b> to <span class="m">A</span>'s first column; then <span class="m">B</span> acts on that vector. So</p>
<div class="formula">(BA)<b class="i">î</b> = B(A<b class="i">î</b>) = B·(first column of A)</div>
<p>Do the same for <b class="j">ĵ</b> and you have recovered the row-times-column recipe — it is just "apply <span class="m">B</span> to each column of <span class="m">A</span>".</p></div>
<h4>Consequences</h4>
<ul>
<li><b>Order matters.</b> In general <span class="m">AB ≠ BA</span>: compare the two canvases. Rotations in the plane do commute with each other; a rotation and a shear do not.</li>
<li><b>Associativity is free.</b> <span class="m">(AB)C = A(BC)</span> says nothing more than "apply C, then B, then A" — the grouping of the symbols does not change what you do.</li>
<li><b>Determinants multiply.</b> If <span class="m">A</span> scales area by 2 and <span class="m">B</span> by 3, doing both scales by 6: <span class="m">det(BA) = det(B) det(A)</span>.</li>
<li><b>Inverses reverse.</b> <span class="m">(BA)⁻¹ = A⁻¹B⁻¹</span>: to undo "A then B" you undo B first.</li>
</ul>
<div class="try"><h4>Try this</h4><ul>
<li>Load <em>Rotate 90°, then shear</em>. Press play on both sides. The final grids differ — same two moves, different outcome.</li>
<li>Load <em>Two rotations</em>. Now the two sides agree, because turning by 30° then 60° is turning by 90° either way.</li>
<li>Load <em>A and A⁻¹</em>: both products are the identity. Watch the grid go out and come back.</li>
<li>Make <span class="m">A</span> a projection (det 0). No choice of <span class="m">B</span> can bring the grid back — you cannot un-flatten a plane. That is why singular matrices have no inverse.</li>
</ul></div>`));
    },
  });
})();
