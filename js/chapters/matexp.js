/* Chapter: Matrix exponentials and linear dynamics */
(function () {
  'use strict';
  const LA = window.LA; const m = LA.m; const ui = LA.ui; const el = ui.el; const T = LA.theme;
  const PRESETS = [
    { label: 'Stable spiral', M: [[-0.4, -1.5], [1.5, -0.4]] }, { label: 'Rotation generator (center)', M: [[0, -1], [1, 0]] }, { label: 'Unstable spiral', M: [[0.3, -1.2], [1.2, 0.3]] },
    { label: 'Saddle', M: [[1, 0], [0, -1]] }, { label: 'Saddle (rotated)', M: [[0.5, 1], [1, 0.5]] }, { label: 'Stable node', M: [[-1, 0], [0, -0.4]] }, { label: 'Unstable node', M: [[0.8, 0.3], [0.3, 0.8]] },
    { label: 'Shear generator (defective)', M: [[0, 1], [0, 0]] }, { label: 'Degenerate (λ = 0)', M: [[1, 2], [0.5, 1]] }, { label: 'Pure decay (−½ I)', M: [[-0.5, 0], [0, -0.5]] },
  ];
  LA.chapters.push({
    id: 'matexp', title: 'Matrix exponentials', group: 'Spectral', order: 13.5, summary: 'e^{At} solves x′ = Ax: the flow that carries the whole plane along the vector field of A',
    mount(ctx) {
      const S = { A: m.clone(PRESETS[0].M), t: 1, reverse: false, x0: [2, 0.5], field: true, flow: true, traj: true, eig: true };
      const main = ctx.view('<b>Phase portrait of x′ = Ax</b> — arrows: the field Ax; curves: solutions; blue grid: the plane after time t under e<sup>At</sup>');
      const inset = ctx.view('<b>Trace–determinant plane</b> — where A sits decides the type of equilibrium', { flex: '0 0 170px' });
      main.wrap.parentElement.style.flexDirection = 'column';
      const s2 = new LA.Scene2D(main.canvas, { scale: 60 }), sp = new LA.Scene2D(inset.canvas, { interactive: false });
      const ed = ui.matrixEditor({ matrix: S.A, onChange: (A) => { S.A = A; refresh(); } });
      const sel = ui.select({ label: 'Preset', options: [{ value: '', label: '— choose —' }].concat(PRESETS.map((p, i) => ({ value: i, label: p.label }))), value: '', onChange: (i) => { if (i === '') return; S.A = m.clone(PRESETS[i].M); ed.update(S.A); refresh(); } });
      const player = ui.player({ label: 'time t (press ▶ to flow from t = 0 to 3)', max: 3, duration: 4000, value: S.t, ease: 'linear', onChange: (t) => { S.t = t; refreshT(); } });
      const revT = ui.toggle({ label: 'Reverse time (use −t)', value: S.reverse, onChange: (v) => { S.reverse = v; refreshT(); } });
      const tg = (k, label) => ui.toggle({ label, value: S[k], onChange: (v) => { S[k] = v; s2.requestDraw(); } });
      const x0Ed = ui.vectorEditor({ vector: S.x0, color: T.vec, onChange: (v) => { S.x0 = v; refreshT(); } });
      const ro = ui.readout([]); const roT = ui.readout([]); const disp = ui.matDisplay();
      ctx.controls.appendChild(ui.group('Matrix A (the generator)', ui.row(ed.el, el('div', {}, sel.el, ui.row(ui.button('Random', () => { S.A = m.randMat(2, 2, -1.5, 1.5, 0.1); ed.update(S.A); refresh(); }, { small: true }), ui.button('Transpose', () => { S.A = m.transpose(S.A); ed.update(S.A); refresh(); }, { small: true })))), ui.note('Drag the tips of <b class="i">î</b>, <b class="j">ĵ</b> on the canvas to edit the columns of A, and the yellow <b class="v">x₀</b> to choose a starting point.')));
      ctx.controls.appendChild(ui.group('Time', player.el, ui.row(revT.el), ui.row(el('span', { class: 'mlabel', html: '<b class="v">x₀</b> =' }), x0Ed.el), ui.row(tg('field', 'Vector field'), tg('traj', 'Sample trajectories'), tg('flow', 'Flowed grid'), tg('eig', 'Eigen-directions'))));
      ctx.controls.appendChild(ui.group('Analysis of A', ro.el, disp.el));
      ctx.controls.appendChild(ui.group('At the current time', roT.el));
      s2.addHandle({ get: () => m.col(S.A, 0), set: (p) => { m.setCol(S.A, 0, p); ed.refresh(); refresh(); }, color: T.i });
      s2.addHandle({ get: () => m.col(S.A, 1), set: (p) => { m.setCol(S.A, 1, p); ed.refresh(); refresh(); }, color: T.j });
      s2.addHandle({ get: () => S.x0, set: (p) => { S.x0 = p; x0Ed.update(S.x0); refreshT(); }, color: T.vec });
      const tt = () => (S.reverse ? -S.t : S.t);
      let E = m.eigen(S.A), trajCache = null;
      function trajectory(x0, T = 6, dt = 0.02) {
        const Ef = m.expm(m.scale(S.A, dt)), Eb = m.expm(m.scale(S.A, -dt)); const fwd = [x0], bwd = []; let p = x0;
        for (let i = 0; i < T / dt; i++) { p = m.apply(Ef, p); if (m.vnorm(p) > 60) break; fwd.push(p); }
        p = x0; for (let i = 0; i < T / dt; i++) { p = m.apply(Eb, p); if (m.vnorm(p) > 60) break; bwd.push(p); }
        return bwd.reverse().concat(fwd);
      }
      function refresh() {
        ed.update(S.A); E = m.eigen(S.A); const A = S.A; trajCache = null;
        const rows = [{ label: 'eigenvalues of A', value: E.values.map((z) => m.fmtC(z)).join(', ') }, { label: 'tr A, det A', value: `${m.fmt(m.trace(A))}, ${m.fmt(m.det(A))}` }, { label: 'type of equilibrium at 0', value: m.classify2(A), color: T.accent }];
        E.spaces.forEach((s, i) => { if (!s.complex) rows.push({ label: `along eigenvector ${m.fmtVec(s.vectors[0])}`, value: `solutions scale by e^{${m.fmt(s.value.re)}t}: ${s.value.re > 1e-9 ? 'growth' : s.value.re < -1e-9 ? 'decay' : 'constant'}`, color: T.eig[i] }); });
        ro.update(rows);
        const realVecs = E.spaces.filter((s) => !s.complex).flatMap((s) => s.vectors);
        if (E.realCount === 2 && E.diagonalizable && realVecs.length === 2) { const P = m.fromCols(realVecs), Pi = m.inverse(P); const lam = E.spaces.filter((s) => !s.complex).flatMap((s) => Array(s.vectors.length).fill(s.value.re)); disp.set(`e<sup>At</sup> = P e<sup>Dt</sup> P⁻¹ = ${ui.mhtml(P)}${ui.mhtml([[`e^{${m.fmt(lam[0])}t}`, '0'], ['0', `e^{${m.fmt(lam[1])}t}`]])}${ui.mhtml(Pi)}`); }
        else if (E.realCount < 2) { const z = E.values[0]; const a = z.re, bb = Math.abs(z.im); disp.set(`λ = ${m.fmt(a)} ± ${m.fmt(bb)}i: &nbsp; e<sup>At</sup> = e<sup>${m.fmt(a)}t</sup>·(rotation by ${m.fmt(bb)}t, in a basis that makes the orbits circles). ${Math.abs(a) < 1e-9 ? 'Pure rotation: every orbit is a closed ellipse.' : a < 0 ? 'The factor e^{' + m.fmt(a) + 't} shrinks the spiral.' : 'The factor e^{' + m.fmt(a) + 't} expands the spiral.'}`); }
        else { const lam = E.values[0].re; disp.set(`Repeated λ = ${m.fmt(lam)} with one eigenvector: &nbsp; e<sup>At</sup> = e<sup>${m.fmt(lam)}t</sup>·(I + (A − ${m.fmt(lam)}I)t) — the series stops because (A − λI)² = 0.`); }
        refreshT();
      }
      function refreshT() {
        const t = tt(); const At = m.scale(S.A, t); const Et = m.expm(At); const xt = m.apply(Et, S.x0);
        let terms = m.identity(2), term = m.identity(2), k = 0; while (k < 60) { k++; term = m.scale(m.mul(term, At), 1 / k); terms = m.add(terms, term); if (m.maxAbs(term) < 1e-9) break; }
        roT.update([
          { label: 't', value: m.fmt(t) }, { label: 'e<sup>At</sup>', value: ui.frag(ui.mhtml(m.round(Et, 0.001))) },
          { label: 'series I + At + (At)²/2! + …', value: `${k} terms give 9-digit accuracy here` },
          { label: 'det e<sup>At</sup>', value: `${m.fmt(m.det(Et), 3)} = e^{t·tr A} = e^{${m.fmt(t * m.trace(S.A))}} = ${m.fmt(Math.exp(t * m.trace(S.A)), 3)}` },
          { label: 'eigenvalues of e<sup>At</sup>', value: E.values.map((z) => (z.im ? m.fmtC({ re: Math.exp(z.re * t) * Math.cos(z.im * t), im: Math.exp(z.re * t) * Math.sin(z.im * t) }) : m.fmt(Math.exp(z.re * t)))).join(', ') + ' = e^{λt}' },
          { label: 'x(t) = e<sup>At</sup> x₀', value: `${m.fmtVec(S.x0)} ↦ ${m.fmtVec(xt)}`, color: T.vec },
        ]);
        s2.requestDraw(); sp.requestDraw();
      }
      s2.onDraw = (s) => {
        const A = S.A, t = tt(); const Et = m.expm(m.scale(A, t));
        s.baseGrid();
        if (S.flow) { s.grid(Et, { alpha: 0.35 }); s.unitSquare(Et, { alpha: 0.6 }); }
        if (S.eig) E.spaces.forEach((sp2, i) => { if (sp2.complex) return; for (const v of sp2.vectors) { s.infiniteLine([0, 0], v, { color: T.eig[i], width: 2, alpha: 0.8 }); s.text(m.vscale(m.vnormalize(v), 3.4), 'λ = ' + m.fmt(sp2.value.re), { color: T.eig[i], dy: -8, bg: 'rgba(11,14,20,0.6)' }); } });
        if (S.field) { const bd = s.bounds(); const step = s.scale > 45 ? 1 : 2; for (let x = Math.ceil(bd.xmin / step) * step; x <= bd.xmax; x += step) for (let y = Math.ceil(bd.ymin / step) * step; y <= bd.ymax; y += step) { const p = [x, y]; const v = m.apply(A, p); const nv = m.vnorm(v); if (nv < 1e-9) continue; const len = Math.min(0.45, 0.12 + 0.15 * nv); s.vector(m.vadd(p, m.vscale(v, len / nv)), { from: p, color: 'rgba(139,148,167,0.9)', width: 1.2, alpha: m.clamp(0.3 + nv * 0.2, 0.3, 0.9) }); } }
        if (S.traj) { if (!trajCache) { trajCache = []; const K = 12; for (let k = 0; k < K; k++) { const a = (2 * Math.PI * k) / K; trajCache.push(trajectory([2.5 * Math.cos(a), 2.5 * Math.sin(a)])); } for (const p of [[0.6, 0], [0, 0.6], [-0.6, 0], [0, -0.6]]) trajCache.push(trajectory(p)); } for (const tr of trajCache) s.polyline(tr, { color: 'rgba(88,196,221,0.55)', width: 1.2 }); }
        const mine = trajectory(S.x0); s.polyline(mine, { color: 'rgba(245,213,71,0.6)', width: 2 });
        const xt = m.apply(Et, S.x0); s.vector(S.x0, { color: T.vec, width: 1.5, alpha: 0.5, dash: [4, 4], label: 'x₀' }); s.vector(xt, { color: T.vec, width: 3, label: 'x(t)' }); s.point(xt, { color: T.vec, r: 5 });
        if (S.flow) s.basis(Et, { width: 2, alpha: 0.8, labels: false });
        s.basis(A, { width: 1.5, alpha: 0.35, labels: true });
        s.caption(`t = ${m.fmt(t)}   det e^{At} = ${m.fmt(m.det(Et), 3)}   ${m.classify2(A)}`, { y: 36, color: T.text });
      };
      sp.onDraw = (s) => {
        const c = s.ctx, W = s.width, H = s.height; const tr = m.trace(S.A), det = m.det(S.A); const R = Math.max(3, Math.abs(tr) + 0.5, Math.abs(det) + 0.5);
        const X = (v) => 36 + ((v + R) / (2 * R)) * (W - 50), Y = (v) => H - 20 - ((v + R) / (2 * R)) * (H - 36);
        c.fillStyle = 'rgba(252,98,85,0.10)'; c.fillRect(X(-R), Y(0), X(R) - X(-R), Y(-R) - Y(0));
        c.beginPath(); c.moveTo(X(-R), Y(R * R / 4)); for (let v = -R; v <= R; v += R / 60) c.lineTo(X(v), Y((v * v) / 4)); c.lineTo(X(R), Y(R)); c.lineTo(X(-R), Y(R)); c.closePath(); c.fillStyle = 'rgba(88,196,221,0.10)'; c.fill();
        c.strokeStyle = 'rgba(255,255,255,0.3)'; c.lineWidth = 1; c.beginPath(); c.moveTo(X(-R), Y(0)); c.lineTo(X(R), Y(0)); c.moveTo(X(0), Y(-R)); c.lineTo(X(0), Y(R)); c.stroke();
        c.strokeStyle = T.accent; c.lineWidth = 1.5; c.beginPath(); for (let v = -R; v <= R; v += R / 60) { const x = X(v), y = Y((v * v) / 4); v === -R ? c.moveTo(x, y) : c.lineTo(x, y); } c.stroke();
        c.font = '11px ui-sans-serif, system-ui, sans-serif'; c.fillStyle = T.muted; c.textAlign = 'center';
        c.fillText('saddles (det < 0)', X(0), Y(-R / 2)); c.fillText('spirals (det > tr²/4)', X(0), Y(R * 0.8)); c.textAlign = 'left'; c.fillText('nodes', X(R * 0.55), Y(R * 0.12)); c.textAlign = 'right'; c.fillText('nodes', X(-R * 0.55), Y(R * 0.12));
        c.fillStyle = T.good; c.textAlign = 'right'; c.fillText('tr < 0: stable', X(-0.1), Y(R) + 12); c.fillStyle = T.warn; c.textAlign = 'left'; c.fillText('tr > 0: unstable', X(0.1), Y(R) + 12);
        c.fillStyle = T.muted; c.textAlign = 'right'; c.fillText('tr A', X(R), Y(0) - 4); c.textAlign = 'left'; c.fillText('det A', X(0) + 4, Y(R) + 24);
        c.fillStyle = T.vec; c.beginPath(); c.arc(X(tr), Y(det), 5, 0, Math.PI * 2); c.fill(); c.strokeStyle = T.bg; c.lineWidth = 1.5; c.stroke();
      };
      refresh();
      ctx.onUnmount(() => { player.stop(); s2.destroy(); sp.destroy(); });
      ctx.hint('Drag x₀ and the columns of A · press ▶ to let time run · reverse time to see where points came from');
      ctx.notes.appendChild(ui.prose(`
<h2>Exponentiating a matrix</h2>
<p>For a number, <span class="m">x′ = ax</span> has solution <span class="m">x(t) = e^{at}x₀</span>. For a system of linear differential equations <span class="m"><b>x</b>′ = A<b>x</b></span> — every component's rate of change is a linear combination of the components — the same formula holds once <span class="m">e^{At}</span> is given a meaning. The power series does it:</p>
<div class="formula">e<sup>At</sup> = I + At + (At)²/2! + (At)³/3! + ⋯</div>
<p>It converges for every square matrix. Differentiating term by term gives <span class="m">(d/dt) e^{At} = A e^{At}</span>, so <span class="m"><b>x</b>(t) = e^{At}<b>x₀</b></span> solves the equation with <span class="m"><b>x</b>(0) = <b>x₀</b></span>. The canvas shows the <b>vector field</b> <span class="m">A<b>x</b></span> (which way each point is pushed), the <b>trajectories</b> (where points go), and the <b>flow</b>: the whole grid carried to time <span class="m">t</span>. Unlike the straight-line morphs in earlier chapters, this is the natural continuous path from the identity to <span class="m">e^{A}</span>.</p>
<div class="def"><h4>Eigenvalues tell the story</h4>
<p>If <span class="m">A<b>v</b> = λ<b>v</b></span> then <span class="m">e^{At}<b>v</b> = e^{λt}<b>v</b></span>: along an eigen-direction the solution just scales, growing if λ &gt; 0 and decaying if λ &lt; 0. With a basis of eigenvectors, <span class="m">e^{At} = P e^{Dt} P⁻¹</span>, where <span class="m">e^{Dt}</span> is diagonal with entries <span class="m">e^{λᵢt}</span>. Complex eigenvalues <span class="m">a ± bi</span> produce <span class="m">e^{at}</span> times a rotation at angular speed <span class="m">b</span>: spirals, or closed orbits if <span class="m">a = 0</span>. The rotation generator <span class="m">[[0, −1], [1, 0]]</span> is the matrix version of <span class="m">e^{iθ} = cos θ + i sin θ</span>: its exponential at time θ is exactly rotation by θ.</p></div>
<h4>Properties worth memorising</h4>
<ul>
<li><span class="m">e^{A(s+t)} = e^{As}e^{At}</span>, <span class="m">e^{0} = I</span>, <span class="m">(e^{At})⁻¹ = e^{−At}</span>: the flow can always be run backwards (toggle reverse time). Every <span class="m">e^{At}</span> is invertible.</li>
<li><span class="m">det e^{At} = e^{t·tr A}</span>: the trace is the rate at which areas grow. A traceless generator preserves area — the rotation generator and the shear generator both do.</li>
<li><span class="m">e^{A+B} = e^{A}e^{B}</span> only when <span class="m">AB = BA</span>. Flows in different directions do not commute, for the same reason matrix products do not.</li>
<li>Defective matrices have no eigenbasis but the series still works; for a repeated eigenvalue the solutions pick up a factor of <span class="m">t</span>, as in <span class="m">e^{At} = e^{λt}(I + (A − λI)t)</span>.</li>
</ul>
<div class="def"><h4>The trace–determinant plane</h4><p>For 2×2 systems the eigenvalues are <span class="m">½(tr ± √(tr² − 4 det))</span>, so the pair (tr A, det A) classifies the equilibrium at the origin: below the horizontal axis a <b>saddle</b>; above it but below the parabola <span class="m">det = tr²/4</span> a <b>node</b>; above the parabola a <b>spiral</b>; on the vertical axis a <b>center</b>. The sign of the trace separates stable (left) from unstable (right). The yellow dot is your matrix — drag <b class="i">î</b> or <b class="j">ĵ</b> and watch it cross a boundary.</p></div>
<h4>Discrete versus continuous</h4>
<p>Chapter 12's power iteration applied <span class="m">A</span> repeatedly: <span class="m"><b>x</b>ₖ = Aᵏ<b>x₀</b></span>, governed by |λ| versus 1. Here time is continuous and the same role is played by <span class="m">e^{λt}</span>, governed by Re λ versus 0. Both are the reason eigenvalues decide stability — of populations, circuits, mechanical vibrations, Markov processes in continuous time, and the linearisation of any nonlinear system near an equilibrium.</p>
<div class="try"><h4>Try this</h4><ul>
<li>Load the <em>Rotation generator</em> and play: the grid turns rigidly, det stays 1, and at t = π/2 ≈ 1.57 the matrix e^{At} is the 90° rotation.</li>
<li>Load <em>Saddle</em>: solutions approach along the stable eigen-direction and leave along the unstable one. Put x₀ exactly on the stable line and it heads to the origin.</li>
<li>Load <em>Shear generator</em>: eigenvalue 0 twice, one eigenvector. The flow is a shear that grows linearly with t, not exponentially.</li>
<li>Drag <b class="j">ĵ</b> slowly across the parabola in the inset: the node's two eigenlines merge and the portrait turns into a spiral.</li>
</ul></div>`));
    },
  });
})();
