/* Chapter: Start here */
(function () {
  'use strict';
  const LA = window.LA; const m = LA.m; const ui = LA.ui; const el = ui.el; const T = LA.theme;
  LA.chapters.push({
    id: 'start', title: 'Start here', group: 'Foundations', order: 1, summary: 'What this explorer is, how to drive it, and the one idea behind everything',
    mount(ctx) {
      const view = ctx.view('<b>A tour of transformations</b> — the grid is the plane ℝ², the arrows are where <b style="color:#83c167">î</b> and <b style="color:#fc6255">ĵ</b> land');
      const tour = [
        { name: 'rotation by 30°', M: m.rot2(Math.PI / 6) }, { name: 'horizontal shear', M: [[1, 1], [0, 1]] }, { name: 'stretch x by 2, squash y', M: [[2, 0], [0, 0.5]] },
        { name: 'reflection across y = x', M: [[0, 1], [1, 0]] }, { name: 'rotation by 90°', M: [[0, -1], [1, 0]] }, { name: 'projection onto a line (det = 0)', M: [[0.5, 0.5], [0.5, 0.5]] },
        { name: 'a general matrix', M: [[1, 1.5], [-0.5, 1]] }, { name: 'the identity', M: m.identity(2) },
      ];
      let M = m.identity(2), from = m.identity(2), idx = 0, tw = null, timer = 0, label = 'the identity', paused = false;
      const scene = new LA.Scene2D(view.canvas, { scale: 70 });
      scene.onDraw = (s) => {
        s.baseGrid(); s.grid(M); s.unitSquare(M); s.shapeF(M, { alpha: 0.9 }); s.basis(M);
        s.caption('now showing: ' + label, { y: 36, color: T.text });
        s.caption('det = ' + m.fmt(m.det(M)), { y: 52 });
      };
      const step = () => {
        if (paused) return;
        const target = tour[idx % tour.length]; idx++; from = m.clone(M);
        tw = LA.anim.tween({ duration: 2200, onUpdate: (u) => { M = m.lerp(from, target.M, u); scene.requestDraw(); }, onDone: () => { timer = setTimeout(step, 1400); } });
        label = target.name; scene.requestDraw();
      };
      timer = setTimeout(step, 900);
      ctx.onUnmount(() => { paused = true; tw && tw.cancel(); clearTimeout(timer); scene.destroy(); });
      const pauseBtn = ui.button('❚❚ Pause tour', () => { paused = !paused; pauseBtn.innerHTML = paused ? '▶ Resume tour' : '❚❚ Pause tour'; if (paused) { tw && tw.cancel(); clearTimeout(timer); } else step(); }, { small: true });
      const list = LA.chapters.slice().sort((a, b) => a.order - b.order);
      ctx.controls.appendChild(ui.group('Tour', ui.row(pauseBtn), ui.note('Scroll to zoom, drag to pan, double-click to reset the view. The same controls work in every chapter.')));
      ctx.controls.appendChild(ui.group('Jump to a chapter', el('div', { class: 'cards' }, ...list.filter((c) => c.id !== 'start').map((c) => el('a', { class: 'card', href: '#' + c.id }, el('b', { text: String(list.indexOf(c) + 1).padStart(2, '0') + ' · ' + c.group }), c.title)))));
      ctx.notes.appendChild(ui.prose(`
<h2>Welcome</h2>
<p>This is a hands-on laboratory for linear algebra in the spirit of 3Blue1Brown's <em>Essence of Linear Algebra</em>. Every chapter pairs a live picture with the precise definitions behind it. Nothing is pre-rendered: you type or drag a matrix and the space responds.</p>
<div class="def"><h4>The one idea</h4><p>A matrix <b>is</b> a linear transformation. Its columns tell you where the basis vectors land. Everything else — determinants, inverses, rank, eigenvectors, the SVD — is a question about <em>what that transformation does to space</em>.</p>
<div class="formula">A = ${ui.mhtml([['a', 'b'], ['c', 'd']], { colColors: true })} &nbsp;means&nbsp; <b class="i">î</b> ↦ ${ui.mhtml([['a'], ['c']], { cls: 'c' })} , <b class="j">ĵ</b> ↦ ${ui.mhtml([['b'], ['d']])}</div></div>
<h4>How to drive it</h4>
<ul>
<li><b>Drag the arrows.</b> In 2D, the tips of <b class="i">î</b>, <b class="j">ĵ</b> and sample vectors are draggable. Hold <span class="kbd">Shift</span> to snap to the half-grid.</li>
<li><b>Type expressions</b> in any matrix cell: <code>1/2</code>, <code>sqrt(2)/2</code>, <code>cos(pi/3)</code>. Use <span class="kbd">↑</span>/<span class="kbd">↓</span> to nudge by 0.1 (<span class="kbd">Shift</span> for 1), or press and drag sideways on a cell to scrub.</li>
<li><b>Animate.</b> Most chapters have a play button that morphs the identity into your matrix, so you can watch where every point goes.</li>
<li><b>3D views</b> orbit by dragging, zoom with the wheel, pan with <span class="kbd">Shift</span>-drag, and reset on double-click.</li>
<li><span class="kbd">[</span> and <span class="kbd">]</span> move between chapters.</li>
</ul>
<h4>The route</h4>
<p><b>Foundations</b> builds the picture: vectors and span, transformations, composition, the determinant, and solving <span class="m">A<b>x</b> = <b>b</b></span>. <b>Dimension</b> leaves the plane: 3D maps, then <em>non-square</em> matrices that move between ℝ¹, ℝ² and ℝ³, then ℝⁿ. <b>Geometry</b> covers dot and cross products and change of basis. <b>Spectral</b> is eigenvectors and the singular value decomposition. <b>Beyond</b> shows the same machinery acting on functions.</p>
<h4>Notation</h4>
<ul>
<li>ℝⁿ — the space of lists of <span class="m">n</span> real numbers, pictured as <span class="m">n</span>-dimensional space.</li>
<li><b class="i">î</b>, <b class="j">ĵ</b>, <b class="k">k̂</b> (or <span class="m">e₁, e₂, …</span>) — the standard basis vectors.</li>
<li><span class="m">A<b>v</b></span> — apply <span class="m">A</span> to <span class="m"><b>v</b></span>; <span class="m">BA</span> — do <span class="m">A</span> first, then <span class="m">B</span>.</li>
<li><span class="m">Aᵀ</span>, <span class="m">A⁻¹</span>, det <span class="m">A</span>, tr <span class="m">A</span>, rank <span class="m">A</span>, null(<span class="m">A</span>), col(<span class="m">A</span>) — transpose, inverse, determinant, trace, rank, null space, column space.</li>
<li><span class="m">λ</span> — an eigenvalue; <span class="m">σ</span> — a singular value.</li>
</ul>
<p class="note">Colour code used throughout: <b class="i">green = î / first column</b>, <b class="j">red = ĵ / second column</b>, <b class="k">blue = k̂ / third column</b>, <b class="v">yellow = a vector you control</b>, <b class="n">purple = null space</b>, <b class="c">teal = column space / image</b>.</p>`));
      ctx.hint('Watch the tour, or pick a chapter from the left. Scroll to zoom · drag to pan · double-click to reset');
    },
  });
})();
