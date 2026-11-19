import { useEffect, useState } from 'react';
import { onAuth, logout, isCloud } from './data/backend.js';
import { StoreProvider, useStore } from './data/store.jsx';
import { currentYm } from './data/model.js';
import { usePersistentState } from './components/ui.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Inventory from './pages/Inventory.jsx';
import Stats from './pages/Stats.jsx';
import Salaries from './pages/Salaries.jsx';
import Reports from './pages/Reports.jsx';
import Settings from './pages/Settings.jsx';

const PAGES = [
  { key: 'home', label: 'الرئيسية', icon: '⌂', comp: Dashboard },
  { key: 'inventory', label: 'الجرد', icon: '▤', comp: Inventory },
  { key: 'stats', label: 'الإحصائية', icon: '▥', comp: Stats },
  { key: 'salaries', label: 'الرواتب', icon: '◈', comp: Salaries, salaries: true },
  { key: 'reports', label: 'التقارير', icon: '▦', comp: Reports },
  { key: 'settings', label: 'الإعدادات', icon: '⚙', comp: Settings }
];

export default function App() {
  const [user, setUser] = useState(undefined);
  useEffect(() => onAuth(setUser), []);

  if (user === undefined) return <div className="splash">جارِ التحميل…</div>;
  if (!user) return <Login />;
  if (user.role === 'none') {
    return (
      <div className="splash">
        <div className="card narrow">
          <h2>لا توجد صلاحية</h2>
          <p>الحساب <b dir="ltr">{user.email}</b> غير مضاف بعد. اطلب من مدير الموقع إضافته من صفحة الإعدادات.</p>
          <button className="btn" onClick={logout}>تسجيل الخروج</button>
        </div>
      </div>
    );
  }
  return <StoreProvider user={user}><Shell /></StoreProvider>;
}

function Shell() {
  const store = useStore();
  const [page, setPage] = usePersistentState('mri-page', 'home');
  const [ym, setYm] = usePersistentState('mri-ym', currentYm());
  const pages = PAGES.filter((p) => (!p.salaries || store.canSalaries));
  const active = pages.find((p) => p.key === page) || pages[0];
  const Comp = active.comp;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" />
          <div>
            <div className="brand-title">جرد قسم الأشعة</div>
            <div className="brand-sub">{store.user.email}{store.user.role === 'manager' ? ' · مدير المركز' : ''}</div>
          </div>
        </div>
        <div className="top-actions">
          <SyncBadge />
          {isCloud && <button className="btn ghost small" onClick={logout}>خروج</button>}
        </div>
      </header>
      {!isCloud && (
        <div className="banner">الوضع التجريبي: البيانات محفوظة على هذا الجهاز فقط إلى أن يُربط الموقع بـ Firebase.</div>
      )}
      <nav className="tabs">
        {pages.map((p) => (
          <button key={p.key} className={`tab ${p.key === active.key ? 'active' : ''}`} onClick={() => setPage(p.key)}>
            <span className="tab-icon" aria-hidden>{p.icon}</span>
            <span>{p.label}</span>
          </button>
        ))}
      </nav>
      <main className="content">
        {!store.loaded ? <div className="muted pad">جارِ تحميل البيانات…</div>
          : <Comp ym={ym} setYm={setYm} go={setPage} />}
      </main>
    </div>
  );
}

function SyncBadge() {
  const { online, pendingSync, isCloud: cloud } = useStore();
  if (!cloud) return <span className="badge gray">محلي</span>;
  if (!online) return <span className="badge warn">بدون إنترنت{pendingSync ? ' · بانتظار المزامنة' : ''}</span>;
  if (pendingSync) return <span className="badge warn">جارِ المزامنة…</span>;
  return <span className="badge ok">متزامن</span>;
}
