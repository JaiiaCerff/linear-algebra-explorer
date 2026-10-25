/* Chapter: Linear transformations in 2D */
(function () {
  'use strict';
  const LA = window.LA; const m = LA.m; const ui = LA.ui; const el = ui.el; const T = LA.theme;
  const PRESETS = [
    { id: 'identity', label: 'Identity', M: [[1, 0], [0, 1]] }, { id: 'rot', label: 'Rotation 45°', M: m.rot2(Math.PI / 4) }, { id: 'rot90', label: 'Rotation 90°', M: [[0, -1], [1, 0]] },
    { id: 'shear', label: 'Shear (x += y)', M: [[1, 1], [0, 1]] }, { id: 'scale', label: 'Scale 2 × ½', M: [[2, 0], [0, 0.5]] }, { id: 'reflx', label: 'Reflect across x-axis', M: [[1, 0], [0, -1]] },
    { id: 'refl', label: 'Reflect across y = x', M: [[0, 1], [1, 0]] }, { id: 'projx', label: 'Project onto x-axis', M: [[1, 0], [0, 0]] }, { id: 'projd', label: 'Project onto y = x', M: [[0.5, 0.5], [0.5, 0.5]] },
    { id: 'collapse', label: 'Collapse to a line', M: [[1, 2], [0.5, 1]] }, { id: 'rotscale', label: 'Rotate & scale', M: [[1, -1], [1, 1]] }, { id: 'neg', label: 'Point reflection (−I)', M: [[-1, 0], [0, -1]] },
  ];
  LA.chapters.push({
    id: 'transform2d', title: 'Linear transformations', group: 'Foundations', order: 3, summary: 'A matrix moves the whole plane; its columns say where î and ĵ land',
    mount(ctx) {
      const S = { A: [[1, 1], [0, 1]], t: 1, v: [1.5, 1], showF: true, showV: true, showCircle: false, showDecomp: true, showGhost: true };
      const view = ctx.view('<b>ℝ² under A</b> — grey grid is the original plane, blue grid is where it went');
      const scene = new LA.Scene2D(view.canvas, { scale: 64 });
      const Mt = () => m.lerp(m.identity(2), S.A, S.t);
      const ed = ui.matrixEditor({ matrix: S.A, onChange: (A) => { S.A = A; refresh(); } });
      const sel = ui.select({ label: 'Preset', options: [{ value: '', label: '— choose —' }].concat(PRESETS.map((p) => ({ value: p.id, label: p.label }))), value: '', onChange: (id) => { const p = PRESETS.find((q) => q.id === id); if (p) { S.A = m.clone(p.M); ed.update(S.A); angle.set(0); refresh(); } } });
      const angle = ui.slider({ label: 'Rotation angle θ (sets A = R<sub>θ</sub>)', min: -180, max: 180, step: 1, value: 0, format: (v) => v + '°', onChange: (v) => { S.A = m.rot2(m.rad(v)); ed.update(S.A); refresh(); } });
      const player = ui.player({ label: 'Animate identity → A', duration: 1800, value: 1, onChange: (t) => { S.t = t; refresh(); } });
      const tg = (k, label) => ui.toggle({ label, value: S[k], onChange: (v) => { S[k] = v; refresh(); } });
      const ro = ui.readout([]); const comp = ui.matDisplay();
      ctx.controls.appendChild(ui.group('Matrix A', ui.row(ed.el, el('div', {}, sel.el, ui.row(ui.button('Random', () => { S.A = m.randMat(2, 2, -2, 2, 0.5); ed.update(S.A); refresh(); }, { small: true }), ui.button('Transpose', () => { S.A = m.transpose(S.A); ed.update(S.A); refresh(); }, { small: true }), ui.button('Invert', () => { const I = m.inverse(S.A); if (I) { S.A = I; ed.update(S.A); refresh(); } }, { small: true, title: 'Replace A by A⁻¹ (if it exists)' })))), angle.el, ui.note('Drag the tips of <b class="i">î</b> and <b class="j">ĵ</b> on the canvas to edit the columns directly.')));
      ctx.controls.appendChild(ui.group('Animation', player.el));
      ctx.controls.appendChild(ui.group('Show', ui.row(tg('showV', 'Sample vector <b class="v">v</b> (draggable)'), tg('showDecomp', 'v as combination of columns')), ui.row(tg('showF', 'An "F" shape'), tg('showCircle', 'Unit circle'), tg('showGhost', 'Target basis while animating'))));
      ctx.controls.appendChild(ui.group('Readout', ro.el, comp.el));
      scene.addHandle({ get: () => m.col(S.A, 0), set: (p) => { m.setCol(S.A, 0, p); ed.refresh(); refresh(); }, color: T.i });
      scene.addHandle({ get: () => m.col(S.A, 1), set: (p) => { m.setCol(S.A, 1, p); ed.refresh(); refresh(); }, color: T.j });
      scene.addHandle({ get: () => S.v, set: (p) => { S.v = p; refresh(); }, color: T.vec, hidden: () => !S.showV });
      function refresh() {
        ed.update(S.A);
        const A = S.A, det = m.det(A), r = m.rank(A), Av = m.apply(A, S.v);
        ro.update([
          { label: 'det A', value: m.fmt(det) + (Math.abs(det) < 1e-9 ? ' — collapses space' : det < 0 ? ' — flips orientation' : ''), color: Math.abs(det) < 1e-9 ? T.warn : det < 0 ? T.neg.replace('0.32', '1') : undefined },
          { label: 'rank A', value: r + (r === 2 ? ' (plane → plane)' : r === 1 ? ' (plane → line)' : ' (plane → point)') },
          { label: 'trace A', value: m.fmt(m.trace(A)) }, { label: 'A⁻¹ exists?', value: Math.abs(det) > 1e-9 ? 'yes' : 'no (singular)' },
          { label: 'î ↦', value: m.fmtVec(m.col(A, 0)), color: T.i }, { label: 'ĵ ↦', value: m.fmtVec(m.col(A, 1)), color: T.j },
          S.showV ? { label: '<b class="v">v</b> ↦ A<b class="v">v</b>', value: m.fmtVec(S.v) + ' ↦ ' + m.fmtVec(Av) } : null,
        ]);
        comp.set(S.showV ? `A<b class="v">v</b> = ${ui.mhtml(A, { colColors: true })}${ui.vhtml(S.v)} = <b class="v">${m.fmt(S.v[0])}</b>·${ui.vhtml(m.col(A, 0), { cls: 'ci' })} + <b class="v">${m.fmt(S.v[1])}</b>·${ui.vhtml(m.col(A, 1))} = ${ui.vhtml(Av)}` : '');
        scene.requestDraw();
      }
      scene.onDraw = (s) => {
        const M = Mt();
        s.baseGrid(); s.grid(M); s.unitSquare(M);
        if (S.showCircle) { s.ellipse(m.identity(2), { stroke: 'rgba(255,255,255,0.25)', width: 1, dash: [3, 4] }); s.ellipse(M, { stroke: T.vec, width: 1.5 }); }
        if (S.showF) { s.shapeF(m.identity(2), { fill: 'rgba(255,255,255,0.04)', stroke: 'rgba(255,255,255,0.18)' }); s.shapeF(M); }
        if (S.showV) {
          const Mv = m.apply(M, S.v);
          if (S.showDecomp) { const c1 = m.vscale(m.col(M, 0), S.v[0]), c2 = m.vscale(m.col(M, 1), S.v[1]); s.polygon([[0, 0], c1, Mv, c2], { fill: 'rgba(245,213,71,0.08)', stroke: 'rgba(245,213,71,0.35)', width: 1, dash: [4, 4] }); s.vector(c1, { color: T.i, alpha: 0.5, width: 2, label: m.fmt(S.v[0]) + '·î' }); s.vector(Mv, { from: c1, color: T.j, alpha: 0.5, width: 2, label: m.fmt(S.v[1]) + '·ĵ' }); }
          if (S.t < 1) s.vector(S.v, { color: T.vec, alpha: 0.35, width: 2, dash: [4, 4] });
          s.vector(Mv, { color: T.vec, label: S.t < 1 ? 'v' : 'Av' });
        }
        if (S.t < 1 && S.showGhost) s.basis(S.A, { alpha: 0.3, labels: false });
        s.basis(M);
        s.caption(`det = ${m.fmt(m.det(M))}`, { y: 36, color: T.text });
      };
      refresh();
      ctx.onUnmount(() => { player.stop(); scene.destroy(); });
      ctx.hint('Drag î, ĵ (and v) · Shift snaps · type expressions like sqrt(2)/2 in the matrix · press ▶ to morph from the identity');
      ctx.notes.appendChild(ui.prose(`
<h2>What makes a transformation linear</h2>
<p>A transformation is a function that takes every vector of the plane to a new vector. It is <b>linear</b> when it respects the two vector operations:</p>
<div class="formula">L(<b>v</b> + <b>w</b>) = L(<b>v</b>) + L(<b>w</b>) &nbsp;&nbsp;and&nbsp;&nbsp; L(c<b>v</b>) = c·L(<b>v</b>)</div>
<p>Geometrically: the origin stays put, straight lines stay straight, and parallel, evenly spaced grid lines stay parallel and evenly spaced. Watch the blue grid as you animate — it never bends.</p>
<div class="def"><h4>The matrix is the transformation</h4>
<p>Because every vector is <span class="m">x<b class="i">î</b> + y<b class="j">ĵ</b></span>, linearity forces <span class="m">L(<b>v</b>) = x·L(<b class="i">î</b>) + y·L(<b class="j">ĵ</b>)</span>. So a linear map is completely determined by where it sends the two basis vectors. Record those two landing spots as columns and you have the matrix:</p>
<div class="formula">${ui.mhtml([['a', 'b'], ['c', 'd']], { colColors: true })}${ui.mhtml([['x'], ['y']])} = x·${ui.mhtml([['a'], ['c']])} + y·${ui.mhtml([['b'], ['d']])} = ${ui.mhtml([['ax + by'], ['cx + dy']])}</div>
<p>The yellow decomposition on the canvas shows exactly this: <b class="v">v</b>'s image is <span class="m">x</span> copies of the new <b class="i">î</b> plus <span class="m">y</span> copies of the new <b class="j">ĵ</b>.</p></div>
<h4>Reading a matrix at a glance</h4>
<ul>
<li>Diagonal entries scale the axes; off-diagonal entries shear or rotate.</li>
<li>If the columns are perpendicular unit vectors the map is a <em>rotation</em> or <em>reflection</em> (lengths and angles are preserved).</li>
<li>If the columns are parallel, the whole plane is squashed onto a line: <em>rank 1</em>, determinant 0, no inverse.</li>
<li>The shaded unit square becomes a parallelogram whose signed area is the <a href="#determinant">determinant</a>.</li>
</ul>
<div class="try"><h4>Try this</h4><ul>
<li>Pick <em>Shear</em> and play the animation. Vertical lines tilt but horizontal lines slide along themselves — <b class="i">î</b> never moves. (That makes <b class="i">î</b> an <a href="#eigen">eigenvector</a>.)</li>
<li>Drag <b class="j">ĵ</b> onto the line through <b class="i">î</b>. The grid collapses; the "F" becomes a sliver. Every vector now lands on one line.</li>
<li>Enter <code>cos(pi/6)</code>, <code>-sin(pi/6)</code>, <code>sin(pi/6)</code>, <code>cos(pi/6)</code>: a rotation by 30°. Turn on the unit circle — rotations keep it a circle; anything else turns it into an ellipse (see <a href="#svd">SVD</a>).</li>
<li>Press <em>Invert</em>. The new matrix undoes the old one; play the animation and compare the two grids.</li>
</ul></div>`));
    },
  });
})();
