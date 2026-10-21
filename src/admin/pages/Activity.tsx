import { useApi } from '../api';
import { describeActivity, fullDate, timeAgo } from '../format';

interface Row {
  id: number;
  created_at: string;
  action: string;
  subject: string | null;
  user_name: string | null;
  meta: any;
}

export default function Activity() {
  const { data, error, loading } = useApi<{ activity: Row[] }>('/api/admin/activity');
  return (
    <>
      <div className="adm-head-wrap">
        <h1 className="adm-h1">Aktivitetslogg</h1>
        <p className="adm-sub" style={{ marginBottom: 0 }}>De 200 senaste händelserna</p>
      </div>
      {error && <div className="adm-alert error" role="alert">{error}</div>}
      <section className="adm-card">
        {loading && !data ? <div className="adm-skeleton" /> : data?.activity.length === 0 ? (
          <p className="adm-empty">Ingen aktivitet än.</p>
        ) : (
          <ul className="adm-list">
            {data?.activity.map((a) => (
              <li key={a.id}>
                <span className="grow">{describeActivity(a)}</span>
                <span className="when" title={fullDate(a.created_at)}>{timeAgo(a.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
