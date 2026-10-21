import { Sparkline } from './Sparkline';
import { Delta } from '../pages/shared';

interface Props {
  label: string;
  value: string;
  cur?: number;
  prev?: number;
  invert?: boolean;
  abs?: boolean;
  series?: number[];
  loading?: boolean;
}

export function StatTile({ label, value, cur, prev, invert, abs, series, loading }: Props) {
  return (
    <div className="adm-stat adm-tile">
      <div className="adm-stat-num">
        {loading ? <div className="adm-skeleton" style={{ width: 70, height: 30 }} /> : (
          <>{value}{cur != null && prev != null && <Delta cur={cur} prev={prev} invert={invert} abs={abs} />}</>
        )}
      </div>
      <div className="adm-stat-label">{label}</div>
      {series && !loading && <Sparkline values={series} invert={invert} />}
    </div>
  );
}
