/* Linear Algebra Explorer — 3D scene drawn on a 2D canvas (orbit camera, painter's algorithm) */
(function () {
  'use strict';
  const LA = window.LA; const m = LA.m; const T = LA.theme;

  class Scene3D {
    constructor(canvas, opts = {}) {
      this.canvas = canvas; this.ctx = canvas.getContext('2d');
      this.def = { yaw: opts.yaw === undefined ? -1.2 : opts.yaw, pitch: opts.pitch === undefined ? 0.5 : opts.pitch, dist: opts.dist || 9 };
      this.yaw = this.def.yaw; this.pitch = this.def.pitch; this.dist = this.def.dist; this.pan = [0, 0];
      this.fov = ((opts.fov || 38) * Math.PI) / 180; this.near = 0.15; this.target = [0, 0, 0];
      this.items = []; this.texts = []; this.onDraw = opts.onDraw || null; this.autoRotate = false;
      this.width = 0; this.height = 0; this.dpr = 1; this._raf = 0; this._drag = null; this._lastTs = 0;
      canvas.style.touchAction = 'none'; canvas.style.cursor = 'grab';
      this._bind();
      this._ro = new ResizeObserver(() => this._resize()); this._ro.observe(canvas.parentElement || canvas); this._resize();
    }
    destroy() { this._ro.disconnect(); cancelAnimationFrame(this._raf); this.onDraw = null; this.autoRotate = false; }
    _resize() { const el = this.canvas.parentElement || this.canvas; const w = el.clientWidth, h = el.clientHeight; if (!w || !h) return; this.dpr = window.devicePixelRatio || 1; this.width = w; this.height = h; this.canvas.width = Math.round(w * this.dpr); this.canvas.height = Math.round(h * this.dpr); this.requestDraw(); }
    resetView() { this.yaw = this.def.yaw; this.pitch = this.def.pitch; this.dist = this.def.dist; this.pan = [0, 0]; this.requestDraw(); }
    requestDraw() { if (this._raf) return; this._raf = requestAnimationFrame((ts) => { this._raf = 0; this.draw(ts); }); }
    _pos(e) { const r = this.canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
    _bind() {
      const c = this.canvas;
      c.addEventListener('pointerdown', (e) => { this._drag = { start: this._pos(e), yaw: this.yaw, pitch: this.pitch, pan: this.pan.slice(), shift: e.shiftKey || e.button === 2 }; c.setPointerCapture(e.pointerId); c.style.cursor = 'grabbing'; e.preventDefault(); });
      c.addEventListener('pointermove', (e) => {
        if (!this._drag) return; const s = this._pos(e); const dx = s[0] - this._drag.start[0], dy = s[1] - this._drag.start[1];
        if (this._drag.shift) { this.pan = [this._drag.pan[0] + dx, this._drag.pan[1] + dy]; }
        else { this.yaw = this._drag.yaw - dx * 0.008; this.pitch = m.clamp(this._drag.pitch + dy * 0.008, -1.5, 1.5); }
        this.requestDraw();
      });
      const up = () => { this._drag = null; c.style.cursor = 'grab'; };
      c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
      c.addEventListener('wheel', (e) => { e.preventDefault(); this.dist = m.clamp(this.dist * Math.exp(e.deltaY * 0.0012), 2.5, 60); this.requestDraw(); }, { passive: false });
      c.addEventListener('dblclick', () => this.resetView());
      c.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    _camera() {
      const cp = Math.cos(this.pitch), sp = Math.sin(this.pitch), cy = Math.cos(this.yaw), sy = Math.sin(this.yaw);
      const dir = [cp * cy, cp * sy, sp]; this.eye = m.vadd(this.target, m.vscale(dir, this.dist));
      this.f = m.vnormalize(m.vsub(this.target, this.eye));
      let r = m.vcross(this.f, [0, 0, 1]); if (m.vnorm(r) < 1e-6) r = [1, 0, 0]; this.r = m.vnormalize(r); this.u = m.vcross(this.r, this.f);
      this.focal = (Math.min(this.height, this.width * 0.9) / 2) / Math.tan(this.fov / 2);
      this.cx = this.width / 2 + this.pan[0]; this.cy = this.height / 2 + this.pan[1];
    }
    cam(p) { const d = m.vsub(p.length === 3 ? p : m.vpad(p, 3), this.eye); return [m.vdot(d, this.r), m.vdot(d, this.u), m.vdot(d, this.f)]; }
    proj(c) { return [this.cx + (this.focal * c[0]) / c[2], this.cy - (this.focal * c[1]) / c[2]]; }
    project(p) { if (!this.eye) this._camera(); const c = this.cam(p); if (c[2] <= this.near) return null; const s = this.proj(c); return { x: s[0], y: s[1], z: c[2] }; }
    fog(z) { return m.clamp(1.35 - 0.5 * (z / this.dist), 0.25, 1); }

    // ---------- primitives (world coords, 3-vectors; 2-vectors are padded) ----------
    line(a, b, o = {}) { this.items.push({ t: 'line', pts: [a, b], o }); }
    polyline(pts, o = {}) { for (let i = 0; i + 1 < pts.length; i++) this.line(pts[i], pts[i + 1], o); if (o.close && pts.length > 2) this.line(pts[pts.length - 1], pts[0], o); }
    vector(v, o = {}) { this.items.push({ t: 'vec', pts: [o.from || [0, 0, 0], v], o }); }
    point(p, o = {}) { this.items.push({ t: 'point', pts: [p], o }); if (o.label) this.text(p, o.label, { color: o.color, dx: 8, dy: -8 }); }
    polygon(pts, o = {}) { this.items.push({ t: 'poly', pts, o }); }
    text(p, str, o = {}) { this.texts.push({ p, str, o }); }

    // ---------- composites ----------
    axes(o = {}) { const L = o.length || 5; const col = o.color || 'rgba(255,255,255,0.25)'; this.line([-L, 0, 0], [L, 0, 0], { color: col, width: 1 }); this.line([0, -L, 0], [0, L, 0], { color: col, width: 1 }); this.line([0, 0, -L], [0, 0, L], { color: col, width: 1 }); if (o.labels !== false) { this.text([L, 0, 0], 'x', { color: T.muted }); this.text([0, L, 0], 'y', { color: T.muted }); this.text([0, 0, L], 'z', { color: T.muted }); } }
    // grid of a coordinate plane transformed by 3×3 (or 3×2 for the xy plane) matrix M
    grid(M, o = {}) {
      const N = o.range || 4, step = o.step || 1; const plane = o.plane || 'xy'; const col = o.color || T.grid, axis = o.axisColor || T.gridAxis; const w = o.width || 1; const alpha = o.alpha === undefined ? 0.8 : o.alpha;
      const mk = (a, b) => (plane === 'xy' ? [a, b, 0] : plane === 'xz' ? [a, 0, b] : [0, a, b]);
      const ap = (p) => m.apply(M, p.slice(0, m.cols(M)));
      for (let i = -N; i <= N + 1e-9; i += step) {
        const isAxis = Math.abs(i) < 1e-9 && o.axes !== false; const oo = { color: isAxis ? axis : col, width: isAxis ? w + 0.8 : w, alpha };
        this.line(ap(mk(i, -N)), ap(mk(i, N)), oo); this.line(ap(mk(-N, i)), ap(mk(N, i)), oo);
      }
    }
    lattice(M, o = {}) {
      const N = o.range || 2, col = o.color || T.grid, alpha = o.alpha === undefined ? 0.45 : o.alpha; const ap = (p) => m.apply(M, p);
      for (let a = -N; a <= N; a++) for (let b = -N; b <= N; b++) { const oo = { color: col, width: o.width || 1, alpha }; this.line(ap([a, b, -N]), ap([a, b, N]), oo); this.line(ap([a, -N, b]), ap([a, N, b]), oo); this.line(ap([-N, a, b]), ap([N, a, b]), oo); }
    }
    basis(M, o = {}) { const n = m.cols(M); for (let j = 0; j < n; j++) { const v = m.vpad(m.col(M, j), 3); this.vector(v, { color: LA.basisColor(j), width: o.width || 3, label: o.labels === false ? null : LA.basisName(j, Math.max(n, 3)), alpha: o.alpha }); } }
    cube(M, o = {}) {
      const V = m.cubeVerts(o.lo === undefined ? 0 : o.lo, o.hi === undefined ? 1 : o.hi).map((p) => m.apply(M, p)); const det = m.isSquare(M) ? m.det(M) : 0;
      const fill = o.fill || (det >= 0 ? T.pos : T.neg); const stroke = o.stroke || 'rgba(255,255,255,0.55)';
      if (o.faces !== false) for (const f of m.cubeFaces()) this.polygon(f.map((i) => V[i]), { fill, alpha: o.alpha === undefined ? 0.55 : o.alpha });
      for (const [a, b] of m.cubeEdges()) this.line(V[a], V[b], { color: stroke, width: o.width || 1.2 });
    }
    // image of the unit sphere: three great circles (+ optional extra rings)
    sphere(M, o = {}) {
      const k = o.samples || 56; const col = o.color || 'rgba(245,213,71,0.9)'; const w = o.width || 1.3; const alpha = o.alpha === undefined ? 0.9 : o.alpha;
      const ring = (f) => this.polyline(Array.from({ length: k }, (_, i) => { const a = (2 * Math.PI * i) / k; return m.apply(M, f(Math.cos(a), Math.sin(a))); }), { color: col, width: w, alpha, close: true });
      ring((c, s) => [c, s, 0]); ring((c, s) => [c, 0, s]); ring((c, s) => [0, c, s]);
      if (o.rings) for (const h of [0.5, -0.5]) { const r = Math.sqrt(1 - h * h); ring((c, s) => [r * c, r * s, h]); ring((c, s) => [r * c, h, r * s]); ring((c, s) => [h, r * c, r * s]); }
    }
    // image of unit circle (in input plane) under 3×2 M, or any closed curve of 3D points
    curve(pts, o = {}) { this.polyline(pts, { close: true, ...o }); }
    // translucent plane patch through origin spanned by u, w (orthonormalised internally)
    planePatch(u, w, o = {}) {
      const B = m.gramSchmidt([u, w]); if (B.length < 2) { if (B.length === 1) this.lineSpan(B[0], o); return; }
      const S = o.size || 4; const [a, b] = B; const P = (s, t) => m.vadd(m.vscale(a, s), m.vscale(b, t));
      this.polygon([P(-S, -S), P(S, -S), P(S, S), P(-S, S)], { fill: o.fill || 'rgba(78,205,196,0.18)', alpha: o.alpha === undefined ? 1 : o.alpha });
      if (o.lines !== false) { const step = o.step || 1; for (let i = -S; i <= S; i += step) { this.line(P(i, -S), P(i, S), { color: o.lineColor || 'rgba(78,205,196,0.45)', width: 1 }); this.line(P(-S, i), P(S, i), { color: o.lineColor || 'rgba(78,205,196,0.45)', width: 1 }); } }
    }
    lineSpan(d, o = {}) { const L = o.size || 6; const u = m.vnormalize(m.vpad(d, 3)); this.line(m.vscale(u, -L), m.vscale(u, L), { color: o.color || T.nul, width: o.width || 2, alpha: o.alpha === undefined ? 0.95 : o.alpha, dash: o.dash }); }
    parallelogram(u, w, o = {}) { const U = m.vpad(u, 3), W = m.vpad(w, 3); this.polygon([[0, 0, 0], U, m.vadd(U, W), W], { fill: o.fill || 'rgba(245,213,71,0.25)', alpha: 1 }); this.polyline([[0, 0, 0], U, m.vadd(U, W), W], { close: true, color: o.stroke || 'rgba(245,213,71,0.8)', width: 1 }); }
    parallelepiped(u, v, w, o = {}) { const M = m.fromCols([u, v, w].map((x) => m.vpad(x, 3))); this.cube(M, o); }
    caption(str, o = {}) { this.texts.push({ screen: [o.x === undefined ? 10 : o.x, o.y === undefined ? 18 : o.y], str, o: { color: o.color || T.muted, font: o.font || '12px ui-sans-serif, system-ui, sans-serif' } }); }

    // ---------- painting ----------
    _clipLine(a, b) { // camera-space near-plane clipping
      const n = this.near; if (a[2] <= n && b[2] <= n) return null; if (a[2] > n && b[2] > n) return [a, b];
      const t = (n - a[2]) / (b[2] - a[2]); const p = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, n + 1e-6]; return a[2] <= n ? [p, b] : [a, p];
    }
    draw(ts) {
      const ctx = this.ctx; if (!this.width) return;
      if (this.autoRotate) { const dt = this._lastTs ? Math.min(50, ts - this._lastTs) : 16; this.yaw -= dt * 0.00025; this.requestDraw(); }
      this._lastTs = ts || performance.now();
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); ctx.fillStyle = T.bg; ctx.fillRect(0, 0, this.width, this.height);
      this._camera(); this.items = []; this.texts = [];
      if (this.onDraw) this.onDraw(this);
      for (const it of this.items) { it.c = it.pts.map((p) => this.cam(p)); it.z = it.c.reduce((s, c) => s + c[2], 0) / it.c.length; }
      this.items.sort((a, b) => b.z - a.z);
      for (const it of this.items) {
        const o = it.o;
        if (it.t === 'line' || it.t === 'vec') {
          const cl = this._clipLine(it.c[0], it.c[1]); if (!cl) continue; const A = this.proj(cl[0]), B = this.proj(cl[1]);
          const alpha = (o.alpha === undefined ? 1 : o.alpha) * this.fog(it.z);
          ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = o.color || T.text; ctx.fillStyle = o.color || T.text; ctx.lineWidth = o.width || 1.5; ctx.lineCap = 'round'; if (o.dash) ctx.setLineDash(o.dash);
          if (it.t === 'line') { ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke(); }
          else {
            const dx = B[0] - A[0], dy = B[1] - A[1], len = Math.hypot(dx, dy);
            if (len < 1) { ctx.beginPath(); ctx.arc(B[0], B[1], 3, 0, Math.PI * 2); ctx.fill(); }
            else {
              const hl = Math.min(m.clamp((0.16 * this.focal) / cl[1][2], 6, 22), len * 0.5), hw = hl * 0.5; const ux = dx / len, uy = dy / len;
              ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0] - ux * hl * 0.8, B[1] - uy * hl * 0.8); ctx.stroke(); ctx.setLineDash([]);
              ctx.beginPath(); ctx.moveTo(B[0], B[1]); ctx.lineTo(B[0] - ux * hl - uy * hw, B[1] - uy * hl + ux * hw); ctx.lineTo(B[0] - ux * hl + uy * hw, B[1] - uy * hl - ux * hw); ctx.closePath(); ctx.fill();
              if (o.label) this.texts.push({ screen: [B[0] + ux * 12 - uy * 10, B[1] + uy * 12 + ux * 10], str: o.label, o: { color: o.labelColor || o.color, align: 'center', baseline: 'middle', math: true } });
            }
          }
          ctx.restore();
        } else if (it.t === 'poly') {
          if (it.c.some((c) => c[2] <= this.near)) continue; const P = it.c.map((c) => this.proj(c));
          ctx.save(); ctx.beginPath(); P.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath();
          if (o.fill) { ctx.globalAlpha = (o.alpha === undefined ? 1 : o.alpha) * (0.6 + 0.4 * this.fog(it.z)); ctx.fillStyle = o.fill; ctx.fill(); }
          if (o.stroke) { ctx.globalAlpha = o.strokeAlpha === undefined ? 1 : o.strokeAlpha; ctx.strokeStyle = o.stroke; ctx.lineWidth = o.width || 1; ctx.stroke(); }
          ctx.restore();
        } else if (it.t === 'point') {
          const c = it.c[0]; if (c[2] <= this.near) continue; const P = this.proj(c);
          ctx.save(); ctx.globalAlpha = (o.alpha === undefined ? 1 : o.alpha) * this.fog(c[2]); ctx.fillStyle = o.color || T.text; ctx.beginPath(); ctx.arc(P[0], P[1], (o.r || 4) * m.clamp(this.dist / c[2], 0.5, 1.6), 0, Math.PI * 2); ctx.fill(); ctx.restore();
        }
      }
      for (const t of this.texts) {
        let x, y; if (t.screen) { [x, y] = t.screen; } else { const p = this.project(t.p); if (!p) continue; x = p.x + (t.o.dx || 0); y = p.y + (t.o.dy || 0); }
        ctx.save(); ctx.font = t.o.font || (t.o.math ? T.fontMath : T.fontUI); ctx.textAlign = t.o.align || 'left'; ctx.textBaseline = t.o.baseline || 'alphabetic';
        ctx.lineWidth = 3; ctx.strokeStyle = T.halo; ctx.lineJoin = 'round'; ctx.strokeText(t.str, x, y); ctx.fillStyle = t.o.color || T.text; ctx.fillText(t.str, x, y); ctx.restore();
      }
    }
  }
  LA.Scene3D = Scene3D;
})();
