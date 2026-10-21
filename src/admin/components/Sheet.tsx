import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

// Ett och samma fönster som beter sig som en app på mobil och som en modal på desktop:
//  - ≤ 800px: bottenpanel som glider upp, stängs genom att dra nedåt (samma gester och tröskelvärden som
//    offertfönstret på publika sajten, se setupSheetGestures i public/assets/js/modal.js).
//  - större skärmar: centrerad modal med rundade hörn.
// Webbläsarens bakåtknapp/-gest stänger fönstret (ett historikinlägg med ?lead=<id> läggs till).
const MOBILE = '(max-width: 800px)';
const EXIT_MS = 260;
const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

interface Props {
  label: string;
  historyKey: string;
  onClosed: () => void;
  children: (api: { close: () => void }) => ReactNode;
}

export function Sheet({ label, historyKey, onClosed, children }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const closing = useRef(false);
  const pushed = useRef(false);
  const restoreFocus = useRef<HTMLElement | null>(null);
  // Föräldern skickar en ny onClosed vid varje rendering. Håll den i en ref så att fönstrets
  // inställning (fokus, scrolllås, historik, gester) inte körs om — då stals fokus från textrutan.
  const onClosedRef = useRef(onClosed);
  onClosedRef.current = onClosed;

  const animateClose = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    const panel = panelRef.current;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (panel) {
      panel.classList.remove('is-dragging');
      panel.style.transform = '';
    }
    overlayRef.current?.style.removeProperty('--adm-drag');
    setOpen(false);
    window.setTimeout(() => onClosedRef.current(), reduce ? 0 : EXIT_MS);
  }, []);

  // Alla sätt att stänga (✕, Esc, bakgrund, nedåtdrag) går hit.
  const close = useCallback(() => {
    if (closing.current) return;
    if (pushed.current && history.state?.admSheet === historyKey) {
      history.back(); // popstate nedan animerar stängningen
      window.setTimeout(animateClose, 450); // reserv om popstate aldrig kommer
    } else {
      if (new URL(location.href).searchParams.has('lead')) history.replaceState(null, '', location.pathname);
      animateClose();
    }
  }, [animateClose, historyKey]);

  // Öppna: animera in, flytta fokus, lås scroll, historikinlägg.
  useEffect(() => {
    restoreFocus.current = document.activeElement as HTMLElement | null;
    const raf = requestAnimationFrame(() => setOpen(true));
    panelRef.current?.focus({ preventScroll: true });

    const main = document.querySelector('.adm-main');
    main?.classList.add('is-locked');
    document.documentElement.classList.add('adm-no-scroll');

    const url = new URL(location.href);
    if (url.searchParams.get('lead') !== historyKey) {
      url.searchParams.set('lead', historyKey);
      history.pushState({ admSheet: historyKey }, '', url);
      pushed.current = true;
    }
    const onPop = () => animateClose();
    window.addEventListener('popstate', onPop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('popstate', onPop);
      main?.classList.remove('is-locked');
      document.documentElement.classList.remove('adm-no-scroll');
      restoreFocus.current?.focus?.({ preventScroll: true });
    };
  }, [animateClose, historyKey]);

  // Esc stänger; Tab hålls inne i fönstret.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const items = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panelRef.current)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [close]);

  // Dra nedåt för att stänga (mobil). Börjar vid handtaget/rubriken, eller i innehållet när det är scrollat högst upp.
  useEffect(() => {
    const panel = panelRef.current;
    const overlay = overlayRef.current;
    if (!panel || !overlay) return;
    const mq = window.matchMedia(MOBILE);
    let startY = 0;
    let dy = 0;
    let startT = 0;
    let tracking = false;
    let dragging = false;

    const body = () => panel.querySelector<HTMLElement>('[data-sheet-body]');

    const onStart = (e: TouchEvent) => {
      if (!mq.matches || closing.current || e.touches.length !== 1) return;
      const t = e.target as HTMLElement;
      const fromGrip = t.closest('[data-sheet-grip]');
      const interactive = t.closest('input, textarea, select, button, label, a, [data-no-drag]');
      const scrolled = (body()?.scrollTop ?? 0) > 0;
      if (!fromGrip && (scrolled || interactive)) return;
      tracking = true;
      dragging = false;
      dy = 0;
      startY = e.touches[0].clientY;
      startT = Date.now();
    };
    const onMove = (e: TouchEvent) => {
      if (!tracking) return;
      dy = e.touches[0].clientY - startY;
      if (!dragging) {
        if ((body()?.scrollTop ?? 0) > 0 || dy < 0) { tracking = false; return; }
        if (dy > 6) { dragging = true; panel.classList.add('is-dragging'); } else return;
      }
      e.preventDefault();
      const offset = Math.max(dy, 0);
      panel.style.transform = `translateY(${offset}px)`;
      overlay.style.setProperty('--adm-drag', String(Math.min(offset / Math.max(panel.offsetHeight, 1), 1)));
    };
    const release = (cancelled: boolean) => {
      if (!tracking) return;
      tracking = false;
      if (!dragging) return;
      dragging = false;
      panel.classList.remove('is-dragging');
      const velocity = dy / Math.max(Date.now() - startT, 1);
      if (!cancelled && (dy > 110 || velocity > 0.6)) {
        try { navigator.vibrate?.(8); } catch { /* ignore */ }
        close();
      } else {
        panel.style.transform = '';
        overlay.style.removeProperty('--adm-drag');
      }
    };
    const onEnd = () => release(false);
    const onCancel = () => release(true);

    panel.addEventListener('touchstart', onStart, { passive: true });
    panel.addEventListener('touchmove', onMove, { passive: false });
    panel.addEventListener('touchend', onEnd);
    panel.addEventListener('touchcancel', onCancel);
    return () => {
      panel.removeEventListener('touchstart', onStart);
      panel.removeEventListener('touchmove', onMove);
      panel.removeEventListener('touchend', onEnd);
      panel.removeEventListener('touchcancel', onCancel);
    };
  }, [close]);

  return createPortal(
    <div
      ref={overlayRef}
      className={`adm-sheet-overlay${open ? ' is-open' : ''}`}
      onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      <div ref={panelRef} className="adm-sheet" role="dialog" aria-modal="true" aria-label={label} tabIndex={-1}>
        <div className="adm-sheet-handle" data-sheet-grip aria-hidden="true" />
        {children({ close })}
      </div>
    </div>,
    document.body,
  );
}
