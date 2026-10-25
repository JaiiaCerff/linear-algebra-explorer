/* Chapter: Singular value decomposition */
(function () {
  'use strict';
  const LA = window.LA; const m = LA.m; const ui = LA.ui; const el = ui.el; const T = LA.theme;
  const C1 = '#ff9f43', C2 = '#c39bd3', C3 = '#4ecdc4';
  const PRESETS = {
    '2x2': [{ label: 'Shear', M: [[1, 1], [0, 1]] }, { label: 'Symmetric', M: [[2, 1], [1, 2]] }, { label: 'Rotation 40° (all σ = 1)', M: m.rot2(m.rad(40)) }, { label: 'Rank 1', M: [[1, 2], [0.5, 1]] }, { label: 'General', M: [[2, 1], [-0.5, 1]] }, { label: 'Nearly singular (large κ)', M: [[1, 1], [1, 1.05]] }],
    '3x2': [{ label: 'Plane into space', M: [[1, 0], [0, 1], [0.5, 0.7]] }, { label: 'Stretching embedding', M: [[2, 0.5], [0, 1], [1, 0]] }, { label: 'Rank 1', M: [[1, 2], [1, 2], [0, 0]] }],
    '2x3': [{ label: 'Drop z', M: [[1, 0, 0], [0, 1, 0]] }, { label: 'Oblique flattening', M: [[1, 0, 0.6], [0, 1, 0.4]] }, { label: 'Rank 1', M: [[1, 2, 0], [2, 4, 0]] }],
    '3x3': [{ label: 'Diagonal 2, 1, ½', M: m.diag([2, 1, 0.5]) }, { label: 'Rotation + stretch', M: m.mul(m.rot3([0, 0, 1], 0.6), m.diag([2, 1, 0.6])) }, { label: 'Shear', M: [[1, 0, 1], [0, 1, 0], [0, 0, 1]] }, { label: 'Rank 2', M: [[1, 0, 1], [0, 1, 1], [1, 1, 2]] }],
  };
  // interpolate an orthogonal matrix from I (t=0) to Q (t=1) through rotations (handles det = −1 via a reflection factor)
  function orthoLerp(Q, t) {
    const n = m.rows(Q); const F = m.identity(n); if (m.det(Q) < 0) F[n - 1][n - 1] = -1; const R = m.mul(Q, F); // R is a rotation
    let Rt;
    if (n === 2) { const th = Math.atan2(R[1][0], R[0][0]); Rt = m.rot2(th * t); }
    else { const E = m.eigen(R); const ax = E.spaces.find((s) => !s.complex && Math.abs(s.value.re - 1) < 1e-4); const cosv = m.clamp((m.trace(R) - 1) / 2, -1, 1); let ang = Math.acos(cosv); let axis = ax ? ax.vectors[0] : [0, 0, 1]; if (ang > 1e-6 && ang < Math.PI - 1e-6) { const w = [R[2][1] - R[1][2], R[0][2] - R[2][0], R[1][0] - R[0][1]]; axis = m.vnormalize(w); } Rt = m.rot3(axis, ang * t); }
    return m.mul(Rt, m.lerp(m.identity(n), F, t));
  }
  LA.chapters.push({
    id: 'svd', title: 'Singular value decomposition', group: 'Spectral', order: 13, summary: 'Every matrix is rotate → stretch → rotate; the stretch factors are the singular values',
    mount(ctx) {
      const S = { shape: '2x2', A: m.clone(PRESETS['2x2'][4].M), t: 3, showV: true };
      let scenes = [], player = null;
      const chips = el('div', { class: 'chips' });
      const setShape = (sh) => { S.shape = sh; S.A = m.clone(PRESETS[sh][0].M); chips.querySelectorAll('.chip').forEach((c) => c.classList.toggle('active', c.dataset.s === sh)); build(); };
      for (const sh of ['2x2', '3x2', '2x3', '3x3']) chips.appendChild(el('button', { class: 'chip' + (S.shape === sh ? ' active' : ''), 'data-s': sh, text: sh.replace('x', '×') + (sh === '3x2' ? '  (plane → space)' : sh === '2x3' ? '  (space → plane)' : ''), on: { click: () => setShape(sh) } }));
      const ro = ui.readout([]); const disp = ui.matDisplay();
      function destroy() { scenes.forEach((s) => s.destroy()); scenes = []; player && player.stop(); }
      let D = null;
      const decompose = () => { const { U, S: sv, V } = m.svd(S.A); D = { U, S: sv, V }; };
      // stage matrix for square shapes: t ∈ [0,1] Vᵀ, [1,2] Σ, [2,3] U
      const stage = (t) => {
        const n = m.cols(S.A); const Vt = m.transpose(D.V); const Sig = m.diag(D.S.slice(0, n));
        if (t <= 1) return orthoLerp(Vt, t);
        if (t <= 2) return m.mul(m.lerp(m.identity(n), Sig, t - 1), Vt);
        return m.mul(m.mul(orthoLerp(D.U, t - 2), Sig), Vt);
      };
      function refresh() {
        decompose(); const r = m.rows(S.A), c = m.cols(S.A); const k = Math.min(r, c); const rank = D.S.filter((s) => s > 1e-9).length; const smin = D.S[k - 1];
        const Sig = m.zeros(r, c); D.S.forEach((s, i) => (Sig[i][i] = s));
        ro.update([
          { label: 'singular values', value: D.S.map((s, i) => `σ${'₁₂₃'[i]} = ${m.fmt(s)}`).join(',  '), color: T.vec },
          { label: 'rank', value: rank + ' (number of nonzero σ)' }, { label: 'condition number κ', value: smin > 1e-9 ? `σ₁/σ${'₁₂₃'[k - 1]} = ${m.fmt(D.S[0] / smin)}` : '∞ (singular)' },
          r === c ? { label: '|det A|', value: `σ₁·…·σ${'₁₂₃'[k - 1]} = ${m.fmt(D.S.reduce((a, b) => a * b, 1))}` } : null,
          { label: 'operator norm', value: `max |Av|/|v| = σ₁ = ${m.fmt(D.S[0])}` },
          { label: 'AᵀA eigenvalues', value: m.eigen(m.mul(m.transpose(S.A), S.A)).values.map((z) => m.fmt(z.re)).join(', ') + ' = σᵢ²' },
        ]);
        disp.set(`A = U Σ Vᵀ = ${ui.mhtml(D.U, { small: r > 2 })}${ui.mhtml(Sig, { small: r > 2 || c > 2 })}${ui.mhtml(m.transpose(D.V), { small: c > 2 })}<br><span class="note">U (${r}×${r}) and V (${c}×${c}) are orthogonal: rotations${m.det(D.U) < 0 ? ' (U includes a reflection, since det A < 0)' : ''}. Columns of V are the input directions <b style="color:${C1}">v₁</b>, <b style="color:${C2}">v₂</b>${c > 2 ? ', <b style="color:' + C3 + '">v₃</b>' : ''}; columns of U are the output directions.</span><br>A⁺ = V Σ⁺ Uᵀ = ${ui.mhtml(m.pinv(S.A), { small: true })} &nbsp;<span class="note">(pseudoinverse: inverts the stretches that are nonzero)</span>`);
        scenes.forEach((s) => s.requestDraw());
      }
      function controls(extra) {
        ctx.controls.innerHTML = ''; ctx.controls.appendChild(ui.group('Shape', chips));
        const ed = ui.matrixEditor({ matrix: S.A, onChange: (A) => { S.A = A; refresh(); } });
        const sel = ui.select({ label: 'Preset', options: [{ value: '', label: '— choose —' }].concat(PRESETS[S.shape].map((p, i) => ({ value: i, label: p.label }))), value: '', onChange: (i) => { if (i === '') return; S.A = m.clone(PRESETS[S.shape][i].M); ed.update(S.A); refresh(); } });
        ctx.controls.appendChild(ui.group('Matrix A', ed.el, ui.row(sel.el, ui.button('Random', () => { const [r, c] = S.shape.split('x').map(Number); S.A = m.randMat(r, c, -2, 2, 0.5); ed.update(S.A); refresh(); }, { small: true }), ui.button('Transpose', () => { S.A = m.transpose(S.A); const sh = m.rows(S.A) + 'x' + m.cols(S.A); if (sh !== S.shape) { S.shape = sh; chips.querySelectorAll('.chip').forEach((c) => c.classList.toggle('active', c.dataset.s === sh)); build(); } else { ed.update(S.A); refresh(); } }, { small: true }))));
        if (extra) ctx.controls.appendChild(extra);
        ctx.controls.appendChild(ui.group('Decomposition', ro.el, disp.el));
        return ed;
      }
      function build() {
        destroy(); ctx.stage.innerHTML = ''; decompose();
        const [r, c] = S.shape.split('x').map(Number);
        if (r === c) {
          const view = ctx.view(`<b>Unit ${c === 2 ? 'circle' : 'sphere'} → ${c === 2 ? 'ellipse' : 'ellipsoid'}</b> — animate Vᵀ (rotate), then Σ (stretch), then U (rotate)`);
          const s = c === 2 ? new LA.Scene2D(view.canvas, { scale: 70 }) : new LA.Scene3D(view.canvas, { dist: 8 }); scenes = [s];
          player = ui.player({ label: 'Stages: 0→1 Vᵀ (rotate)  ·  1→2 Σ (stretch along axes)  ·  2→3 U (rotate)', max: 3, duration: 4500, value: S.t, onChange: (t) => { S.t = t; s.requestDraw(); } });
          const vT = ui.toggle({ label: 'Show singular vectors', value: S.showV, onChange: (val) => { S.showV = val; s.requestDraw(); } });
          const ed = controls(ui.group('Animation', player.el, ui.row(vT.el), ui.note('Linear interpolation is replaced by true rotations here, so you see each factor acting as a rigid turn or an axis-aligned stretch.')));
          if (c === 2) { s.addHandle({ get: () => m.col(S.A, 0), set: (p) => { m.setCol(S.A, 0, p); ed.refresh(); refresh(); }, color: T.i, hidden: () => S.t < 3 }); s.addHandle({ get: () => m.col(S.A, 1), set: (p) => { m.setCol(S.A, 1, p); ed.refresh(); refresh(); }, color: T.j, hidden: () => S.t < 3 }); }
          s.onDraw = (sc) => {
            const M = stage(S.t); const phase = S.t < 1 ? 'Vᵀ: rotating so that v₁, v₂ line up with the axes' : S.t < 2 ? 'Σ: stretching the axes by σ₁, σ₂' : S.t < 3 ? 'U: rotating into the final position' : 'A = UΣVᵀ';
            if (c === 2) {
              sc.baseGrid(); sc.grid(M, { alpha: 0.55 }); sc.ellipse(m.identity(2), { stroke: 'rgba(255,255,255,0.3)', width: 1, dash: [3, 4] }); sc.ellipse(M, { fill: 'rgba(245,213,71,0.12)', stroke: T.vec, width: 2 });
              sc.basis(M, { width: 2, alpha: 0.8 });
              if (S.showV) { const v1 = m.col(D.V, 0), v2 = m.col(D.V, 1); sc.vector(m.apply(M, v1), { color: C1, width: 3, label: S.t < 1.01 ? 'v₁' : S.t < 2.99 ? 'σ₁·' : 'σ₁u₁' }); sc.vector(m.apply(M, v2), { color: C2, width: 3, label: S.t < 1.01 ? 'v₂' : S.t < 2.99 ? 'σ₂·' : 'σ₂u₂' }); if (S.t >= 3) { sc.vector(v1, { color: C1, width: 1.5, alpha: 0.5, dash: [4, 4] }); sc.vector(v2, { color: C2, width: 1.5, alpha: 0.5, dash: [4, 4] }); } }
              sc.caption(phase, { y: 36, color: T.text });
            } else {
              sc.axes({ length: 3.5 }); sc.grid(m.identity(3), { range: 3, color: 'rgba(255,255,255,0.06)', axisColor: 'rgba(255,255,255,0.14)' }); sc.sphere(m.identity(3), { color: 'rgba(255,255,255,0.15)', width: 1 }); sc.sphere(M, { rings: true });
              sc.basis(M, { width: 2 });
              if (S.showV) [C1, C2, C3].forEach((col, i) => { const vi = m.col(D.V, i); sc.vector(m.apply(M, vi), { color: col, width: 3, label: S.t < 1.01 ? 'v' + '₁₂₃'[i] : S.t >= 3 ? 'σ' + '₁₂₃'[i] + 'u' + '₁₂₃'[i] : 'σ' + '₁₂₃'[i] }); });
              sc.caption(phase, { y: 36, color: T.text });
            }
          };
        } else {
          const vin = ctx.view(`<b>Input ℝ${c === 2 ? '²' : '³'}</b> — unit ${c === 2 ? 'circle' : 'sphere'} with the right singular vectors v₁, v₂${c === 3 ? ', v₃' : ''}`);
          const vout = ctx.view(`<b>Output ℝ${r === 2 ? '²' : '³'}</b> — its image, with σ₁u₁, σ₂u₂${r === 3 ? ' and the unused direction u₃' : ''}`);
          const sIn = c === 2 ? new LA.Scene2D(vin.canvas, { scale: 70 }) : new LA.Scene3D(vin.canvas, { dist: 7 });
          const sOut = r === 2 ? new LA.Scene2D(vout.canvas, { scale: 55 }) : new LA.Scene3D(vout.canvas, { dist: 8 }); scenes = [sIn, sOut];
          controls(null);
          sIn.onDraw = (sc) => {
            const cols = [C1, C2, C3];
            if (c === 2) { sc.baseGrid(); sc.ellipse(m.identity(2), { stroke: T.vec, width: 2 }); sc.basis(m.identity(2), { width: 2, alpha: 0.6 }); [0, 1].forEach((i) => sc.vector(m.col(D.V, i), { color: cols[i], width: 3, label: 'v' + '₁₂'[i] })); sc.caption('v₁ is the direction A stretches most; v₂ the least', { y: 36 }); }
            else { sc.axes({ length: 2.5 }); sc.sphere(m.identity(3), { rings: true, color: 'rgba(245,213,71,0.7)' }); [0, 1, 2].forEach((i) => sc.vector(m.col(D.V, i), { color: cols[i], width: 3, label: 'v' + '₁₂₃'[i] + (D.S[i] === undefined || D.S[i] < 1e-9 ? ' (crushed)' : '') })); sc.caption('v₃ spans the null space: it is crushed to the origin', { y: 36 }); }
          };
          sOut.onDraw = (sc) => {
            const cols = [C1, C2, C3]; const A = S.A;
            if (r === 2) {
              sc.baseGrid(); if (c === 3) { const pts = m.unitCircle(72); const ell = pts.map((p) => m.apply(A, m.vadd(m.vscale(m.col(D.V, 0), p[0]), m.vscale(m.col(D.V, 1), p[1])))); sc.polygon(ell, { fill: 'rgba(245,213,71,0.15)', stroke: T.vec, width: 2 }); const K = 16; for (let i = 0; i < K; i++) { const a = (Math.PI * i) / K; const ring = Array.from({ length: 48 }, (_, k) => { const b = (2 * Math.PI * k) / 48; return m.apply(A, [Math.cos(a) * Math.cos(b), Math.sin(a) * Math.cos(b), Math.sin(b)]); }); sc.polyline(ring, { close: true, color: 'rgba(245,213,71,0.18)', width: 1 }); } }
              [0, 1].forEach((i) => sc.vector(m.vscale(m.col(D.U, i), D.S[i] || 0), { color: cols[i], width: 3, label: 'σ' + '₁₂'[i] + 'u' + '₁₂'[i] })); sc.basis(A, { width: 2, alpha: 0.6 });
              sc.caption('the unit sphere lands as a filled ellipse (the great circle through v₁, v₂ is its boundary)', { y: 36 });
            } else {
              sc.axes({ length: 3.5 }); sc.grid(m.identity(3), { range: 3, color: 'rgba(255,255,255,0.06)', axisColor: 'rgba(255,255,255,0.14)' });
              const Cs = m.colspace(A); if (Cs.length === 2) sc.planePatch(Cs[0], Cs[1], { size: 3.5, fill: 'rgba(78,205,196,0.1)', lineColor: 'rgba(78,205,196,0.25)' });
              sc.curve(m.unitCircle(72).map((p) => m.apply(A, p)), { color: T.vec, width: 2 });
              [0, 1].forEach((i) => sc.vector(m.vscale(m.col(D.U, i), D.S[i]), { color: cols[i], width: 3, label: 'σ' + '₁₂'[i] + 'u' + '₁₂'[i] })); sc.vector(m.col(D.U, 2), { color: 'rgba(255,255,255,0.5)', width: 1.5, label: 'u₃ (normal)', dash: [4, 4] }); sc.basis(A, { width: 2, alpha: 0.6 });
              sc.caption('the unit circle lands as an ellipse in the image plane; u₃ is perpendicular to it', { y: 36 });
            }
          };
        }
        refresh();
        ctx.hint(r === c ? 'Press ▶ to see A split into rotate → stretch → rotate' : 'Compare the input and output pictures: A maps v₁ ↦ σ₁u₁ and v₂ ↦ σ₂u₂');
      }
      build();
      ctx.onUnmount(destroy);
      ctx.notes.appendChild(ui.prose(`
<h2>Every matrix is a rotation, a stretch and a rotation</h2>
<p>Eigenvectors need a square matrix and even then may fail to exist. The <b>singular value decomposition</b> never fails: for <em>any</em> <span class="m">m × n</span> matrix,</p>
<div class="formula">A = U Σ Vᵀ</div>
<p>where <span class="m">V</span> (n×n) and <span class="m">U</span> (m×m) are orthogonal — rotations, possibly with a reflection — and <span class="m">Σ</span> is "diagonal" with non-negative entries <span class="m">σ₁ ≥ σ₂ ≥ …</span>, the <b>singular values</b>. Read right to left: <span class="m">Vᵀ</span> rotates the input so that the special directions <b style="color:#ff9f43">v₁</b>, <b style="color:#c39bd3">v₂</b> line up with the axes; <span class="m">Σ</span> stretches each axis by σᵢ (and, for non-square shapes, drops or adds zero coordinates); <span class="m">U</span> rotates the result into place.</p>
<div class="def"><h4>Geometry</h4>
<p>The unit circle (sphere) is always mapped to an ellipse (ellipsoid). Its semi-axes have lengths σ₁, σ₂, … and point along the columns <b>uᵢ</b> of <span class="m">U</span>; the input directions that land on those axes are the columns <b>vᵢ</b> of <span class="m">V</span>. So the SVD answers "which input direction gets stretched the most, and by how much?" — σ₁ is the largest stretch factor of the matrix, and <span class="m">σ₁/σ_min</span> (the condition number) measures how distorted the ellipse is.</p></div>
<h4>Why it exists: eigenvectors of AᵀA</h4>
<p><span class="m">AᵀA</span> is symmetric, so it has perpendicular eigenvectors; these are the <b>vᵢ</b>, and its eigenvalues are σᵢ². Then <span class="m">A<b>vᵢ</b></span> are perpendicular too, with lengths σᵢ; normalising them gives the <b>uᵢ</b>. The SVD is thus the eigen-decomposition idea, applied where it always works.</p>
<h4>What it tells you</h4>
<ul>
<li><b>Rank</b> = number of nonzero singular values; the zero ones mark the null space (<b>v</b>'s with σ = 0) and the directions never reached (<b>u</b>'s beyond the rank).</li>
<li><b>Non-square maps made simple.</b> A 3×2 matrix is "rotate the plane, stretch it, then lay it into space along <b>u₁</b>, <b>u₂</b>"; a 2×3 is "rotate space so the null direction is the z-axis, discard z, stretch, rotate". Compare with chapter 8.</li>
<li><b>Pseudoinverse.</b> <span class="m">A⁺ = V Σ⁺ Uᵀ</span> inverts every nonzero stretch and ignores the rest. It gives the least-squares solution of <span class="m">A<b>x</b> = <b>b</b></span> when no exact solution exists, and the shortest one when there are many.</li>
<li><b>Low-rank approximation.</b> <span class="m">A = Σ σᵢ <b>uᵢ</b><b>vᵢ</b>ᵀ</span> is a sum of rank-1 pieces in decreasing order of importance. Keeping the first few is image compression, noise reduction and principal component analysis.</li>
</ul>
<div class="try"><h4>Try this</h4><ul>
<li>With a 2×2 shear, play the animation. A shear does not look like "rotate, stretch, rotate", yet it is one — watch the ellipse's axes.</li>
<li>Pick <em>Rotation 40°</em>: both singular values are 1 and the ellipse stays a circle.</li>
<li>Pick <em>Nearly singular</em>: κ is huge and the ellipse is a needle. Such matrices amplify rounding errors when solving systems.</li>
<li>Switch to 2×3 and 3×2 and compare their decompositions after pressing <em>Transpose</em>: U and V swap roles.</li>
</ul></div>`));
    },
  });
})();
