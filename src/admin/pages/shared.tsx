import { decimal } from '../format';

// Förändring mot föregående period. invert: lägre är bättre (t.ex. Googles snittposition).
// abs: visa skillnaden i enheter (positioner) i stället för procent.
export function Delta({ cur, prev, invert = false, abs = false }: { cur: number; prev: number; invert?: boolean; abs?: boolean }) {
  if (!prev) return null;
  const diff = cur - prev;
  const change = abs ? diff : (diff / prev) * 100;
  if (Math.abs(change) < (abs ? 0.05 : 0.5)) return null;
  const good = invert ? change < 0 : change > 0;
  const text = abs ? decimal(Math.abs(change)) : `${Math.abs(Math.round(change))} %`;
  return (
    <span className={`adm-stat-delta ${good ? 'up' : 'down'}`} aria-label={`${good ? 'bättre' : 'sämre'} med ${text}`}>
      {change > 0 ? '▲' : '▼'} {text}
    </span>
  );
}

export function SetupHint({ what, env }: { what: string; env: string }) {
  return (
    <div className="adm-card">
      <h2 className="adm-card-title" style={{ marginBottom: 8 }}>{what} är inte kopplat än</h2>
      <p style={{ margin: 0, color: 'var(--adm-muted)' }}>
        Lägg till miljövariablerna <code>GOOGLE_SERVICE_ACCOUNT_JSON</code> och <code>{env}</code> i Vercel, och ge tjänstekontots
        e-postadress läsbehörighet i {what}. Då dyker datan upp här automatiskt.
      </p>
    </div>
  );
}
