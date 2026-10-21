import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AltArrowLeftLinearIcon, AltArrowRightLinearIcon, CloseCircleLinearIcon, DownloadLinearIcon, ArrowRightUpLinearIcon,
} from '@solar-icons/react';
import { FileIcon, downloadUrl, kindOf, labelFor, type Attachment } from './Attachments';

// Helskärm för bilder och filer: ←/→ eller svep för att bläddra, svep nedåt/Esc för att stänga,
// tryck på en bild för att växla mellan "passa in" och full storlek. PDF:er visas som förhandsvisning.
export function Lightbox({ items, start, onClose }: { items: Attachment[]; start: number; onClose: () => void }) {
  const [index, setIndex] = useState(start);
  const [zoomed, setZoomed] = useState(false);
  const [failed, setFailed] = useState<Set<number>>(new Set());
  const contentRef = useRef<HTMLDivElement>(null);
  const item = items[index];
  const kind = kindOf(item);
  const isImage = kind === 'image' && !failed.has(index);
  // Android-Chrome kan inte visa PDF i en iframe — där blir det ett kort med "Öppna PDF".
  const inlinePdf = kind === 'pdf' && !/Android/i.test(navigator.userAgent);

  const go = useCallback((delta: number) => {
    setIndex((i) => (i + delta + items.length) % items.length);
    setZoomed(false);
  }, [items.length]);

  // Fånga tangenttryck först så att modalen under inte stängs av samma Esc.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onClose(); }
      else if (e.key === 'ArrowLeft' && items.length > 1) { e.preventDefault(); e.stopPropagation(); go(-1); }
      else if (e.key === 'ArrowRight' && items.length > 1) { e.preventDefault(); e.stopPropagation(); go(1); }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [go, items.length, onClose]);

  // Svep: i sidled för nästa/föregående, nedåt för att stänga. Av när bilden är förstorad (då panorerar man).
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    let sx = 0;
    let sy = 0;
    let axis: '' | 'x' | 'y' = '';
    let dx = 0;
    let dy = 0;
    let active = false;

    const onStart = (e: TouchEvent) => {
      if (zoomed || e.touches.length !== 1) return;
      active = true;
      axis = '';
      dx = 0;
      dy = 0;
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
    };
    const onMove = (e: TouchEvent) => {
      if (!active) return;
      dx = e.touches[0].clientX - sx;
      dy = e.touches[0].clientY - sy;
      if (!axis) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      }
      if (axis === 'y' && dy < 0) return;
      e.preventDefault();
      el.style.transition = 'none';
      el.style.transform = axis === 'x' ? `translateX(${dx}px)` : `translateY(${Math.max(dy, 0)}px)`;
    };
    const onEnd = () => {
      if (!active) return;
      active = false;
      el.style.transition = 'transform .2s ease';
      el.style.transform = '';
      if (axis === 'x' && Math.abs(dx) > 70 && items.length > 1) go(dx < 0 ? 1 : -1);
      else if (axis === 'y' && dy > 110) onClose();
    };
    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd);
    el.addEventListener('touchcancel', onEnd);
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
      el.removeEventListener('touchcancel', onEnd);
    };
  }, [go, items.length, onClose, zoomed, index]);

  return createPortal(
    <div className="adm-lb" role="dialog" aria-modal="true" aria-label="Förhandsvisning av bilaga">
      <div className="adm-lb-top">
        <span className="adm-lb-count">{index + 1} / {items.length} · {labelFor(item, index, items)}</span>
        <div className="adm-lb-actions">
          <a className="adm-lb-btn" href={item.url} target="_blank" rel="noopener noreferrer"><ArrowRightUpLinearIcon size={18} /><span>Öppna</span></a>
          <a className="adm-lb-btn" href={downloadUrl(item.url)} download={item.filename}><DownloadLinearIcon size={18} /><span>Ladda ner</span></a>
          <button type="button" className="adm-lb-btn icon" onClick={onClose} aria-label="Stäng"><CloseCircleLinearIcon size={22} /></button>
        </div>
      </div>

      <div className="adm-lb-stage" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        {items.length > 1 && (
          <button type="button" className="adm-lb-nav prev" onClick={() => go(-1)} aria-label="Föregående"><AltArrowLeftLinearIcon size={26} /></button>
        )}

        <div ref={contentRef} className={`adm-lb-content${zoomed ? ' is-zoomed' : ''}`} key={item.url}>
          {isImage && (
            <img
              className="adm-lb-img"
              src={item.url}
              alt={labelFor(item, index, items)}
              onClick={() => setZoomed((z) => !z)}
              onError={() => setFailed((s) => new Set(s).add(index))}
              draggable={false}
            />
          )}
          {inlinePdf && (
            <div className="adm-lb-pdf">
              <iframe className="adm-lb-frame" src={item.url} title={labelFor(item, index, items)} />
              <p className="adm-lb-hint">Syns inte förhandsvisningen? <a href={item.url} target="_blank" rel="noopener noreferrer">Öppna i ny flik</a></p>
            </div>
          )}
          {!isImage && !inlinePdf && (
            <div className="adm-lb-file">
              <FileIcon kind={kind} size={44} />
              <strong>{item.filename.length > 40 ? item.filename.slice(0, 37) + '…' : item.filename}</strong>
              <p>{kind === 'image' ? 'Bilden kan inte visas i den här webbläsaren (t.ex. HEIC).' : kind === 'pdf' ? 'PDF:er öppnas i läsaren på din enhet.' : 'Den här filtypen kan inte förhandsvisas.'}</p>
              <div className="adm-actions" style={{ justifyContent: 'center' }}>
                <a className="adm-btn" href={item.url} target="_blank" rel="noopener noreferrer">{kind === 'pdf' ? 'Öppna PDF' : 'Öppna'}</a>
                <a className="adm-btn secondary" href={downloadUrl(item.url)} download={item.filename}>Ladda ner</a>
              </div>
            </div>
          )}
        </div>

        {items.length > 1 && (
          <button type="button" className="adm-lb-nav next" onClick={() => go(1)} aria-label="Nästa"><AltArrowRightLinearIcon size={26} /></button>
        )}
      </div>
    </div>,
    document.body,
  );
}
