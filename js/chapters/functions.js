/* Chapter: Abstract vector spaces — functions as vectors */
(function () {
  'use strict';
  const LA = window.LA; const m = LA.m; const ui = LA.ui; const el = ui.el; const T = LA.theme;
  // Operators on P₃ = polynomials of degree ≤ 3, basis {1, x, x², x³}
  const OPS = {
    D: { label: 'Derivative  d/dx  (4×4)', mat: () => [[0, 1, 0, 0], [0, 0, 2, 0], [0, 0, 0, 3], [0, 0, 0, 0]], outDeg: 3, desc: 'differentiates: x³ ↦ 3x², x² ↦ 2x, x ↦ 1, 1 ↦ 0' },
    D2: { label: 'Second derivative  (4×4)', mat: () => m.mul(OPS.D.mat(), OPS.D.mat()), outDeg: 3, desc: 'the square of the derivative matrix' },
    shift: { label: 'Shift  f(x) ↦ f(x + 1)  (4×4)', mat: () => [[1, 1, 1, 1], [0, 1, 2, 3], [0, 0, 1, 3], [0, 0, 0, 1]], outDeg: 3, desc: 'binomial expansion: (x+1)³ = 1 + 3x + 3x² + x³' },
    reflect: { label: 'Reflect  f(x) ↦ f(−x)  (4×4)', mat: () => m.diag([1, -1, 1, -1]), outDeg: 3, desc: 'odd powers flip sign' },
    dilate: { label: 'Dilate  f(x) ↦ f(2x)  (4×4)', mat: () => m.diag([1, 2, 4, 8]), outDeg: 3, desc: 'xᵏ ↦ 2ᵏ xᵏ' },
    xmul: { label: 'Multiply by x  (5×4, raises degree)', mat: () => [[0, 0, 0, 0], [1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]], outDeg: 4, desc: 'P₃ → P₄: a non-square, injective map' },
    integ: { label: 'Integrate from 0  (5×4)', mat: () => [[0, 0, 0, 0], [1, 0, 0, 0], [0, 1 / 2, 0, 0], [0, 0, 1 / 3, 0], [0, 0, 0, 1 / 4]], outDeg: 4, desc: 'xᵏ ↦ xᵏ⁺¹/(k+1): a right-inverse of D' },
    evalA: { label: 'Evaluate at a point  f ↦ f(a)  (1×4)', mat: (a) => [[1, a, a * a, a * a * a]], outDeg: 0, desc: 'a linear functional — a dual vector' },
  };
  const polyStr = (c) => { const t = []; c.forEach((a, k) => { if (Math.abs(a) < 1e-9) return; const coef = Math.abs(Math.abs(a) - 1) < 1e-9 && k > 0 ? '' : m.fmt(Math.abs(a)); const pw = k === 0 ? '' : k === 1 ? 'x' : 'x' + '⁰¹²³⁴⁵'[k]; t.push((t.length ? (a < 0 ? ' − ' : ' + ') : a < 0 ? '−' : '') + coef + pw); }); return t.join('') || '0'; };
  LA.chapters.push({
    id: 'functions', title: 'Functions as vectors', group: 'Beyond', order: 15, summary: 'Polynomials form a vector space; the derivative is a matrix — the whole theory transfers',
    mount(ctx) {
      const S = { c: [1, -1, -1.5, 0.5], op: 'D', a: 1 };
      const view = ctx.view('<b>Graphs</b> — <b style="color:#f5d547">f</b> (input) and <b style="color:#4ecdc4">Lf</b> (output) on the same axes');
      const scene = new LA.Scene2D(view.canvas, { scale: 55 });
      const cEd = ui.vectorEditor({ vector: S.c, color: T.vec, onChange: (c) => { S.c = c; refresh(); } });
      const opSel = ui.select({ label: 'Linear operator L', options: Object.entries(OPS).map(([k, o]) => ({ value: k, label: o.label })), value: S.op, onChange: (v) => { S.op = v; refresh(); } });
      const aS = ui.slider({ label: 'a (for evaluation)', min: -3, max: 3, step: 0.1, value: S.a, onChange: (v) => { S.a = v; refresh(); } });
      const ro = ui.readout([]); const disp = ui.matDisplay();
      ctx.controls.appendChild(ui.group('A polynomial f ∈ P₃', ui.row(el('span', { class: 'mlabel', html: 'coefficients of 1, x, x², x³ :' }), cEd.el), ui.row(ui.button('x³ − x', () => set([0, -1, 0, 1]), { small: true }), ui.button('(x+1)²', () => set([1, 2, 1, 0]), { small: true }), ui.button('constant 2', () => set([2, 0, 0, 0]), { small: true }), ui.button('Random', () => set(m.randMat(1, 4, -2, 2, 0.5)[0]), { small: true }))));
      ctx.controls.appendChild(ui.group('Operator', ui.row(opSel.el), aS.el));
      ctx.controls.appendChild(ui.group('The operator as a matrix', disp.el, ro.el));
      function set(c) { S.c = c; cEd.update(c); refresh(); }
      let L = OPS.D.mat(), out = [];
      function refresh() {
        const op = OPS[S.op]; L = op.mat(S.a); out = m.apply(L, S.c); const sq = m.isSquare(L);
        const E = sq ? m.eigen(L) : null;
        disp.set(`[L] = ${ui.mhtml(L, { small: m.rows(L) > 4 })} &nbsp; [L]<b class="v">f</b> = ${ui.mhtml(L, { small: true })}${ui.vhtml(S.c, { small: true })} = ${ui.vhtml(out, { small: true })}<br><span class="note">${op.desc}. Column k is L applied to xᵏ, written in the output basis.</span>`);
        ro.update([
          { label: 'f', value: polyStr(S.c), color: T.vec }, { label: 'Lf', value: S.op === 'evalA' ? `f(${m.fmt(S.a)}) = ${m.fmt(out[0])}` : polyStr(out), color: T.colsp },
          { label: 'shape', value: `${m.rows(L)}×${m.cols(L)}: P₃ (≅ℝ⁴) → ${op.outDeg === 0 ? 'ℝ' : 'P' + '₀₁₂₃₄'[op.outDeg] + ' (≅ℝ' + '⁰¹²³⁴⁵'[op.outDeg + 1] + ')'}` },
          { label: 'rank / nullity', value: `${m.rank(L)} / ${m.cols(L) - m.rank(L)}` + (m.cols(L) - m.rank(L) ? ' — null space: ' + m.nullspace(L).map((v) => polyStr(v)).join(', ') : ' — injective') },
          sq ? { label: 'det', value: m.fmt(m.det(L)) + (Math.abs(m.det(L)) < 1e-9 ? ' — not invertible' : ' — invertible') } : null,
          sq ? { label: 'eigenvalues', value: E.values.map((z) => m.fmtC(z)).join(', ') + (S.op === 'D' || S.op === 'D2' ? ' — only 0: the constants (Df = 0·f). D is nilpotent, D⁴ = 0.' : S.op === 'shift' ? ' — only 1, with eigenspace the constants; defective like a shear.' : S.op === 'dilate' ? ' — eigenvectors are the monomials xᵏ.' : S.op === 'reflect' ? ' — even and odd polynomials.' : '') } : null,
          S.op === 'integ' ? { label: 'check', value: 'D ∘ ∫ = identity on P₃ (a left-inverse), but ∫ ∘ D kills constants' } : null,
        ]);
        scene.requestDraw();
      }
      const evalP = (c, x) => c.reduce((s, a, k) => s + a * Math.pow(x, k), 0);
      scene.onDraw = (s) => {
        s.baseGrid(); const b = s.bounds(); const N = 240; const xs = Array.from({ length: N + 1 }, (_, i) => b.xmin + ((b.xmax - b.xmin) * i) / N);
        const clampy = (y) => m.clamp(y, b.ymin - 5, b.ymax + 5);
        s.polyline(xs.map((x) => [x, clampy(evalP(S.c, x))]), { color: T.vec, width: 2.5 });
        if (S.op === 'evalA') { const fa = evalP(S.c, S.a); s.line([S.a, 0], [S.a, fa], { color: T.colsp, width: 1.5, dash: [4, 4] }); s.line([0, fa], [S.a, fa], { color: T.colsp, width: 1.5, dash: [4, 4] }); s.point([S.a, fa], { color: T.colsp, r: 6, label: 'f(a) = ' + m.fmt(fa) }); s.vector([0, fa], { color: T.colsp, width: 4, head: false }); }
        else { s.polyline(xs.map((x) => [x, clampy(evalP(out, x))]), { color: T.colsp, width: 2.5 }); if (S.op === 'shift') s.caption('Lf(x) = f(x + 1): the graph slides one unit to the left', { y: 52 }); if (S.op === 'D') s.caption('where f has a peak or trough, Lf crosses zero', { y: 52 }); }
        s.text([b.xmax - 0.2, evalP(S.c, b.xmax - 0.2)], 'f', { color: T.vec, align: 'right', dy: -8, math: true }); if (S.op !== 'evalA') s.text([b.xmax - 0.6, evalP(out, b.xmax - 0.6)], 'Lf', { color: T.colsp, align: 'right', dy: -8, math: true });
        s.caption(`f = ${polyStr(S.c)}   ${S.op === 'evalA' ? '' : 'Lf = ' + polyStr(out)}`, { y: 36, color: T.text });
      };
      refresh();
      ctx.onUnmount(() => scene.destroy());
      ctx.hint('Edit the coefficients and pick an operator · the matrix on the right is the operator in the basis 1, x, x², x³');
      ctx.notes.appendChild(ui.prose(`
<h2>What is a vector, really?</h2>
<p>Arrows and lists of numbers were our two pictures, but neither is the definition. A <b>vector space</b> is any set whose elements can be added and scaled, with the familiar rules: addition is commutative and associative, there is a zero, every element has a negative, and scaling distributes — eight axioms in all. Polynomials satisfy them. So do all functions ℝ → ℝ, sequences, matrices, solutions of a linear differential equation. The axioms are the interface; everything built here was built only from that interface.</p>
<div class="def"><h4>Polynomials of degree ≤ 3</h4><p>Choose the basis <span class="m">1, x, x², x³</span>. Then <span class="m">f(x) = c₀ + c₁x + c₂x² + c₃x³</span> <em>is</em> the vector <span class="m">(c₀, c₁, c₂, c₃)</span> ∈ ℝ⁴ — nothing more is needed to add or scale it. The space is 4-dimensional. A different basis (Legendre or Chebyshev polynomials, say) would be a <a href="#basis">change of basis</a> with some invertible 4×4 matrix.</p></div>
<div class="def"><h4>The derivative is a matrix</h4><p>Differentiation is linear: <span class="m">(f + g)′ = f′ + g′</span> and <span class="m">(cf)′ = cf′</span>. So on P₃ it is a linear transformation, and once a basis is chosen it is a matrix — its columns are the derivatives of the basis vectors: <span class="m">1 ↦ 0, x ↦ 1, x² ↦ 2x, x³ ↦ 3x²</span>. Look at it: zeros on and below the diagonal, so <span class="m">det = 0</span> (constants are killed, so it cannot be undone), the null space is the constants, and <span class="m">D⁴ = 0</span>. Its only eigenvalue is 0 — among polynomials nothing satisfies <span class="m">f′ = λf</span> with λ ≠ 0. (In the infinite-dimensional space of all functions, <span class="m">e^{λx}</span> is such an eigenvector; that is why exponentials dominate differential equations.)</p></div>
<h4>Every chapter, revisited</h4>
<ul>
<li><b>Non-square</b>: multiplication by x and integration raise the degree, so they are 5×4 maps P₃ → P₄ — injective but not onto, exactly like the 3×2 maps of chapter 8.</li>
<li><b>Duality</b>: "evaluate at a" is a linear map to ℝ, a 1×4 row <span class="m">[1 a a² a³]</span>. Its null space is the polynomials vanishing at a. Every linear functional on P₃ is a combination of such evaluations — this is the basis of interpolation.</li>
<li><b>Inverse</b>: the shift f(x) ↦ f(x+1) is upper triangular with 1s on the diagonal, det 1, invertible (shift back). Integration from 0 is a <em>right</em> inverse of D (D∘∫ = I) but not a left inverse, as the rank–nullity count predicts.</li>
<li><b>Eigenvectors</b>: dilation f(x) ↦ f(2x) has eigenvectors xᵏ with eigenvalues 2ᵏ; reflection f(x) ↦ f(−x) splits the space into even (λ = 1) and odd (λ = −1) polynomials.</li>
</ul>
<p>This is the payoff of abstraction: a determinant computed for a grid of arrows tells you something about calculus, and a picture of a collapsing plane tells you which differential equations can be solved uniquely.</p>
<div class="try"><h4>Try this</h4><ul>
<li>Take f = x³ − x and the derivative. The zero crossings of Lf sit under the peak and trough of f.</li>
<li>Pick <em>Integrate</em>, then type the output coefficients back in and apply <em>Derivative</em>: you recover f (right inverse). Do it the other way round and the constant is lost.</li>
<li>Pick <em>Evaluate</em> and slide a: the output is a single number, and f is in the null space exactly when the curve crosses the axis at a.</li>
</ul></div>`));
    },
  });
})();
