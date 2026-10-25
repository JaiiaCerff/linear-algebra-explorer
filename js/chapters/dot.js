/* Chapter: Dot products, duality and projection */
(function () {
  'use strict';
  const LA = window.LA; const m = LA.m; const ui = LA.ui; const el = ui.el; const T = LA.theme;
  LA.chapters.push({
    id: 'dot', title: 'Dot products & duality', group: 'Geometry', order: 9, summary: 'v·w as a projection, and as the 1×2 matrix [v₁ v₂] squashing the plane onto a line',
    mount(ctx) {
      const S = { v: [2, 1], w: [1, 2], t: 0, showProj: true, showP: false };
      const main = ctx.view('<b>The plane</b> — drag <b style="color:#f5d547">v</b> and <b style="color:#f08fc0">w</b>; the projection of w onto v is marked');
      const line = ctx.view('<b>Output of the 1×2 matrix [v₁ v₂]</b> — a number line', { flex: '0 0 170px' });
      main.wrap.parentElement.style.flexDirection = 'column';
      const s2 = new LA.Scene2D(main.canvas, { scale: 62 }), s1 = new LA.Scene2D(line.canvas, { scale: 62, oneD: true });
      const vEd = ui.vectorEditor({ vector: S.v, color: T.vec, onChange: (v) => { S.v = v; refresh(); } });
      const wEd = ui.vectorEditor({ vector: S.w, color: T.vec2, onChange: (w) => { S.w = w; refresh(); } });
      const player = ui.player({ label: 'Animate: squash the plane onto the line of v (the map w ↦ (v·w)·v̂)', value: 0, duration: 2000, onChange: (t) => { S.t = t; redraw(); } });
      const tg = (k, label) => ui.toggle({ label, value: S[k], onChange: (val) => { S[k] = val; redraw(); } });
      const ro = ui.readout([]); const disp = ui.matDisplay();
      ctx.controls.appendChild(ui.group('Vectors', ui.row(el('span', { class: 'mlabel', html: '<b class="v">v</b> =' }), vEd.el, el('span', { class: 'mlabel', html: '<b class="p">w</b> =' }), wEd.el), ui.row(ui.button('Perpendicular', () => { S.w = m.perp2(S.v); wEd.update(S.w); refresh(); }, { small: true }), ui.button('Parallel', () => { S.w = m.vscale(S.v, 1.5); wEd.update(S.w); refresh(); }, { small: true }), ui.button('Unit v', () => { S.v = m.vnormalize(S.v); vEd.update(S.v); refresh(); }, { small: true }), ui.button('Random', () => { S.v = m.randMat(1, 2, -3, 3, 0.5)[0]; S.w = m.randMat(1, 2, -3, 3, 0.5)[0]; vEd.update(S.v); wEd.update(S.w); refresh(); }, { small: true }))));
      ctx.controls.appendChild(ui.group('Duality animation', player.el, ui.row(tg('showProj', 'Show projection of w onto v'), tg('showP', 'Show the projection matrix P'))));
      ctx.controls.appendChild(ui.group('Readout', ro.el, disp.el));
      s2.addHandle({ get: () => S.v, set: (p) => { S.v = p; vEd.update(S.v); refresh(); }, color: T.vec });
      s2.addHandle({ get: () => S.w, set: (p) => { S.w = p; wEd.update(S.w); refresh(); }, color: T.vec2 });
      const redraw = () => { s2.requestDraw(); s1.requestDraw(); };
      function refresh() {
        const v = S.v, w = S.w; const d = m.vdot(v, w); const nv = m.vnorm(v), nw = m.vnorm(w); const th = m.angle(v, w);
        const P = nv > 1e-9 ? m.projector([v]) : m.zeros(2, 2);
        ro.update([
          { label: 'v · w', value: `${m.fmt(v[0])}·${m.fmt(w[0])} + ${m.fmt(v[1])}·${m.fmt(w[1])} = <b>${m.fmt(d)}</b>` },
          { label: '|v| |w| cos θ', value: `${m.fmt(nv)} · ${m.fmt(nw)} · cos(${Number.isNaN(th) ? '—' : m.fmt(m.deg(th), 1) + '°'}) = ${m.fmt(nv * nw * Math.cos(th || 0))}` },
          { label: 'sign', value: Math.abs(d) < 1e-9 ? 'zero — perpendicular' : d > 0 ? 'positive — angle under 90°' : 'negative — angle over 90°', color: Math.abs(d) < 1e-9 ? T.accent : d > 0 ? T.good : T.warn },
          { label: 'length of projection of w onto v', value: nv > 1e-9 ? `(v·w)/|v| = ${m.fmt(d / nv)}` : '—' },
          { label: 'projection vector', value: nv > 1e-9 ? `(v·w / v·v)·v = ${m.fmtVec(m.vscale(v, d / (nv * nv)))}` : '—' },
          { label: 'as a 1×2 matrix', value: `[${m.fmt(v[0])}  ${m.fmt(v[1])}]·w: î ↦ ${m.fmt(v[0])}, ĵ ↦ ${m.fmt(v[1])}, w ↦ ${m.fmt(d)}` },
        ]);
        disp.set(S.showP || true ? `P = <span class="m">vvᵀ / (vᵀv)</span> = ${ui.mhtml(P)} , &nbsp; P² = ${ui.mhtml(m.mul(P, P))} , &nbsp; Pw = ${ui.vhtml(m.apply(P, w))}` : '');
        redraw();
      }
      s2.onDraw = (s) => {
        const v = S.v, w = S.w; const nv = m.vnorm(v); const u = nv > 1e-9 ? m.vscale(v, 1 / nv) : [1, 0];
        const Q = [[u[0] * v[0], u[0] * v[1]], [u[1] * v[0], u[1] * v[1]]]; // w ↦ (v·w) û
        const M = m.lerp(m.identity(2), Q, S.t);
        s.baseGrid();
        if (S.t > 0) { s.grid(M, { alpha: 0.7 }); s.infiniteLine([0, 0], u, { color: T.vec, width: 1, alpha: 0.5 }); }
        else s.infiniteLine([0, 0], u, { color: 'rgba(245,213,71,0.35)', width: 1, dash: [4, 6] });
        if (S.showP && S.t === 0) { s.grid(m.projector([v]), { color: 'rgba(78,205,196,0.35)', axisColor: 'rgba(78,205,196,0.6)' }); }
        if (S.showProj && S.t === 0 && nv > 1e-9) { const pr = m.vscale(v, m.vdot(v, w) / (nv * nv)); s.line(w, pr, { color: T.vec2, width: 1, dash: [4, 4] }); s.vector(pr, { color: T.vec2, width: 5, alpha: 0.45, head: false }); s.text(m.vscale(pr, 0.5), 'proj', { color: T.vec2, dy: 16, align: 'center' }); if (!Number.isNaN(m.angle(v, w))) { const a0 = Math.atan2(v[1], v[0]), a1 = Math.atan2(w[1], w[0]); s.arc([0, 0], 0.5, Math.min(a0, a1), Math.max(a0, a1), { color: 'rgba(255,255,255,0.6)' }); } }
        if (S.t === 0) { s.basis(m.identity(2), { width: 2 }); s.vector(v, { color: T.vec, label: 'v' }); s.vector(w, { color: T.vec2, label: 'w' }); }
        else { s.basis(M); s.vector(m.apply(M, w), { color: T.vec2, label: S.t >= 1 ? '(v·w) v̂' : 'w' }); s.vector(v, { color: T.vec, label: 'v', alpha: 0.6 }); if (S.t >= 1) for (let k = -8; k <= 8; k++) s.point(m.vscale(u, k), { color: T.white, r: 2 }); }
        s.caption(S.t > 0 ? 'the plane is collapsing onto the line of v; distances along it are the dot products' : 'v · w = ' + m.fmt(m.vdot(v, w)), { y: 36, color: T.text });
      };
      s1.onDraw = (s) => {
        const v = S.v, w = S.w; s.baseGrid();
        s.vector1D(v[0], { level: 1, color: T.i, label: 'î ↦ v₁ = ' + m.fmt(v[0]) }); s.vector1D(v[1], { level: 2, color: T.j, label: 'ĵ ↦ v₂ = ' + m.fmt(v[1]) });
        s.vector1D(m.vdot(v, w), { level: 0, color: T.vec2, label: 'w ↦ v·w = ' + m.fmt(m.vdot(v, w)) });
      };
      refresh();
      ctx.onUnmount(() => { player.stop(); s2.destroy(); s1.destroy(); });
      ctx.hint('Drag v and w · press ▶ to see the dot product as a linear map from the plane to a number line');
      ctx.notes.appendChild(ui.prose(`
<h2>Two definitions that agree</h2>
<div class="formula"><b>v</b> · <b>w</b> = v₁w₁ + v₂w₂ &nbsp;&nbsp;=&nbsp;&nbsp; |<b>v</b>| |<b>w</b>| cos θ</div>
<p>Numerically: multiply matching coordinates and add. Geometrically: project <b class="p">w</b> onto the line of <b class="v">v</b> and multiply the (signed) length of that shadow by |<b class="v">v</b>|. The sign tells you whether the vectors point broadly the same way (positive), opposite ways (negative) or are perpendicular (zero). Because the geometric formula is symmetric in the two vectors, so is the numeric one, even though "project w onto v" sounds asymmetric.</p>
<div class="def"><h4>Duality: dot products are 1×2 matrices</h4>
<p>Fix <b class="v">v</b> and look at the function <span class="m"><b>w</b> ↦ <b>v</b>·<b>w</b></span>. It is linear and lands in ℝ, so it is a linear map ℝ² → ℝ¹ — a <em>1×2 matrix</em>. Its two entries are where <b class="i">î</b> and <b class="j">ĵ</b> land on the number line: <span class="m">[v₁ v₂]</span>. The matrix of "dot with <b>v</b>" is just <b>v</b> written sideways, <span class="m">vᵀ</span>.</p>
<p>Conversely every linear map to ℝ is a dot product with some vector, its <em>dual vector</em>. The number line in the lower panel is the output space of that map; the animation above shows the same map drawn inside the plane, where the whole grid collapses onto the line through <b class="v">v</b> and the images of <b class="i">î</b>, <b class="j">ĵ</b> are spaced by v₁ and v₂. Everything perpendicular to <b>v</b> is the null space.</p></div>
<h4>Why the projection formula is linear</h4>
<p>Take a unit vector <b>û</b>. Projecting <b class="i">î</b> onto the line of <b>û</b> gives a number; by the symmetry of the picture it is the same as projecting <b>û</b> onto the x-axis, which is <span class="m">u₁</span>. Likewise <b class="j">ĵ</b> lands at <span class="m">u₂</span>. So "project onto <b>û</b>" is the matrix <span class="m">[u₁ u₂]</span>, and scaling by |<b>v</b>| gives <span class="m">[v₁ v₂]</span>. This is 3Blue1Brown's argument for why the two definitions match.</p>
<h4>Projection matrices</h4>
<p>If you want the projected <em>vector</em> rather than the length, use <span class="m">P = <b>v</b><b>v</b>ᵀ / (<b>v</b>ᵀ<b>v</b>)</span>, a 2×2 matrix of rank 1. Two things make it a projection: <span class="m">P² = P</span> (projecting twice changes nothing) and <span class="m">Pᵀ = P</span> (it is orthogonal, not oblique). Toggle "show P" to see its grid: everything is flattened onto the line of <b class="v">v</b>, perpendicular to it.</p>
<div class="try"><h4>Try this</h4><ul>
<li>Drag <b class="p">w</b> around a circle and watch the sign flip exactly as it crosses the line perpendicular to <b class="v">v</b>.</li>
<li>Make <b class="v">v</b> a unit vector. Now v·w is simply the signed length of w's shadow, and the squash animation becomes an orthogonal projection.</li>
<li>Press play with <b class="p">w</b> perpendicular to <b class="v">v</b>: <b class="p">w</b> is in the null space and lands on 0.</li>
<li>Compare with chapter 8 at shape 1×2: it is the same map seen as a "space-changing" matrix.</li>
</ul></div>`));
    },
  });
})();
