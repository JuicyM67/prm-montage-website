// Förändring mot föregående period. invert: lägre är bättre (t.ex. Googles snittposition).
export function Delta({ cur, prev, invert = false }: { cur: number; prev: number; invert?: boolean }) {
  if (!prev) return null;
  const change = ((cur - prev) / prev) * 100;
  if (Math.abs(change) < 0.5) return null;
  const good = invert ? change < 0 : change > 0;
  return (
    <span className={`adm-stat-delta ${good ? 'up' : 'down'}`} aria-label={`${change > 0 ? 'upp' : 'ner'} ${Math.abs(Math.round(change))} procent`}>
      {change > 0 ? '▲' : '▼'} {Math.abs(Math.round(change))} %
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
