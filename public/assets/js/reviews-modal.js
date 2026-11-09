/* Omdömesmodal. Öppnas från element med [data-reviews-open] samt automatiskt kopplade betygskomponenter.
   Listan hämtas från /api/reviews (databasen) och faller tillbaka på den inbäddade listan. */
(function () {
  var dlg = document.getElementById('cv-reviews-modal');
  if (!dlg) return;
  var list = document.getElementById('cv-rmodal-list');
  var loaded = false;
  var lastFocus = null;

  // Alla komponenter som visar betyg eller recensioner blir klickbara.
  var SELECTORS = ['.cv-rating', '.cv-float', '.cv-ctastars', '.cv-proof__list li:first-child', '.cv-stat:nth-child(-n+2)', '.cv-reviews-all'];
  document.querySelectorAll(SELECTORS.join(',')).forEach(function (el) {
    if (dlg.contains(el)) return;
    el.setAttribute('data-reviews-open', '');
    if (el.tagName !== 'BUTTON' && el.tagName !== 'A') {
      el.setAttribute('role', 'button');
      el.tabIndex = 0;
    }
    el.setAttribute('aria-haspopup', 'dialog');
    el.classList.add('cv-reviews-trigger');
  });

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function initials(n) { return String(n).split(/\s+/).map(function (p) { return p.charAt(0); }).slice(0, 2).join('').toUpperCase(); }
  function stars(n) {
    var out = '';
    for (var i = 0; i < 5; i++) out += '<i class="fas fa-star" style="' + (i < n ? '' : 'opacity:.25') + '"></i>';
    return out;
  }
  var PAGE = 20;
  function card(r) {
    return '<figure class="cv-review"><div class="stars" aria-label="' + (r.rating || 5) + ' av 5 stjärnor">' + stars(r.rating || 5) + '</div>' +
      '<blockquote>”' + esc(r.text) + '”</blockquote>' +
      '<figcaption><span class="cv-avatar">' + esc(initials(r.name)) + '</span><span>' + esc(r.name) + '<small><i class="fab fa-google"></i> Google-recension</small></span></figcaption></figure>';
  }
  function render(items) {
    var shown = 0;
    list.innerHTML = '';
    var more = document.createElement('button');
    more.type = 'button';
    more.className = 'cv-btn cv-btn--ghost cv-rmodal__more';
    function next() {
      var chunk = items.slice(shown, shown + PAGE);
      more.insertAdjacentHTML('beforebegin', chunk.map(card).join(''));
      shown += chunk.length;
      if (shown >= items.length) { more.remove(); } else { more.textContent = 'Visa fler (' + (items.length - shown) + ' kvar)'; }
    }
    more.addEventListener('click', next);
    list.appendChild(more);
    next();
  }
  function fallback() {
    try { return JSON.parse(document.getElementById('cv-reviews-fallback').textContent) || []; } catch (e) { return []; }
  }
  function load() {
    if (loaded) return;
    loaded = true;
    list.innerHTML = '<p class="cv-rmodal__loading">Laddar omdömen…</p>';
    fetch('/api/reviews', { headers: { Accept: 'application/json' } })
      .then(function (r) { if (!r.ok) throw new Error('status ' + r.status); return r.json(); })
      .then(function (d) {
        if (d && d.reviews && d.reviews.length) render(d.reviews.map(function (x) { return { name: x.author, text: x.body, rating: x.rating }; }));
        else render(fallback());
      })
      .catch(function () { render(fallback()); });
  }
  function open() {
    lastFocus = document.activeElement;
    if (typeof dlg.showModal === 'function') { if (!dlg.open) dlg.showModal(); } else { dlg.setAttribute('open', ''); }
    document.documentElement.classList.add('cv-noscroll');
    load();
    if (window.ntTrack) window.ntTrack('reviews_open', { page_path: location.pathname });
  }
  function close() {
    if (typeof dlg.close === 'function') dlg.close(); else dlg.removeAttribute('open');
  }
  dlg.addEventListener('close', function () {
    document.documentElement.classList.remove('cv-noscroll');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  });

  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-reviews-open]');
    if (t && !dlg.contains(t)) { e.preventDefault(); open(); return; }
    if (e.target.closest && e.target.closest('[data-reviews-close]')) { close(); return; }
    if (e.target === dlg) { close(); return; }               // klick på mörkläggningen
    // Offertknappen i modalen: stäng först, annars hamnar offertfönstret bakom modalen.
    if (dlg.open && e.target.closest && e.target.closest('#cv-reviews-modal .hire-btn')) close();
  });
  document.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('[role="button"][data-reviews-open]')) {
      e.preventDefault();
      open();
    }
  });
  if (location.hash === '#omdomen') open();
})();
