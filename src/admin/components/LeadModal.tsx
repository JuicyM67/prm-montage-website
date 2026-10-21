import { useCallback, useEffect, useRef, useState } from 'react';
import {
  PhoneLinearIcon, LetterLinearIcon, MapPointLinearIcon, CopyLinearIcon, CheckCircleLinearIcon, CloseCircleLinearIcon,
} from '@solar-icons/react';
import { api } from '../api';
import { fullDate, LEAD_STATUS, LEAD_TYPES, timeAgo } from '../format';
import { Gallery, type Attachment } from './Attachments';
import { Lightbox } from './Lightbox';
import { Sheet } from './Sheet';

export interface Lead {
  id: string;
  created_at: string;
  type: string;
  name: string;
  email: string | null;
  phone: string;
  service: string | null;
  message: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  area: string | null;
  page: string | null;
  attachments: Attachment[];
  status: 'ny' | 'hanterad' | 'arkiverad';
  notes: string | null;
  handled_at: string | null;
  handled_by_name: string | null;
}

type Status = Lead['status'];
const STATUSES: Status[] = ['ny', 'hanterad', 'arkiverad'];

// ---------- Autospar av interna anteckningar ----------
// Sparar ~0,7 s efter sista tangenttrycket. Sparningar körs en i taget (en ändring under pågående
// sparning köas), misslyckade försök provas igen med växande väntetid, och allt skickas direkt
// (keepalive) vid blur, stängning och när sidan lämnas.
type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

function useAutosave(id: string, initial: string, onSaved?: (text: string) => void) {
  const [value, setValue] = useState(initial);
  const [state, setState] = useState<SaveState>('idle');
  const latest = useRef(initial);
  const lastSaved = useRef(initial);
  const inflight = useRef(false);
  const rerun = useRef(false);
  const timer = useRef<number | undefined>(undefined);
  const retryTimer = useRef<number | undefined>(undefined);
  const retryDelay = useRef(2000);
  const alive = useRef(true);

  const run = useCallback(async (keepalive = false) => {
    if (inflight.current) { rerun.current = true; return; }
    const text = latest.current;
    if (text === lastSaved.current) {
      if (alive.current) setState((s) => (s === 'dirty' ? 'saved' : s));
      return;
    }
    inflight.current = true;
    if (alive.current) setState('saving');
    try {
      await api('/api/admin/leads', { method: 'PATCH', json: { id, notes: text }, keepalive });
      lastSaved.current = text;
      retryDelay.current = 2000;
      onSaved?.(text); // även efter att fönstret stängts, så att listan alltid har senaste texten
      if (alive.current) setState(latest.current === text ? 'saved' : 'dirty');
    } catch {
      if (alive.current) {
        setState('error');
        window.clearTimeout(retryTimer.current);
        retryTimer.current = window.setTimeout(() => run(), retryDelay.current);
        retryDelay.current = Math.min(retryDelay.current * 2, 20000);
      }
    } finally {
      inflight.current = false;
      if (rerun.current) { rerun.current = false; run(keepalive); }
    }
  }, [id, onSaved]);

  const change = useCallback((next: string) => {
    setValue(next);
    latest.current = next;
    setState('dirty');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => run(), 700);
  }, [run]);

  const flush = useCallback(() => {
    window.clearTimeout(timer.current);
    window.clearTimeout(retryTimer.current);
    run(true);
  }, [run]);

  useEffect(() => {
    alive.current = true;
    const onHide = () => flush();
    window.addEventListener('pagehide', onHide);
    return () => {
      alive.current = false;
      window.removeEventListener('pagehide', onHide);
      flush(); // stängs fönstret med osparad text skickas den ändå
    };
  }, [flush]);

  return { value, state, change, flush };
}

const SAVE_TEXT: Record<SaveState, string> = {
  idle: 'Sparas automatiskt',
  dirty: 'Skriver…',
  saving: 'Sparar…',
  saved: 'Sparat ✓',
  error: 'Kunde inte spara – försöker igen',
};

// ---------- Hjälpare ----------
const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
const addressOf = (l: Lead) => [l.address, [l.postal_code, l.city].filter(Boolean).join(' ')].filter(Boolean).join(', ');

function detailsText(l: Lead): string {
  return [
    `Namn: ${l.name}`,
    `Telefon: ${l.phone}`,
    l.email && `E-post: ${l.email}`,
    addressOf(l) && `Adress: ${addressOf(l)}`,
    l.service && `Tjänst: ${l.service}`,
    l.message && `Meddelande: ${l.message}`,
  ].filter(Boolean).join('\n');
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

// ---------- Fönstret ----------
export function LeadModal({ lead, onClosed, onChanged, onNotesSaved }: { lead: Lead; onClosed: () => void; onChanged: () => void; onNotesSaved: (id: string, text: string) => void }) {
  return (
    <Sheet label={`Förfrågan från ${lead.name}`} historyKey={lead.id} onClosed={onClosed}>
      {({ close }) => <LeadBody lead={lead} onChanged={onChanged} onNotesSaved={onNotesSaved} close={close} />}
    </Sheet>
  );
}

function LeadBody({ lead, onChanged, onNotesSaved, close }: { lead: Lead; onChanged: () => void; onNotesSaved: (id: string, text: string) => void; close: () => void }) {
  const leadId = lead.id;
  const saved = useCallback((text: string) => onNotesSaved(leadId, text), [leadId, onNotesSaved]);
  const notes = useAutosave(lead.id, lead.notes ?? '', saved);
  const [status, setStatus] = useState<Status>(lead.status);
  const [statusMsg, setStatusMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [viewer, setViewer] = useState<number | null>(null);
  const flashTimer = useRef<number | undefined>(undefined);

  const waitingDays = status === 'ny' ? Math.floor((Date.now() - new Date(lead.created_at).getTime()) / 86_400_000) : 0;
  const address = addressOf(lead);
  const attachments = lead.attachments ?? [];

  const flash = (text: string) => {
    setStatusMsg(text);
    window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setStatusMsg(''), 2200);
  };

  const changeStatus = async (next: Status) => {
    if (next === status) return;
    const before = status;
    setStatus(next);
    try {
      await api('/api/admin/leads', { method: 'PATCH', json: { id: lead.id, status: next } });
      flash('Sparat ✓');
      onChanged();
    } catch (e) {
      setStatus(before);
      flash(e instanceof Error ? e.message : 'Kunde inte spara');
    }
  };

  const copy = async () => {
    if (await copyText(detailsText(lead))) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  };

  const closeNow = () => { notes.flush(); close(); };

  const history: { when: string; text: string }[] = [{ when: lead.created_at, text: 'Förfrågan inkom' }];
  if (status !== 'ny' && lead.handled_at) {
    history.push({ when: lead.handled_at, text: `Markerad som ${LEAD_STATUS[status].toLowerCase()}${lead.handled_by_name ? ` av ${lead.handled_by_name}` : ''}` });
  }

  return (
    <>
      <header className="adm-lead-head" data-sheet-grip>
        <div className="adm-avatar" aria-hidden="true">{initials(lead.name)}</div>
        <div className="adm-lead-title">
          <h2>{lead.name}</h2>
          <div className="adm-lead-chips">
            <span className={`adm-pill${lead.type === 'jour' ? ' jour' : ''}`}>{LEAD_TYPES[lead.type] || lead.type}</span>
            <span className={`adm-pill${status === 'ny' ? ' ny' : ''}`}>{LEAD_STATUS[status]}</span>
            {waitingDays >= 2 && <span className="adm-pill warn">Väntat {waitingDays} dygn</span>}
            <span className="adm-lead-when" title={fullDate(lead.created_at)}>inkom {timeAgo(lead.created_at)}</span>
          </div>
        </div>
        <button type="button" className="adm-close" onClick={closeNow} aria-label="Stäng"><CloseCircleLinearIcon size={26} /></button>
      </header>

      <div className="adm-lead-body" data-sheet-body>
        <div className="adm-lead-grid">
          <div className="adm-lead-col">
            <section className="adm-panel p-kund" aria-label="Kund">
              <div className="adm-qa-row">
                <a className="adm-qa primary" href={`tel:${lead.phone.replace(/[^\d+]/g, '')}`}><PhoneLinearIcon size={20} /><span>Ring</span></a>
                {lead.email
                  ? <a className="adm-qa" href={`mailto:${lead.email}`}><LetterLinearIcon size={20} /><span>Mejla</span></a>
                  : <span className="adm-qa is-disabled" aria-disabled="true"><LetterLinearIcon size={20} /><span>Mejla</span></span>}
                {address
                  ? <a className="adm-qa" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`} target="_blank" rel="noopener noreferrer"><MapPointLinearIcon size={20} /><span>Karta</span></a>
                  : <span className="adm-qa is-disabled" aria-disabled="true"><MapPointLinearIcon size={20} /><span>Karta</span></span>}
                <button type="button" className="adm-qa" onClick={copy}>
                  {copied ? <CheckCircleLinearIcon size={20} /> : <CopyLinearIcon size={20} />}<span>{copied ? 'Kopierat' : 'Kopiera'}</span>
                </button>
              </div>

              <dl className="adm-facts">
                <dt>Telefon</dt><dd><a href={`tel:${lead.phone.replace(/[^\d+]/g, '')}`}>{lead.phone}</a></dd>
                <dt>E-post</dt><dd>{lead.email ? <a href={`mailto:${lead.email}`}>{lead.email}</a> : '–'}</dd>
                {address && <><dt>Adress</dt><dd>{address}</dd></>}
                {lead.service && <><dt>Tjänst</dt><dd>{lead.service}</dd></>}
                {lead.area && <><dt>Område</dt><dd>{lead.area}</dd></>}
                {lead.page && <><dt>Skickat från</dt><dd>{lead.page}</dd></>}
              </dl>
            </section>

            {lead.message && (
              <section className="adm-panel p-msg" aria-label="Meddelande">
                <h3 className="adm-panel-title">Meddelande</h3>
                <blockquote className="adm-quote">{lead.message}</blockquote>
              </section>
            )}
          </div>

          <div className="adm-lead-col">
            <section className="adm-panel p-status" aria-label="Status">
              <h3 className="adm-panel-title">Status <span className="adm-saved" aria-live="polite">{statusMsg}</span></h3>
              <div className="adm-seg" role="radiogroup" aria-label="Status">
                {STATUSES.map((s) => (
                  <button key={s} type="button" role="radio" aria-checked={status === s} className={`adm-seg-btn${status === s ? ' is-active' : ''} ${s}`} onClick={() => changeStatus(s)}>
                    {LEAD_STATUS[s]}
                  </button>
                ))}
              </div>
            </section>

            {attachments.length > 0 && (
              <section className="adm-panel p-photos" aria-label="Bilder och filer">
                <h3 className="adm-panel-title">Bilder & filer <span className="adm-count-badge">{attachments.length}</span></h3>
                <Gallery items={attachments} onOpen={setViewer} />
              </section>
            )}

            <section className="adm-panel p-notes" aria-label="Interna anteckningar">
              <h3 className="adm-panel-title">
                <label htmlFor="lead-notes">Interna anteckningar</label>
                <span className={`adm-saved ${notes.state}`} aria-live="polite">{SAVE_TEXT[notes.state]}</span>
              </h3>
              <textarea
                id="lead-notes"
                className="adm-input adm-notes"
                value={notes.value}
                maxLength={5000}
                placeholder="Skriv något som bara ni ser – sparas automatiskt"
                onChange={(e) => notes.change(e.target.value)}
                onBlur={notes.flush}
              />
            </section>

            <section className="adm-panel p-history" aria-label="Historik">
              <h3 className="adm-panel-title">Historik</h3>
              <ol className="adm-timeline">
                {history.map((h) => (
                  <li key={h.text}><strong>{h.text}</strong><span>{fullDate(h.when)}</span></li>
                ))}
              </ol>
            </section>
          </div>
        </div>
      </div>

      {viewer !== null && <Lightbox items={attachments} start={viewer} onClose={() => setViewer(null)} />}
    </>
  );
}
