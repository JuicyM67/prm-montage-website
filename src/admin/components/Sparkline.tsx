// Minidiagram för stat-rutor. Rent dekorativt (aria-hidden) — värdet och förändringen står som text i rutan.
// invert: lägre värde ritas högre upp (för position, där lägre är bättre).
export function Sparkline({ values, invert = false }: { values: number[]; invert?: boolean }) {
  if (values.length < 2 || Math.max(...values) <= 0) return null;
  const W = 120;
  const H = 34;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const y = (v: number) => {
    const t = (v - min) / range;
    return 3 + (invert ? t : 1 - t) * (H - 6);
  };
  const points = values.map((v, i) => `${((i / (values.length - 1)) * W).toFixed(1)},${y(v).toFixed(1)}`);
  return (
    <svg className="adm-spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
      <polygon points={`0,${H} ${points.join(' ')} ${W},${H}`} fill="currentColor" opacity="0.1" />
      <polyline points={points.join(' ')} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
