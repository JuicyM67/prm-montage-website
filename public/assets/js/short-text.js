// Centrerar korta stycken (tre rader eller mindre) som står ensamma under en rubrik.
// Stycken som följs/föregås av andra stycken lämnas vänsterjusterade så att textblocket håller ihop.
(function () {
  var SEL = '.cv-prose > p, .cv-prose > h3 + p, .cv-prose > h4 + p, .tp-service-area .row > [class*="col-xl-8"] p';
  function run() {
    document.querySelectorAll(SEL).forEach(function (p) {
      p.classList.remove('is-short');
      var a = p.previousElementSibling, b = p.nextElementSibling;
      if ((a && a.tagName === 'P') || (b && b.tagName === 'P')) return;
      var lh = parseFloat(getComputedStyle(p).lineHeight) || 28;
      if (p.getBoundingClientRect().height <= lh * 3.4) p.classList.add('is-short');
    });
  }
  var t;
  function later() { clearTimeout(t); t = setTimeout(run, 120); }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(run);
  window.addEventListener('load', run);
  window.addEventListener('resize', later);
  run();
})();
