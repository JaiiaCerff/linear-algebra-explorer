/* Chapter: The determinant */
(function () {
  'use strict';
  const LA = window.LA; const m = LA.m; const ui = LA.ui; const el = ui.el; const T = LA.theme;
  LA.chapters.push({
    id: 'determinant', title: 'The determinant', group: 'Foundations', order: 5, summary: 'How much a transformation scales area or volume, and whether it flips orientation',
    mount(ctx) {
      const S = { mode: '2d', A: [[3, 1], [1, 2]], A3: [[2, 0, 0], [0, 1.5, 0.5], [0, 0, 1]], t: 1, tiles: false, blob: false, proof: false, lattice: false };
      let scene = null, player = null;
      const chips = el('div', { class: 'chips' });
      const setMode = (mode) => { S.mode = mode; chips.querySelectorAll('.chip').forEach((c) => c.classList.toggle('active', c.dataset.m === mode)); build(); };
      for (const [k, l] of [['2d', 'Area in ℝ²'], ['3d', 'Volume in ℝ³']]) chips.appendChild(el('button', { class: 'chip' + (S.mode === k ? ' active' : ''), 'data-m': k, text: l, on: { click: () => setMode(k) } }));
      function build() {
        if (scene) { scene.destroy(); scene = null; } if (player) player.stop();
        ctx.stage.innerHTML = ''; ctx.controls.innerHTML = ''; ctx.controls.appendChild(ui.group('Space', chips));
        S.mode === '2d' ? build2D() : build3D();
      }
      function build2D() {
        const view = ctx.view('<b>Unit square → parallelogram</b>; shaded area = |det A|, colour flips when orientation flips');
        scene = new LA.Scene2D(view.canvas, { scale: 64 });
        const ed = ui.matrixEditor({ matrix: S.A, onChange: (A) => { S.A = A; refresh(); } });
        player = ui.player({ label: 'Animate identity → A', value: S.t, onChange: (t) => { S.t = t; refresh(); } });
        const tg = (k, label) => ui.toggle({ label, value: S[k], onChange: (v) => { S[k] = v; refresh(); } });
        const ro = ui.readout([]);
        ctx.controls.appendChild(ui.group('Matrix A', ui.row(ed.el, el('div', {}, ui.row(ui.button('Random', () => { S.A = m.randMat(2, 2, -2, 2, 0.5); ed.update(S.A); refresh(); }, { small: true }), ui.button('Swap columns', () => { S.A = m.fromCols([m.col(S.A, 1), m.col(S.A, 0)]); ed.update(S.A); refresh(); }, { small: true })), ui.row(ui.button('Rotation 40°', () => { S.A = m.rot2(m.rad(40)); ed.update(S.A); refresh(); }, { small: true }), ui.button('Singular', () => { S.A = [[2, 1], [4, 2]]; ed.update(S.A); refresh(); }, { small: true }), ui.button('Default', () => { S.A = [[3, 1], [1, 2]]; ed.update(S.A); refresh(); }, { small: true })))), ui.note('Drag <b class="i">î</b> and <b class="j">ĵ</b> on the canvas. Try dragging <b class="j">ĵ</b> clockwise past <b class="i">î</b>.')));
        ctx.controls.appendChild(ui.group('Animation', player.el));
        ctx.controls.appendChild(ui.group('Show', ui.row(tg('tiles', 'Many unit squares (every area scales alike)')), ui.row(tg('blob', 'A circle (any region scales alike)')), ui.row(tg('proof', 'Why area = ad − bc (needs a &gt; b ≥ 0, d &gt; c ≥ 0)'))));
        ctx.controls.appendChild(ui.group('Readout', ro.el));
        scene.addHandle({ get: () => m.col(S.A, 0), set: (p) => { m.setCol(S.A, 0, p); ed.refresh(); refresh(); }, color: T.i });
        scene.addHandle({ get: () => m.col(S.A, 1), set: (p) => { m.setCol(S.A, 1, p); ed.refresh(); refresh(); }, color: T.j });
        function refresh() {
          ed.update(S.A); const [[a, b], [c, d]] = S.A; const det = m.det(S.A);
          ro.update([
            { label: 'det A = ad − bc', value: `${m.fmt(a)}·${m.fmt(d)} − ${m.fmt(b)}·${m.fmt(c)} = <b>${m.fmt(det)}</b>` },
            { label: 'area scale factor', value: '|det| = ' + m.fmt(Math.abs(det)) },
            { label: 'orientation', value: Math.abs(det) < 1e-9 ? 'destroyed — plane collapses to a line or point' : det > 0 ? 'preserved (î → ĵ still counter-clockwise)' : 'flipped (like a mirror)', color: Math.abs(det) < 1e-9 ? T.warn : det > 0 ? T.good : '#ff8a5b' },
            { label: 'invertible?', value: Math.abs(det) > 1e-9 ? 'yes, det A⁻¹ = 1/det A = ' + m.fmt(1 / det) : 'no' },
          ]);
          scene.requestDraw();
        }
        scene.onDraw = (s) => {
          const M = m.lerp(m.identity(2), S.A, S.t); const det = m.det(M);
          s.baseGrid(); s.grid(M, { alpha: 0.5 });
          if (S.tiles) for (let i = -3; i <= 2; i++) for (let j = -3; j <= 2; j++) { if (i === 0 && j === 0) continue; s.polygon([[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]].map((p) => m.apply(M, p)), { fill: det >= 0 ? T.pos : T.neg, alpha: 0.35, stroke: 'rgba(255,255,255,0.15)', width: 1 }); }
          if (S.blob) { s.ellipse(m.identity(2), { stroke: 'rgba(255,255,255,0.3)', width: 1, dash: [3, 4] }); s.ellipse(M, { fill: 'rgba(245,213,71,0.15)', stroke: T.vec, width: 1.5 }); s.text(m.apply(M, [0, -1]), 'area π·|det| = ' + m.fmt(Math.PI * Math.abs(det)), { color: T.vec, dy: 18, align: 'center' }); }
          s.unitSquare(M, { alpha: 0.9 });
          const [[a, b], [c, d]] = M;
          if (S.proof && S.t >= 1) {
            if (a > b && b >= 0 && d > c && c >= 0) {
              const W = a + b, H = c + d; const pieces = [
                { pts: [[0, 0], [a, 0], [a, c]], col: 'rgba(131,193,103,0.35)', lab: 'ac/2' }, { pts: [[b, d], [b, H], [W, H]], col: 'rgba(131,193,103,0.35)', lab: 'ac/2' },
                { pts: [[0, 0], [0, d], [b, d]], col: 'rgba(252,98,85,0.35)', lab: 'bd/2' }, { pts: [[a, c], [W, c], [W, H]], col: 'rgba(252,98,85,0.35)', lab: 'bd/2' },
                { pts: [[a, 0], [W, 0], [W, c], [a, c]], col: 'rgba(214,120,255,0.35)', lab: 'bc' }, { pts: [[0, d], [b, d], [b, H], [0, H]], col: 'rgba(214,120,255,0.35)', lab: 'bc' },
              ];
              s.polygon([[0, 0], [W, 0], [W, H], [0, H]], { stroke: 'rgba(255,255,255,0.6)', width: 1, dash: [5, 4] });
              for (const p of pieces) { s.polygon(p.pts, { fill: p.col, stroke: 'rgba(255,255,255,0.25)', width: 1 }); const cx = p.pts.reduce((q, r) => q + r[0], 0) / p.pts.length, cy = p.pts.reduce((q, r) => q + r[1], 0) / p.pts.length; s.text([cx, cy], p.lab, { align: 'center', baseline: 'middle', math: true }); }
              s.text([W / 2, 0], '(a + b)', { dy: 16, align: 'center', math: true }); s.text([0, H / 2], '(c + d)', { dx: -14, align: 'right', math: true });
              s.caption(`(a+b)(c+d) − 2·ac/2 − 2·bd/2 − 2·bc = ad − bc = ${m.fmt(a * d - b * c)}`, { y: 52, color: T.text });
            } else s.caption('Proof diagram needs a > b ≥ 0 and d > c ≥ 0 (e.g. the default matrix).', { y: 52, color: T.warn });
          }
          s.basis(M);
          s.text(m.apply(M, [0.5, 0.5]), 'area ' + m.fmt(Math.abs(det)), { align: 'center', baseline: 'middle', color: T.white });
          s.caption(`det = ${m.fmt(det)}  ${det < 0 ? '(orientation flipped)' : ''}`, { y: 36, color: T.text });
        };
        refresh();
        ctx.hint('Drag î and ĵ · the parallelogram is the image of the unit square · its signed area is det A');
      }
      function build3D() {
        const view = ctx.view('<b>Unit cube → parallelepiped</b>; volume = |det A|');
        scene = new LA.Scene3D(view.canvas, { dist: 8 });
        const ed = ui.matrixEditor({ matrix: S.A3, onChange: (A) => { S.A3 = A; refresh(); } });
        player = ui.player({ label: 'Animate identity → A', value: S.t, onChange: (t) => { S.t = t; refresh(); } });
        const latT = ui.toggle({ label: 'Show lattice', value: S.lattice, onChange: (v) => { S.lattice = v; refresh(); } });
        const rotT = ui.toggle({ label: 'Auto-rotate', value: false, onChange: (v) => { scene.autoRotate = v; scene.requestDraw(); } });
        const ro = ui.readout([]);
        ctx.controls.appendChild(ui.group('Matrix A', ed.el, ui.row(ui.button('Random', () => { S.A3 = m.randMat(3, 3, -2, 2, 0.5); ed.update(S.A3); refresh(); }, { small: true }), ui.button('Rotation', () => { S.A3 = m.rot3([1, 1, 0], 0.8); ed.update(S.A3); refresh(); }, { small: true }), ui.button('Reflection (z → −z)', () => { S.A3 = m.diag([1, 1, -1]); ed.update(S.A3); refresh(); }, { small: true }), ui.button('Flatten (rank 2)', () => { S.A3 = [[1, 0, 1], [0, 1, 1], [1, 1, 2]]; ed.update(S.A3); refresh(); }, { small: true }), ui.button('Default', () => { S.A3 = [[2, 0, 0], [0, 1.5, 0.5], [0, 0, 1]]; ed.update(S.A3); refresh(); }, { small: true }))));
        ctx.controls.appendChild(ui.group('Animation', player.el, ui.row(latT.el, rotT.el)));
        ctx.controls.appendChild(ui.group('Readout', ro.el));
        function refresh() {
          const A = S.A3, det = m.det(A); const [[a, b, c], [d, e, f], [g, h, i]] = A;
          ro.update([
            { label: 'det A', value: `<b>${m.fmt(det)}</b>` }, { label: 'volume scale', value: '|det| = ' + m.fmt(Math.abs(det)) },
            { label: 'expansion (row 1)', value: `${m.fmt(a)}·(${m.fmt(e)}·${m.fmt(i)} − ${m.fmt(f)}·${m.fmt(h)}) − ${m.fmt(b)}·(${m.fmt(d)}·${m.fmt(i)} − ${m.fmt(f)}·${m.fmt(g)}) + ${m.fmt(c)}·(${m.fmt(d)}·${m.fmt(h)} − ${m.fmt(e)}·${m.fmt(g)})` },
            { label: 'orientation', value: Math.abs(det) < 1e-9 ? 'destroyed — space collapses (rank ' + m.rank(A) + ')' : det > 0 ? 'preserved (right-handed î, ĵ, k̂)' : 'flipped (left-handed)', color: Math.abs(det) < 1e-9 ? T.warn : det > 0 ? T.good : '#ff8a5b' },
            { label: 'triple product', value: 'det = (î′ × ĵ′) · k̂′ = ' + m.fmt(m.vdot(m.vcross(m.col(A, 0), m.col(A, 1)), m.col(A, 2))) },
          ]);
          scene.requestDraw();
        }
        scene.onDraw = (s) => {
          const M = m.lerp(m.identity(3), S.A3, S.t);
          s.axes({ length: 3.5 }); s.grid(m.identity(3), { range: 3, color: 'rgba(255,255,255,0.07)', axisColor: 'rgba(255,255,255,0.15)' });
          if (S.lattice) s.lattice(M, { range: 2, alpha: 0.35 });
          s.cube(m.identity(3), { faces: false, stroke: 'rgba(255,255,255,0.25)' });
          s.cube(M, { alpha: 0.5 }); s.basis(M);
          s.caption(`det = ${m.fmt(m.det(M))}   volume = ${m.fmt(Math.abs(m.det(M)))}`, { y: 36, color: T.text });
        };
        refresh();
        ctx.hint('Drag to orbit · the coloured box is the image of the unit cube · its signed volume is det A');
      }
      build();
      ctx.onUnmount(() => { player && player.stop(); scene && scene.destroy(); });
      ctx.notes.appendChild(ui.prose(`
<h2>The determinant is a scale factor</h2>
<p>A linear map stretches or squashes every region of the plane by the <em>same</em> factor (turn on "many unit squares" to see it). That factor, with a sign, is the <b>determinant</b>. In 3D it is the volume factor.</p>
<div class="def"><h4>Definition by properties</h4><p>det is the unique function of the columns that is (1) <b>multilinear</b> — scaling one column scales det, adding to one column adds — (2) <b>alternating</b> — swapping two columns negates it — and (3) <b>normalised</b>: det I = 1. Signed area of a parallelogram has exactly these properties, which is why the geometric and algebraic definitions agree.</p>
<div class="formula">det ${ui.mhtml([['a', 'b'], ['c', 'd']], { colColors: true })} = ad − bc</div></div>
<h4>What the sign and the zero mean</h4>
<ul>
<li><b>det &gt; 0</b>: orientation kept — going from <b class="i">î</b> to <b class="j">ĵ</b> is still counter-clockwise (in 3D, <b class="i">î</b>, <b class="j">ĵ</b>, <b class="k">k̂</b> still obey the right-hand rule).</li>
<li><b>det &lt; 0</b>: space was flipped over, like a reflection. The shaded square changes colour at the moment <b class="j">ĵ</b> crosses the line of <b class="i">î</b>.</li>
<li><b>det = 0</b>: the image has <em>zero area</em>, so the plane was squashed onto a line or a point. Information is lost, so no inverse exists. Equivalently the columns are linearly dependent.</li>
</ul>
<h4>Facts worth knowing</h4>
<ul>
<li><span class="m">det(BA) = det(B)·det(A)</span>: scale factors multiply under composition.</li>
<li><span class="m">det(A⁻¹) = 1/det(A)</span>; <span class="m">det(Aᵀ) = det(A)</span>; <span class="m">det(cA) = cⁿ det(A)</span> in ℝⁿ.</li>
<li>For a rotation det = 1; for a reflection det = −1; for a projection det = 0.</li>
<li>In 3D the determinant equals the <a href="#cross">scalar triple product</a> <span class="m">(<b>a</b> × <b>b</b>) · <b>c</b></span> of the columns.</li>
</ul>
<div class="try"><h4>Try this</h4><ul>
<li>Enable the proof overlay with the default matrix: the bounding rectangle (a+b)(c+d) minus two triangles of area ac/2, two of area bd/2 and two rectangles bc leaves exactly ad − bc.</li>
<li>Drag <b class="j">ĵ</b> slowly across <b class="i">î</b>. The area shrinks to zero (collapse) and then grows again with the opposite colour (flip).</li>
<li>Press <em>Swap columns</em>: the picture is a mirror image and the determinant changes sign — property (2).</li>
<li>In 3D, apply the reflection z → −z: the box looks the same but det = −1. Orientation is invisible until you track which vector is which.</li>
</ul></div>`));
    },
  });
})();
