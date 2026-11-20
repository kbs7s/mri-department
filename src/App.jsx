import { useEffect, useState } from 'react';
import { onAuth, logout, isCloud } from './data/backend.js';
import { StoreProvider, useStore } from './data/store.jsx';
import { currentYm, ymLabel } from './data/model.js';
import { Icon, usePersistentState } from './components/ui.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Inventory from './pages/Inventory.jsx';
import Stats from './pages/Stats.jsx';
import Salaries from './pages/Salaries.jsx';
import Reports from './pages/Reports.jsx';
import Settings from './pages/Settings.jsx';

const PAGES = [
  { key: 'home', label: 'الرئيسية', icon: 'home', comp: Dashboard },
  { key: 'inventory', label: 'الجرد', icon: 'inventory', comp: Inventory },
  { key: 'stats', label: 'الإحصائية', icon: 'stats', comp: Stats },
  { key: 'salaries', label: 'الرواتب', icon: 'salaries', comp: Salaries, salaries: true },
  { key: 'reports', label: 'التقارير', icon: 'reports', comp: Reports },
  { key: 'settings', label: 'الإعدادات', icon: 'settings', comp: Settings, admin: true }
];

function useTheme() {
  const [theme, setTheme] = usePersistentState('mri-theme', 'auto');
  const [resolvedDark, setResolvedDark] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'auto' && mq.matches);
      setResolvedDark(dark);
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    };
    apply();
    mq.addEventListener?.('change', apply);
    return () => mq.removeEventListener?.('change', apply);
  }, [theme]);

  const toggle = () => setTheme(resolvedDark ? 'light' : 'dark');
  return { dark: resolvedDark, toggle };
}

export default function App() {
  const [user, setUser] = useState(undefined);
  const theme = useTheme();
  useEffect(() => onAuth(setUser), []);

  if (user === undefined) {
    return (
      <div className="splash">
        <div className="splash-loader">
          <div className="mri-spinner" />
          <span>جارِ التحميل…</span>
        </div>
      </div>
    );
  }
  if (!user) return <Login />;
  if (user.role === 'none') {
    return (
      <div className="splash">
        <div className="card narrow no-access-card">
          <div className="no-access-icon"><Icon name="shield" size={28} /></div>
          <h2>لا توجد صلاحية</h2>
          <p className="muted">
            الحساب <b dir="ltr">{user.email}</b> غير مضاف بعد. اطلب من مدير الموقع إضافته من صفحة الإعدادات.
          </p>
          <button className="btn primary block" onClick={logout}>
            <Icon name="logout" size={16} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </div>
    );
  }
  return <StoreProvider user={user}><Shell theme={theme} /></StoreProvider>;
}

function Shell({ theme }) {
  const store = useStore();
  const [page, setPage] = usePersistentState('mri-page', 'home');
  const [ym, setYm] = usePersistentState('mri-ym', currentYm());
  const pages = PAGES.filter((p) => (!p.salaries || store.canSalaries) && (!p.admin || store.isAdmin));
  const active = pages.find((p) => p.key === page) || pages[0];
  const Comp = active.comp;
  const roleLabel = store.user.role === 'admin' ? 'مسؤول النظام' : 'مدير المركز';

  return (
    <div className="app">
      <aside className="sidebar" aria-label="التنقل الرئيسي">
        <div className="sidebar-brand">
          <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" />
          <div className="sidebar-brand-text">
            <div className="brand-title">جرد قسم الأشعة</div>
            <div className="brand-sub">إدارة الرنين والمفراس</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {pages.map((p) => (
            <button
              key={p.key}
              className={`nav-item ${p.key === active.key ? 'active' : ''}`}
              onClick={() => setPage(p.key)}
            >
              <span className="nav-icon"><Icon name={p.icon} size={19} /></span>
              <span>{p.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-pill">
            <div className="user-avatar" aria-hidden="true">
              {(store.user.email || 'U').slice(0, 1).toUpperCase()}
            </div>
            <div className="user-meta">
              <div className="user-role">{roleLabel}</div>
              <div className="user-email" dir="ltr">{store.user.email}</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div className="topbar-start">
            <div className="brand mobile-only">
              <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" />
              <div>
                <div className="brand-title">جرد قسم الأشعة</div>
                <div className="brand-sub">{roleLabel}</div>
              </div>
            </div>
            <div className="desktop-crumb desktop-only">
              <span className="crumb-page">{active.label}</span>
              <span className="crumb-sep">·</span>
              <span className="crumb-month">{ymLabel(ym)}</span>
            </div>
          </div>

          <div className="top-actions">
            <SyncBadge />
            <button
              type="button"
              className="icon-btn theme-btn"
              onClick={theme.toggle}
              aria-label={theme.dark ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي'}
              title={theme.dark ? 'الوضع النهاري' : 'الوضع الليلي'}
            >
              <Icon name={theme.dark ? 'sun' : 'moon'} size={18} />
            </button>
            {isCloud && (
              <button className="btn ghost small" onClick={logout} title="تسجيل الخروج">
                <Icon name="logout" size={16} />
                <span className="hide-xs">خروج</span>
              </button>
            )}
          </div>
        </header>

        {!isCloud && (
          <div className="banner">
            <Icon name="info" size={16} />
            <span>الوضع التجريبي: البيانات محفوظة على هذا الجهاز فقط إلى أن يُربط الموقع بـ Firebase.</span>
          </div>
        )}

        <main className="content">
          {!store.loaded ? (
            <div className="loading-state">
              <div className="mri-spinner" />
              <span>جارِ تحميل البيانات…</span>
            </div>
          ) : (
            <Comp ym={ym} setYm={setYm} go={setPage} />
          )}
        </main>
      </div>

      <nav className="mobile-tabs" aria-label="التنقل السفلي">
        {pages.map((p) => (
          <button
            key={p.key}
            className={`tab ${p.key === active.key ? 'active' : ''}`}
            onClick={() => setPage(p.key)}
          >
            <span className="tab-icon"><Icon name={p.icon} size={20} /></span>
            <span>{p.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function SyncBadge() {
  const { online, pendingSync, isCloud: cloud } = useStore();
  if (!cloud) {
    return (
      <span className="badge gray">
        <span className="status-dot" />
        <span>محلي</span>
      </span>
    );
  }
  if (!online) {
    return (
      <span className="badge warn">
        <span className="status-dot" />
        <span>بدون إنترنت{pendingSync ? ' · بانتظار المزامنة' : ''}</span>
      </span>
    );
  }
  if (pendingSync) {
    return (
      <span className="badge warn">
        <span className="status-dot pulse" />
        <span>جارِ المزامنة…</span>
      </span>
    );
  }
  return (
    <span className="badge ok">
      <span className="status-dot pulse" />
      <span>متزامن</span>
    </span>
  );
}
