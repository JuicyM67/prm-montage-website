import { Delta } from '../pages/shared';
import { number } from '../format';

const COLORS = ['#1F5C50', '#1FA968', '#7ED7A8', '#B9E7D0', '#D5DEDC'];

interface Item { label: string; value: number; prev?: number }

// Delar av en helhet som ett enda staplat band + en kompakt förklaring (trafikkällor, enheter).
export function SplitBar({ title, items, unit = '' }: { title: string; items: Item[]; unit?: string }) {
  const total = items.reduce((sum, i) => sum + i.value, 0);
  return (
    <section className="adm-card">
      <div className="adm-card-head"><h2 className="adm-card-title">{title}</h2></div>
      {total === 0 ? <p className="adm-empty">Ingen data i perioden.</p> : (
        <>
          <div className="adm-dist" role="img" aria-label={items.map((i) => `${i.label}: ${i.value}`).join(', ')}>
            {items.map((i, idx) => i.value > 0 && (
              <div key={i.label} style={{ flex: i.value, background: COLORS[Math.min(idx, COLORS.length - 1)] }} title={`${i.label}: ${i.value}${unit}`} />
            ))}
          </div>
          <ul className="adm-list" style={{ marginTop: 8 }}>
            {items.map((i, idx) => (
              <li key={i.label}>
                <i className="adm-dot" style={{ background: COLORS[Math.min(idx, COLORS.length - 1)] }} />
                <span className="grow">{i.label}</span>
                {i.prev !== undefined && <Delta cur={i.value} prev={i.prev} />}
                <span className="when" style={{ minWidth: 76, textAlign: 'right' }}>
                  <strong style={{ color: 'var(--adm-ink)' }}>{number(i.value)}</strong> · {Math.round((i.value / total) * 100)} %
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
