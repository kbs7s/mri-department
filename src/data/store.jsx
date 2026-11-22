import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { subscribe, isCloud } from './backend.js';
import { sortByOrder, mergePurchases } from './model.js';

const StoreCtx = createContext(null);
const COLS = ['materials', 'staff', 'inventory', 'stats', 'salaryFields', 'salaries', 'purchases', 'counts'];

export function StoreProvider({ user, children }) {
  const [data, setData] = useState({});
  const [pending, setPending] = useState({});
  const [errors, setErrors] = useState({});
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);

  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  useEffect(() => {
    if (!user || user.role === 'none') return;
    const cols = user.role === 'admin' ? [...COLS, 'users'] : COLS;
    const unsubs = cols.map((col) => subscribe(col, (list, hasPending) => {
      setData((d) => ({ ...d, [col]: list }));
      setPending((p) => ({ ...p, [col]: hasPending }));
    }, (err) => setErrors((e) => ({ ...e, [col]: err.message }))));
    return () => unsubs.forEach((u) => u && u());
  }, [user?.email, user?.role]);

  const value = useMemo(() => {
    const byId = (list) => Object.fromEntries((list || []).map((d) => [d.id, d]));
    const materials = [...(data.materials || [])].sort(sortByOrder);
    const staff = [...(data.staff || [])].sort(sortByOrder);
    const salaryFields = [...(data.salaryFields || [])].sort(sortByOrder);
    return {
      user,
      loaded: COLS.every((c) => data[c] !== undefined),
      materials, activeMaterials: materials.filter((m) => m.active !== false),
      staff, activeStaff: staff.filter((s) => s.active !== false),
      rawInventory: byId(data.inventory),
      // الشراء في الجرد الشهري يُحسب من سجل المشتريات عند وجوده
      inventory: mergePurchases(byId(data.inventory), data.purchases || []),
      purchases: [...(data.purchases || [])].sort((a, b) => String(b.date).localeCompare(String(a.date))),
      counts: [...(data.counts || [])].sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.id).localeCompare(String(a.id))),
      stats: byId(data.stats),
      salaryFields,
      salaries: byId(data.salaries),
      users: data.users || [],
      isAdmin: user?.role === 'admin',
      canSalaries: user?.role === 'admin' || user?.role === 'manager',
      pendingSync: Object.values(pending).some(Boolean),
      online, isCloud, errors
    };
  }, [data, pending, online, user, errors]);

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export const useStore = () => useContext(StoreCtx);
