# Linear Algebra Explorer

An interactive, 3Blue1Brown-style laboratory for linear algebra. Type or drag a matrix and watch
what it does to space — in 2D, in 3D, between spaces of different dimension, and in ℝⁿ.

No build step, no dependencies, works offline.

Repository: <https://github.com/JaiiaCerff/linear-algebra-explorer>

## Run it

Three ways, from simplest to most permanent:

1. **Open the file.** Double-click `index.html`. Everything works from `file://` because the app uses plain scripts, no modules and no network.
2. **Serve it once.** From this folder:

   ```bash
   ./serve.sh
   ```

   then visit <http://localhost:8123>. Ctrl-C stops it.
3. **Keep it running (macOS).** Install a per-user LaunchAgent that serves the folder at login and restarts it if it dies:

   ```bash
   tools/install-localhost-server.sh
   ```

   <http://localhost:8123> then works whenever you are logged in. It binds to 127.0.0.1 only. Remove it with `tools/uninstall-localhost-server.sh`. The agent runs the folder in place, so a `git pull` is all it takes to update what is served.

## Chapters

| # | Chapter | What you can do |
|---|---------|-----------------|
| 1 | Start here | Self-running tour of transformations, how to drive the app, notation |
| 2 | Vectors, span & basis | Drag vectors, build linear combinations, see span collapse when vectors become dependent (2D and 3D) |
| 3 | Linear transformations | 2×2 matrix editor with draggable î and ĵ, animated identity → A, column decomposition of Av |
| 4 | Composition & multiplication | "A then B" vs "B then A" side by side; BA computed column by column |
| 5 | The determinant | Area/volume scaling, orientation flips, singular collapse, an interactive proof that area = ad − bc |
| 6 | Inverses, rank & null space | Row picture and column picture of Ax = b, inverse formula, null space, column space, rank–nullity (2D and 3D) |
| 7 | Transformations in 3D | 3×3 editor, rotation axes, unit cube → parallelepiped, sphere → ellipsoid |
| 8 | Non-square matrices | Any m×n with m, n ∈ {1,2,3}: linked input and output spaces, null space, fibres, column space, plus a combined animated view of ℝⁿ being flattened into or embedded in ℝᵐ |
| 9 | Dot products & duality | Projection, the 1×2 matrix [v₁ v₂] squashing the plane onto a number line, projection matrices |
| 10 | Cross products | u × v as area and normal, right-hand rule, scalar triple product |
| 11 | Change of basis | Two grids, translating coordinates with P and P⁻¹, the same transformation as P⁻¹AP |
| 12 | Gram–Schmidt & QR | Step-by-step orthonormalisation (2D and 3D), A = QR read off the steps, breakdown on dependent columns, the QR algorithm for eigenvalues |
| 13 | Least squares | Draggable data points, line/constant/parabola fits, residual squares, a hand-drawn guess to beat, and for three points the full ℝ³ picture: b, its projection onto the column space, and the perpendicular residual |
| 14 | Eigenvectors & eigenvalues | Eigen-directions, λ-slider showing det(A − λI) collapse, characteristic polynomial plot, eigenbasis view, power iteration, 3D eigenspaces |
| 15 | Singular value decomposition | Rotate → stretch → rotate animation, unit circle → ellipse, 3×2 / 2×3 / 3×3 shapes, pseudoinverse |
| 16 | Matrix exponentials | Phase portraits of x′ = Ax: vector field, trajectories, the plane flowed by e^{At}, eigen-directions, trace–determinant plane, series and closed forms |
| 17 | Higher dimensions | ℝ⁴–ℝ⁶: hypercube shadows, rotations in planes, parallel coordinates |
| 18 | Functions as vectors | Polynomials as ℝ⁴; derivative, shift, integral, evaluation as matrices |

## Controls

- Drag arrow tips in 2D views; hold Shift to snap to the half-grid.
- Matrix cells accept expressions: `1/2`, `sqrt(2)/2`, `cos(pi/3)`. Arrow keys nudge by 0.1 (Shift: 1), or press and drag sideways on a cell to scrub.
- Scroll to zoom, drag the background to pan, double-click to reset. 3D views orbit on drag, pan with Shift-drag.
- `[` and `]` switch chapters.

## Project layout

```
index.html            entry point (loads everything as classic scripts)
css/style.css         theme and layout
js/math.js            linear algebra engine: RREF, rank, null/column space, inverse, determinant,
                      characteristic polynomial, eigen-decomposition, one-sided-Jacobi SVD, pseudoinverse,
                      Gram–Schmidt/QR, least squares, matrix exponential
js/render2d.js        2D canvas scene (grids, vectors, shapes, draggable handles) and tweening
js/render3d.js        3D scene on a 2D canvas (orbit camera, painter's algorithm)
js/ui.js              matrix editor, sliders, players, readouts
js/app.js             sidebar, routing, chapter lifecycle
js/chapters/*.js      one file per chapter; each registers itself in LA.chapters
tests/math-test.html  self-test page for the math engine (open it in the browser)
```

## Adding a chapter

Create `js/chapters/mychapter.js`:

```js
(function () {
  const LA = window.LA, m = LA.m, ui = LA.ui;
  LA.chapters.push({
    id: 'mychapter', title: 'My chapter', group: 'Geometry', order: 16, summary: 'One line',
    mount(ctx) {
      const view = ctx.view('Title shown on the canvas');
      const scene = new LA.Scene2D(view.canvas);
      scene.onDraw = (s) => { s.baseGrid(); s.vector([1, 2], { label: 'v' }); };
      ctx.controls.appendChild(ui.group('Controls'));
      ctx.notes.appendChild(ui.prose('<h2>Explanation</h2>'));
      ctx.onUnmount(() => scene.destroy());
    },
  });
})();
```

and add a `<script>` tag for it in `index.html` before `js/app.js`.
