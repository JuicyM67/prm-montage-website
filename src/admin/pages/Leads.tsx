import { useEffect, useState } from 'react';
import { api, useApi } from '../api';
import { fullDate, LEAD_STATUS, LEAD_TYPES, timeAgo } from '../format';

interface Lead {
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
  attachments: { filename: string; url: string }[];
  status: 'ny' | 'hanterad' | 'arkiverad';
  notes: string | null;
  handled_at: string | null;
  handled_by_name: string | null;
}

const FILTERS: { id: string; label: string }[] = [
  { id: '', label: 'Alla' },
  { id: 'ny', label: 'Nya' },
  { id: 'hanterad', label: 'Hanterade' },
  { id: 'arkiverad', label: 'Arkiverade' },
];

export default function Leads() {
  const [filter, setFilter] = useState('');
  const { data, error, loading, reload } = useApi<{ leads: Lead[] }>(`/api/admin/leads${filter ? `?status=${filter}` : ''}`);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = data?.leads.find((l) => l.id === selectedId) ?? null;

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
              <tr key={l.id} className="is-click" onClick={() => setSelectedId(l.id)} tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') setSelectedId(l.id); }}>
                <td>
                  <div className="adm-cell-main">{l.name}</div>
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

      {selected && <LeadDrawer lead={selected} onClose={() => setSelectedId(null)} onChanged={reload} />}
    </>
  );
}

function LeadDrawer({ lead, onClose, onChanged }: { lead: Lead; onClose: () => void; onChanged: () => void }) {
  const [notes, setNotes] = useState(lead.notes ?? '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => { setNotes(lead.notes ?? ''); }, [lead.id, lead.notes]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const patch = async (body: Record<string, unknown>) => {
    setBusy(true);
    setErr('');
    try {
      await api('/api/admin/leads', { method: 'PATCH', json: { id: lead.id, ...body } });
      onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Något gick fel.');
    } finally {
      setBusy(false);
    }
  };

  const address = [lead.address, [lead.postal_code, lead.city].filter(Boolean).join(' ')].filter(Boolean).join(', ');

  return (
    <div className="adm-overlay" onClick={onClose}>
      <aside className="adm-drawer" role="dialog" aria-modal="true" aria-label={`Förfrågan från ${lead.name}`} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h2>{lead.name}</h2>
            <span className={`adm-pill${lead.type === 'jour' ? ' jour' : ''}`}>{LEAD_TYPES[lead.type] || lead.type}</span>{' '}
            <span className={`adm-pill${lead.status === 'ny' ? ' ny' : ''}`}>{LEAD_STATUS[lead.status]}</span>
          </div>
          <button type="button" className="adm-btn secondary small" onClick={onClose} style={{ alignSelf: 'flex-start' }}>Stäng</button>
        </div>

        <dl className="adm-dl">
          <dt>Inkom</dt><dd>{fullDate(lead.created_at)}</dd>
          <dt>Telefon</dt><dd><a href={`tel:${lead.phone.replace(/[^\d+]/g, '')}`}>{lead.phone}</a></dd>
          <dt>E-post</dt><dd>{lead.email ? <a href={`mailto:${lead.email}`}>{lead.email}</a> : '–'}</dd>
          {lead.service && <><dt>Tjänst</dt><dd>{lead.service}</dd></>}
          {address && <><dt>Adress</dt><dd>{address}</dd></>}
          {lead.area && <><dt>Område</dt><dd>{lead.area}</dd></>}
          {lead.handled_at && <><dt>Hanterad</dt><dd>{fullDate(lead.handled_at)}{lead.handled_by_name ? ` av ${lead.handled_by_name}` : ''}</dd></>}
        </dl>

        {lead.message && <div className="adm-msg">{lead.message}</div>}

        {lead.attachments?.length > 0 && (
          <>
            <h3 style={{ fontSize: 14, margin: '20px 0 8px' }}>Bilagor</h3>
            <ul className="adm-list">
              {lead.attachments.map((a) => (
                <li key={a.url}><a className="grow" href={a.url} target="_blank" rel="noopener noreferrer">{a.filename}</a></li>
              ))}
            </ul>
          </>
        )}

        <div className="adm-field" style={{ marginTop: 20 }}>
          <label htmlFor="lead-notes">Anteckningar</label>
          <textarea id="lead-notes" className="adm-input" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={5000} placeholder="Intern anteckning, syns bara i admin" />
          <div>
            <button type="button" className="adm-btn secondary small" disabled={busy || notes === (lead.notes ?? '')} onClick={() => patch({ notes })}>Spara anteckning</button>
          </div>
        </div>

        {err && <div className="adm-alert error" role="alert">{err}</div>}

        <div className="adm-actions">
          {lead.status !== 'hanterad' && <button type="button" className="adm-btn" disabled={busy} onClick={() => patch({ status: 'hanterad' })}>Markera som hanterad</button>}
          {lead.status !== 'ny' && <button type="button" className="adm-btn secondary" disabled={busy} onClick={() => patch({ status: 'ny' })}>Sätt som ny</button>}
          {lead.status !== 'arkiverad' && <button type="button" className="adm-btn secondary" disabled={busy} onClick={() => patch({ status: 'arkiverad' })}>Arkivera</button>}
        </div>
      </aside>
    </div>
  );
}
