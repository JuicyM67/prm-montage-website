/* ============================================
   PRM MONTAGE — Klistrig CTA-rad på mobil (Ring + Begär offert)
   Visas bara under 768 px (se .nt-sticky-cta i custom.css).
   "Begär offert" öppnar samma modal som .hire-btn (se modal.js).
   ============================================ */

document.addEventListener('DOMContentLoaded', function () {
  var overlay = document.getElementById('nt-hire-modal');
  if (!overlay || document.getElementById('nt-sticky-cta')) return;

  var bar = document.createElement('div');
  bar.id = 'nt-sticky-cta';
  bar.className = 'nt-sticky-cta';
  bar.innerHTML =
    '<a class="nt-sticky-cta__call" href="tel:+46852027977" aria-label="Ring PRM Montage 08-520 279 77">Ring oss</a>' +
    '<button type="button" class="nt-sticky-cta__quote">Begär offert</button>';
  document.body.appendChild(bar);
  document.body.classList.add('nt-has-sticky-cta');

  bar.querySelector('.nt-sticky-cta__quote').addEventListener('click', function () {
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (window.ntTrack) window.ntTrack('cta_click', { cta: 'sticky_quote' });
  });

  // Telefonklick spåras redan globalt som phone_click (cookie-consent.js).

  // Dölj raden medan modalen är öppen så att den inte hamnar ovanpå formuläret.
  new MutationObserver(function () {
    bar.classList.toggle('nt-hidden', overlay.classList.contains('active'));
  }).observe(overlay, { attributes: true, attributeFilter: ['class'] });
});
