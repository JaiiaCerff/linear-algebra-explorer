/* Linear Algebra Explorer — math engine
   Matrices are arrays of rows; vectors are flat arrays. No dependencies. */
(function () {
  'use strict';
  const LA = (window.LA = window.LA || {});
  const m = (LA.m = {});
  LA.chapters = LA.chapters || [];
  const EPS = 1e-12;

  // ---------- scalars & formatting ----------
  m.clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  m.approx = (a, b, t = 1e-9) => Math.abs(a - b) <= t;
  m.fmt = function (x, d = 2) {
    if (x === null || x === undefined || Number.isNaN(x)) return '—';
    if (!isFinite(x)) return x > 0 ? '∞' : '−∞';
    const p = Math.pow(10, d);
    let r = Math.round(x * p) / p;
    if (Object.is(r, -0) || Math.abs(r) < 0.5 / p) r = 0;
    let s = r.toFixed(d);
    if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
    return s.replace('-', '−');
  };
  m.fmtC = function (z, d = 2) {
    const re = z.re, im = z.im;
    if (Math.abs(im) < 1e-9) return m.fmt(re, d);
    const ims = m.fmt(Math.abs(im), d);
    const imPart = (ims === '1' ? '' : ims) + 'i';
    if (Math.abs(re) < 1e-9) return (im < 0 ? '−' : '') + imPart;
    return m.fmt(re, d) + (im < 0 ? ' − ' : ' + ') + imPart;
  };
  m.fmtVec = (v, d = 2) => '(' + v.map((x) => m.fmt(x, d)).join(', ') + ')';
  m.deg = (rad) => (rad * 180) / Math.PI;
  m.rad = (deg) => (deg * Math.PI) / 180;

  // Parse a numeric expression such as "1/2", "sqrt(2)/2", "cos(pi/3)".
  m.parseNum = function (str) {
    if (typeof str === 'number') return str;
    let s = String(str).trim().replace(/−/g, '-').replace(/×/g, '*').replace(/÷/g, '/').replace(/π/g, 'pi').replace(/√/g, 'sqrt');
    if (s === '') return NaN;
    if (/^-?\d*\.?\d+(e-?\d+)?$/i.test(s)) return parseFloat(s);
    if (!/^[0-9+\-*/^().\s a-z]*$/i.test(s)) return NaN;
    const allowed = { pi: 'Math.PI', e: 'Math.E', sqrt: 'Math.sqrt', sin: 'Math.sin', cos: 'Math.cos', tan: 'Math.tan', abs: 'Math.abs', exp: 'Math.exp', ln: 'Math.log', log: 'Math.log', atan: 'Math.atan', asin: 'Math.asin', acos: 'Math.acos' };
    const ids = s.match(/[a-z]+/gi) || [];
    for (const id of ids) if (!(id.toLowerCase() in allowed)) return NaN;
    s = s.replace(/[a-z]+/gi, (id) => allowed[id.toLowerCase()]).replace(/\^/g, '**');
    try {
      const v = Function('"use strict"; return (' + s + ')')();
      return typeof v === 'number' && isFinite(v) ? v : NaN;
    } catch (e) { return NaN; }
  };

  // ---------- vectors ----------
  m.vadd = (a, b) => a.map((x, i) => x + b[i]);
  m.vsub = (a, b) => a.map((x, i) => x - b[i]);
  m.vscale = (a, s) => a.map((x) => x * s);
  m.vneg = (a) => a.map((x) => -x);
  m.vdot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
  m.vnorm = (a) => Math.sqrt(m.vdot(a, a));
  m.vnormalize = (a) => { const n = m.vnorm(a); return n < EPS ? a.map(() => 0) : m.vscale(a, 1 / n); };
  m.vcross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  m.vlerp = (a, b, t) => a.map((x, i) => x + (b[i] - x) * t);
  m.vzeros = (n) => Array(n).fill(0);
  m.vdist = (a, b) => m.vnorm(m.vsub(a, b));
  m.e = (i, n) => { const v = m.vzeros(n); v[i] = 1; return v; };
  m.vpad = (v, n) => { const r = m.vzeros(n); for (let i = 0; i < Math.min(n, v.length); i++) r[i] = v[i]; return r; };
  m.angle = (a, b) => { const d = m.vnorm(a) * m.vnorm(b); if (d < EPS) return NaN; return Math.acos(m.clamp(m.vdot(a, b) / d, -1, 1)); };
  m.vequal = (a, b, t = 1e-9) => a.length === b.length && a.every((x, i) => Math.abs(x - b[i]) <= t);
  m.perp2 = (v) => [-v[1], v[0]];

  // ---------- matrices ----------
  m.zeros = (r, c) => Array.from({ length: r }, () => Array(c).fill(0));
  m.identity = (n) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
  m.diag = (d) => { const n = d.length, A = m.zeros(n, n); d.forEach((x, i) => (A[i][i] = x)); return A; };
  m.clone = (A) => A.map((r) => r.slice());
  m.rows = (A) => A.length;
  m.cols = (A) => (A[0] ? A[0].length : 0);
  m.isSquare = (A) => m.rows(A) === m.cols(A);
  m.transpose = (A) => { const r = m.rows(A), c = m.cols(A); return Array.from({ length: c }, (_, j) => Array.from({ length: r }, (_, i) => A[i][j])); };
  m.mul = function (A, B) {
    const r = m.rows(A), k = m.cols(A), c = m.cols(B);
    const C = m.zeros(r, c);
    for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) { let s = 0; for (let t = 0; t < k; t++) s += A[i][t] * B[t][j]; C[i][j] = s; }
    return C;
  };
  m.mulAll = (...Ms) => Ms.reduce((P, M) => m.mul(P, M));
  m.apply = (A, v) => A.map((row) => row.reduce((s, a, j) => s + a * (v[j] || 0), 0));
  m.add = (A, B) => A.map((r, i) => r.map((x, j) => x + B[i][j]));
  m.sub = (A, B) => A.map((r, i) => r.map((x, j) => x - B[i][j]));
  m.scale = (A, s) => A.map((r) => r.map((x) => x * s));
  m.lerp = (A, B, t) => A.map((r, i) => r.map((x, j) => x + (B[i][j] - x) * t));
  m.pad = function (A, r, c) { const P = m.zeros(r, c); for (let i = 0; i < Math.min(r, m.rows(A)); i++) for (let j = 0; j < Math.min(c, m.cols(A)); j++) P[i][j] = A[i][j]; return P; };
  m.crop = (A, r, c) => A.slice(0, r).map((row) => row.slice(0, c));
  m.resize = function (A, r, c) { // keep overlapping entries, fill new diagonal with 1, others 0
    const P = m.zeros(r, c);
    for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) P[i][j] = (A[i] && A[i][j] !== undefined) ? A[i][j] : (i === j ? 1 : 0);
    return P;
  };
  m.col = (A, j) => A.map((r) => r[j]);
  m.setCol = (A, j, v) => { A.forEach((r, i) => (r[j] = v[i])); return A; };
  m.fromCols = (cols) => m.transpose(cols);
  m.trace = (A) => A.reduce((s, r, i) => s + r[i], 0);
  m.maxAbs = (A) => A.reduce((s, r) => Math.max(s, ...r.map(Math.abs)), 0);
  m.frob = (A) => Math.sqrt(A.reduce((s, r) => s + r.reduce((q, x) => q + x * x, 0), 0));
  m.equal = (A, B, t = 1e-9) => m.rows(A) === m.rows(B) && m.cols(A) === m.cols(B) && A.every((r, i) => r.every((x, j) => Math.abs(x - B[i][j]) <= t));
  m.isSymmetric = (A) => m.isSquare(A) && m.equal(A, m.transpose(A), 1e-9);
  m.isOrthogonal = (A) => m.isSquare(A) && m.equal(m.mul(m.transpose(A), A), m.identity(m.rows(A)), 1e-6);

  m.det = function (A) {
    const n = m.rows(A);
    if (n !== m.cols(A)) return NaN;
    if (n === 0) return 1;
    if (n === 1) return A[0][0];
    if (n === 2) return A[0][0] * A[1][1] - A[0][1] * A[1][0];
    if (n === 3) { const [[a, b, c], [d, e, f], [g, h, i]] = A; return a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g); }
    const M = m.clone(A); let det = 1;
    for (let k = 0; k < n; k++) {
      let p = k; for (let i = k + 1; i < n; i++) if (Math.abs(M[i][k]) > Math.abs(M[p][k])) p = i;
      if (Math.abs(M[p][k]) < 1e-14) return 0;
      if (p !== k) { [M[p], M[k]] = [M[k], M[p]]; det = -det; }
      det *= M[k][k];
      for (let i = k + 1; i < n; i++) { const f = M[i][k] / M[k][k]; for (let j = k; j < n; j++) M[i][j] -= f * M[k][j]; }
    }
    return det;
  };

  m.inverse = function (A) {
    const n = m.rows(A); if (n !== m.cols(A)) return null;
    const M = A.map((r, i) => r.concat(m.e(i, n)));
    const tol = 1e-10 * Math.max(1, m.maxAbs(A));
    for (let k = 0; k < n; k++) {
      let p = k; for (let i = k + 1; i < n; i++) if (Math.abs(M[i][k]) > Math.abs(M[p][k])) p = i;
      if (Math.abs(M[p][k]) <= tol) return null;
      [M[p], M[k]] = [M[k], M[p]];
      const piv = M[k][k]; for (let j = 0; j < 2 * n; j++) M[k][j] /= piv;
      for (let i = 0; i < n; i++) if (i !== k) { const f = M[i][k]; if (f !== 0) for (let j = 0; j < 2 * n; j++) M[i][j] -= f * M[k][j]; }
    }
    return M.map((r) => r.slice(n));
  };

  m.rref = function (A, tol = 1e-9) {
    const M = m.clone(A); const r = m.rows(M), c = m.cols(M); const pivots = [];
    const t = tol * Math.max(1, m.maxAbs(A)); let row = 0;
    for (let col = 0; col < c && row < r; col++) {
      let p = row; for (let i = row + 1; i < r; i++) if (Math.abs(M[i][col]) > Math.abs(M[p][col])) p = i;
      if (Math.abs(M[p][col]) <= t) { for (let i = row; i < r; i++) M[i][col] = 0; continue; }
      [M[p], M[row]] = [M[row], M[p]];
      const piv = M[row][col]; for (let j = 0; j < c; j++) M[row][j] /= piv;
      for (let i = 0; i < r; i++) if (i !== row) { const f = M[i][col]; if (f !== 0) for (let j = 0; j < c; j++) M[i][j] -= f * M[row][j]; }
      pivots.push(col); row++;
    }
    return { R: M, pivots };
  };
  m.rank = (A) => m.rref(A).pivots.length;
  m.nullspace = function (A) {
    const { R, pivots } = m.rref(A); const n = m.cols(A);
    const free = [...Array(n).keys()].filter((j) => !pivots.includes(j));
    return free.map((f) => { const v = m.vzeros(n); v[f] = 1; pivots.forEach((pc, i) => (v[pc] = -R[i][f])); return v; });
  };
  m.colspace = (A) => m.rref(A).pivots.map((j) => m.col(A, j));
  m.rowspace = (A) => { const { R, pivots } = m.rref(A); return pivots.map((_, i) => R[i].slice()); };
  m.gramSchmidt = function (vs, tol = 1e-9) {
    const out = [];
    for (const v of vs) { let w = v.slice(); for (const u of out) w = m.vsub(w, m.vscale(u, m.vdot(w, u))); const n = m.vnorm(w); if (n > tol) out.push(m.vscale(w, 1 / n)); }
    return out;
  };
  m.completeBasis = function (vs, n) {
    const out = m.gramSchmidt(vs);
    for (let i = 0; i < n && out.length < n; i++) { const c = m.gramSchmidt(out.concat([m.e(i, n)])); if (c.length > out.length) out.push(c[c.length - 1]); }
    return out;
  };
  // Orthonormal basis of the orthogonal complement of span(vs) in R^n
  m.complement = function (vs, n) { const b = m.gramSchmidt(vs); return m.completeBasis(b, n).slice(b.length); };
  m.solve = function (A, b) { // least-norm / particular solution via RREF, or null if inconsistent
    const aug = A.map((r, i) => r.concat([b[i]])); const n = m.cols(A);
    const { R, pivots } = m.rref(aug);
    if (pivots.includes(n)) return null;
    const x = m.vzeros(n); pivots.forEach((pc, i) => (x[pc] = R[i][n])); return x;
  };
  m.projector = function (vs) { // orthogonal projection matrix onto span(vs) in R^n
    const n = vs[0].length; const B = m.gramSchmidt(vs); let P = m.zeros(n, n);
    for (const u of B) for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) P[i][j] += u[i] * u[j];
    return P;
  };

  // ---------- special matrices ----------
  m.rot2 = (th) => [[Math.cos(th), -Math.sin(th)], [Math.sin(th), Math.cos(th)]];
  m.rot3 = function (axis, th) {
    const [x, y, z] = m.vnormalize(axis); const c = Math.cos(th), s = Math.sin(th), C = 1 - c;
    return [[c + x * x * C, x * y * C - z * s, x * z * C + y * s], [y * x * C + z * s, c + y * y * C, y * z * C - x * s], [z * x * C - y * s, z * y * C + x * s, c + z * z * C]];
  };
  m.rotPlane = function (n, i, j, th) { const R = m.identity(n); const c = Math.cos(th), s = Math.sin(th); R[i][i] = c; R[i][j] = -s; R[j][i] = s; R[j][j] = c; return R; };
  m.reflect2 = (th) => [[Math.cos(2 * th), Math.sin(2 * th)], [Math.sin(2 * th), -Math.cos(2 * th)]];
  m.randMat = function (r, c, lo = -2, hi = 2, step = 0.5) {
    return Array.from({ length: r }, () => Array.from({ length: c }, () => { const v = lo + Math.random() * (hi - lo); return step ? Math.round(v / step) * step : v; }));
  };
  m.randOrtho = function (n) { let B = []; while (B.length < n) B = m.gramSchmidt(Array.from({ length: n }, () => Array.from({ length: n }, () => Math.random() * 2 - 1))); return m.fromCols(B); };
  m.round = (A, step = 0.01) => A.map((r) => r.map((x) => Math.round(x / step) * step));

  // ---------- polynomials & eigenvalues ----------
  // Characteristic polynomial p(λ) = det(λI − A) via Faddeev–LeVerrier. Returns c with p(λ) = Σ c[k] λ^k, c[n] = 1.
  m.charPoly = function (A) {
    const n = m.rows(A); let M = m.zeros(n, n); const c = Array(n + 1).fill(0); c[n] = 1;
    for (let k = 1; k <= n; k++) { M = m.add(m.mul(A, M), m.scale(m.identity(n), c[n - k + 1])); c[n - k] = -m.trace(m.mul(A, M)) / k; }
    return c;
  };
  const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
  const csub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const cdiv = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
  const peval = (c, z) => { let r = [0, 0]; for (let k = c.length - 1; k >= 0; k--) { r = cmul(r, z); r[0] += c[k]; } return r; };
  m.polyEval = (c, x) => { let r = 0; for (let k = c.length - 1; k >= 0; k--) r = r * x + c[k]; return r; };
  m.polyRoots = function (coef) {
    const c = coef.slice(); while (c.length > 1 && Math.abs(c[c.length - 1]) < 1e-14) c.pop();
    const n = c.length - 1; if (n < 1) return [];
    const fin = (arr) => arr.sort((p, q) => (Math.abs(q.re - p.re) > 1e-9 ? q.re - p.re : q.im - p.im));
    if (n === 1) return [{ re: -c[0] / c[1], im: 0 }];
    if (n === 2) {
      const a = c[2], b = c[1], cc = c[0]; const D = b * b - 4 * a * cc;
      if (D >= 0) { const s = Math.sqrt(D); return fin([{ re: (-b + s) / (2 * a), im: 0 }, { re: (-b - s) / (2 * a), im: 0 }]); }
      const s = Math.sqrt(-D); return fin([{ re: -b / (2 * a), im: s / (2 * a) }, { re: -b / (2 * a), im: -s / (2 * a) }]);
    }
    const p = c.map((x) => x / c[n]);
    let R = 0; for (let k = 0; k < n; k++) R = Math.max(R, Math.abs(p[k])); R = 1 + R;
    let roots = []; for (let k = 0; k < n; k++) { const ang = (2 * Math.PI * k) / n + 0.4; roots.push([0.5 * R * Math.cos(ang), 0.5 * R * Math.sin(ang)]); }
    for (let it = 0; it < 2000; it++) {
      let maxd = 0;
      for (let i = 0; i < n; i++) {
        const num = peval(p, roots[i]); let den = [1, 0];
        for (let j = 0; j < n; j++) if (j !== i) den = cmul(den, csub(roots[i], roots[j]));
        if (Math.abs(den[0]) + Math.abs(den[1]) < 1e-300) den = [1e-300, 0];
        const d = cdiv(num, den); roots[i] = csub(roots[i], d); maxd = Math.max(maxd, Math.hypot(d[0], d[1]));
      }
      if (maxd < 1e-15) break;
    }
    const scale = Math.max(1, ...roots.map((r) => Math.hypot(r[0], r[1])));
    return fin(roots.map((r) => ({ re: Math.abs(r[0]) < 1e-9 * scale ? 0 : r[0], im: Math.abs(r[1]) < 1e-6 * scale ? 0 : r[1] })));
  };

  // Eigen-decomposition summary. Returns { values:[{re,im}], spaces:[{value, alg, geo, vectors, complex}], charPoly, diagonalizable, realCount }
  m.eigen = function (A) {
    const n = m.rows(A); const cp = m.charPoly(A); const vals = m.polyRoots(cp);
    const scale = Math.max(1, m.maxAbs(A)); const spaces = [];
    for (const v of vals) {
      const same = spaces.find((s) => Math.abs(s.value.re - v.re) < 1e-6 * scale && Math.abs(s.value.im - v.im) < 1e-6 * scale);
      if (same) { same.alg++; continue; }
      spaces.push({ value: v, alg: 1, geo: 0, vectors: [], complex: Math.abs(v.im) > 0 });
    }
    for (const s of spaces) {
      if (s.complex) continue;
      const B = m.sub(A, m.scale(m.identity(n), s.value.re));
      const { S, V } = m.svd(B);
      const tol = 1e-6 * scale;
      let geo = 0; for (let k = S.length - 1; k >= 0; k--) if (S[k] < tol) geo++; else break;
      geo = Math.max(1, geo);
      const vecs = []; for (let k = n - geo; k < n; k++) vecs.push(m.vnormalize(m.col(V, k)));
      s.vectors = vecs.map(fixSign); s.geo = geo;
    }
    const diagonalizable = spaces.every((s) => s.complex || s.geo === s.alg);
    return { values: vals, spaces, charPoly: cp, diagonalizable, realCount: spaces.filter((s) => !s.complex).reduce((a, s) => a + s.alg, 0) };
  };
  function fixSign(v) { for (const x of v) { if (Math.abs(x) > 1e-9) return x < 0 ? m.vneg(v) : v; } return v; }
  m.fixSign = fixSign;

  // Full SVD via one-sided Jacobi. Returns {U (m×m), S (min(m,n) desc), V (n×n)} with det(V) = +1.
  m.svd = function (A) {
    let r = m.rows(A), c = m.cols(A); let M = A, transposed = false;
    if (r < c) { M = m.transpose(A); transposed = true; [r, c] = [c, r]; }
    const U = m.clone(M); const V = m.identity(c);
    for (let sweep = 0; sweep < 80; sweep++) {
      let off = 0;
      for (let p = 0; p < c - 1; p++) for (let q = p + 1; q < c; q++) {
        let alpha = 0, beta = 0, gamma = 0;
        for (let i = 0; i < r; i++) { alpha += U[i][p] * U[i][p]; beta += U[i][q] * U[i][q]; gamma += U[i][p] * U[i][q]; }
        if (Math.abs(gamma) < 1e-300 || Math.abs(gamma) <= 1e-15 * Math.sqrt(alpha * beta)) continue;
        off = Math.max(off, Math.abs(gamma) / Math.sqrt(alpha * beta));
        const zeta = (beta - alpha) / (2 * gamma);
        const t = (zeta >= 0 ? 1 : -1) / (Math.abs(zeta) + Math.sqrt(1 + zeta * zeta));
        const cs = 1 / Math.sqrt(1 + t * t), sn = cs * t;
        for (let i = 0; i < r; i++) { const up = U[i][p], uq = U[i][q]; U[i][p] = cs * up - sn * uq; U[i][q] = sn * up + cs * uq; }
        for (let i = 0; i < c; i++) { const vp = V[i][p], vq = V[i][q]; V[i][p] = cs * vp - sn * vq; V[i][q] = sn * vp + cs * vq; }
      }
      if (off < 1e-15) break;
    }
    const sv = []; for (let j = 0; j < c; j++) { let s = 0; for (let i = 0; i < r; i++) s += U[i][j] * U[i][j]; sv.push(Math.sqrt(s)); }
    const order = [...Array(c).keys()].sort((a, b) => sv[b] - sv[a]);
    const S = order.map((j) => sv[j]);
    const Vc = order.map((j) => m.col(V, j));
    const tol = 1e-12 * Math.max(1, S[0] || 1);
    const Uc = order.map((j, k) => (S[k] > tol ? m.vscale(m.col(U, j), 1 / S[k]) : null));
    const known = Uc.filter((x) => x); const full = m.completeBasis(known, r); let fi = known.length;
    const Ucols = Uc.map((u) => u || full[fi++]); while (Ucols.length < r) Ucols.push(full[fi++]);
    let Um = m.fromCols(Ucols), Vm = m.fromCols(Vc);
    if (transposed) { const tmp = Um; Um = Vm; Vm = tmp; }
    const mm = m.rows(Um), nn = m.rows(Vm);
    if (m.det(Vm) < 0) { const j = nn - 1; for (let i = 0; i < nn; i++) Vm[i][j] = -Vm[i][j]; if (j < mm) for (let i = 0; i < mm; i++) Um[i][j] = -Um[i][j]; }
    return { U: Um, S, V: Vm };
  };
  m.pinv = function (A) {
    const { U, S, V } = m.svd(A); const r = m.rows(A), c = m.cols(A); const P = m.zeros(c, r);
    const tol = 1e-9 * Math.max(1, S[0] || 1);
    S.forEach((s, k) => { if (s > tol) for (let i = 0; i < c; i++) for (let j = 0; j < r; j++) P[i][j] += (V[i][k] * U[j][k]) / s; });
    return P;
  };
  m.cond = (A) => { const S = m.svd(A).S; const s = S[S.length - 1]; return s < 1e-12 ? Infinity : S[0] / s; };


  // ---------- Gram–Schmidt / QR ----------
  // Each step records the projections subtracted, the residual, its length and the resulting unit vector (null if dependent).
  m.gramSchmidtSteps = function (vs, tol = 1e-9) {
    const steps = []; const qs = [];
    vs.forEach((a, k) => {
      const projs = qs.map((e) => ({ q: e.q, k: e.k, coef: m.vdot(e.q, a) }));
      let r = a.slice(); for (const p of projs) r = m.vsub(r, m.vscale(p.q, p.coef));
      const n = m.vnorm(r); const q = n > tol * Math.max(1, m.vnorm(a)) ? m.vscale(r, 1 / n) : null;
      steps.push({ a, projs, residual: r, norm: n, q, dependent: !q });
      if (q) qs.push({ q, k });
    });
    return steps;
  };
  // Thin QR by Gram–Schmidt on the columns: A (m×n) = Q (m×n) R (n×n), R upper triangular. ok = false if columns are dependent.
  m.qr = function (A, tol = 1e-9) {
    const n = m.cols(A), r = m.rows(A); const cols = [...Array(n).keys()].map((j) => m.col(A, j));
    const steps = m.gramSchmidtSteps(cols, tol); const Qc = []; const R = m.zeros(n, n); let ok = true; const holes = [];
    steps.forEach((s, k) => { s.projs.forEach((p) => (R[p.k][k] = p.coef)); R[k][k] = s.q ? s.norm : 0; if (s.q) Qc.push(s.q); else { ok = false; holes.push(k); Qc.push(null); } });
    if (holes.length) { const full = m.completeBasis(Qc.filter((q) => q), r); let fi = Qc.filter((q) => q).length; for (const k of holes) Qc[k] = full[fi++] || m.vzeros(r); }
    return { Q: m.fromCols(Qc), R, ok, steps };
  };
  // Wilkinson shift: eigenvalue of the trailing 2×2 block closest to the last diagonal entry
  m.wilkinsonShift = function (B) {
    const n = m.rows(B); if (n < 2) return B[0][0];
    const a = B[n - 2][n - 2], b = B[n - 2][n - 1], c = B[n - 1][n - 2], d = B[n - 1][n - 1];
    const tr = a + d, det = a * d - b * c, disc = (tr * tr) / 4 - det; if (disc < 0) return d;
    const r1 = tr / 2 + Math.sqrt(disc), r2 = tr / 2 - Math.sqrt(disc); return Math.abs(r1 - d) <= Math.abs(r2 - d) ? r1 : r2;
  };
  // ---------- least squares ----------
  m.lstsq = function (A, b) {
    const At = m.transpose(A); const AtA = m.mul(At, A); const Atb = m.apply(At, b); const inv = m.inverse(AtA);
    const x = inv ? m.apply(inv, Atb) : m.apply(m.pinv(A), b);
    const p = m.apply(A, x); const r = m.vsub(b, p);
    const P = inv ? m.mul(m.mul(A, inv), At) : m.mul(A, m.pinv(A));
    return { x, p, r, AtA, Atb, P, ok: !!inv, sse: m.vdot(r, r) };
  };
  // ---------- matrix exponential (scaling and squaring + Taylor) ----------
  m.expm = function (A) {
    const n = m.rows(A); const norm = Math.max(...A.map((row) => row.reduce((s, x) => s + Math.abs(x), 0)));
    const s = norm > 0.5 ? Math.ceil(Math.log2(norm / 0.5)) : 0; const B = m.scale(A, 1 / Math.pow(2, s));
    let term = m.identity(n), sum = m.identity(n);
    for (let k = 1; k <= 24; k++) { term = m.scale(m.mul(term, B), 1 / k); sum = m.add(sum, term); if (m.maxAbs(term) < 1e-17) break; }
    for (let i = 0; i < s; i++) sum = m.mul(sum, sum);
    return sum;
  };
  // Classify the equilibrium of x' = Ax for 2×2 A
  m.classify2 = function (A) {
    const tr = m.trace(A), det = m.det(A), disc = tr * tr - 4 * det; const e = 1e-9;
    if (Math.abs(det) < e) return Math.abs(tr) < e ? 'degenerate (A² = 0 or A = 0): a line or plane of equilibria' : 'degenerate: a whole line of equilibria (one eigenvalue is 0)';
    if (disc < -e) return Math.abs(tr) < e ? 'center: closed orbits (purely imaginary eigenvalues)' : tr < 0 ? 'stable spiral: trajectories spiral in' : 'unstable spiral: trajectories spiral out';
    if (det < 0) return 'saddle: one direction attracts, one repels';
    if (disc < e) return tr < 0 ? 'stable (improper) node: repeated eigenvalue' : 'unstable (improper) node: repeated eigenvalue';
    return tr < 0 ? 'stable node: all trajectories decay to 0' : 'unstable node: all trajectories grow';
  };
  // ---------- geometry helpers ----------
  m.unitCircle = (k = 64) => Array.from({ length: k }, (_, i) => [Math.cos((2 * Math.PI * i) / k), Math.sin((2 * Math.PI * i) / k)]);
  m.squarePts = () => [[0, 0], [1, 0], [1, 1], [0, 1]];
  m.cubeVerts = (lo = 0, hi = 1) => [0, 1, 2, 3, 4, 5, 6, 7].map((b) => [b & 1 ? hi : lo, b & 2 ? hi : lo, b & 4 ? hi : lo]);
  m.cubeFaces = () => [[0, 1, 3, 2], [4, 5, 7, 6], [0, 1, 5, 4], [2, 3, 7, 6], [0, 2, 6, 4], [1, 3, 7, 5]];
  m.cubeEdges = () => { const E = []; for (let a = 0; a < 8; a++) for (let b = a + 1; b < 8; b++) { const d = a ^ b; if (d && !(d & (d - 1))) E.push([a, b]); } return E; };
  m.hypercube = function (n) {
    const N = 1 << n; const verts = []; for (let b = 0; b < N; b++) verts.push(Array.from({ length: n }, (_, i) => ((b >> i) & 1 ? 1 : -1)));
    const edges = []; for (let a = 0; a < N; a++) for (let i = 0; i < n; i++) { const b = a ^ (1 << i); if (b > a) edges.push([a, b]); }
    return { verts, edges };
  };
})();
