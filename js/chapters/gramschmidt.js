/* Chapter: Orthonormal bases, Gram–Schmidt and QR */
(function () {
  'use strict';
  const LA = window.LA; const m = LA.m; const ui = LA.ui; const el = ui.el; const T = LA.theme;
  const QC = ['#ff9f43', '#c39bd3', '#4ecdc4'];
  const P2 = [{ label: 'Default', M: [[2, 1], [1, 2]] }, { label: 'Nearly parallel', M: [[2, 1.8], [1, 1.1]] }, { label: 'Already orthogonal', M: [[2, -1], [1, 2]] }, { label: 'Dependent (breakdown)', M: [[2, -1], [1, -0.5]] }];
  const P3 = [{ label: 'Default', M: [[1, 1, 0], [1, 0, 1], [0, 1, 1]] }, { label: 'Skewed', M: [[2, 1, 1], [0, 1, 1], [0, 0.3, 1]] }, { label: 'Third vector in the plane of the first two', M: [[1, 0, 1], [0, 1, 1], [0, 0, 0]] }];
  LA.chapters.push({
    id: 'gramschmidt', title: 'Gram–Schmidt & QR', group: 'Geometry', order: 11.5, summary: 'Straighten any basis into a perpendicular one, and read off A = QR',
    mount(ctx) {
      const S = { mode: '2d', A: m.clone(P2[0].M), A3: m.clone(P3[0].M), t: 0, circle: true, B: null, iters: 0 };
      let scene = null, player = null;
      const chips = el('div', { class: 'chips' });
      const setMode = (mode) => { S.mode = mode; S.t = 0; chips.querySelectorAll('.chip').forEach((c) => c.classList.toggle('active', c.dataset.m === mode)); build(); };
      for (const [k, l] of [['2d', 'Plane ℝ²'], ['3d', 'Space ℝ³']]) chips.appendChild(el('button', { class: 'chip' + (S.mode === k ? ' active' : ''), 'data-m': k, text: l, on: { click: () => setMode(k) } }));
      const cur = () => (S.mode === '2d' ? S.A : S.A3);
      const sameMag = (E) => { const mags = E.values.map((z) => Math.hypot(z.re, z.im)).sort((a, b) => b - a); for (let i = 1; i < mags.length; i++) if (Math.abs(mags[i] - mags[i - 1]) < 1e-6 && !(E.values[i].im || E.values[i - 1].im)) return true; return false; };
      const setCur = (A) => { if (S.mode === '2d') S.A = A; else S.A3 = A; };
      // state of vector k at animation time t (phases: 2k = subtract projections, 2k+1 = normalise)
      function stateAt(steps, k, t) {
        const s = steps[k]; const start = 2 * k;
        if (t <= start) return { v: s.a, phase: 'orig', u: 0 };
        if (t < start + 1) { const u = t - start; let v = s.a.slice(); for (const p of s.projs) v = m.vsub(v, m.vscale(p.q, p.coef * u)); return { v, phase: 'subtract', u }; }
        if (s.dependent) return { v: s.residual, phase: 'dead', u: 1 };
        if (t < start + 2) { const u = t - start - 1; return { v: m.vlerp(s.residual, s.q, u), phase: 'normalise', u }; }
        return { v: s.q, phase: 'done', u: 1 };
      }
      const phaseText = (steps, t, n) => { if (t <= 0) return 'start: the columns a₁…aₙ of A'; if (t >= 2 * n) return 'done: q₁…qₙ are orthonormal, A = QR'; const k = Math.floor(t / 2); const sub = t - 2 * k < 1; const s = steps[k]; if (sub) return `step ${k + 1}a: subtract from a${'₁₂₃'[k]} its projections onto ${s.projs.map((p) => 'q' + '₁₂₃'[p.k]).join(', ') || 'nothing (first vector)'}`; if (s.dependent) return `a${'₁₂₃'[k]} is in the span of the previous vectors — residual 0, cannot normalise`; return `step ${k + 1}b: divide the residual by its length r${'₁₂₃'[k]}${'₁₂₃'[k]} = ${m.fmt(s.norm)} to get q${'₁₂₃'[k]}`; };
      function destroy() { scene && scene.destroy(); scene = null; player && player.stop(); }
      function build() {
        destroy(); ctx.stage.innerHTML = ''; ctx.controls.innerHTML = ''; ctx.controls.appendChild(ui.group('Space', chips));
        const n = S.mode === '2d' ? 2 : 3; const A = cur();
        const view = ctx.view(S.mode === '2d' ? '<b>Gram–Schmidt in ℝ²</b> — green/red: the columns of A; orange/purple: the orthonormal q₁, q₂' : '<b>Gram–Schmidt in ℝ³</b> — columns of A become q₁, q₂, q₃');
        scene = S.mode === '2d' ? new LA.Scene2D(view.canvas, { scale: 70 }) : new LA.Scene3D(view.canvas, { dist: 7.5 });
        const ed = ui.matrixEditor({ matrix: A, label: 'A — its columns are the vectors a₁, a₂' + (n === 3 ? ', a₃' : ''), onChange: (B) => { setCur(B); refresh(); } });
        const presets = S.mode === '2d' ? P2 : P3;
        const sel = ui.select({ label: 'Preset', options: [{ value: '', label: '— choose —' }].concat(presets.map((p, i) => ({ value: i, label: p.label }))), value: '', onChange: (i) => { if (i === '') return; setCur(m.clone(presets[i].M)); ed.update(cur()); refresh(); } });
        player = ui.player({ label: 'Run Gram–Schmidt (each vector: subtract projections, then normalise)', max: 2 * n, duration: 1600 * n, value: S.t, onChange: (t) => { S.t = t; scene.requestDraw(); } });
        const stepBtn = ui.button('Next step ›', () => { player.stop(); player.set(Math.min(2 * n, Math.floor(S.t + 1e-6) + 1)); }, { small: true });
        const circT = ui.toggle({ label: 'Show unit ' + (n === 2 ? 'circle' : 'sphere'), value: S.circle, onChange: (v) => { S.circle = v; scene.requestDraw(); } });
        const ro = ui.readout([]); const disp = ui.matDisplay();
        const qrDisp = ui.matDisplay(); const qrRo = ui.readout([]);
        const qrStep = (times, shifted) => { for (let i = 0; i < times; i++) { const nn = m.rows(S.B); const mu = shifted ? m.wilkinsonShift(S.B) : 0; const { Q, R } = m.qr(m.sub(S.B, m.scale(m.identity(nn), mu))); S.B = m.add(m.mul(R, Q), m.scale(m.identity(nn), mu)); S.iters++; } qrRefresh(); };
        ctx.controls.appendChild(ui.group('Matrix A', ed.el, ui.row(sel.el, ui.button('Random', () => { setCur(m.randMat(n, n, -2, 2, 0.5)); ed.update(cur()); refresh(); }, { small: true }))));
        ctx.controls.appendChild(ui.group('Animation', player.el, ui.row(stepBtn, circT.el)));
        ctx.controls.appendChild(ui.group('A = QR', ro.el, disp.el));
        ctx.controls.appendChild(ui.group('Bonus: the QR algorithm for eigenvalues', ui.note('Factor B = QR, then multiply in the other order: B ← RQ. Each new B is similar to A (same eigenvalues), and for most matrices the sequence converges to upper-triangular form with the eigenvalues on the diagonal.'), ui.row(ui.button('B ← RQ (one step)', () => qrStep(1), { small: true, primary: true }), ui.button('× 10 steps', () => qrStep(10), { small: true }), ui.button('× 10 shifted steps', () => qrStep(10, true), { small: true, title: 'Wilkinson shift: factor B − μI with μ an eigenvalue of the trailing 2×2 block, then add μI back. Converges much faster and separates eigenvalues of equal size' }), ui.button('Reset B = A', () => { S.B = m.clone(cur()); S.iters = 0; qrRefresh(); }, { small: true })), qrDisp.el, qrRo.el));
        if (n === 2) { for (let j = 0; j < 2; j++) scene.addHandle({ get: () => m.col(S.A, j), set: (p) => { m.setCol(S.A, j, p); ed.refresh(); refresh(); }, color: LA.basisColor(j), hidden: () => S.t > 0 }); }
        let steps = m.gramSchmidtSteps([...Array(n).keys()].map((j) => m.col(A, j)));
        function refresh() {
          const A = cur(); steps = m.gramSchmidtSteps([...Array(n).keys()].map((j) => m.col(A, j))); const { Q, R, ok } = m.qr(A);
          ro.update([
            { label: 'Q (columns q₁…)', value: ui.frag(ui.mhtml(Q, { small: n === 3 })) }, { label: 'R (upper triangular)', value: ui.frag(ui.mhtml(R, { small: n === 3 })) },
            { label: 'r<sub>jk</sub> = q<sub>j</sub>·a<sub>k</sub>', value: 'the coefficients that were subtracted; diagonal r<sub>kk</sub> = length of the k-th residual' },
            { label: 'QᵀQ', value: ui.frag(ui.mhtml(m.round(m.mul(m.transpose(Q), Q), 0.001), { small: true })) },
            { label: 'det A', value: `${m.fmt(m.det(A))} = det Q · det R = ${m.fmt(m.det(Q))} · ${m.fmt(m.det(R))}` },
            ok ? null : { label: 'breakdown', value: 'a column lies in the span of the previous ones: A has dependent columns (rank ' + m.rank(A) + '), so no full QR exists', color: T.warn },
          ]);
          disp.set(ok ? `A = QR: ${ui.mhtml(A, { colColors: true, small: n === 3 })} = ${ui.mhtml(Q, { small: n === 3 })}${ui.mhtml(R, { small: n === 3 })}` : '');
          S.B = m.clone(A); S.iters = 0; qrRefresh(); scene.requestDraw();
        }
        function qrRefresh() {
          const B = S.B; const E = m.eigen(cur()); const diag = B.map((r, i) => r[i]);
          qrDisp.set(`B${S.iters ? '<sub>' + S.iters + '</sub>' : ''} = ${ui.mhtml(m.round(B, 0.001), { small: n === 3 })}`);
          const below = Math.max(0, ...B.flatMap((r, i) => r.filter((_, j) => j < i).map(Math.abs)));
          qrRo.update([{ label: 'diagonal of B', value: diag.map((d) => m.fmt(d, 3)).join(', ') }, { label: 'true eigenvalues of A', value: E.values.map((z) => m.fmtC(z, 3)).join(', ') }, { label: 'largest entry below diagonal', value: m.fmt(below, 4) + (below < 1e-3 ? ' — converged' : ''), color: below < 1e-3 ? T.good : undefined }, E.realCount < n ? { label: 'note', value: 'complex eigenvalues: B converges to a block form with a 2×2 block, not a triangle', color: T.warn } : null, sameMag(E) ? { label: 'note', value: 'two eigenvalues have the same magnitude (e.g. 1 and −1): the unshifted iteration cannot separate them — use the shifted steps, as real software does', color: T.warn } : null]);
        }
        scene.onDraw = (s) => {
          const t = S.t; const n = steps.length;
          if (n === 2) {
            s.baseGrid(); if (S.circle) s.ellipse(m.identity(2), { stroke: 'rgba(255,255,255,0.25)', width: 1, dash: [3, 5] });
            steps.forEach((st, k) => s.vector(st.a, { color: LA.basisColor(k), width: 1.5, alpha: 0.35, dash: [4, 4] }));
            if (t >= 2 * n && steps.every((st) => !st.dependent)) { const Q = m.fromCols(steps.map((st) => st.q)); s.unitSquare(Q, { fill: 'rgba(255,159,67,0.12)', stroke: 'rgba(255,159,67,0.5)' }); }
            steps.forEach((st, k) => {
              const { v, phase } = stateAt(steps, k, t);
              if (phase === 'subtract') { let acc = [0, 0]; for (const p of st.projs) { const comp = m.vscale(p.q, p.coef); s.vector(m.vadd(acc, comp), { from: acc, color: QC[p.k], width: 2, alpha: 0.7, dash: [5, 4], label: `(q${'₁₂₃'[p.k]}·a${'₁₂₃'[k]}) q${'₁₂₃'[p.k]}` }); acc = m.vadd(acc, comp); } s.line(st.a, acc, { color: 'rgba(255,255,255,0.4)', width: 1, dash: [3, 4] }); }
              const col = phase === 'orig' ? LA.basisColor(k) : phase === 'dead' ? T.warn : QC[k];
              const label = phase === 'orig' ? 'a' + '₁₂₃'[k] : phase === 'done' ? 'q' + '₁₂₃'[k] : phase === 'dead' ? '0' : phase === 'subtract' ? 'a' + '₁₂₃'[k] + ' − proj' : 'residual → q' + '₁₂₃'[k];
              s.vector(v, { color: col, width: 3, label });
            });
          } else {
            s.axes({ length: 3 }); s.grid(m.identity(3), { range: 3, color: 'rgba(255,255,255,0.06)', axisColor: 'rgba(255,255,255,0.14)' });
            if (S.circle) s.sphere(m.identity(3), { color: 'rgba(255,255,255,0.14)', width: 1 });
            steps.forEach((st, k) => s.vector(st.a, { color: LA.basisColor(k), width: 1.5, alpha: 0.35, dash: [4, 4] }));
            if (t >= 4 && steps[0].q && steps[1].q) s.planePatch(steps[0].q, steps[1].q, { size: 2, fill: 'rgba(255,159,67,0.08)', lineColor: 'rgba(255,159,67,0.25)', step: 0.5 });
            if (t >= 2 * n && steps.every((st) => !st.dependent)) s.cube(m.fromCols(steps.map((st) => st.q)), { alpha: 0.18, fill: 'rgba(255,159,67,0.3)', stroke: 'rgba(255,159,67,0.5)' });
            steps.forEach((st, k) => {
              const { v, phase } = stateAt(steps, k, t);
              if (phase === 'subtract') { let acc = [0, 0, 0]; for (const p of st.projs) { const comp = m.vscale(p.q, p.coef); s.vector(m.vadd(acc, comp), { from: acc, color: QC[p.k], width: 2, alpha: 0.7, dash: [5, 4] }); acc = m.vadd(acc, comp); } s.line(st.a, acc, { color: 'rgba(255,255,255,0.4)', width: 1, dash: [3, 4] }); }
              const col = phase === 'orig' ? LA.basisColor(k) : phase === 'dead' ? T.warn : QC[k];
              s.vector(v, { color: col, width: 3, label: phase === 'orig' ? 'a' + '₁₂₃'[k] : phase === 'done' ? 'q' + '₁₂₃'[k] : phase === 'dead' ? '0' : phase === 'subtract' ? 'a' + '₁₂₃'[k] + ' − proj' : '→ q' + '₁₂₃'[k] });
            });
          }
          s.caption(phaseText(steps, t, n), { y: 36, color: T.text });
        };
        refresh();
        ctx.hint(n === 2 ? 'Drag a₁ and a₂ before pressing ▶ · step through the algorithm with "Next step"' : 'Drag to orbit · step through the algorithm with "Next step"');
      }
      build();
      ctx.onUnmount(destroy);
      ctx.notes.appendChild(ui.prose(`
<h2>Why perpendicular unit vectors are the best basis</h2>
<p>In an <b>orthonormal</b> basis <span class="m">q₁, …, qₙ</span> (unit length, mutually perpendicular) coordinates are free: the coefficient of <span class="m">qⱼ</span> in any vector <b>v</b> is just the dot product <span class="m">qⱼ·<b>v</b></span>. Packed into a matrix <span class="m">Q</span>, this says <span class="m">QᵀQ = I</span>, so <span class="m">Q⁻¹ = Qᵀ</span>: no elimination needed, and no rounding error amplified. Rotations and reflections are exactly the square orthonormal matrices.</p>
<div class="def"><h4>The Gram–Schmidt process</h4>
<p>Given independent <span class="m">a₁, …, aₙ</span>, build the <span class="m">q</span>'s one at a time. Keep <span class="m">a₁</span>'s direction: <span class="m">q₁ = a₁/|a₁|</span>. For each later <span class="m">aₖ</span>, remove the parts that point along the earlier <span class="m">q</span>'s, then normalise:</p>
<div class="formula">rₖ = aₖ − (q₁·aₖ) q₁ − … − (qₖ₋₁·aₖ) qₖ₋₁, &nbsp;&nbsp; qₖ = rₖ / |rₖ|</div>
<p>The subtracted pieces are orthogonal projections (chapter 9), so what remains is perpendicular to everything before it. The span never changes: <span class="m">span(q₁…qₖ) = span(a₁…aₖ)</span> at every stage. If some <span class="m">rₖ</span> is zero, <span class="m">aₖ</span> was already in that span — the vectors were dependent, and the process reports the rank.</p></div>
<div class="def"><h4>The QR factorisation</h4>
<p>Read the same equations backwards: <span class="m">aₖ = (q₁·aₖ) q₁ + … + (qₖ₋₁·aₖ) qₖ₋₁ + |rₖ| qₖ</span>. Each column of <span class="m">A</span> is a combination of the <em>first k</em> columns of <span class="m">Q</span>, so the coefficient matrix is upper triangular:</p>
<div class="formula">A = QR, &nbsp; Rⱼₖ = qⱼ·aₖ (j &lt; k), &nbsp; Rₖₖ = |rₖ|</div>
<p>Geometrically: <span class="m">R</span> is the matrix <span class="m">A</span> written in the orthonormal coordinates of its own column space, and <span class="m">Q</span> rotates that description into place. Since <span class="m">|det Q| = 1</span>, <span class="m">|det A| = R₁₁R₂₂⋯Rₙₙ</span> — the volume of the parallelepiped is the product of the successive perpendicular heights.</p></div>
<h4>What QR is for</h4>
<ul>
<li><b>Solving systems:</b> <span class="m">A<b>x</b> = <b>b</b></span> becomes <span class="m">R<b>x</b> = Qᵀ<b>b</b></span>, a triangular system solved by back-substitution. This is the stable way to do it.</li>
<li><b>Least squares:</b> the next chapter — the normal equations simplify to <span class="m">R<b>x̂</b> = Qᵀ<b>b</b></span>.</li>
<li><b>Eigenvalues:</b> the QR algorithm (bonus panel) factors, swaps the order, and repeats. <span class="m">RQ = Qᵀ(QR)Q = QᵀAQ</span> is similar to <span class="m">A</span>, and the iteration usually drives it toward a triangle whose diagonal is the spectrum. Production code adds shifts (the "shifted steps" button: factor <span class="m">B − μI</span> with μ chosen from the trailing 2×2 block, then add <span class="m">μI</span> back) and a Hessenberg pre-step, but the heart is this loop. Without shifts the iteration cannot separate eigenvalues of equal size, such as 1 and −1.</li>
<li><b>Numerics:</b> the version animated here (classical Gram–Schmidt) loses orthogonality for nearly parallel inputs; libraries use the modified variant or Householder reflections, which produce the same <span class="m">Q</span> and <span class="m">R</span> to within signs.</li>
</ul>
<div class="try"><h4>Try this</h4><ul>
<li>Press <em>Next step</em> repeatedly with the default: watch the purple projection being subtracted from a₂, leaving a vector perpendicular to q₁, then shrinking onto the unit circle.</li>
<li>Load <em>Nearly parallel</em>: the residual is tiny, so R₂₂ is tiny and the result is sensitive to rounding — the reason for modified Gram–Schmidt.</li>
<li>Load <em>Already orthogonal</em>: R is diagonal; Gram–Schmidt only normalises.</li>
<li>In the bonus panel press <em>× 10 steps</em> with a symmetric A: the diagonal converges to the eigenvalues and the entry below it dies.</li>
</ul></div>`));
    },
  });
})();
