/* Chapter: Cross products */
(function () {
  'use strict';
  const LA = window.LA; const m = LA.m; const ui = LA.ui; const el = ui.el; const T = LA.theme;
  LA.chapters.push({
    id: 'cross', title: 'Cross products', group: 'Geometry', order: 10, summary: 'u × v: a vector perpendicular to both whose length is the area they span',
    mount(ctx) {
      const S = { u: [2, 0, 0.5], v: [0.5, 2, 0], w: [0.5, 0.5, 1.5], showW: false, showRule: true };
      const view = ctx.view('<b>ℝ³</b> — <b style="color:#83c167">u</b>, <b style="color:#fc6255">v</b>, their parallelogram, and <b style="color:#f5d547">u × v</b>');
      const scene = new LA.Scene3D(view.canvas, { dist: 9 });
      const uEd = ui.vectorEditor({ vector: S.u, color: T.i, onChange: (u) => { S.u = u; refresh(); } });
      const vEd = ui.vectorEditor({ vector: S.v, color: T.j, onChange: (v) => { S.v = v; refresh(); } });
      const wEd = ui.vectorEditor({ vector: S.w, color: T.k, onChange: (w) => { S.w = w; refresh(); } });
      const wT = ui.toggle({ label: 'Third vector <b class="k">w</b> (triple product / volume)', value: S.showW, onChange: (val) => { S.showW = val; refresh(); } });
      const rotT = ui.toggle({ label: 'Auto-rotate', value: false, onChange: (val) => { scene.autoRotate = val; scene.requestDraw(); } });
      const ro = ui.readout([]); const disp = ui.matDisplay();
      ctx.controls.appendChild(ui.group('Vectors', ui.row(el('span', { class: 'mlabel', html: '<b class="i">u</b> =' }), uEd.el, el('span', { class: 'mlabel', html: '<b class="j">v</b> =' }), vEd.el), ui.row(ui.button('î × ĵ', () => set([1, 0, 0], [0, 1, 0]), { small: true }), ui.button('ĵ × î', () => set([0, 1, 0], [1, 0, 0]), { small: true }), ui.button('Swap u ↔ v', () => set(S.v, S.u), { small: true }), ui.button('Parallel', () => set(S.u, m.vscale(S.u, -1.5)), { small: true }), ui.button('Random', () => set(m.randMat(1, 3, -2, 2, 0.5)[0], m.randMat(1, 3, -2, 2, 0.5)[0]), { small: true })), ui.row(wT.el), ui.row(el('span', { class: 'mlabel', html: '<b class="k">w</b> =' }), wEd.el), ui.row(rotT.el)));
      ctx.controls.appendChild(ui.group('Readout', ro.el, disp.el));
      function set(u, v) { S.u = u.slice(); S.v = v.slice(); uEd.update(S.u); vEd.update(S.v); refresh(); }
      function refresh() {
        const u = S.u, v = S.v, w = S.w; const c = m.vcross(u, v); const area = m.vnorm(c); const th = m.angle(u, v);
        const triple = m.vdot(c, w); const det = m.det(m.fromCols([u, v, w]));
        ro.update([
          { label: 'u × v', value: `(${m.fmt(u[1])}·${m.fmt(v[2])} − ${m.fmt(u[2])}·${m.fmt(v[1])}, ${m.fmt(u[2])}·${m.fmt(v[0])} − ${m.fmt(u[0])}·${m.fmt(v[2])}, ${m.fmt(u[0])}·${m.fmt(v[1])} − ${m.fmt(u[1])}·${m.fmt(v[0])}) = <b>${m.fmtVec(c)}</b>` },
          { label: '|u × v| = area', value: `${m.fmt(area)}  = |u||v| sin θ = ${m.fmt(m.vnorm(u))}·${m.fmt(m.vnorm(v))}·sin(${Number.isNaN(th) ? '—' : m.fmt(m.deg(th), 1) + '°'})`, color: area < 1e-9 ? T.warn : undefined },
          { label: 'perpendicular?', value: `(u×v)·u = ${m.fmt(m.vdot(c, u))},  (u×v)·v = ${m.fmt(m.vdot(c, v))}` },
          { label: 'orientation', value: area < 1e-9 ? 'u, v parallel — no plane, zero vector' : 'right-hand rule: curl fingers from u to v, thumb gives u × v' },
          S.showW ? { label: '(u × v) · w', value: `${m.fmt(triple)} = det[u v w] = ${m.fmt(det)} = signed volume`, color: Math.abs(triple) < 1e-9 ? T.warn : triple > 0 ? T.good : '#ff8a5b' } : null,
        ]);
        disp.set(`u × v = det ${ui.mhtml([['î', 'ĵ', 'k̂'], u.map((x) => m.fmt(x)), v.map((x) => m.fmt(x))], { rowColors: true })} &nbsp;&nbsp; so that &nbsp;&nbsp; (u × v)·w = det ${ui.mhtml(m.fromCols([w, u, v]), { colColors: false })} for every w`);
        scene.requestDraw();
      }
      scene.onDraw = (s) => {
        const u = S.u, v = S.v, c = m.vcross(u, v);
        s.axes({ length: 3.5 }); s.grid(m.identity(3), { range: 3, color: 'rgba(255,255,255,0.07)', axisColor: 'rgba(255,255,255,0.15)' });
        s.parallelogram(u, v, { fill: 'rgba(245,213,71,0.22)', stroke: 'rgba(245,213,71,0.7)' });
        if (S.showW) { s.cube(m.fromCols([u, v, S.w]), { alpha: 0.18, fill: 'rgba(88,196,221,0.3)', stroke: 'rgba(88,196,221,0.5)' }); s.vector(S.w, { color: T.k, width: 3, label: 'w' }); }
        s.vector(u, { color: T.i, width: 3, label: 'u' }); s.vector(v, { color: T.j, width: 3, label: 'v' });
        s.vector(c, { color: T.vec, width: 3.5, label: 'u × v' });
        if (S.showRule && m.vnorm(c) > 1e-9) { const k = 24; const a0 = m.vnormalize(u), b0 = m.vnormalize(m.vsub(v, m.vscale(a0, m.vdot(v, a0)))); if (m.vnorm(b0) > 0) { const pts = []; for (let i = 0; i <= k; i++) { const ang = (m.angle(u, v) * i) / k; pts.push(m.vscale(m.vadd(m.vscale(a0, Math.cos(ang)), m.vscale(b0, Math.sin(ang))), 0.6)); } s.polyline(pts, { color: 'rgba(255,255,255,0.7)', width: 1.5 }); s.vector(pts[k], { from: pts[k - 1], color: 'rgba(255,255,255,0.7)', width: 1.5 }); } }
        s.caption(`|u × v| = ${m.fmt(m.vnorm(c))} = area of the yellow parallelogram`, { y: 36, color: T.text });
      };
      refresh();
      ctx.onUnmount(() => scene.destroy());
      ctx.hint('Drag to orbit · the yellow arrow is perpendicular to the parallelogram; its length equals the area');
      ctx.notes.appendChild(ui.prose(`
<h2>A vector that encodes an area</h2>
<p>For <b class="i">u</b>, <b class="j">v</b> in ℝ³, the <b>cross product</b> <span class="m"><b>u</b> × <b>v</b></span> is the vector that is perpendicular to both, has length equal to the area of the parallelogram they span, and points by the right-hand rule. In coordinates it is computed from a mnemonic determinant with <b class="i">î</b>, <b class="j">ĵ</b>, <b class="k">k̂</b> in the first row:</p>
<div class="formula"><b>u</b> × <b>v</b> = (u₂v₃ − u₃v₂, &nbsp;u₃v₁ − u₁v₃, &nbsp;u₁v₂ − u₂v₁)</div>
<h4>Properties you can see</h4>
<ul>
<li><b>Anticommutative:</b> <span class="m"><b>v</b> × <b>u</b> = −(<b>u</b> × <b>v</b>)</span>. Press <em>Swap</em>: the arrow flips.</li>
<li><b>Zero when parallel:</b> the parallelogram degenerates, the area is 0, and there is no unique perpendicular direction anyway.</li>
<li><b>Length:</b> |<b>u</b> × <b>v</b>| = |<b>u</b>||<b>v</b>| sin θ, the counterpart of |<b>u</b>||<b>v</b>| cos θ for the dot product.</li>
<li><b>Not associative, but bilinear:</b> it is linear in each argument separately, which is what lets the determinant formula work.</li>
</ul>
<div class="def"><h4>Where the formula comes from: duality again</h4>
<p>Fix <b class="i">u</b> and <b class="j">v</b> and consider the function <span class="m"><b>w</b> ↦ det[<b>w</b> <b>u</b> <b>v</b>]</span>, the signed volume of the parallelepiped with edges <b>w</b>, <b>u</b>, <b>v</b>. It is linear in <b>w</b>, so by <a href="#dot">duality</a> it equals <span class="m"><b>p</b>·<b>w</b></span> for a unique vector <b>p</b>. Expanding the determinant along its first column shows that <b>p</b> is exactly the cross-product formula. Geometrically, volume = (area of base) × (height of <b>w</b> above the base), and "height above the base" is the dot product with a unit normal — so <b>p</b> must be perpendicular to the base with length equal to its area.</p></div>
<h4>The scalar triple product</h4>
<p>Turn on <b class="k">w</b>. The number <span class="m">(<b>u</b> × <b>v</b>) · <b>w</b> = det[<b>u</b> <b>v</b> <b>w</b>]</span> is the signed volume of the blue box — positive when <b>u</b>, <b>v</b>, <b>w</b> form a right-handed triple, zero when <b>w</b> lies in the plane of <b>u</b> and <b>v</b>. This is the 3D determinant from chapter 5 with a new name.</p>
<div class="try"><h4>Try this</h4><ul>
<li>Set <b>u</b> = î, <b>v</b> = ĵ: you get k̂, with |k̂| = 1 = area of the unit square.</li>
<li>Double <b>u</b>: the cross product doubles (bilinearity). Rotate <b>v</b> toward <b>u</b> by editing it: the area and the arrow shrink.</li>
<li>With <b>w</b> on, put <b>w</b> = <b>u</b> + <b>v</b>: the triple product is 0 and the box is flat.</li>
</ul></div>`));
    },
  });
})();
