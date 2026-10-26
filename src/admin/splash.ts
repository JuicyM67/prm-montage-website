const MIN_VISIBLE_MS = 600;

/** Tona ut och ta bort splashen. Visas minst en kort stund så den inte blinkar förbi. */
export function hideSplash() {
  try { sessionStorage.setItem('adm-splashed', '1'); } catch { /* ignore */ }
  const el = document.getElementById('adm-splash');
  if (!el) return;
  const started = (window as unknown as { __admSplashStart?: number }).__admSplashStart ?? 0;
  const wait = Math.max(0, MIN_VISIBLE_MS - (Date.now() - started));
  setTimeout(() => {
    el.classList.add('is-hidden');
    setTimeout(() => el.remove(), 400);
  }, wait);
}
