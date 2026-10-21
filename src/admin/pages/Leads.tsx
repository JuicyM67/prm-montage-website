import { useCallback, useEffect, useRef, useState } from 'react';
import { PaperclipLinearIcon } from '@solar-icons/react';
import { useApi } from '../api';
import { fullDate, LEAD_STATUS, LEAD_TYPES, timeAgo } from '../format';
import { LeadModal, type Lead } from '../components/LeadModal';

const FILTERS: { id: string; label: string }[] = [
  { id: '', label: 'Alla' },
  { id: 'ny', label: 'Nya' },
  { id: 'hanterad', label: 'Hanterade' },
  { id: 'arkiverad', label: 'Arkiverade' },
];

export default function Leads() {
  const [filter, setFilter] = useState('');
  const { data, error, loading, reload, setData } = useApi<{ leads: Lead[] }>(`/api/admin/leads${filter ? `?status=${filter}` : ''}`);
  const [open, setOpen] = useState<Lead | null>(null);
  const deepLinkHandled = useRef(false);

  // Listan håller alltid senaste sparade anteckning, så att man ser rätt text om man öppnar förfrågan igen.
  const notesSaved = useCallback((id: string, text: string) => {
    setData((d) => (d ? { ...d, leads: d.leads.map((l) => (l.id === id ? { ...l, notes: text } : l)) } : d));
  }, [setData]);

  // Öppen lead hålls uppdaterad när listan laddas om, men stängs inte om den försvinner ur filtret
  // (t.ex. "Hanterad" när fliken "Nya" är vald) — då behåller vi den senast kända versionen.
  useEffect(() => {
    if (!data) return;
    if (open) {
      const fresh = data.leads.find((l) => l.id === open.id);
      if (fresh && fresh !== open) setOpen(fresh);
    } else if (!deepLinkHandled.current) {
      // /admin/forfragningar?lead=<id> (t.ex. efter omladdning) öppnar den förfrågan direkt.
      deepLinkHandled.current = true;
      const id = new URLSearchParams(window.location.search).get('lead');
      const match = id ? data.leads.find((l) => l.id === id) : undefined;
      if (match) setOpen(match);
    }
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <div className="adm-head-wrap">
        <h1 className="adm-h1">Förfrågningar</h1>
        <p className="adm-sub" style={{ marginBottom: 0 }}>Allt som kommit in via formulären på sajten</p>
      </div>

      <div className="adm-tabs" role="tablist">
        {FILTERS.map((f) => (
          <button key={f.id} type="button" role="tab" aria-selected={filter === f.id} className={`adm-tab${filter === f.id ? ' is-active' : ''}`} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      {error && <div className="adm-alert error" role="alert">{error}</div>}

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr><th>Namn</th><th>Typ</th><th>Tjänst / plats</th><th>Status</th><th className="num">Inkom</th></tr>
          </thead>
          <tbody>
            {loading && !data && <tr><td colSpan={5}><div className="adm-skeleton" /></td></tr>}
            {data?.leads.length === 0 && <tr><td colSpan={5} className="adm-empty">Inga förfrågningar här än.</td></tr>}
            {data?.leads.map((l) => (
              <tr key={l.id} className="is-click" onClick={() => setOpen(l)} tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') setOpen(l); }}>
                <td>
                  <div className="adm-cell-main">
                    {l.name}
                    {l.attachments?.length > 0 && (
                      <span className="adm-clip" title={`${l.attachments.length} bilaga${l.attachments.length > 1 ? 'r' : ''}`}>
                        <PaperclipLinearIcon size={14} />{l.attachments.length}
                      </span>
                    )}
                  </div>
                  <div className="adm-cell-sub">{l.phone}</div>
                </td>
                <td><span className={`adm-pill${l.type === 'jour' ? ' jour' : ''}`}>{LEAD_TYPES[l.type] || l.type}</span></td>
                <td>
                  <div className="adm-truncate">{l.service || '–'}</div>
                  <div className="adm-cell-sub">{[l.city, l.area].filter(Boolean).join(' · ')}</div>
                </td>
                <td><span className={`adm-pill${l.status === 'ny' ? ' ny' : ''}`}>{LEAD_STATUS[l.status]}</span></td>
                <td className="num" title={fullDate(l.created_at)}>{timeAgo(l.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && <LeadModal key={open.id} lead={open} onClosed={() => setOpen(null)} onChanged={reload} onNotesSaved={notesSaved} />}
    </>
  );
}
