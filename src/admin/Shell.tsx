import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import {
  Widget5LinearIcon, Widget5BoldIcon,
  InboxLinearIcon, InboxBoldIcon,
  GraphUpLinearIcon, GraphUpBoldIcon,
  EyeLinearIcon, EyeBoldIcon,
  UsersGroupRoundedLinearIcon, UsersGroupRoundedBoldIcon,
  HistoryLinearIcon, HistoryBoldIcon,
  DoubleAltArrowLeftLinearIcon, DoubleAltArrowRightLinearIcon,
  Logout2LinearIcon, HamburgerMenuLinearIcon,
} from '@solar-icons/react';
import { authClient } from './auth-client';
import { api } from './api';
import Overview from './pages/Overview';
import Leads from './pages/Leads';
import Users from './pages/Users';
import Activity from './pages/Activity';
import Queries from './pages/Queries';
import Visitors from './pages/Visitors';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role?: string | null;
}

export type PageId = 'overview' | 'leads' | 'queries' | 'visitors' | 'users' | 'activity';

type IconProps = { size?: number };
interface NavItem {
  id: PageId;
  href: string;
  label: string;
  Icon: ComponentType<IconProps>;
  ActiveIcon: ComponentType<IconProps>;
}
const nav: { group: string | null; items: NavItem[] }[] = [
  { group: null, items: [{ id: 'overview', href: '/admin', label: 'Översikt', Icon: Widget5LinearIcon, ActiveIcon: Widget5BoldIcon }] },
  { group: 'Leads', items: [{ id: 'leads', href: '/admin/forfragningar', label: 'Förfrågningar', Icon: InboxLinearIcon, ActiveIcon: InboxBoldIcon }] },
  {
    group: 'Synlighet',
    items: [
      { id: 'queries', href: '/admin/sokord', label: 'Sökord & ranking', Icon: GraphUpLinearIcon, ActiveIcon: GraphUpBoldIcon },
      { id: 'visitors', href: '/admin/besokare', label: 'Besökare', Icon: EyeLinearIcon, ActiveIcon: EyeBoldIcon },
    ],
  },
  {
    group: 'System',
    items: [
      { id: 'users', href: '/admin/anvandare', label: 'Användare', Icon: UsersGroupRoundedLinearIcon, ActiveIcon: UsersGroupRoundedBoldIcon },
      { id: 'activity', href: '/admin/aktivitet', label: 'Aktivitetslogg', Icon: HistoryLinearIcon, ActiveIcon: HistoryBoldIcon },
    ],
  },
];

const readCollapsed = () => {
  try { return localStorage.getItem('adm-collapsed') === '1'; } catch { return false; }
};

export default function Shell({ page }: { page: PageId }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [checked, setChecked] = useState(false);
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [open, setOpen] = useState(false);
  const [newLeads, setNewLeads] = useState(0);

  useEffect(() => {
    authClient.getSession().then(({ data }) => {
      if (!data?.user) {
        window.location.replace('/admin/login');
        return;
      }
      setUser(data.user as AdminUser);
      setChecked(true);
    }).catch(() => window.location.replace('/admin/login'));
  }, []);

  useEffect(() => {
    if (!user) return;
    api<{ leadsNew: number }>('/api/admin/overview').then((d) => setNewLeads(d.leadsNew)).catch(() => {});
  }, [user, page]);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      try { localStorage.setItem('adm-collapsed', c ? '0' : '1'); } catch { /* ignore */ }
      return !c;
    });
  };

  const logout = async () => {
    await authClient.signOut();
    window.location.href = '/admin/login';
  };

  if (!checked || !user) return <div className="adm-loading">Laddar…</div>;

  const current = nav.flatMap((g) => g.items).find((i) => i.id === page);
  let content: ReactNode;
  switch (page) {
    case 'overview': content = <Overview user={user} />; break;
    case 'leads': content = <Leads />; break;
    case 'queries': content = <Queries />; break;
    case 'visitors': content = <Visitors />; break;
    case 'users': content = <Users me={user} />; break;
    case 'activity': content = <Activity />; break;
  }

  return (
    <div className={`adm-shell${collapsed ? ' is-collapsed' : ''}${open ? ' is-open' : ''}`}>
      <aside className="adm-side" aria-label="Huvudmeny">
        <a className="adm-brand" href="/admin" aria-label="PRM Montage admin">
          <img src="/assets/img/logo/logo-white.webp" alt="PRM Montage" height={36} />
          <span className="adm-brand-mark" aria-hidden="true">P</span>
        </a>
        <nav className="adm-nav">
          {nav.map((g, i) => (
            <div key={i}>
              {g.group && <div className="adm-group">{g.group}</div>}
              {g.items.map(({ id, href, label, Icon, ActiveIcon }) => {
                const active = id === page;
                const I = active ? ActiveIcon : Icon;
                return (
                  <a key={id} href={href} className={`adm-link${active ? ' is-active' : ''}`} aria-current={active ? 'page' : undefined} title={collapsed ? label : undefined}>
                    <I size={22} />
                    <span className="adm-label">{label}</span>
                    {id === 'leads' && newLeads > 0 && <span className="adm-badge" aria-label={`${newLeads} nya`}>{newLeads}</span>}
                  </a>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="adm-side-foot">
          <button type="button" className="adm-link" onClick={toggleCollapsed} title={collapsed ? 'Fäll ut menyn' : undefined}>
            {collapsed ? <DoubleAltArrowRightLinearIcon size={22} /> : <DoubleAltArrowLeftLinearIcon size={22} />}
            <span className="adm-label">Fäll ihop menyn</span>
          </button>
          <button type="button" className="adm-link" onClick={logout} title={collapsed ? 'Logga ut' : undefined}>
            <Logout2LinearIcon size={22} />
            <span className="adm-label">Logga ut</span>
          </button>
        </div>
      </aside>
      {open && <div className="adm-scrim" onClick={() => setOpen(false)} />}
      <main className="adm-main">
        <div className="adm-topbar">
          <button type="button" onClick={() => setOpen(true)} aria-label="Öppna menyn"><HamburgerMenuLinearIcon size={24} /></button>
          <strong>{current?.label}</strong>
        </div>
        <div className="adm-content">{content}</div>
      </main>
    </div>
  );
}
