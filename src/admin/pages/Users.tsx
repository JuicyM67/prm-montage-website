import { useState, type FormEvent } from 'react';
import { UserPlusLinearIcon } from '@solar-icons/react';
import { api, useApi } from '../api';
import { timeAgo } from '../format';
import type { AdminUser } from '../Shell';

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string | null;
  banned: boolean;
  created_at: string;
  last_login: string | null;
}

export default function Users({ me }: { me: AdminUser }) {
  const { data, error, loading, reload } = useApi<{ users: UserRow[] }>('/api/admin/users');
  const [inviting, setInviting] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const isAdmin = me.role === 'admin';

  const act = async (fn: () => Promise<unknown>, okText: string) => {
    setNotice(null);
    try {
      await fn();
      setNotice({ kind: 'ok', text: okText });
      reload();
    } catch (e) {
      setNotice({ kind: 'error', text: e instanceof Error ? e.message : 'Något gick fel.' });
    }
  };

  return (
    <>
      <div className="adm-head-wrap adm-head">
        <div>
          <h1 className="adm-h1">Användare</h1>
          <p className="adm-sub">Bara inbjudna personer kan logga in</p>
        </div>
        {isAdmin && (
          <button type="button" className="adm-btn" onClick={() => setInviting(true)}>
            <UserPlusLinearIcon size={20} /> Bjud in
          </button>
        )}
      </div>

      {!isAdmin && <div className="adm-alert">Bara administratörer kan bjuda in eller ta bort användare.</div>}
      {notice && <div className={`adm-alert ${notice.kind}`} role="status">{notice.text}</div>}
      {error && <div className="adm-alert error" role="alert">{error}</div>}

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr><th>Namn</th><th>Roll</th><th>Status</th><th className="num">Senast inloggad</th>{isAdmin && <th />}</tr>
          </thead>
          <tbody>
            {loading && !data && <tr><td colSpan={5}><div className="adm-skeleton" /></td></tr>}
            {data?.users.map((u) => (
              <tr key={u.id}>
                <td>
                  <div className="adm-cell-main">{u.name}{u.id === me.id ? ' (du)' : ''}</div>
                  <div className="adm-cell-sub">{u.email}</div>
                </td>
                <td>{u.role === 'admin' ? 'Administratör' : 'Medlem'}</td>
                <td>
                  {u.banned ? <span className="adm-pill warn">Avstängd</span>
                    : u.last_login ? <span className="adm-pill ny">Aktiv</span>
                    : <span className="adm-pill warn">Inbjuden</span>}
                </td>
                <td className="num">{u.last_login ? timeAgo(u.last_login) : '–'}</td>
                {isAdmin && (
                  <td className="num">
                    {!u.last_login && !u.banned && (
                      <button type="button" className="adm-btn secondary small" onClick={() => act(() => api('/api/admin/users', { method: 'PUT', json: { id: u.id } }), `Ny länk skickad till ${u.email}.`)}>
                        Skicka om
                      </button>
                    )}{' '}
                    {u.id !== me.id && (
                      <button
                        type="button"
                        className="adm-btn danger small"
                        onClick={() => {
                          if (window.confirm(`Ta bort ${u.name}? Personen förlorar åtkomsten direkt.`)) {
                            act(() => api(`/api/admin/users?id=${encodeURIComponent(u.id)}`, { method: 'DELETE' }), `${u.name} är borttagen.`);
                          }
                        }}
                      >
                        Ta bort
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {inviting && (
        <InviteModal
          onClose={() => setInviting(false)}
          onDone={(email) => { setInviting(false); setNotice({ kind: 'ok', text: `Inbjudan skickad till ${email}.` }); reload(); }}
        />
      )}
    </>
  );
}

function InviteModal({ onClose, onDone }: { onClose: () => void; onDone: (email: string) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      await api('/api/admin/users', { method: 'POST', json: { name, email, role } });
      onDone(email.trim());
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Något gick fel.');
      setBusy(false);
    }
  };

  return (
    <div className="adm-overlay center" onClick={onClose}>
      <form className="adm-modal" role="dialog" aria-modal="true" aria-label="Bjud in användare" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>Bjud in användare</h2>
        <p className="adm-sub">Personen får ett mejl med en inloggningslänk.</p>
        {err && <div className="adm-alert error" role="alert">{err}</div>}
        <div className="adm-field">
          <label htmlFor="inv-name">Namn</label>
          <input id="inv-name" className="adm-input" required autoFocus value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="adm-field">
          <label htmlFor="inv-email">E-post</label>
          <input id="inv-email" className="adm-input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="adm-field">
          <label htmlFor="inv-role">Roll</label>
          <select id="inv-role" className="adm-input" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="member">Medlem – ser och hanterar förfrågningar</option>
            <option value="admin">Administratör – kan även bjuda in och ta bort</option>
          </select>
        </div>
        <div className="adm-actions">
          <button type="submit" className="adm-btn" disabled={busy}>{busy ? 'Skickar…' : 'Skicka inbjudan'}</button>
          <button type="button" className="adm-btn secondary" onClick={onClose}>Avbryt</button>
        </div>
      </form>
    </div>
  );
}
