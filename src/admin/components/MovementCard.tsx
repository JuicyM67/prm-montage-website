import { useState } from 'react';
import { decimal, number } from '../format';

export interface Move {
  query: string;
  position: number;
  prevPosition: number | null;
  delta: number | null;
  clicks: number;
  impressions: number;
}

export interface MoveTab {
  id: string;
  label: string;
  rows: Move[];
  empty: string;
  hint?: string;
}

// "Rörelser": vilka sökord som klättrat, tappat, är nya eller ligger nära första sidan.
export function MovementCard({ tabs, comparable = true }: { tabs: MoveTab[]; comparable?: boolean }) {
  const firstWithRows = tabs.find((t) => t.rows.length > 0)?.id ?? tabs[0].id;
  const [active, setActive] = useState(firstWithRows);
  const tab = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <section className="adm-card">
      <div className="adm-card-head" style={{ flexWrap: 'wrap' }}>
        <h2 className="adm-card-title">Rörelser</h2>
        <div className="adm-tabs" role="tablist" style={{ marginBottom: 0 }}>
          {tabs.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={active === t.id} className={`adm-tab${active === t.id ? ' is-active' : ''}`} onClick={() => setActive(t.id)}>
              {t.label}{t.rows.length > 0 && <span className="adm-tab-count">{t.rows.length}</span>}
            </button>
          ))}
        </div>
      </div>
      {tab.hint && <p className="adm-hint" style={{ margin: '0 0 6px' }}>{tab.hint}</p>}
      {tab.rows.length === 0 ? <p className="adm-empty">{comparable || tab.id === 'near' ? tab.empty : 'Det finns ingen data från perioden före att jämföra med än.'}</p> : (
        <ul className="adm-list">
          {tab.rows.slice(0, 6).map((r) => (
            <li key={r.query}>
              <span className="grow adm-truncate" style={{ maxWidth: '100%' }}>{r.query}</span>
              {r.delta !== null && Math.abs(r.delta) >= 0.05 && (
                <span className={`adm-chip ${r.delta > 0 ? 'up' : 'down'}`}>
                  {r.delta > 0 ? '▲' : '▼'} {decimal(Math.abs(r.delta))}
                </span>
              )}
              {comparable && r.prevPosition === null && <span className="adm-chip new">Ny</span>}
              <span className="when" style={{ minWidth: 92, textAlign: 'right' }}>
                plats {decimal(r.position)}
                {tab.id === 'near' && <><br />{number(r.impressions)} visningar</>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
