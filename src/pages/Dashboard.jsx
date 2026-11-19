import { useStore } from '../data/store.jsx';
import { DEVICES, fmt, itemFor, num, shiftYm, MONTHS, parseYm, invId, ymLabel } from '../data/model.js';
import { contrastCounts, deviceTotals } from '../data/derived.js';
import { MonthPicker, Stat, BarChart, Icon } from '../components/ui.jsx';

export default function Dashboard({ ym, setYm, go }) {
  const { activeMaterials, inventory, stats, materials } = useStore();
  const st = stats[ym] || {};
  const tot = deviceTotals(st);
  const contrast = contrastCounts(materials, inventory, ym);
  const mriTotal = num(st.devices?.mri?.count);
  const ctTotal = num(st.devices?.ct?.count);

  const last12 = Array.from({ length: 12 }, (_, i) => shiftYm(ym, i - 11));
  const shortLabel = (s) => { const { y, m } = parseYm(s); return `${m}/${String(y).slice(2)}`; };

  const missing = last12.slice(-6).filter((s) =>
    !stats[s] || activeMaterials.some((m) => !inventory[invId(s, m.id)]));

  const lowCount = activeMaterials.filter((m) => {
    const { remaining } = itemFor(inventory, m.id, ym);
    return m.minStock != null && remaining != null && remaining < m.minStock;
  }).length;

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-head-title">
          <h2>نظرة عامة</h2>
          <span className="page-sub">ملخص أداء القسم والمخزون لشهر {ymLabel(ym)}</span>
        </div>
        <MonthPicker ym={ym} onChange={setYm} />
      </div>

      <div className="stats-grid">
        <Stat
          label="فحوصات الرنين MRI"
          value={fmt(mriTotal)}
          icon="scan"
          sub={contrast.mri != null ? `ملونة ${fmt(contrast.mri)} · عادية ${mriTotal != null ? fmt(mriTotal - contrast.mri) : '—'}` : 'لا توجد بيانات صبغة مسجلة'}
        />
        <Stat
          label="فحوصات المفراس CT"
          value={fmt(ctTotal)}
          icon="activity"
          sub={contrast.ct != null ? `ملونة ${fmt(contrast.ct)} · عادية ${ctTotal != null ? fmt(ctTotal - contrast.ct) : '—'}` : 'لا توجد بيانات صبغة مسجلة'}
        />
        <Stat
          label="مجموع الفحوصات"
          value={fmt(tot.count)}
          icon="stats"
          sub={DEVICES.map((d) => `${d.key.toUpperCase()} ${fmt(st.devices?.[d.key]?.count)}`).join(' · ')}
        />
        <Stat
          label="المبلغ الكلي"
          value={fmt(tot.amount)}
          icon="salaries"
          tone="accent"
          sub={`إجمالي إيرادات ${ymLabel(ym)}`}
        />
      </div>

      <section className="card">
        <div className="card-head">
          <h3>
            <span className="card-title-icon"><Icon name="inventory" size={16} /></span>
            <span>المخزون الحالي</span>
            {lowCount > 0 && <span className="badge warn">{lowCount} منخفض</span>}
          </h3>
          <button className="link" onClick={() => go('inventory')}>
            <span>فتح الجرد</span>
            <Icon name="chevronLeft" size={16} />
          </button>
        </div>
        {!activeMaterials.length ? (
          <p className="muted small">لا توجد مواد فعّالة بعد. يمكنك إضافتها من صفحة الجرد أو الإعدادات.</p>
        ) : (
          <div className="stock-list">
            {activeMaterials.map((m) => {
              const { remaining, diff } = itemFor(inventory, m.id, ym);
              const low = m.minStock != null && remaining != null && remaining < m.minStock;
              const pct = m.minStock ? Math.min(100, ((remaining || 0) / (m.minStock * 3)) * 100) : 50;
              return (
                <div key={m.id} className={`stock ${low ? 'low' : ''}`}>
                  <div className="stock-top">
                    <span className="stock-name">{m.name}</span>
                    <span className="stock-qty">{fmt(remaining)} <small className="muted">{m.unit}</small></span>
                  </div>
                  <div className="meter"><div style={{ width: `${pct}%` }} /></div>
                  <div className="row between">
                    <span className="muted small">
                      {low ? `أقل من الحد الأدنى (${m.minStock})` : `الحد الأدنى ${fmt(m.minStock)}`}
                      {diff ? ` · فرق ${fmt(diff)}` : ''}
                    </span>
                    <span className={`badge ${low ? 'warn' : 'ok'}`}>{low ? 'منخفض' : 'جيد'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="two-col">
        <section className="card">
          <div className="card-head">
            <h3>
              <span className="card-title-icon"><Icon name="scan" size={16} /></span>
              <span>فحوصات الرنين (آخر 12 شهر)</span>
            </h3>
          </div>
          <BarChart data={last12.map((s) => ({ label: s, short: shortLabel(s), value: num(stats[s]?.devices?.mri?.count) || 0 }))} />
        </section>

        <section className="card">
          <div className="card-head">
            <h3>
              <span className="card-title-icon"><Icon name="salaries" size={16} /></span>
              <span>المبلغ الكلي (آخر 12 شهر)</span>
            </h3>
          </div>
          <BarChart
            color="var(--accent-2)"
            format={(v) => fmt(v / 1000, 1) + 'k'}
            data={last12.map((s) => ({ label: s, short: shortLabel(s), value: deviceTotals(stats[s]).amount }))}
          />
        </section>
      </div>

      {missing.length > 0 && (
        <section className="card">
          <div className="card-head">
            <h3>
              <span className="card-title-icon"><Icon name="alert" size={16} /></span>
              <span>أشهر غير مكتملة</span>
            </h3>
            <span className="badge warn">{missing.length} أشهر</span>
          </div>
          <p className="muted small">اضغط على أي شهر للانتقال مباشرة إلى الجرد واستكمال البيانات الناقصة.</p>
          <div className="chips">
            {missing.map((s) => {
              const { y, m } = parseYm(s);
              return (
                <button key={s} className="chip warn" onClick={() => { setYm(s); go('inventory'); }}>
                  {MONTHS[m - 1]} {y}
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
