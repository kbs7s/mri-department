import { useStore } from '../data/store.jsx';
import { save } from '../data/backend.js';
import { DEVICES, fmt, n0, num, ymLabel } from '../data/model.js';
import { contrastCounts, deviceTotals, staffTotals } from '../data/derived.js';
import { MonthPicker, CellNum, Stat, Icon } from '../components/ui.jsx';

export default function Stats({ ym, setYm, go }) {
  const { activeStaff, stats, materials, inventory, isAdmin } = useStore();
  const st = stats[ym] || {};
  const put = (data) => save('stats', ym, { ym, ...data });
  const sTot = staffTotals(st, activeStaff);
  const dTot = deviceTotals(st);
  const contrast = contrastCounts(materials, inventory, ym);
  const staffGrand = sTot.mri + sTot.ct;

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-head-title">
          <h2>إحصائية الفحوصات</h2>
          <span className="page-sub">تسجيل عمل الأجهزة وإنتاجية الموظفين لشهر {ymLabel(ym)}</span>
        </div>
        <MonthPicker ym={ym} onChange={setYm} />
      </div>

      <div className="stats-grid">
        <Stat label="إجمالي الفحوصات" value={fmt(dTot.count)} icon="stats" />
        <Stat label="إجمالي المبالغ" value={fmt(dTot.amount)} icon="salaries" tone="accent" />
        <Stat label="فحوصات الموظفين (MRI + CT)" value={fmt(staffGrand)} icon="users" sub={`MRI ${fmt(sTot.mri)} · CT ${fmt(sTot.ct)}`} />
      </div>

      <div className="two-col">
        <section className="card">
          <div className="card-head">
            <h3>
              <span className="card-title-icon"><Icon name="activity" size={16} /></span>
              <span>عمل الأجهزة والمبالغ</span>
            </h3>
          </div>
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
          <div className="card-head">
            <h3>
              <span className="card-title-icon"><Icon name="scan" size={16} /></span>
              <span>الفحوصات الملونة والعادية</span>
            </h3>
          </div>
          <p className="muted small">الملونة تؤخذ تلقائيًا من الجرد الشهري، والعادية = المجموع − الملونة.</p>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>الجهاز</th><th>المجموع</th><th>ملونة</th><th>عادية</th><th>نسبة الملون</th></tr></thead>
              <tbody>
                {['mri', 'ct'].map((k) => {
                  const total = num(st.devices?.[k]?.count);
                  const c = contrast[k];
                  const pct = total && c != null ? Math.min(100, Math.round((c / total) * 100)) : null;
                  return (
                    <tr key={k}>
                      <th>{DEVICES.find((d) => d.key === k).label}</th>
                      <td>{fmt(total)}</td>
                      <td><b>{fmt(c)}</b></td>
                      <td>{total != null && c != null ? fmt(total - c) : '—'}</td>
                      <td>
                        {pct != null ? (
                          <div className="inline-bar-cell">
                            <div className="inline-bar"><span style={{ width: `${pct}%` }} /></div>
                            <span className="small muted">{pct}%</span>
                          </div>
                        ) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="card">
        <div className="card-head">
          <h3>
            <span className="card-title-icon"><Icon name="users" size={16} /></span>
            <span>عمل الموظفين</span>
          </h3>
          {activeStaff.length > 0 && <span className="badge accent">{activeStaff.length} موظف</span>}
        </div>
        {!activeStaff.length ? (
          <p className="muted">لا يوجد موظفون. <button className="link" onClick={() => go('settings')}>أضفهم من الإعدادات</button></p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>الموظف</th><th>MRI</th><th>CT</th><th>المجموع</th><th>الحصة</th></tr></thead>
              <tbody>
                {activeStaff.map((s) => {
                  const rowTotal = n0(st.staff?.[s.id]?.mri) + n0(st.staff?.[s.id]?.ct);
                  const share = staffGrand > 0 ? Math.round((rowTotal / staffGrand) * 100) : 0;
                  return (
                    <tr key={s.id}>
                      <th>{s.name}</th>
                      <td><CellNum value={st.staff?.[s.id]?.mri} disabled={!isAdmin} onSave={(v) => put({ staff: { [s.id]: { mri: v } } })} /></td>
                      <td><CellNum value={st.staff?.[s.id]?.ct} disabled={!isAdmin} onSave={(v) => put({ staff: { [s.id]: { ct: v } } })} /></td>
                      <td><b>{fmt(rowTotal)}</b></td>
                      <td>
                        <div className="inline-bar-cell">
                          <div className="inline-bar"><span style={{ width: `${share}%` }} /></div>
                          <span className="small muted">{share}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <th>المجموع</th>
                  <td>{fmt(sTot.mri)}</td>
                  <td>{fmt(sTot.ct)}</td>
                  <td>{fmt(staffGrand)}</td>
                  <td>100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
