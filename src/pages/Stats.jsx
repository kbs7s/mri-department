import { useStore } from '../data/store.jsx';
import { save } from '../data/backend.js';
import { DEVICES, fmt, n0, num } from '../data/model.js';
import { contrastCounts, deviceTotals, staffTotals } from '../data/derived.js';
import { MonthPicker, CellNum } from '../components/ui.jsx';

export default function Stats({ ym, setYm, go }) {
  const { activeStaff, stats, materials, inventory, isAdmin } = useStore();
  const st = stats[ym] || {};
  const put = (data) => save('stats', ym, { ym, ...data });
  const sTot = staffTotals(st, activeStaff);
  const dTot = deviceTotals(st);
  const contrast = contrastCounts(materials, inventory, ym);

  return (
    <div className="page">
      <div className="page-head">
        <h2>إحصائية الفحوصات</h2>
        <MonthPicker ym={ym} onChange={setYm} />
      </div>

      <section className="card">
        <h3>عمل الأجهزة والمبالغ</h3>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>الجهاز</th><th>عدد الفحوصات</th><th>المبلغ</th></tr></thead>
            <tbody>
              {DEVICES.map((d) => (
                <tr key={d.key}>
                  <th>{d.label}</th>
                  <td><CellNum value={st.devices?.[d.key]?.count} disabled={!isAdmin} onSave={(v) => put({ devices: { [d.key]: { count: v } } })} /></td>
                  <td><CellNum value={st.devices?.[d.key]?.amount} disabled={!isAdmin} onSave={(v) => put({ devices: { [d.key]: { amount: v } } })} /></td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr><th>المجموع</th><td>{fmt(dTot.count)}</td><td>{fmt(dTot.amount)}</td></tr></tfoot>
          </table>
        </div>
      </section>

      <section className="card">
        <h3>الفحوصات الملونة والعادية</h3>
        <p className="muted small">الملونة تؤخذ من الجرد الشهري، والعادية = المجموع − الملونة.</p>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>الجهاز</th><th>المجموع</th><th>ملونة</th><th>عادية</th></tr></thead>
            <tbody>
              {['mri', 'ct'].map((k) => {
                const total = num(st.devices?.[k]?.count);
                const c = contrast[k];
                return (
                  <tr key={k}>
                    <th>{DEVICES.find((d) => d.key === k).label}</th>
                    <td>{fmt(total)}</td><td>{fmt(c)}</td>
                    <td>{total != null && c != null ? fmt(total - c) : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h3>عمل الموظفين</h3>
        {!activeStaff.length ? (
          <p className="muted">لا يوجد موظفون. <button className="link" onClick={() => go('settings')}>أضفهم من الإعدادات</button></p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>الموظف</th><th>MRI</th><th>CT</th><th>المجموع</th></tr></thead>
              <tbody>
                {activeStaff.map((s) => (
                  <tr key={s.id}>
                    <th>{s.name}</th>
                    <td><CellNum value={st.staff?.[s.id]?.mri} disabled={!isAdmin} onSave={(v) => put({ staff: { [s.id]: { mri: v } } })} /></td>
                    <td><CellNum value={st.staff?.[s.id]?.ct} disabled={!isAdmin} onSave={(v) => put({ staff: { [s.id]: { ct: v } } })} /></td>
                    <td>{fmt(n0(st.staff?.[s.id]?.mri) + n0(st.staff?.[s.id]?.ct))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr><th>المجموع</th><td>{fmt(sTot.mri)}</td><td>{fmt(sTot.ct)}</td><td>{fmt(sTot.mri + sTot.ct)}</td></tr></tfoot>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
