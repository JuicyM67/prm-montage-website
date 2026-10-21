import { number } from '../format';

interface Bucket { id: string; label: string; count: number }
const COLORS: Record<string, string> = { top3: '#1F5C50', top10: '#1FA968', top20: '#9FDDBF', rest: '#D5DEDC' };

// Hur många sökord som rankar var: topp 3, 4–10, 11–20, 21+ (med förändring mot föregående period).
export function DistributionBar({ current, previous }: { current: Bucket[]; previous: Bucket[] | null }) {
  const total = current.reduce((sum, b) => sum + b.count, 0);
  if (!total) return null;
  const top10 = (rows: Bucket[]) => rows.filter((b) => b.id === 'top3' || b.id === 'top10').reduce((s, b) => s + b.count, 0);
  const now10 = top10(current);
  const diff10 = previous ? now10 - top10(previous) : 0;

  return (
    <section className="adm-card">
      <div className="adm-card-head" style={{ flexWrap: 'wrap' }}>
        <h2 className="adm-card-title">Var rankar sökorden?</h2>
        <span className="adm-hint">
          {number(now10)} av {number(total)} sökord på första sidan
          {diff10 !== 0 && <strong className={diff10 > 0 ? 'adm-up' : 'adm-down'}> ({diff10 > 0 ? '+' : ''}{diff10})</strong>}
        </span>
      </div>
      <div className="adm-dist" role="img" aria-label={current.map((b) => `${b.label}: ${b.count}`).join(', ')}>
        {current.map((b) => b.count > 0 && (
          <div key={b.id} style={{ flex: b.count, background: COLORS[b.id] }} title={`${b.label}: ${b.count} sökord`} />
        ))}
      </div>
      <div className="adm-legend" style={{ marginTop: 10 }}>
        {current.map((b) => {
          const d = previous ? b.count - (previous.find((p) => p.id === b.id)?.count ?? 0) : 0;
          return (
            <span key={b.id}>
              <i style={{ background: COLORS[b.id] }} />
              {b.label}: <strong>{number(b.count)}</strong>
              {d !== 0 && <em className={`adm-legend-delta ${(b.id === 'rest' ? d < 0 : d > 0) ? 'adm-up' : 'adm-down'}`}>{d > 0 ? '+' : ''}{d}</em>}
            </span>
          );
        })}
      </div>
    </section>
  );
}
