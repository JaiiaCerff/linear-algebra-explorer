/* Linear Algebra Explorer — 2D canvas scene (grids, vectors, shapes, draggable handles) */
(function () {
  'use strict';
  const LA = window.LA; const m = LA.m;
  const T = (LA.theme = {
    bg: '#0b0e14', grid: 'rgba(88,196,221,0.55)', gridAxis: 'rgba(120,214,235,0.95)',
    base: 'rgba(255,255,255,0.07)', baseAxis: 'rgba(255,255,255,0.25)',
    i: '#83c167', j: '#fc6255', k: '#58c4dd', vec: '#f5d547', vec2: '#f08fc0', vec3: '#9be2ff',
    text: '#e6e9ef', muted: '#8b94a7', accent: '#58c4dd', pos: 'rgba(88,196,221,0.28)', neg: 'rgba(255,138,91,0.32)',
    nul: '#d678ff', colsp: '#4ecdc4', rowsp: '#ffd166', eig: ['#ff9f43', '#c39bd3', '#4ecdc4', '#f6f49d'],
    white: '#ffffff', warn: '#ff8a5b', good: '#83c167', halo: 'rgba(11,14,20,0.85)',
    fontUI: '13px ui-sans-serif, system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif',
    fontMath: 'italic 15px "STIX Two Math", "Latin Modern Math", "Cambria Math", Georgia, "Times New Roman", serif',
  });
  LA.rgba = (hex, a) => { const h = hex.replace('#', ''); const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
  LA.basisColor = (i) => [T.i, T.j, T.k, T.vec2, T.rowsp, T.vec3, T.nul, T.eig[0]][i % 8];
  LA.basisName = (i, n) => (n <= 3 ? ['î', 'ĵ', 'k̂'][i] : 'e' + '₀₁₂₃₄₅₆₇₈₉'[i + 1]);

  class Scene2D {
    constructor(canvas, opts = {}) {
      this.canvas = canvas; this.ctx = canvas.getContext('2d');
      this.baseScale = opts.scale || 60; this.scale = this.baseScale;
      this.originFrac = opts.origin || [0.5, 0.5]; this.pan = [0, 0];
      this.oneD = !!opts.oneD; this.interactive = opts.interactive !== false;
      this.handles = []; this.onDraw = opts.onDraw || null; this.onView = opts.onView || null;
      this.width = 0; this.height = 0; this.dpr = 1; this._raf = 0; this._hover = null; this._drag = null;
      canvas.style.touchAction = 'none';
      this._bind();
      this._ro = new ResizeObserver(() => this._resize());
      this._ro.observe(canvas.parentElement || canvas);
      this._resize();
    }
    destroy() { this._ro.disconnect(); cancelAnimationFrame(this._raf); this.onDraw = null; this.handles = []; }
    _resize() {
      const el = this.canvas.parentElement || this.canvas; const w = el.clientWidth, h = el.clientHeight;
      if (!w || !h) return;
      this.dpr = window.devicePixelRatio || 1; this.width = w; this.height = h;
      this.canvas.width = Math.round(w * this.dpr); this.canvas.height = Math.round(h * this.dpr);
      this.requestDraw();
    }
    get center() { return [this.width * this.originFrac[0] + this.pan[0], this.height * this.originFrac[1] + this.pan[1]]; }
    toScreen(p) { const c = this.center; return [c[0] + p[0] * this.scale, c[1] - (p[1] || 0) * this.scale]; }
    toWorld(s) { const c = this.center; return [(s[0] - c[0]) / this.scale, (c[1] - s[1]) / this.scale]; }
    bounds() { const a = this.toWorld([0, this.height]), b = this.toWorld([this.width, 0]); return { xmin: a[0], ymin: a[1], xmax: b[0], ymax: b[1] }; }
    viewRadius() { const b = this.bounds(); return Math.max(Math.abs(b.xmin), Math.abs(b.xmax), Math.abs(b.ymin), Math.abs(b.ymax)); }
    resetView() { this.pan = [0, 0]; this.scale = this.baseScale; this.requestDraw(); }
    requestDraw() { if (this._raf) return; this._raf = requestAnimationFrame(() => { this._raf = 0; this.draw(); }); }
    draw() {
      const ctx = this.ctx; if (!this.width) return;
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      ctx.fillStyle = T.bg; ctx.fillRect(0, 0, this.width, this.height);
      if (this.onDraw) this.onDraw(this);
      for (const h of this.handles) {
        if (h.hidden && h.hidden()) continue;
        const s = this.toScreen(h.get()); const active = h === this._hover || (this._drag && this._drag.handle === h);
        ctx.beginPath(); ctx.arc(s[0], s[1], (h.r || 7) + (active ? 3 : 0), 0, Math.PI * 2);
        ctx.fillStyle = active ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.14)'; ctx.fill();
        ctx.lineWidth = 1.5; ctx.strokeStyle = h.color || T.white; ctx.stroke();
      }
    }
    _pos(e) { const r = this.canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
    _hitHandle(s) {
      let best = null, bd = 1e9;
      for (const h of this.handles) { if (h.hidden && h.hidden()) continue; const p = this.toScreen(h.get()); const d = Math.hypot(p[0] - s[0], p[1] - s[1]); if (d < (h.r || 7) + 8 && d < bd) { bd = d; best = h; } }
      return best;
    }
    _bind() {
      const c = this.canvas;
      c.addEventListener('pointerdown', (e) => {
        const s = this._pos(e); const h = this._hitHandle(s);
        if (h) { this._drag = { handle: h }; h.onStart && h.onStart(); c.setPointerCapture(e.pointerId); }
        else if (this.interactive) { this._drag = { pan: true, start: s, pan0: this.pan.slice() }; c.setPointerCapture(e.pointerId); }
        e.preventDefault();
      });
      c.addEventListener('pointermove', (e) => {
        const s = this._pos(e);
        if (this._drag) {
          if (this._drag.handle) {
            let w = this.toWorld(s); if (this.oneD) w[1] = 0;
            if (e.shiftKey) w = w.map((x) => Math.round(x * 2) / 2);
            this._drag.handle.set(w, e); this.requestDraw();
          } else if (this._drag.pan) {
            this.pan = [this._drag.pan0[0] + s[0] - this._drag.start[0], this.oneD ? this._drag.pan0[1] : this._drag.pan0[1] + s[1] - this._drag.start[1]];
            this.requestDraw(); this.onView && this.onView();
          }
        } else {
          const h = this._hitHandle(s); c.style.cursor = h ? 'grab' : 'default';
          if (h !== this._hover) { this._hover = h; this.requestDraw(); }
        }
      });
      const up = () => { if (this._drag && this._drag.handle && this._drag.handle.onEnd) this._drag.handle.onEnd(); this._drag = null; };
      c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
      c.addEventListener('pointerleave', () => { if (this._hover) { this._hover = null; this.requestDraw(); } });
      c.addEventListener('wheel', (e) => {
        if (!this.interactive) return; e.preventDefault();
        const s = this._pos(e); const w = this.toWorld(s); const f = Math.exp(-e.deltaY * 0.0015);
        this.scale = m.clamp(this.scale * f, 6, 800);
        const cx0 = this.width * this.originFrac[0], cy0 = this.height * this.originFrac[1];
        this.pan = [s[0] - w[0] * this.scale - cx0, this.oneD ? this.pan[1] : s[1] + w[1] * this.scale - cy0];
        this.requestDraw(); this.onView && this.onView();
      }, { passive: false });
      c.addEventListener('dblclick', () => this.resetView());
    }
    addHandle(h) { this.handles.push(h); return h; }
    clearHandles() { this.handles = []; }

    // ---------- drawing primitives (world coordinates) ----------
    baseGrid(o = {}) {
      const ctx = this.ctx; const b = this.bounds(); const step = o.step || this._niceStep();
      const color = o.color || T.base, axis = o.axisColor || T.baseAxis;
      ctx.lineWidth = 1;
      if (!this.oneD) {
        ctx.strokeStyle = color; ctx.beginPath();
        for (let x = Math.ceil(b.xmin / step) * step; x <= b.xmax; x += step) { if (Math.abs(x) < 1e-9) continue; const s = this.toScreen([x, 0]); ctx.moveTo(s[0], 0); ctx.lineTo(s[0], this.height); }
        for (let y = Math.ceil(b.ymin / step) * step; y <= b.ymax; y += step) { if (Math.abs(y) < 1e-9) continue; const s = this.toScreen([0, y]); ctx.moveTo(0, s[1]); ctx.lineTo(this.width, s[1]); }
        ctx.stroke();
      }
      ctx.strokeStyle = axis; ctx.lineWidth = this.oneD ? 1.5 : 1; ctx.beginPath();
      const o0 = this.toScreen([0, 0]); ctx.moveTo(0, o0[1]); ctx.lineTo(this.width, o0[1]);
      if (!this.oneD) { ctx.moveTo(o0[0], 0); ctx.lineTo(o0[0], this.height); }
      ctx.stroke();
      if (o.labels !== false) {
        ctx.font = '11px ui-sans-serif, system-ui, sans-serif'; ctx.fillStyle = T.muted; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        const lstep = step * (this.scale * step < 28 ? 2 : 1);
        for (let x = Math.ceil(b.xmin / lstep) * lstep; x <= b.xmax; x += lstep) { if (Math.abs(x) < 1e-9) continue; const s = this.toScreen([x, 0]); if (this.oneD) { ctx.beginPath(); ctx.moveTo(s[0], s[1] - 5); ctx.lineTo(s[0], s[1] + 5); ctx.strokeStyle = axis; ctx.stroke(); } ctx.fillText(m.fmt(x), s[0], m.clamp(s[1] + 4, 2, this.height - 14)); }
        if (!this.oneD) { ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; for (let y = Math.ceil(b.ymin / lstep) * lstep; y <= b.ymax; y += lstep) { if (Math.abs(y) < 1e-9) continue; const s = this.toScreen([0, y]); ctx.fillText(m.fmt(y), m.clamp(s[0] - 4, 20, this.width - 2), s[1]); } }
      }
    }
    _niceStep() { const px = this.scale; if (px > 160) return 0.25; if (px > 80) return 0.5; if (px > 22) return 1; if (px > 10) return 2; return 5; }
    // Grid of the plane transformed by 2×2 matrix M
    grid(M, o = {}) {
      const ctx = this.ctx; const N = o.range || Math.min(80, Math.ceil(this.viewRadius() * 1.2) + 6); const step = o.step || 1;
      const color = o.color || T.grid, axis = o.axisColor || T.gridAxis; const w = o.width || 1;
      ctx.globalAlpha = o.alpha === undefined ? 1 : o.alpha;
      ctx.lineWidth = w; ctx.strokeStyle = color; ctx.beginPath();
      for (let i = -N; i <= N; i += step) { if (i === 0 && o.axes !== false) continue; const a = this.toScreen(m.apply(M, [i, -N])), b = this.toScreen(m.apply(M, [i, N])); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); const c = this.toScreen(m.apply(M, [-N, i])), d = this.toScreen(m.apply(M, [N, i])); ctx.moveTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); }
      ctx.stroke();
      if (o.axes !== false) { ctx.lineWidth = w + 1; ctx.strokeStyle = axis; ctx.beginPath(); const a = this.toScreen(m.apply(M, [0, -N])), b = this.toScreen(m.apply(M, [0, N])); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); const c = this.toScreen(m.apply(M, [-N, 0])), d = this.toScreen(m.apply(M, [N, 0])); ctx.moveTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.stroke(); }
      ctx.globalAlpha = 1;
    }
    line(a, b, o = {}) {
      const ctx = this.ctx; const A = this.toScreen(a), B = this.toScreen(b);
      ctx.save(); ctx.globalAlpha = o.alpha === undefined ? 1 : o.alpha; ctx.lineWidth = o.width || 1.5; ctx.strokeStyle = o.color || T.text;
      if (o.dash) ctx.setLineDash(o.dash); ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke(); ctx.restore();
    }
    infiniteLine(p, dir, o = {}) { const L = this.viewRadius() * 3 + Math.hypot(p[0], p[1]); const d = m.vnormalize(dir); if (m.vnorm(d) === 0) return; this.line(m.vadd(p, m.vscale(d, -L)), m.vadd(p, m.vscale(d, L)), o); }
    polyline(pts, o = {}) {
      const ctx = this.ctx; if (pts.length < 2) return; ctx.save(); ctx.globalAlpha = o.alpha === undefined ? 1 : o.alpha; ctx.lineWidth = o.width || 1.5; ctx.strokeStyle = o.color || T.text; if (o.dash) ctx.setLineDash(o.dash);
      ctx.beginPath(); pts.forEach((p, i) => { const s = this.toScreen(p); i ? ctx.lineTo(s[0], s[1]) : ctx.moveTo(s[0], s[1]); }); if (o.close) ctx.closePath(); ctx.stroke(); ctx.restore();
    }
    polygon(pts, o = {}) {
      const ctx = this.ctx; if (pts.length < 2) return; ctx.save(); ctx.beginPath(); pts.forEach((p, i) => { const s = this.toScreen(p); i ? ctx.lineTo(s[0], s[1]) : ctx.moveTo(s[0], s[1]); }); ctx.closePath();
      if (o.fill) { ctx.globalAlpha = o.alpha === undefined ? 1 : o.alpha; ctx.fillStyle = o.fill; ctx.fill(); }
      if (o.stroke) { ctx.globalAlpha = o.strokeAlpha === undefined ? 1 : o.strokeAlpha; ctx.lineWidth = o.width || 1.5; ctx.strokeStyle = o.stroke; if (o.dash) ctx.setLineDash(o.dash); ctx.stroke(); }
      ctx.restore();
    }
    ellipse(M, o = {}) { this.polygon(m.unitCircle(o.samples || 72).map((p) => m.apply(M, p)), o); }
    circle(c, r, o = {}) { const s = this.toScreen(c); const ctx = this.ctx; ctx.save(); ctx.beginPath(); ctx.arc(s[0], s[1], r * this.scale, 0, Math.PI * 2); if (o.fill) { ctx.globalAlpha = o.alpha === undefined ? 1 : o.alpha; ctx.fillStyle = o.fill; ctx.fill(); } if (o.stroke) { ctx.globalAlpha = 1; ctx.lineWidth = o.width || 1.5; ctx.strokeStyle = o.stroke; if (o.dash) ctx.setLineDash(o.dash); ctx.stroke(); } ctx.restore(); }
    point(p, o = {}) { const s = this.toScreen(p); const ctx = this.ctx; ctx.save(); ctx.globalAlpha = o.alpha === undefined ? 1 : o.alpha; ctx.beginPath(); ctx.arc(s[0], s[1], o.r || 4, 0, Math.PI * 2); ctx.fillStyle = o.color || T.text; ctx.fill(); ctx.restore(); if (o.label) this.text(p, o.label, { color: o.color, dx: 8, dy: -8, math: o.math !== false }); }
    arc(c, r, a0, a1, o = {}) { const s = this.toScreen(c); const ctx = this.ctx; ctx.save(); ctx.beginPath(); ctx.arc(s[0], s[1], r * this.scale, -a1, -a0); ctx.lineWidth = o.width || 1.5; ctx.strokeStyle = o.color || T.text; ctx.stroke(); ctx.restore(); }
    vector(v, o = {}) {
      const ctx = this.ctx; const from = o.from || [0, 0]; const A = this.toScreen(from), B = this.toScreen(v);
      const dx = B[0] - A[0], dy = B[1] - A[1]; const len = Math.hypot(dx, dy);
      const color = o.color || T.vec; const w = o.width || 2.5;
      ctx.save(); ctx.globalAlpha = o.alpha === undefined ? 1 : o.alpha; ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round';
      if (o.dash) ctx.setLineDash(o.dash);
      if (len < 0.5) { ctx.beginPath(); ctx.arc(A[0], A[1], 3, 0, Math.PI * 2); ctx.fill(); ctx.restore(); if (o.label) this.text(v, o.label, { color, dx: 8, dy: -8 }); return; }
      const hl = o.head === false ? 0 : Math.min(12 + w, len * 0.5), hw = hl * 0.55; const ux = dx / len, uy = dy / len;
      const ex = B[0] - ux * hl * 0.85, ey = B[1] - uy * hl * 0.85;
      ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(ex, ey); ctx.stroke(); ctx.setLineDash([]);
      if (hl > 0) { ctx.beginPath(); ctx.moveTo(B[0], B[1]); ctx.lineTo(B[0] - ux * hl - uy * hw, B[1] - uy * hl + ux * hw); ctx.lineTo(B[0] - ux * hl + uy * hw, B[1] - uy * hl - ux * hw); ctx.closePath(); ctx.fill(); }
      ctx.restore();
      if (o.label) { const off = o.labelOffset || 12; this.text(v, o.label, { color: o.labelColor || color, dx: ux * off - uy * off * 0.9, dy: uy * off + ux * off * 0.9, align: 'center', baseline: 'middle', math: o.math !== false }); }
    }
    // 1-D arrow along the number line, raised by `level` rows
    vector1D(x, o = {}) { const y = (o.level || 0) * (o.rowHeight || 0.35); this.vector([x, y], { from: [0, y], ...o, label: undefined }); if (o.label) this.text([x, y], o.label, { color: o.color || T.vec, dx: x >= 0 ? 10 : -10, dy: -10, align: x >= 0 ? 'left' : 'right' }); }
    text(p, str, o = {}) {
      const s = this.toScreen(p); this.textScreen(s[0] + (o.dx || 0), s[1] + (o.dy || 0), str, o);
    }
    textScreen(x, y, str, o = {}) {
      const ctx = this.ctx; ctx.save(); ctx.font = o.font || (o.math ? T.fontMath : T.fontUI); ctx.textAlign = o.align || 'left'; ctx.textBaseline = o.baseline || 'alphabetic';
      if (o.bg) { const w = ctx.measureText(str).width; ctx.fillStyle = o.bg; const ax = o.align === 'center' ? x - w / 2 - 4 : o.align === 'right' ? x - w - 4 : x - 4; ctx.fillRect(ax, y - 12, w + 8, 18); }
      ctx.lineWidth = 3; ctx.strokeStyle = T.halo; ctx.lineJoin = 'round'; ctx.strokeText(str, x, y);
      ctx.fillStyle = o.color || T.text; ctx.fillText(str, x, y); ctx.restore();
    }
    // Shade a parallelogram spanned by columns of M from origin (unit square image)
    unitSquare(M, o = {}) { const pts = m.squarePts().map((p) => m.apply(M, p)); this.polygon(pts, { fill: o.fill || (m.det(M) >= 0 ? T.pos : T.neg), stroke: o.stroke || 'rgba(255,255,255,0.5)', width: 1, alpha: o.alpha === undefined ? 1 : o.alpha }); }
    // Draw standard basis images with labels
    basis(M, o = {}) {
      const n = m.cols(M); const names = o.names || (n <= 3 ? ['î', 'ĵ', 'k̂'] : null);
      for (let j = 0; j < n; j++) { const v = m.col(M, j); if (v.length < 2) v.push(0); this.vector(v, { color: LA.basisColor(j), width: o.width || 3, label: o.labels === false ? null : (names ? names[j] : LA.basisName(j, n)), alpha: o.alpha }); }
    }
    // Faint copy of a shape (an "F" glyph) useful for seeing orientation
    shapeF(M, o = {}) {
      const F = [[0.2, 0.2], [0.2, 1.8], [1.4, 1.8], [1.4, 1.5], [0.6, 1.5], [0.6, 1.15], [1.2, 1.15], [1.2, 0.85], [0.6, 0.85], [0.6, 0.2]];
      this.polygon(F.map((p) => m.apply(M, p)), { fill: o.fill || 'rgba(245,213,71,0.28)', stroke: o.stroke || 'rgba(245,213,71,0.9)', width: 1.5, alpha: o.alpha === undefined ? 1 : o.alpha });
    }
    subspaceLine(dir, o = {}) { this.infiniteLine([0, 0], dir, { color: o.color || T.nul, width: o.width || 2, alpha: o.alpha === undefined ? 0.9 : o.alpha, dash: o.dash }); }
    shadeAll(color, alpha = 0.08) { const ctx = this.ctx; ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.fillRect(0, 0, this.width, this.height); ctx.restore(); }
    caption(str, o = {}) { this.textScreen(o.x === undefined ? 10 : o.x, o.y === undefined ? 18 : o.y, str, { color: o.color || T.muted, font: o.font || '12px ui-sans-serif, system-ui, sans-serif', align: o.align }); }
  }
  LA.Scene2D = Scene2D;

  // ---------- tweening ----------
  const ease = { linear: (t) => t, inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2), out: (t) => 1 - Math.pow(1 - t, 3) };
  LA.anim = {
    ease,
    tween({ duration = 1500, ease: e = 'inOut', onUpdate, onDone }) {
      const E = typeof e === 'function' ? e : ease[e] || ease.inOut; let start = null, raf = 0, cancelled = false;
      const frame = (ts) => { if (cancelled) return; if (start === null) start = ts; const u = Math.min(1, (ts - start) / duration); onUpdate(E(u), u); if (u < 1) raf = requestAnimationFrame(frame); else onDone && onDone(); };
      raf = requestAnimationFrame(frame);
      return { cancel() { cancelled = true; cancelAnimationFrame(raf); }, get done() { return cancelled || (start !== null && performance.now() - start >= duration); } };
    },
  };
})();
