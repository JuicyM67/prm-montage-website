import { useState, type FormEvent } from 'react';
import { LetterLinearIcon, CopyLinearIcon, StarBoldIcon } from '@solar-icons/react';
import { api, useApi } from '../api';
import { timeAgo } from '../format';

interface Invite {
  id: number;
  token: string;
  name: string;
  email: string;
  note: string | null;
  created_at: string;
  sent_at: string | null;
  opened_at: string | null;
  submitted_at: string | null;
  created_by_name: string | null;
}
interface WebReview { id: number; author: string; body: string; rating: number; published: boolean; created_at: string }

const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n);

function statusOf(i: Invite): { label: string; cls: string } {
  if (i.submitted_at) return { label: 'Omdöme inskickat', cls: 'ny' };
  if (!i.sent_at) return { label: 'Ej skickad', cls: 'warn' };
  if (i.opened_at) return { label: 'Öppnad', cls: '' };
  return { label: 'Skickad', cls: '' };
}

export default function Reviews() {
  const invites = useApi<{ invites: Invite[] }>('/api/admin/review-invites');
  const reviews = useApi<{ reviews: WebReview[] }>('/api/admin/reviews');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setNotice(null);
    try {
      await fn();
      setNotice({ kind: 'ok', text: ok });
    } catch (e) {
      setNotice({ kind: 'error', text: e instanceof Error ? e.message : 'Något gick fel.' });
    }
    invites.reload();
    reviews.reload();
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    await run(async () => {
      await api('/api/admin/review-invites', { method: 'POST', json: { name, email, note } });
      setName(''); setEmail(''); setNote('');
    }, `Inbjudan skickad till ${email.trim()}.`);
    setBusy(false);
  };

  const copyLink = async (i: Invite) => {
    const url = `${window.location.origin}/omdome?t=${i.token}`;
    try { await navigator.clipboard.writeText(url); setNotice({ kind: 'ok', text: 'Länken är kopierad.' }); }
    catch { setNotice({ kind: 'error', text: url }); }
  };

  const pending = reviews.data?.reviews.filter((r) => !r.published) ?? [];
  const live = reviews.data?.reviews.filter((r) => r.published) ?? [];

  return (
    <>
      <div className="adm-head-wrap">
        <h1 className="adm-h1">Omdömen</h1>
        <p className="adm-sub" style={{ marginBottom: 0 }}>Bjud in kunder att recensera er, på sajten och på Google</p>
      </div>

      {notice && <div className={`adm-alert ${notice.kind}`} role="status">{notice.text}</div>}

      <div className="adm-card" style={{ marginBottom: 24 }}>
        <div className="adm-card-head"><h2 className="adm-card-title">Bjud in en kund</h2></div>
        <form onSubmit={submit} style={{ display: 'grid', gap: 0, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', columnGap: 16 }}>
          <div className="adm-field">
            <label htmlFor="rv-name">Kundens namn</label>
            <input id="rv-name" className="adm-input" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="adm-field">
            <label htmlFor="rv-email">E-post</label>
            <input id="rv-email" className="adm-input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="adm-field" style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="rv-note">Intern anteckning (visas inte för kunden)</label>
            <input id="rv-note" className="adm-input" placeholder="t.ex. blandarbyte i Solna" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <button type="submit" className="adm-btn" disabled={busy}><LetterLinearIcon size={18} /> {busy ? 'Skickar…' : 'Skicka inbjudan'}</button>
            <span className="adm-cell-sub" style={{ marginLeft: 12 }}>Kunden får ett mejl med en personlig länk som fungerar en gång.</span>
          </div>
        </form>
      </div>

      {pending.length > 0 && (
        <div className="adm-card" style={{ marginBottom: 24 }}>
          <div className="adm-card-head"><h2 className="adm-card-title">Nya omdömen att godkänna ({pending.length})</h2></div>
          {pending.map((r) => (
            <div key={r.id} style={{ borderTop: '1px solid var(--adm-line)', padding: '14px 0' }}>
              <div className="adm-cell-main"><StarBoldIcon size={14} color="#F5B301" /> {stars(r.rating)} &nbsp; {r.author} <span className="adm-cell-sub">&nbsp;{timeAgo(r.created_at)}</span></div>
              <p style={{ margin: '6px 0 10px' }}>{r.body}</p>
              <button type="button" className="adm-btn small" onClick={() => run(() => api('/api/admin/reviews', { method: 'PATCH', json: { id: r.id, published: true } }), 'Omdömet är publicerat.')}>Publicera på sajten</button>{' '}
              <span className="adm-cell-sub">Dolt tills du publicerar</span>
            </div>
          ))}
        </div>
      )}

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead><tr><th>Kund</th><th>Status</th><th className="num">Skickad</th><th /></tr></thead>
          <tbody>
            {invites.loading && !invites.data && <tr><td colSpan={4}><div className="adm-skeleton" /></td></tr>}
            {invites.data?.invites.length === 0 && <tr><td colSpan={4} className="adm-cell-sub">Inga inbjudningar ännu.</td></tr>}
            {invites.data?.invites.map((i) => {
              const st = statusOf(i);
              return (
                <tr key={i.id}>
                  <td>
                    <div className="adm-cell-main">{i.name}</div>
                    <div className="adm-cell-sub">{i.email}{i.note ? ` · ${i.note}` : ''}</div>
                  </td>
                  <td><span className={`adm-pill ${st.cls}`}>{st.label}</span></td>
                  <td className="num">{i.sent_at ? timeAgo(i.sent_at) : '–'}</td>
                  <td className="num">
                    {!i.submitted_at && (
                      <>
                        <button type="button" className="adm-btn secondary small" onClick={() => run(() => api('/api/admin/review-invites', { method: 'PUT', json: { id: i.id } }), `Mejlet skickades igen till ${i.email}.`)}>Skicka om</button>{' '}
                        <button type="button" className="adm-btn secondary small" onClick={() => copyLink(i)} title="Kopiera länken"><CopyLinearIcon size={16} /> Länk</button>{' '}
                      </>
                    )}
                    <button type="button" className="adm-btn danger small" onClick={() => { if (window.confirm(`Ta bort inbjudan till ${i.name}? Länken slutar fungera.`)) run(() => api(`/api/admin/review-invites?id=${i.id}`, { method: 'DELETE' }), 'Inbjudan borttagen.'); }}>Ta bort</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {live.length > 0 && (
        <div className="adm-card" style={{ marginTop: 24 }}>
          <div className="adm-card-head"><h2 className="adm-card-title">Publicerade omdömen från sajten ({live.length})</h2></div>
          {live.map((r) => (
            <div key={r.id} style={{ borderTop: '1px solid var(--adm-line)', padding: '12px 0' }}>
              <div className="adm-cell-main">{stars(r.rating)} &nbsp; {r.author}</div>
              <p style={{ margin: '4px 0 8px' }}>{r.body}</p>
              <button type="button" className="adm-btn secondary small" onClick={() => run(() => api('/api/admin/reviews', { method: 'PATCH', json: { id: r.id, published: false } }), 'Omdömet är dolt.')}>Dölj</button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
