import { useCallback, useState } from 'react';

// Samma val på Översikt, Sökord & ranking och Besökare. Valet sparas i webbläsaren och följer med mellan sidorna.
export const PERIODS = [
  { id: '7d', label: '7 dagar' },
  { id: '28d', label: '28 dagar' },
  { id: '90d', label: '90 dagar' },
  { id: 'month', label: 'Den här månaden' },
  { id: 'lastmonth', label: 'Förra månaden' },
  { id: 'year', label: 'Det här året' },
] as const;

export type PeriodId = (typeof PERIODS)[number]['id'];
const KEY = 'adm-period';

function read(): PeriodId {
  try {
    const value = localStorage.getItem(KEY);
    return PERIODS.some((p) => p.id === value) ? (value as PeriodId) : '28d';
  } catch {
    return '28d';
  }
}

export function usePeriod() {
  const [period, set] = useState<PeriodId>(read);
  const setPeriod = useCallback((next: PeriodId) => {
    set(next);
    try { localStorage.setItem(KEY, next); } catch { /* ignore */ }
  }, []);
  return [period, setPeriod] as const;
}

export const periodLabel = (id: PeriodId) => PERIODS.find((p) => p.id === id)?.label ?? '';

// Segmenterad kontroll på desktop, rullista på mobil (se .adm-period-* i admin.css).
export function PeriodPicker({ value, onChange }: { value: PeriodId; onChange: (id: PeriodId) => void }) {
  return (
    <>
      <div className="adm-tabs adm-period-tabs" role="tablist" aria-label="Period" style={{ marginBottom: 0 }}>
        {PERIODS.map((p) => (
          <button key={p.id} type="button" role="tab" aria-selected={value === p.id} className={`adm-tab${value === p.id ? ' is-active' : ''}`} onClick={() => onChange(p.id)}>
            {p.label}
          </button>
        ))}
      </div>
      <select className="adm-input adm-period-select" aria-label="Period" value={value} onChange={(e) => onChange(e.target.value as PeriodId)}>
        {PERIODS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
      </select>
    </>
  );
}
