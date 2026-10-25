/* Chapter: Eigenvectors and eigenvalues */
(function () {
  'use strict';
  const LA = window.LA; const m = LA.m; const ui = LA.ui; const el = ui.el; const T = LA.theme;
  const P2 = [
    { label: 'Default: two eigen-directions', M: [[3, 1], [0, 2]] }, { label: 'Symmetric (perpendicular eigenvectors)', M: [[2, 1], [1, 2]] }, { label: 'Shear — defective (one direction only)', M: [[1, 1], [0, 1]] },
    { label: 'Rotation 90° — no real eigenvectors', M: [[0, -1], [1, 0]] }, { label: 'Rotate & scale (complex λ)', M: [[1, -1], [1, 1]] }, { label: 'Diagonal scaling', M: [[2, 0], [0, 0.5]] },
    { label: 'Reflection (λ = 1, −1)', M: [[0, 1], [1, 0]] }, { label: 'Projection (λ = 1, 0)', M: [[0.5, 0.5], [0.5, 0.5]] }, { label: 'Markov matrix (λ = 1, …)', M: [[0.9, 0.3], [0.1, 0.7]] },
    { label: 'Negative eigenvalue', M: [[1, 2], [2, -2]] }, { label: 'Identity (every vector)', M: [[1, 0], [0, 1]] },
  ];
  const P3 = [
    { label: 'Symmetric', M: [[2, 1, 0], [1, 2, 0], [0, 0, 3]] }, { label: 'Rotation 50° about (1,1,1)', M: m.rot3([1, 1, 1], m.rad(50)) }, { label: 'Diagonal scaling', M: m.diag([2, 1, 0.5]) },
    { label: 'Shear (defective)', M: [[1, 1, 0], [0, 1, 0], [0, 0, 2]] }, { label: 'Projection onto xy-plane', M: m.diag([1, 1, 0]) }, { label: 'Reflection z → −z', M: m.diag([1, 1, -1]) }, { label: 'General', M: [[2, 0.5, 0], [0.5, 1, 0.5], [0, 0.5, 2]] },
  ];
  LA.chapters.push({
    id: 'eigen', title: 'Eigenvectors & eigenvalues', group: 'Spectral', order: 12, summary: 'The directions a transformation merely stretches, and by how much',
    mount(ctx) {
      const S = { mode: '2d', A: m.clone(P2[0].M), A3: m.clone(P3[0].M), t: 1, v: [1.5, 1.2], v3: [1, 0.5, 1.5], lines: true, field: false, basis: true, lam: 0, lamMode: false, eigView: false, iters: 0 };
      let scenes = [], player = null;
      const chips = el('div', { class: 'chips' });
      const setMode = (mode) => { S.mode = mode; chips.querySelectorAll('.chip').forEach((c) => c.classList.toggle('active', c.dataset.m === mode)); build(); };
      for (const [k, l] of [['2d', 'Plane ℝ²'], ['3d', 'Space ℝ³']]) chips.appendChild(el('button', { class: 'chip' + (S.mode === k ? ' active' : ''), 'data-m': k, text: l, on: { click: () => setMode(k) } }));
      function destroy() { scenes.forEach((s) => s.destroy()); scenes = []; player && player.stop(); }
      function build() { destroy(); ctx.stage.innerHTML = ''; ctx.controls.innerHTML = ''; ctx.controls.appendChild(ui.group('Space', chips)); S.mode === '2d' ? build2D() : build3D(); }
      const cpString = (c) => { const n = c.length - 1; const terms = []; for (let k = n; k >= 0; k--) { const a = c[k]; if (Math.abs(a) < 1e-9) continue; const coef = k === n ? '' : (Math.abs(Math.abs(a) - 1) < 1e-9 && k > 0 ? '' : m.fmt(Math.abs(a))); const pow = k === 0 ? '' : k === 1 ? 'λ' : 'λ' + '⁰¹²³⁴⁵⁶⁷⁸⁹'[k]; terms.push((terms.length ? (a < 0 ? ' − ' : ' + ') : a < 0 ? '−' : '') + coef + pow); } return terms.join('') || '0'; };
      const eigRows = (E, n) => {
        const rows = [{ label: 'characteristic polynomial', value: `det(λI − A) = ${cpString(E.charPoly)}` }];
        E.spaces.forEach((s, i) => {
          const col = T.eig[i % T.eig.length];
          if (s.complex) rows.push({ label: `λ${'₁₂₃'[i]}`, value: `${m.fmtC(s.value)}  — complex: no real eigenvector; |λ| = ${m.fmt(Math.hypot(s.value.re, s.value.im))}, angle ${m.fmt(m.deg(Math.atan2(s.value.im, s.value.re)), 1)}°`, color: col });
          else rows.push({ label: `λ${'₁₂₃'[i]}${s.alg > 1 ? ' (×' + s.alg + ')' : ''}`, value: `${m.fmt(s.value.re)} &nbsp; eigenvector${s.vectors.length > 1 ? 's' : ''}: ${s.vectors.map((v) => m.fmtVec(v)).join(', ')}${s.geo < s.alg ? ' — only ' + s.geo + ' direction' + (s.geo > 1 ? 's' : '') + ' for multiplicity ' + s.alg + ' (defective)' : s.geo === n ? ' — every vector' : ''}`, color: col });
        });
        rows.push({ label: 'diagonalisable over ℝ?', value: E.realCount === n && E.diagonalizable ? 'yes — a basis of eigenvectors exists' : E.realCount < n ? 'no — complex eigenvalues (it rotates)' : 'no — not enough independent eigenvectors', color: E.realCount === n && E.diagonalizable ? T.good : T.warn });
        rows.push({ label: 'checks', value: `tr A = Σλ = ${m.fmt(E.values.reduce((a, z) => a + z.re, 0))},  det A = Πλ = ${m.fmt(E.values.reduce((a, z) => a * (Math.abs(z.im) > 0 ? Math.hypot(z.re, z.im) : z.re), 1))}` });
        return rows;
      };
      function build2D() {
        const main = ctx.view('<b>ℝ² under A</b> — coloured lines are eigen-directions; vectors on them only stretch');
        const inset = ctx.view('<b>p(λ) = det(λI − A)</b> — its roots are the eigenvalues', { flex: '0 0 150px' });
        main.wrap.parentElement.style.flexDirection = 'column';
        const s2 = new LA.Scene2D(main.canvas, { scale: 60 }), sp = new LA.Scene2D(inset.canvas, { interactive: false }); scenes = [s2, sp];
        const ed = ui.matrixEditor({ matrix: S.A, onChange: (A) => { S.A = A; refresh(); } });
        const sel = ui.select({ label: 'Preset', options: [{ value: '', label: '— choose —' }].concat(P2.map((p, i) => ({ value: i, label: p.label }))), value: '', onChange: (i) => { if (i === '') return; S.A = m.clone(P2[i].M); ed.update(S.A); refresh(); } });
        player = ui.player({ label: 'Animate identity → A', value: S.t, onChange: (t) => { S.t = t; redraw(); } });
        const tg = (k, label) => ui.toggle({ label, value: S[k], onChange: (val) => { S[k] = val; refresh(); } });
        const lamS = ui.slider({ label: 'λ — show the grid of (A − λI); it collapses when λ is an eigenvalue', min: -4, max: 6, step: 0.01, value: S.lam, onChange: (v) => { S.lam = v; S.lamMode = true; lamT.set(true); redraw(); } });
        const lamT = ui.toggle({ label: 'Show A − λI instead of A', value: S.lamMode, onChange: (val) => { S.lamMode = val; redraw(); } });
        const eigT = ui.toggle({ label: 'View in the eigenbasis (A becomes diagonal)', value: S.eigView, onChange: (val) => { S.eigView = val; refresh(); } });
        const iterBtn = ui.button('Apply A to v (power iteration)', () => { const Av = m.apply(S.A, S.v); if (m.vnorm(Av) > 1e-9) S.v = m.vscale(m.vnormalize(Av), 2); S.iters++; refresh(); }, { small: true });
        const ro = ui.readout([]); const disp = ui.matDisplay();
        ctx.controls.appendChild(ui.group('Matrix A', ui.row(ed.el, el('div', {}, sel.el, ui.row(ui.button('Random', () => { S.A = m.randMat(2, 2, -2, 3, 0.5); ed.update(S.A); refresh(); }, { small: true }), ui.button('Random symmetric', () => { const B = m.randMat(2, 2, -2, 3, 0.5); B[1][0] = B[0][1]; S.A = B; ed.update(S.A); refresh(); }, { small: true })))), ui.note('Drag <b class="i">î</b>, <b class="j">ĵ</b> and the yellow <b class="v">v</b>. Eigen-directions update live.')));
        ctx.controls.appendChild(ui.group('Explore', player.el, ui.row(tg('lines', 'Eigen-directions'), tg('field', 'Many vectors'), tg('basis', 'î, ĵ')), ui.row(eigT.el), ui.row(iterBtn, ui.button('Reset v', () => { S.v = [1.5, 1.2]; S.iters = 0; refresh(); }, { small: true }))));
        ctx.controls.appendChild(ui.group('Why det(A − λI) = 0', lamS.el, ui.row(lamT.el)));
        ctx.controls.appendChild(ui.group('Eigen-analysis', ro.el, disp.el));
        s2.addHandle({ get: () => m.col(S.A, 0), set: (p) => { m.setCol(S.A, 0, p); ed.refresh(); refresh(); }, color: T.i, hidden: () => S.eigView });
        s2.addHandle({ get: () => m.col(S.A, 1), set: (p) => { m.setCol(S.A, 1, p); ed.refresh(); refresh(); }, color: T.j, hidden: () => S.eigView });
        s2.addHandle({ get: () => S.v, set: (p) => { S.v = p; S.iters = 0; refresh(); }, color: T.vec, hidden: () => S.eigView });
        let E = m.eigen(S.A);
        const redraw = () => { s2.requestDraw(); sp.requestDraw(); };
        function refresh() {
          ed.update(S.A); E = m.eigen(S.A); const A = S.A;
          const rows = eigRows(E, 2);
          const Av = m.apply(A, S.v); const ang = m.angle(S.v, Av); const isEig = m.vnorm(S.v) > 1e-9 && (Number.isNaN(ang) || ang < 0.01 || Math.abs(ang - Math.PI) < 0.01);
          rows.push({ label: '<b class="v">v</b> ↦ A<b class="v">v</b>', value: `${m.fmtVec(S.v)} ↦ ${m.fmtVec(Av)}${isEig ? ' — v is on an eigen-direction: Av = ' + m.fmt(m.vnorm(Av) / m.vnorm(S.v) * (m.vdot(S.v, Av) < 0 ? -1 : 1)) + '·v' : ''}${S.iters ? `  (after ${S.iters} application${S.iters > 1 ? 's' : ''})` : ''}`, color: isEig ? T.good : undefined });
          ro.update(rows);
          const realSpaces = E.spaces.filter((s) => !s.complex); const vecs = realSpaces.flatMap((s) => s.vectors);
          if (E.realCount === 2 && E.diagonalizable && vecs.length === 2) { const P = m.fromCols(vecs), D = m.diag(realSpaces.flatMap((s) => Array(s.vectors.length).fill(s.value.re))), Pi = m.inverse(P); disp.set(`A = P D P⁻¹ = ${ui.mhtml(P)}${ui.mhtml(D)}${ui.mhtml(Pi)}${m.isSymmetric(A) ? '<br><span class="note">A is symmetric, so its eigenvectors are perpendicular and P can be taken orthogonal (P⁻¹ = Pᵀ).</span>' : ''}<br><span class="note">Powers are easy: Aᵏ = P Dᵏ P⁻¹, e.g. A¹⁰ has diagonal entries ${D.map((r, i) => m.fmt(Math.pow(r[i], 10))).join(', ')} in the eigenbasis.</span>`); }
          else if (E.realCount < 2) { const z = E.values[0]; disp.set(`<span class="note">Complex pair λ = ${m.fmtC(z)}: in a suitable basis A is a rotation by ${m.fmt(m.deg(Math.atan2(Math.abs(z.im), z.re)), 1)}° combined with scaling by |λ| = ${m.fmt(Math.hypot(z.re, z.im))}. No direction stays on its own line.</span>`); }
          else disp.set('<span class="note">Only one eigen-direction: A is a shear-like map and cannot be diagonalised. Its Jordan form has a 1 above the diagonal.</span>');
          if (S.eigView && !(E.realCount === 2 && E.diagonalizable && vecs.length === 2)) { S.eigView = false; eigT.set(false); }
          redraw();
        }
        s2.onDraw = (s) => {
          const A = S.A; const lam = S.lamMode ? S.lam : 0; const Al = m.sub(A, m.scale(m.identity(2), lam)); let M = m.lerp(m.identity(2), Al, S.t);
          let W = m.identity(2); // view transform (eigenbasis)
          if (S.eigView) { const vecs = E.spaces.filter((q) => !q.complex).flatMap((q) => q.vectors); const P = m.fromCols(vecs); const Pi = m.inverse(P); if (Pi) { W = Pi; } }
          const Mv = m.mul(m.mul(W, M), m.inverse(W) || m.identity(2));
          s.baseGrid(); s.grid(Mv, { alpha: 0.7 });
          if (S.lines) E.spaces.forEach((sp, i) => { if (sp.complex) return; const col = T.eig[i % T.eig.length]; if (sp.geo >= 2) { s.shadeAll(col, 0.08); s.caption('every direction is an eigen-direction (A = λI)', { y: 52, color: col }); return; } for (const v of sp.vectors) { const d = m.apply(W, v); s.infiniteLine([0, 0], d, { color: col, width: 2, alpha: 0.9 }); const lp = m.vscale(m.vnormalize(d), 3.2); s.text(lp, 'λ = ' + m.fmt(sp.value.re), { color: col, dy: -8, bg: 'rgba(11,14,20,0.6)' }); } });
          if (S.field) { const K = 24; for (let k = 0; k < K; k++) { const a = (2 * Math.PI * k) / K; const u = [Math.cos(a), Math.sin(a)]; const uu = m.apply(W, u), Mu = m.apply(Mv, uu); s.vector(uu, { color: 'rgba(255,255,255,0.25)', width: 1, head: false }); s.vector(Mu, { color: 'rgba(88,196,221,0.75)', width: 1.5 }); } }
          if (S.basis) s.basis(Mv, { width: 2, alpha: 0.9 });
          const vv = m.apply(W, S.v), Mvv = m.apply(Mv, vv);
          s.infiniteLine([0, 0], vv, { color: 'rgba(245,213,71,0.35)', width: 1, dash: [4, 6] });
          if (S.t < 1 || S.lamMode) s.vector(vv, { color: T.vec, alpha: 0.35, width: 2 });
          s.vector(Mvv, { color: T.vec, width: 3, label: S.t < 1 ? 'v' : (S.lamMode ? '(A − λI)v' : 'Av') });
          if (!S.lamMode) s.vector(vv, { color: T.vec, width: 1.5, alpha: 0.5, head: true });
          if (S.lamMode) s.caption(`A − λI with λ = ${m.fmt(S.lam)}:  det = ${m.fmt(m.det(Al))}${Math.abs(m.det(Al)) < 0.05 ? '  ← nearly zero: λ is an eigenvalue, space collapses' : ''}`, { y: 36, color: Math.abs(m.det(Al)) < 0.05 ? T.eig[0] : T.text });
          else s.caption(S.eigView ? 'eigenbasis view: A is diagonal here — each axis is simply scaled by its eigenvalue' : `det = ${m.fmt(m.det(M))}  tr = ${m.fmt(m.trace(M))}`, { y: 36, color: T.text });
        };
        sp.onDraw = (s) => {
          const ctx2 = s.ctx, W = s.width, H = s.height; const c = E.charPoly; const roots = E.values.filter((z) => z.im === 0).map((z) => z.re);
          const xs = roots.length ? roots : [0]; let lo = Math.min(-2, ...xs) - 1.5, hi = Math.max(2, ...xs) + 1.5; if (S.lamMode) { lo = Math.min(lo, S.lam - 0.5); hi = Math.max(hi, S.lam + 0.5); }
          const N = 160; let ymax = 1; const pts = []; for (let i = 0; i <= N; i++) { const x = lo + ((hi - lo) * i) / N; const y = m.polyEval(c, x); pts.push([x, y]); ymax = Math.max(ymax, Math.min(Math.abs(y), 40)); }
          ymax = Math.min(ymax, 12); const X = (x) => 30 + ((x - lo) / (hi - lo)) * (W - 40), Y = (y) => H / 2 - (y / ymax) * (H / 2 - 18);
          ctx2.strokeStyle = 'rgba(255,255,255,0.25)'; ctx2.lineWidth = 1; ctx2.beginPath(); ctx2.moveTo(30, Y(0)); ctx2.lineTo(W - 10, Y(0)); ctx2.moveTo(X(0), 10); ctx2.lineTo(X(0), H - 8); ctx2.stroke();
          ctx2.strokeStyle = T.accent; ctx2.lineWidth = 2; ctx2.beginPath(); pts.forEach((p, i) => { const y = m.clamp(Y(p[1]), -50, H + 50); i ? ctx2.lineTo(X(p[0]), y) : ctx2.moveTo(X(p[0]), y); }); ctx2.stroke();
          ctx2.font = '11px ui-sans-serif, system-ui, sans-serif'; ctx2.fillStyle = T.muted; ctx2.textAlign = 'center'; for (let x = Math.ceil(lo); x <= hi; x++) { ctx2.fillText(String(x), X(x), Y(0) + 13); }
          E.spaces.forEach((sp2, i) => { if (sp2.complex) return; ctx2.fillStyle = T.eig[i % T.eig.length]; ctx2.beginPath(); ctx2.arc(X(sp2.value.re), Y(0), 5, 0, Math.PI * 2); ctx2.fill(); });
          if (S.lamMode) { ctx2.strokeStyle = T.vec; ctx2.setLineDash([4, 4]); ctx2.beginPath(); ctx2.moveTo(X(S.lam), 10); ctx2.lineTo(X(S.lam), H - 8); ctx2.stroke(); ctx2.setLineDash([]); ctx2.fillStyle = T.vec; ctx2.beginPath(); ctx2.arc(X(S.lam), Y(m.polyEval(c, S.lam)), 4, 0, Math.PI * 2); ctx2.fill(); }
          if (E.realCount === 0) { ctx2.fillStyle = T.warn; ctx2.textAlign = 'left'; ctx2.fillText('no real roots → no real eigenvectors', 34, 22); }
          ctx2.fillStyle = T.text; ctx2.textAlign = 'right'; ctx2.fillText('p(λ) = ' + cpString(c), W - 12, 22);
        };
        refresh();
        ctx.hint('Drag v along a coloured line: Av stays on the line · move the λ slider to see det(A − λI) hit zero at the eigenvalues');
      }
      function build3D() {
        const view = ctx.view('<b>ℝ³ under A</b> — coloured lines/planes are eigenspaces');
        const s3 = new LA.Scene3D(view.canvas, { dist: 9 }); scenes = [s3];
        const ed = ui.matrixEditor({ matrix: S.A3, onChange: (A) => { S.A3 = A; refresh(); } });
        const vEd = ui.vectorEditor({ vector: S.v3, color: T.vec, onChange: (v) => { S.v3 = v; refresh(); } });
        const sel = ui.select({ label: 'Preset', options: [{ value: '', label: '— choose —' }].concat(P3.map((p, i) => ({ value: i, label: p.label }))), value: '', onChange: (i) => { if (i === '') return; S.A3 = m.clone(P3[i].M); ed.update(S.A3); refresh(); } });
        player = ui.player({ label: 'Animate identity → A', value: S.t, onChange: (t) => { S.t = t; s3.requestDraw(); } });
        const rotT = ui.toggle({ label: 'Auto-rotate camera', value: false, onChange: (v) => { s3.autoRotate = v; s3.requestDraw(); } });
        const iterBtn = ui.button('Apply A to v (power iteration)', () => { const Av = m.apply(S.A3, S.v3); if (m.vnorm(Av) > 1e-9) S.v3 = m.vscale(m.vnormalize(Av), 2); vEd.update(S.v3); refresh(); }, { small: true });
        const ro = ui.readout([]); const disp = ui.matDisplay();
        ctx.controls.appendChild(ui.group('Matrix A', ed.el, ui.row(sel.el, ui.button('Random symmetric', () => { const B = m.randMat(3, 3, -2, 2, 0.5); for (let i = 0; i < 3; i++) for (let j = i; j < 3; j++) B[j][i] = B[i][j]; S.A3 = B; ed.update(S.A3); refresh(); }, { small: true }), ui.button('Random', () => { S.A3 = m.randMat(3, 3, -2, 2, 0.5); ed.update(S.A3); refresh(); }, { small: true }))));
        ctx.controls.appendChild(ui.group('Explore', player.el, ui.row(el('span', { class: 'mlabel', html: '<b class="v">v</b> =' }), vEd.el, iterBtn), ui.row(rotT.el)));
        ctx.controls.appendChild(ui.group('Eigen-analysis', ro.el, disp.el));
        let E = m.eigen(S.A3);
        function refresh() {
          E = m.eigen(S.A3); const rows = eigRows(E, 3); const Av = m.apply(S.A3, S.v3); rows.push({ label: '<b class="v">v</b> ↦ A<b class="v">v</b>', value: `${m.fmtVec(S.v3)} ↦ ${m.fmtVec(Av)}` }); ro.update(rows);
          const orth = m.isOrthogonal(S.A3); disp.set(orth && m.det(S.A3) > 0 ? '<span class="note">A is a rotation: its axis is the real eigenvector (λ = 1); the other two eigenvalues are the complex pair e^{±iθ}.</span>' : m.isSymmetric(S.A3) ? '<span class="note">A is symmetric: three real eigenvalues and mutually perpendicular eigenvectors (spectral theorem).</span>' : '');
          s3.requestDraw();
        }
        s3.onDraw = (s) => {
          const M = m.lerp(m.identity(3), S.A3, S.t);
          s.axes({ length: 4 }); s.grid(m.identity(3), { range: 3, color: 'rgba(255,255,255,0.07)', axisColor: 'rgba(255,255,255,0.15)' }); s.grid(M, { range: 3, alpha: 0.5 });
          E.spaces.forEach((sp, i) => { if (sp.complex) return; const col = T.eig[i % T.eig.length]; if (sp.geo === 1) s.lineSpan(sp.vectors[0], { color: col, size: 5, width: 3 }); else if (sp.geo === 2) s.planePatch(sp.vectors[0], sp.vectors[1], { size: 3, fill: LA.rgba(col, 0.15), lineColor: LA.rgba(col, 0.5) }); if (sp.geo === 1) s.text(m.vscale(m.vnormalize(sp.vectors[0]), 5.3), 'λ = ' + m.fmt(sp.value.re), { color: col }); });
          s.cube(M, { alpha: 0.25 }); s.basis(M, { width: 2 });
          const Mv = m.apply(M, S.v3); s.line(m.vscale(m.vnormalize(S.v3), -6), m.vscale(m.vnormalize(S.v3), 6), { color: 'rgba(245,213,71,0.3)', width: 1, dash: [4, 6] }); s.vector(S.v3, { color: T.vec, width: 1.5, alpha: 0.5 }); s.vector(Mv, { color: T.vec, width: 3, label: S.t < 1 ? 'v' : 'Av' });
          s.caption(`det = ${m.fmt(m.det(M))}`, { y: 36, color: T.text });
        };
        refresh();
        ctx.hint('Drag to orbit · eigenspaces are the lines/planes that map to themselves · a rotation’s axis is its eigenvector');
      }
      build();
      ctx.onUnmount(destroy);
      ctx.notes.appendChild(ui.prose(`
<h2>Directions that only stretch</h2>
<p>Most vectors get knocked off their own line by a transformation. An <b>eigenvector</b> is one that is not: <span class="m">A<b>v</b> = λ<b>v</b></span> for some scalar <span class="m">λ</span>, the <b>eigenvalue</b>. The line through <b>v</b> maps onto itself; the eigenvalue says by how much it stretches (λ &gt; 1), shrinks (0 &lt; λ &lt; 1), flips (λ &lt; 0) or collapses (λ = 0).</p>
<div class="def"><h4>Why det(A − λI) = 0</h4>
<p>Rewrite <span class="m">A<b>v</b> = λ<b>v</b></span> as <span class="m">(A − λI)<b>v</b> = <b>0</b></span>. A nonzero <b>v</b> is sent to zero only if <span class="m">A − λI</span> squashes space — that is, only if <span class="m">det(A − λI) = 0</span>. Move the λ slider: subtracting λ from the diagonal changes the grid, and at exactly the eigenvalues it flattens. Expanding the determinant gives the <b>characteristic polynomial</b>, plotted in the lower panel. In 2D:</p>
<div class="formula">λ² − (tr A) λ + det A = 0 &nbsp;&nbsp;⇒&nbsp;&nbsp; λ = ½(tr A) ± √(¼(tr A)² − det A)</div>
<p>Once λ is known, the eigenvectors are the null space of <span class="m">A − λI</span>.</p></div>
<h4>The cases you will meet</h4>
<ul>
<li><b>Distinct real eigenvalues</b> (default): two independent eigen-directions. They are perpendicular exactly when A is symmetric.</li>
<li><b>Complex eigenvalues</b> (rotations): the polynomial has no real root; no line is preserved. The pair <span class="m">a ± bi</span> means "rotate by atan2(b, a) and scale by √(a²+b²)".</li>
<li><b>Repeated eigenvalue, full eigenspace</b>: <span class="m">A = λI</span> — every vector is an eigenvector.</li>
<li><b>Repeated eigenvalue, one direction</b> (shear): the <em>algebraic</em> multiplicity is 2 but the <em>geometric</em> multiplicity (dimension of the eigenspace) is 1. Such a matrix is <b>defective</b>: not diagonalisable.</li>
<li><b>Zero eigenvalue</b>: the eigenspace is the null space; det A = 0.</li>
</ul>
<div class="def"><h4>Diagonalisation</h4><p>If the eigenvectors form a basis, put them in the columns of <span class="m">P</span>. In that basis the transformation is just scaling along each axis: <span class="m">A = P D P⁻¹</span> with <span class="m">D</span> diagonal. Toggle "view in the eigenbasis" to see it. Powers become trivial (<span class="m">Aᵏ = P Dᵏ P⁻¹</span>), which is why eigenvalues govern long-run behaviour: repeated application (the power-iteration button) aligns any vector with the eigenvector of largest |λ|.</p></div>
<h4>Where eigen-things show up</h4>
<p>Axis of a 3D rotation (λ = 1); stable states of a Markov chain (λ = 1); growth rates of linear differential equations and recurrences (Fibonacci's golden ratio is an eigenvalue of [[1,1],[1,0]]); principal axes of an ellipse of data (PCA); vibration modes; energy levels in quantum mechanics. The <a href="#svd">SVD</a> extends the idea to non-square matrices.</p>
<div class="try"><h4>Try this</h4><ul>
<li>Load the default and drag <b class="v">v</b> onto the orange line. <span class="m">A<b>v</b></span> stays on the line, three times as long. Now put it on the purple line: twice as long.</li>
<li>Load <em>Shear</em>: one eigenline (the x-axis) and a repeated λ = 1. Slide λ to 1: the grid collapses onto a line, not a point — one dimension of eigenvectors, not two.</li>
<li>Load <em>Rotation 90°</em>: the parabola floats above the axis; nothing is preserved. Change one entry slightly to make it a rotate-and-scale map.</li>
<li>Press <em>Apply A to v</em> ten times with the default matrix: <b class="v">v</b> snaps to the dominant eigenvector (λ = 3).</li>
<li>In 3D, load the rotation: the only real eigen-direction is the axis (1,1,1).</li>
</ul></div>`));
    },
  });
})();
