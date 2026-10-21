import { useState, type ReactNode } from 'react';

export interface Column<T> {
  label: string;
  align?: 'right';
  render: (row: T) => ReactNode;
}

export interface TableTab<T = any> {
  id: string;
  label: string;
  rows: T[];
  columns: Column<T>[];
  // Text som sökfältet filtrerar på.
  searchText: (row: T) => string;
  empty?: string;
}

// En enda tabell med flikar (t.ex. Sökord | Sidor): visar `initial` rader, sökfält och "Visa alla".
export function TabbedTable({ tabs, initial = 10, title }: { tabs: TableTab[]; initial?: number; title?: string }) {
  const [active, setActive] = useState(tabs[0].id);
  const [filter, setFilter] = useState('');
  const [expanded, setExpanded] = useState(false);
  const tab = tabs.find((t) => t.id === active) ?? tabs[0];

  const needle = filter.trim().toLowerCase();
  const filtered = needle ? tab.rows.filter((r) => tab.searchText(r).toLowerCase().includes(needle)) : tab.rows;
  const visible = expanded || needle ? filtered : filtered.slice(0, initial);

  const select = (id: string) => { setActive(id); setFilter(''); setExpanded(false); };

  return (
    <section className="adm-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="adm-card-head adm-table-head" style={{ flexWrap: 'wrap', margin: 0 }}>
        {title && <h2 className="adm-card-title">{title}</h2>}
        <div className="adm-tabs" role="tablist" style={{ marginBottom: 0 }}>
          {tabs.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={active === t.id} className={`adm-tab${active === t.id ? ' is-active' : ''}`} onClick={() => select(t.id)}>
              {t.label}<span className="adm-tab-count">{t.rows.length}</span>
            </button>
          ))}
        </div>
        {tab.rows.length > initial && (
          <input className="adm-input adm-filter" type="search" placeholder="Filtrera…" aria-label={`Filtrera ${tab.label.toLowerCase()}`} value={filter} onChange={(e) => setFilter(e.target.value)} />
        )}
      </div>
      <div className="adm-table-wrap" style={{ borderRadius: 0 }}>
        <table className="adm-table">
          <thead>
            <tr>{tab.columns.map((c) => <th key={c.label} className={c.align === 'right' ? 'num' : undefined}>{c.label}</th>)}</tr>
          </thead>
          <tbody>
            {visible.length === 0 && <tr><td colSpan={tab.columns.length} className="adm-empty">{needle ? 'Inga träffar.' : tab.empty ?? 'Ingen data i perioden.'}</td></tr>}
            {visible.map((row, i) => (
              <tr key={i}>{tab.columns.map((c) => <td key={c.label} className={c.align === 'right' ? 'num' : undefined}>{c.render(row)}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
      {!needle && filtered.length > initial && (
        <div style={{ padding: '10px 20px 14px', borderTop: '1px solid var(--adm-line)' }}>
          <button type="button" className="adm-btn secondary small" onClick={() => setExpanded((e) => !e)}>
            {expanded ? 'Visa färre' : `Visa alla ${filtered.length}`}
          </button>
        </div>
      )}
    </section>
  );
}
