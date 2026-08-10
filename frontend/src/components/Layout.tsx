import { useState, type ComponentType } from 'react';
import { BookOpen, Database, GraduationCap, Home, LogOut, Newspaper, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { MeProvider, useMe } from '../me';
import Dialog from './Dialog';

type NavItem = {
  to: string;
  label: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number; 'aria-hidden'?: boolean }>;
  end?: boolean;
};

function AppNav({ mobile = false }: { mobile?: boolean }) {
  const me = useMe();
  const items: NavItem[] = [
    { to: '/', label: 'Feed', icon: Home, end: true },
    { to: '/library', label: 'Library', icon: BookOpen },
    { to: '/study', label: 'Study', icon: GraduationCap },
    ...(me?.is_admin ? [{ to: '/admin', label: 'Database', icon: Database }] : []),
  ];

  return (
    <nav className={mobile ? 'mobile-tabbar' : 'rail-nav'} aria-label="Primary navigation">
      {items.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `${mobile ? 'mobile-tab' : 'rail-link'}${isActive ? ' active' : ''}`
          }
        >
          <Icon size={mobile ? 21 : 19} strokeWidth={2} aria-hidden />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function LayoutChrome({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  const me = useMe();
  const [updatesOpen, setUpdatesOpen] = useState(false);

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <div className="shell">
        <aside className="rail rail-left">
          <div className="brand-block">
            <span className="brand-mark">ARGUS</span>
            <span className="brand-tag">Textbook social</span>
          </div>
          <AppNav />
          <div className="rail-foot">
            {me && (
              <p className="rail-user" title={me.email}>
                {me.is_admin ? me.email : 'Guest session'}
              </p>
            )}
            <a href="/logout" className="rail-link subtle">
              <LogOut size={18} strokeWidth={2} aria-hidden />
              <span>Log out</span>
            </a>
          </div>
        </aside>

        <div className="mobile-topbar">
          <span className="mobile-brand">ARGUS</span>
          <button
            type="button"
            className="icon-button"
            aria-label="Open updates"
            onClick={() => setUpdatesOpen(true)}
          >
            <Newspaper size={20} aria-hidden />
          </button>
        </div>

        <main id="main-content" className="center-col" tabIndex={-1}>
          {children}
        </main>
        <aside className="rail rail-right" aria-label="Updates">
          {right}
        </aside>
        <AppNav mobile />
      </div>

      <Dialog
        open={updatesOpen}
        onClose={() => setUpdatesOpen(false)}
        labelledBy="updates-dialog-title"
        className="updates-dialog"
      >
        <div className="dialog-header">
          <div>
            <p className="eyebrow">Live activity</p>
            <h2 id="updates-dialog-title">Updates</h2>
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label="Close updates"
            onClick={() => setUpdatesOpen(false)}
          >
            <X size={20} aria-hidden />
          </button>
        </div>
        <div className="dialog-body">{right}</div>
      </Dialog>
    </>
  );
}

export default function Layout({
  children,
  right,
}: {
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <MeProvider>
      <LayoutChrome right={right}>{children}</LayoutChrome>
    </MeProvider>
  );
}
