/* Chapter: Higher dimensions */
(function () {
  'use strict';
  const LA = window.LA; const m = LA.m; const ui = LA.ui; const el = ui.el; const T = LA.theme;
  const lerpColor = (t) => { t = m.clamp(t, 0, 1); const a = [88, 196, 221], b = [255, 159, 67]; return `rgb(${a.map((x, i) => Math.round(x + (b[i] - x) * t)).join(',')})`; };
  function spreadProjection(n) {
    if (n === 4) { const k = 1 / Math.sqrt(3); return m.transpose([[k, k, k], [k, -k, -k], [-k, k, -k], [-k, -k, k]]).map((r) => r.map((x) => x * 0.95)); }
    const cols = []; const ga = Math.PI * (3 - Math.sqrt(5)); for (let j = 0; j < n; j++) { const z = 1 - (2 * (j + 0.5)) / n; const r = Math.sqrt(1 - z * z); const ph = ga * j; cols.push([r * Math.cos(ph), r * Math.sin(ph), z]); } return m.fromCols(cols).map((r) => r.map((x) => x * Math.sqrt(3 / n) * 0.9));
  }
  LA.chapters.push({
    id: 'highdim', title: 'Higher dimensions', group: 'Beyond', order: 14, summary: 'ℝⁿ for n = 4, 5, 6: the same rules, seen through shadows and parallel coordinates',
    mount(ctx) {
      const S = { n: 4, A: m.rotPlane(4, 0, 3, 0.6), t: 1, obj: 'cube', proj: 'spread', P: null, x: [1, 0.5, -0.5, 1], i: 0, j: 3, th: 0.6, spin: false, cloud: null };
      S.P = spreadProjection(4);
      const shadow = ctx.view('<b>3D shadow of ℝⁿ</b> — the hypercube [−1,1]ⁿ projected to 3D; colour encodes the 4th coordinate');
      const pc = ctx.view('<b>Parallel coordinates</b> — thin coloured: columns of A · dashed yellow: x · thick yellow: Ax', { flex: '0 0 190px' });
      shadow.wrap.parentElement.style.flexDirection = 'column';
      const s3 = new LA.Scene3D(shadow.canvas, { dist: 7 }); const s2 = new LA.Scene2D(pc.canvas, { interactive: false });
      let ed, xEd, spinTw = null;
      const ro = ui.readout([]); const disp = ui.matDisplay();
      const ctrlN = el('div'), ctrlA = el('div');
      ctx.controls.appendChild(ctrlN); ctx.controls.appendChild(ctrlA);
      const makeCloud = (n) => Array.from({ length: 60 }, () => Array.from({ length: n }, () => Math.round((Math.random() * 2 - 1) * 10) / 10));
      S.cloud = makeCloud(4);
      const setN = (n) => { S.n = n; S.A = m.identity(n); S.x = Array.from({ length: n }, (_, k) => [1, 0.5, -0.5, 1, 0.8, -0.3][k]); S.i = 0; S.j = n - 1; S.P = S.proj === 'coords' ? m.crop(m.identity(n), 3, n) : S.proj === 'random' ? randomProj(n) : spreadProjection(n); S.cloud = makeCloud(n); buildControls(); setRot(); };
      const randomProj = (n) => m.transpose(m.randOrtho(n)).slice(0, 3).map((r) => r.map((x) => x * Math.sqrt(3 / n) * 1.2));
      function setRot() { S.A = m.rotPlane(S.n, S.i, S.j, S.th); if (ed) ed.update(S.A); refresh(); }
      function buildControls() {
        ctrlN.innerHTML = ''; ctrlA.innerHTML = ''; const n = S.n;
        const nStep = ui.stepper({ label: 'dimension n', value: n, min: 4, max: 6, onChange: (v) => setN(v) });
        const objSel = ui.select({ label: 'Object', options: [{ value: 'cube', label: 'hypercube [−1,1]ⁿ' }, { value: 'cloud', label: 'random point cloud' }, { value: 'basis', label: 'basis vectors only' }], value: S.obj, onChange: (v) => { S.obj = v; refresh(); } });
        const projSel = ui.select({ label: 'Shadow direction (3×n projection)', options: [{ value: 'spread', label: 'spread evenly' }, { value: 'coords', label: 'first three coordinates' }, { value: 'random', label: 'random orthonormal' }], value: S.proj, onChange: (v) => { S.proj = v; S.P = v === 'coords' ? m.crop(m.identity(n), 3, n) : v === 'random' ? randomProj(n) : spreadProjection(n); refresh(); } });
        ctrlN.appendChild(ui.group('Space ℝⁿ', ui.row(nStep.el), ui.row(objSel.el, projSel.el), ui.row(ui.button('Reshuffle shadow', () => { if (S.proj === 'random') S.P = randomProj(n); else S.proj = 'random', projSel.set('random'), (S.P = randomProj(n)); refresh(); }, { small: true }))));
        ed = ui.matrixEditor({ matrix: S.A, small: true, onChange: (A) => { S.A = A; refresh(); } });
        xEd = ui.vectorEditor({ vector: S.x, color: T.vec, onChange: (x) => { S.x = x; refresh(); } }); xEd.el.classList.add('small');
        const axisOpts = Array.from({ length: n }, (_, k) => ({ value: k, label: 'x' + '₁₂₃₄₅₆'[k] }));
        const iSel = ui.select({ label: 'plane: from', options: axisOpts, value: S.i, onChange: (v) => { S.i = +v; if (S.i === S.j) S.j = (S.i + 1) % n, jSel.set(S.j); setRot(); } });
        const jSel = ui.select({ label: 'to', options: axisOpts, value: S.j, onChange: (v) => { S.j = +v; if (S.i === S.j) S.i = (S.j + 1) % n, iSel.set(S.i); setRot(); } });
        const thS = ui.slider({ label: 'angle θ', min: -180, max: 180, step: 1, value: Math.round(m.deg(S.th)), format: (v) => Math.round(v) + '°', onChange: (v) => { S.th = m.rad(v); setRot(); } });
        const spinT = ui.toggle({ label: 'Spin continuously in this plane', value: S.spin, onChange: (v) => { S.spin = v; if (v) spin(); else if (spinTw) { spinTw.cancel(); spinTw = null; ed.update(S.A); } } });
        function spin() { if (spinTw) spinTw.cancel(); spinTw = LA.anim.tween({ duration: 8000, ease: 'linear', onUpdate: (u) => { S.th = (S.th + 0.012) % (2 * Math.PI); S.A = m.rotPlane(S.n, S.i, S.j, S.th); thS.set(Math.round(m.deg(S.th > Math.PI ? S.th - 2 * Math.PI : S.th))); refresh(false); }, onDone: () => { if (S.spin) spin(); } }); }
        const player = ui.player({ label: 'Animate identity → A', value: S.t, onChange: (t) => { S.t = t; draw(); } });
        const presets = ui.select({ label: 'Preset', options: [{ value: '', label: '— choose —' }, { value: 'rot', label: 'rotation in the chosen plane' }, { value: 'double', label: 'double rotation (two planes at once)' }, { value: 'ortho', label: 'random rotation of ℝⁿ' }, { value: 'scale', label: 'scale each axis differently' }, { value: 'proj', label: 'project onto first 3 coordinates (rank 3)' }, { value: 'perm', label: 'cyclic permutation of axes' }, { value: 'rand', label: 'random matrix' }, { value: 'id', label: 'identity' }], value: '', onChange: (v) => { if (!v) return; const n = S.n; if (v === 'rot') S.A = m.rotPlane(n, S.i, S.j, S.th); else if (v === 'double') S.A = m.mul(m.rotPlane(n, 0, 1, 0.5), m.rotPlane(n, 2, 3, 0.9)); else if (v === 'ortho') S.A = m.randOrtho(n); else if (v === 'scale') S.A = m.diag(Array.from({ length: n }, (_, k) => [1.5, 1, 0.5, 1.2, 0.8, 1.1][k])); else if (v === 'proj') S.A = m.diag(Array.from({ length: n }, (_, k) => (k < 3 ? 1 : 0))); else if (v === 'perm') { S.A = m.zeros(n, n); for (let k = 0; k < n; k++) S.A[(k + 1) % n][k] = 1; } else if (v === 'rand') S.A = m.randMat(n, n, -1.5, 1.5, 0.5); else S.A = m.identity(n); ed.update(S.A); refresh(); } });
        ctrlA.appendChild(ui.group(`Matrix A (${n}×${n})`, ed.el, ui.row(presets.el), ui.row(el('span', { class: 'mlabel', html: '<b class="v">x</b> =' }), xEd.el)));
        ctrlA.appendChild(ui.group('Rotations happen in planes', ui.row(iSel.el, jSel.el), thS.el, ui.row(spinT.el), ui.note('In ℝ³ we say "rotate about an axis", but what really turns is a plane. In ℝⁿ pick any two axes: the x<sub>i</sub>x<sub>j</sub>-plane rotates and the other n − 2 directions stay fixed.')));
        ctrlA.appendChild(ui.group('Animation', player.el));
        ctrlA.appendChild(ui.group('Readout', ro.el, disp.el));
        ctx.onUnmount(() => { player.stop(); spinTw && spinTw.cancel(); });
      }
      const Mt = () => m.lerp(m.identity(S.n), S.A, S.t);
      function refresh(updateRo = true) {
        if (updateRo) {
          const A = S.A, n = S.n; const E = m.eigen(A); const Ax = m.apply(A, S.x);
          ro.update([
            { label: 'det A', value: m.fmt(m.det(A)) + ' — scales n-volume (hypercube volume 2ⁿ = ' + Math.pow(2, n) + ' → ' + m.fmt(Math.pow(2, n) * Math.abs(m.det(A))) + ')' },
            { label: 'rank', value: m.rank(A) + (m.rank(A) < n ? ' — collapses ' + (n - m.rank(A)) + ' dimension(s)' : ' — invertible') }, { label: 'trace', value: m.fmt(m.trace(A)) },
            { label: 'orthogonal?', value: m.isOrthogonal(A) ? 'yes — lengths and angles preserved (a rotation' + (m.det(A) < 0 ? ' with reflection)' : ')') : 'no' },
            { label: 'eigenvalues', value: E.values.map((z) => m.fmtC(z)).join(',  ') }, { label: '|Ax| / |x|', value: m.vnorm(S.x) > 1e-9 ? m.fmt(m.vnorm(Ax) / m.vnorm(S.x)) : '—' },
          ]);
          disp.set(`A<b class="v">x</b> = ${ui.vhtml(Ax, { small: true })}<span class="note"> &nbsp; hypercube: ${1 << n} vertices, ${n * (1 << (n - 1))} edges</span>`);
        }
        draw();
      }
      function draw() { s3.requestDraw(); s2.requestDraw(); }
      s3.onDraw = (s) => {
        const n = S.n, M = Mt(), P = S.P; const proj = (v) => m.apply(P, m.apply(M, v));
        s.axes({ length: 2.6, labels: false });
        for (let k = 0; k < n; k++) { const e = m.apply(P, m.e(k, n)); s.line([0, 0, 0], m.vscale(e, 2.2), { color: 'rgba(255,255,255,0.12)', width: 1, dash: [3, 5] }); s.text(m.vscale(e, 2.35), 'x' + '₁₂₃₄₅₆'[k], { color: T.muted }); }
        const hidden = (v) => (n > 3 ? (v[3] + 1.5) / 3 : 0.5);
        if (S.obj === 'cube') {
          const H = m.hypercube(n); const V = H.verts.map((v) => m.apply(M, v)); const Pv = V.map((v) => m.apply(P, v));
          for (const [a, b] of H.edges) s.line(Pv[a], Pv[b], { color: lerpColor((hidden(V[a]) + hidden(V[b])) / 2), width: 1.2, alpha: 0.85 });
          if (n <= 5) V.forEach((v, k) => s.point(Pv[k], { color: lerpColor(hidden(v)), r: 2.5 }));
        } else if (S.obj === 'cloud') { S.cloud.forEach((v) => { const w = m.apply(M, v); s.point(m.apply(P, w), { color: lerpColor(hidden(w)), r: 3.5 }); }); }
        for (let k = 0; k < n; k++) s.vector(proj(m.e(k, n)), { color: LA.basisColor(k), width: 2.5, label: 'Ae' + '₁₂₃₄₅₆'[k], alpha: S.obj === 'basis' ? 1 : 0.7 });
        s.vector(proj(S.x), { color: T.vec, width: 3, label: S.t < 1 ? 'x' : 'Ax' });
        s.caption(`shadow of ℝ${'⁰¹²³⁴⁵⁶'[n]} · det = ${m.fmt(m.det(M))}`, { y: 36, color: T.text });
      };
      s2.onDraw = (s) => {
        const ctx2 = s.ctx, W = s.width, H = s.height, n = S.n, M = Mt(); const R = 2.5; const X = (k) => 40 + (k * (W - 60)) / (n - 1), Y = (v) => H / 2 - (m.clamp(v, -R, R) / R) * (H / 2 - 22);
        ctx2.strokeStyle = 'rgba(255,255,255,0.25)'; ctx2.lineWidth = 1; ctx2.font = '11px ui-sans-serif, system-ui, sans-serif'; ctx2.fillStyle = T.muted; ctx2.textAlign = 'center';
        for (let k = 0; k < n; k++) { ctx2.beginPath(); ctx2.moveTo(X(k), 14); ctx2.lineTo(X(k), H - 16); ctx2.stroke(); ctx2.fillText('x' + '₁₂₃₄₅₆'[k], X(k), H - 4); }
        ctx2.strokeStyle = 'rgba(255,255,255,0.12)'; ctx2.beginPath(); ctx2.moveTo(30, Y(0)); ctx2.lineTo(W - 20, Y(0)); ctx2.stroke(); ctx2.textAlign = 'left'; ctx2.fillText('0', 6, Y(0) + 4); ctx2.fillText('+' + R, 6, Y(R) + 4); ctx2.fillText('−' + R, 6, Y(-R) + 4);
        const line = (v, color, width, dash) => { ctx2.save(); ctx2.strokeStyle = color; ctx2.lineWidth = width; if (dash) ctx2.setLineDash(dash); ctx2.beginPath(); v.forEach((val, k) => (k ? ctx2.lineTo(X(k), Y(val)) : ctx2.moveTo(X(k), Y(val)))); ctx2.stroke(); ctx2.restore(); };
        for (let k = 0; k < n; k++) line(m.col(M, k), LA.basisColor(k), 1.5);
        line(S.x, T.vec, 1.5, [4, 4]); line(m.apply(M, S.x), T.vec, 3);
      };
      buildControls(); refresh();
      ctx.onUnmount(() => { s3.destroy(); s2.destroy(); spinTw && spinTw.cancel(); });
      ctx.hint('Drag to orbit the shadow · spin the x₁x₄-plane to see the tesseract turn through the 4th dimension');
      ctx.notes.appendChild(ui.prose(`
<h2>Nothing in the rules mentions "three"</h2>
<p>A vector in ℝⁿ is a list of n numbers; a linear map is an n×n (or m×n) matrix whose columns say where the basis vectors go. Every definition in this explorer — span, rank, determinant, inverse, eigenvector, SVD — was stated for arbitrary n, and the algorithms behind the readouts do not care what n is. What we lose is the picture. Two substitutes are shown here.</p>
<div class="def"><h4>Shadows</h4><p>A 3×n matrix <span class="m">P</span> is a linear map ℝⁿ → ℝ³: a <em>projection</em> of n-space onto 3-space (chapter 8 with m = 3). The hypercube's 2ⁿ corners (±1, …, ±1) and its n·2ⁿ⁻¹ edges are mapped to a 3D wire-frame, exactly as a 3D cube casts a 2D shadow. Colour encodes the 4th coordinate, which the shadow discards. Rotating the hypercube in a plane that involves x₄ makes the inner and outer cubes of the "tesseract" trade places — that is the 4D analogue of a cube's far face coming to the front.</p></div>
<div class="def"><h4>Parallel coordinates</h4><p>Draw one vertical axis per dimension and plot a vector as the zig-zag through its coordinates. Now a 6-dimensional vector is as easy to read as a 2-dimensional one. The thin lines are the columns of A; a diagonal matrix shows as lines that each touch only one axis; a permutation shows as crossing lines.</p></div>
<h4>What changes with dimension</h4>
<ul>
<li><b>Rotations are about planes, not axes.</b> In ℝ³ the plane of rotation happens to have a unique perpendicular line, so we name the axis. In ℝ⁴ a rotation can turn <em>two</em> planes at once with different angles ("double rotation") and fix only the origin.</li>
<li><b>Determinant = n-volume scale.</b> The hypercube has volume 2ⁿ; after A it has 2ⁿ·|det A|.</li>
<li><b>Eigenvalues come in n's</b>: real ones are fixed directions, complex pairs are planes of rotation. A rotation of ℝⁿ has |λ| = 1 for all of them.</li>
<li><b>Rank–nullity</b> still counts: an n×n matrix of rank r crushes an (n − r)-dimensional null space.</li>
</ul>
<p>In data science a vector with hundreds of coordinates is a row of a spreadsheet, and a matrix with hundreds of columns transforms whole tables; eigenvectors of the covariance matrix (PCA) and the SVD are how one finds the few directions that matter. The geometric intuition built in 2D and 3D is exactly the intuition to use there.</p>
<div class="try"><h4>Try this</h4><ul>
<li>n = 4, spin the x₁x₄-plane. Watch the colour (4th coordinate) flow through the structure as the inner cube becomes the outer one.</li>
<li>Choose <em>double rotation</em> and play the animation: nothing but the origin stays still, yet lengths are preserved (det 1, orthogonal).</li>
<li>Choose <em>project onto first 3 coordinates</em>: the shadow becomes an ordinary cube and rank drops to 3.</li>
<li>Set n = 6 and look at the parallel-coordinates plot while applying a random rotation: six zig-zags, still one matrix.</li>
</ul></div>`));
    },
  });
})();
