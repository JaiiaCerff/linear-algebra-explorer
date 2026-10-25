/* Chapter: Linear transformations in 3D */
(function () {
  'use strict';
  const LA = window.LA; const m = LA.m; const ui = LA.ui; const el = ui.el; const T = LA.theme;
  const PRESETS = [
    { id: 'identity', label: 'Identity', M: m.identity(3) }, { id: 'rotz', label: 'Rotate 60° about z', M: m.rot3([0, 0, 1], Math.PI / 3) }, { id: 'rotd', label: 'Rotate 120° about (1,1,1)', M: m.rot3([1, 1, 1], (2 * Math.PI) / 3) },
    { id: 'scale', label: 'Scale 2, 1, ½', M: m.diag([2, 1, 0.5]) }, { id: 'shear', label: 'Shear (x += z)', M: [[1, 0, 1], [0, 1, 0], [0, 0, 1]] }, { id: 'reflz', label: 'Reflect z → −z', M: m.diag([1, 1, -1]) },
    { id: 'projxy', label: 'Project onto xy-plane (rank 2)', M: m.diag([1, 1, 0]) }, { id: 'projp', label: 'Project onto plane x+y+z=0', M: m.sub(m.identity(3), m.scale([[1, 1, 1], [1, 1, 1], [1, 1, 1]], 1 / 3)) }, { id: 'rank1', label: 'Collapse to a line (rank 1)', M: [[1, 2, 0], [1, 2, 0], [2, 4, 0]] },
    { id: 'general', label: 'A general matrix', M: [[1, 0.4, 0], [0, 1, 0.3], [0.3, 0, 1.2]] }, { id: 'neg', label: 'Point reflection −I', M: m.scale(m.identity(3), -1) },
  ];
  LA.chapters.push({
    id: 'transform3d', title: 'Transformations in 3D', group: 'Dimension', order: 7, summary: 'Three basis vectors, a 3×3 matrix, and the same rules: columns are landing spots',
    mount(ctx) {
      const S = { A: m.clone(PRESETS[9].M), t: 1, v: [1, 1, 1], showV: true, lattice: false, sphere: false, cube: true, axis: 'z', ang: 0 };
      const view = ctx.view('<b>ℝ³ under A</b> — grey is the original floor grid, blue is where it went; the box is the image of the unit cube');
      const scene = new LA.Scene3D(view.canvas, { dist: 9 });
      const Mt = () => m.lerp(m.identity(3), S.A, S.t);
      const ed = ui.matrixEditor({ matrix: S.A, onChange: (A) => { S.A = A; refresh(); } });
      const vEd = ui.vectorEditor({ vector: S.v, color: T.vec, onChange: (v) => { S.v = v; refresh(); } });
      const sel = ui.select({ label: 'Preset', options: [{ value: '', label: '— choose —' }].concat(PRESETS.map((p) => ({ value: p.id, label: p.label }))), value: '', onChange: (id) => { const p = PRESETS.find((q) => q.id === id); if (p) { S.A = m.clone(p.M); ed.update(S.A); refresh(); } } });
      const axes = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1], d: [1, 1, 1] };
      const axSel = ui.select({ label: 'Rotation axis', options: [{ value: 'z', label: 'z' }, { value: 'x', label: 'x' }, { value: 'y', label: 'y' }, { value: 'd', label: '(1,1,1)' }], value: 'z', onChange: (v) => { S.axis = v; if (S.ang) setRot(); } });
      const angle = ui.slider({ label: 'Rotation angle (sets A)', min: -180, max: 180, step: 1, value: 0, format: (v) => v + '°', onChange: (v) => { S.ang = v; setRot(); } });
      function setRot() { S.A = m.rot3(axes[S.axis], m.rad(S.ang)); ed.update(S.A); refresh(); }
      const player = ui.player({ label: 'Animate identity → A', value: 1, onChange: (t) => { S.t = t; refresh(); } });
      const tg = (k, label) => ui.toggle({ label, value: S[k], onChange: (v) => { S[k] = v; refresh(); } });
      const rotT = ui.toggle({ label: 'Auto-rotate camera', value: false, onChange: (v) => { scene.autoRotate = v; scene.requestDraw(); } });
      const ro = ui.readout([]);
      ctx.controls.appendChild(ui.group('Matrix A', ed.el, ui.row(sel.el, ui.button('Random', () => { S.A = m.randMat(3, 3, -2, 2, 0.5); ed.update(S.A); refresh(); }, { small: true }), ui.button('Transpose', () => { S.A = m.transpose(S.A); ed.update(S.A); refresh(); }, { small: true }), ui.button('Invert', () => { const I = m.inverse(S.A); if (I) { S.A = I; ed.update(S.A); refresh(); } }, { small: true })), ui.row(axSel.el), angle.el));
      ctx.controls.appendChild(ui.group('Animation', player.el));
      ctx.controls.appendChild(ui.group('Show', ui.row(tg('cube', 'Unit cube'), tg('lattice', 'Lattice'), tg('sphere', 'Unit sphere → ellipsoid')), ui.row(tg('showV', 'Sample vector <b class="v">v</b> ='), vEd.el), ui.row(rotT.el)));
      ctx.controls.appendChild(ui.group('Readout', ro.el));
      function refresh() {
        const A = S.A, det = m.det(A), r = m.rank(A); const orth = m.isOrthogonal(A); const E = m.eigen(A);
        const axisVec = orth && det > 0 ? E.spaces.find((s) => !s.complex && Math.abs(s.value.re - 1) < 1e-6) : null;
        ro.update([
          { label: 'det A', value: m.fmt(det) + (Math.abs(det) < 1e-9 ? ' — collapses space' : det < 0 ? ' — flips orientation (mirror)' : ''), color: Math.abs(det) < 1e-9 ? T.warn : undefined },
          { label: 'rank A', value: r + [' (space → point)', ' (space → line)', ' (space → plane)', ' (space → space)'][r] },
          { label: 'trace A', value: m.fmt(m.trace(A)) },
          { label: 'orthogonal (AᵀA = I)?', value: orth ? (det > 0 ? 'yes — a rotation' : 'yes — a rotation combined with a reflection') : 'no', color: orth ? T.good : undefined },
          axisVec ? { label: 'rotation axis', value: m.fmtVec(axisVec.vectors[0]) + ' (eigenvector with λ = 1), angle ' + m.fmt(m.deg(Math.acos(m.clamp((m.trace(A) - 1) / 2, -1, 1))), 1) + '°' } : null,
          S.showV ? { label: 'A<b class="v">v</b>', value: m.fmtVec(S.v) + ' ↦ ' + m.fmtVec(m.apply(A, S.v)) } : null,
        ]);
        scene.requestDraw();
      }
      scene.onDraw = (s) => {
        const M = Mt();
        s.axes({ length: 4 }); s.grid(m.identity(3), { range: 4, color: 'rgba(255,255,255,0.07)', axisColor: 'rgba(255,255,255,0.16)' });
        s.grid(M, { range: 4, alpha: 0.75 });
        if (S.lattice) s.lattice(M, { range: 2, alpha: 0.35 });
        if (S.sphere) { s.sphere(m.identity(3), { color: 'rgba(255,255,255,0.2)', width: 1 }); s.sphere(M, { rings: true }); }
        if (S.cube) s.cube(M, { alpha: 0.45 });
        if (S.showV) { const Mv = m.apply(M, S.v); const c = [0, 1, 2].map((j) => m.vscale(m.col(M, j), S.v[j])); const p1 = c[0], p2 = m.vadd(c[0], c[1]); s.vector(p1, { color: T.i, alpha: 0.4, width: 1.5 }); s.vector(p2, { from: p1, color: T.j, alpha: 0.4, width: 1.5 }); s.vector(Mv, { from: p2, color: T.k, alpha: 0.4, width: 1.5 }); s.vector(Mv, { color: T.vec, width: 3, label: S.t < 1 ? 'v' : 'Av' }); }
        s.basis(M);
        s.caption(`det = ${m.fmt(m.det(M))}   rank = ${m.rank(S.A)}`, { y: 36, color: T.text });
      };
      refresh();
      ctx.onUnmount(() => { player.stop(); scene.destroy(); });
      ctx.hint('Drag to orbit · scroll to zoom · Shift-drag to pan · double-click to reset · the three columns are where î, ĵ, k̂ land');
      ctx.notes.appendChild(ui.prose(`
<h2>Nothing new, one more direction</h2>
<p>A 3×3 matrix records where <b class="i">î</b>, <b class="j">ĵ</b> and <b class="k">k̂</b> land, one per column. Any vector <span class="m">(x, y, z)</span> goes to <span class="m">x·(col 1) + y·(col 2) + z·(col 3)</span>. The unit cube becomes a parallelepiped whose signed volume is the determinant.</p>
<div class="def"><h4>Rotations in 3D</h4><p>A rotation keeps lengths and angles, so its columns are three perpendicular unit vectors: <span class="m">AᵀA = I</span>, which makes <span class="m">A⁻¹ = Aᵀ</span>. Every 3D rotation has an <em>axis</em> — a line that does not move. That axis is an eigenvector with eigenvalue 1, and the angle satisfies <span class="m">tr A = 1 + 2cos θ</span>. Try the preset "Rotate 120° about (1,1,1)": the cube's corner at (1,1,1) stays put while <b class="i">î</b> → <b class="j">ĵ</b> → <b class="k">k̂</b> → <b class="i">î</b>.</p></div>
<h4>Rank in three dimensions</h4>
<ul>
<li><b>Rank 3</b>: space fills space; det ≠ 0; invertible.</li>
<li><b>Rank 2</b>: all of space is flattened onto a plane (det = 0). A whole line of inputs — the null space — is crushed to the origin.</li>
<li><b>Rank 1</b>: space is squeezed onto a line; a whole plane is crushed to the origin.</li>
</ul>
<p>These flattenings are the bridge to the next chapter: a rank-2 map of ℝ³ is essentially a 2×3 matrix with a copy of the plane embedded back in space.</p>
<div class="try"><h4>Try this</h4><ul>
<li>Turn on the sphere and pick <em>Scale 2, 1, ½</em>: the sphere becomes an ellipsoid with semi-axes 2, 1, ½. For a general matrix the ellipsoid's axes are <em>not</em> along the coordinate axes — the <a href="#svd">SVD</a> finds them.</li>
<li>Pick <em>Project onto xy-plane</em> and play. Watch the lattice fold flat and the cube's volume reach zero.</li>
<li>Use the rotation slider at 90° about z, then press <em>Transpose</em>: the transpose of a rotation is its inverse, so the grid turns back.</li>
<li>Enter a shear and look at the cube: faces slide but the volume stays 1 — the determinant of a shear is always 1.</li>
</ul></div>`));
    },
  });
})();
