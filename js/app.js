/* Linear Algebra Explorer — application shell (sidebar, routing, chapter lifecycle) */
(function () {
  'use strict';
  const LA = window.LA; const ui = LA.ui; const el = ui.el;
  LA.chapters = LA.chapters || [];
  const GROUPS = ['Foundations', 'Dimension', 'Geometry', 'Spectral', 'Beyond'];
  let current = null, cleanup = [];
  const $ = (id) => document.getElementById(id);

  function ordered() { return LA.chapters.slice().sort((a, b) => a.order - b.order); }
  function makeCtx() {
    const stage = $('stage'), controls = $('controls'), notes = $('notes'), hint = $('hint');
    return {
      stage, controls, notes,
      view(title, opts = {}) {
        const wrap = el('div', { class: 'view' + (opts.cls ? ' ' + opts.cls : ''), style: opts.flex ? { flex: opts.flex } : null });
        const canvas = el('canvas'); const t = el('div', { class: 'view-title', html: title || '' });
        wrap.appendChild(canvas); wrap.appendChild(t); stage.appendChild(wrap);
        return { wrap, canvas, title: t, setTitle: (h) => (t.innerHTML = h), remove: () => wrap.remove() };
      },
      onUnmount(fn) { cleanup.push(fn); },
      track(tw) { cleanup.push(() => tw && tw.cancel && tw.cancel()); return tw; },
      hint(text) { hint.textContent = text || ''; },
      goto(id) { location.hash = '#' + id; },
    };
  }
  function mount(id) {
    const list = ordered(); const ch = list.find((c) => c.id === id) || list[0]; if (!ch) return;
    if (current) { for (const fn of cleanup) { try { fn(); } catch (e) { console.error(e); } } cleanup = []; try { current.unmount && current.unmount(); } catch (e) { console.error(e); } }
    $('stage').innerHTML = ''; $('controls').innerHTML = ''; $('notes').innerHTML = ''; $('hint').textContent = '';
    current = ch; document.title = ch.title + ' · Linear Algebra Explorer';
    $('ch-title').textContent = ch.title; $('ch-summary').textContent = ch.summary || '';
    const idx = list.indexOf(ch); $('ch-num').textContent = `${idx + 1} / ${list.length}`;
    $('prev').disabled = idx === 0; $('next').disabled = idx === list.length - 1;
    $('prev').onclick = () => (location.hash = '#' + list[idx - 1].id); $('next').onclick = () => (location.hash = '#' + list[idx + 1].id);
    document.querySelectorAll('.nav-item').forEach((a) => a.classList.toggle('active', a.dataset.id === ch.id));
    try { ch.mount(makeCtx()); } catch (e) { console.error(e); $('notes').appendChild(ui.prose(`<p class="err">This chapter failed to load: ${e.message}</p>`)); }
    $('panel').scrollTop = 0; document.body.classList.remove('nav-open');
  }
  function buildSidebar() {
    const nav = $('nav'); nav.innerHTML = ''; const list = ordered();
    for (const g of GROUPS) {
      const items = list.filter((c) => c.group === g); if (!items.length) continue;
      const sec = el('div', { class: 'nav-group' }, el('h4', { text: g }));
      for (const c of items) sec.appendChild(el('a', { class: 'nav-item', href: '#' + c.id, 'data-id': c.id }, el('span', { class: 'nav-num', text: String(list.indexOf(c) + 1).padStart(2, '0') }), el('span', { class: 'nav-title', text: c.title })));
      nav.appendChild(sec);
    }
  }
  LA.start = function () {
    buildSidebar(); mount(location.hash.slice(1));
    window.addEventListener('hashchange', () => mount(location.hash.slice(1)));
    $('menu').addEventListener('click', () => document.body.classList.toggle('nav-open'));
    document.addEventListener('keydown', (e) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      if (e.key === ']' && !$('next').disabled) $('next').click(); if (e.key === '[' && !$('prev').disabled) $('prev').click();
    });
  };
  document.addEventListener('DOMContentLoaded', LA.start);
})();
