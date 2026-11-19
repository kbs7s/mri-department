import { useStore } from '../data/store.jsx';
import { DEVICES, fmt, itemFor, num, shiftYm, MONTHS, parseYm, invId } from '../data/model.js';
import { contrastCounts, deviceTotals } from '../data/derived.js';
import { MonthPicker, Stat, BarChart } from '../components/ui.jsx';

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

  return (
    <div className="page">
      <div className="page-head">
        <h2>نظرة عامة</h2>
        <MonthPicker ym={ym} onChange={setYm} />
      </div>

      <div className="stats-grid">
        <Stat label="فحوصات الرنين" value={fmt(mriTotal)}
          sub={contrast.mri != null ? `ملونة ${fmt(contrast.mri)} · عادية ${mriTotal != null ? fmt(mriTotal - contrast.mri) : '—'}` : null} />
        <Stat label="فحوصات المفراس" value={fmt(ctTotal)}
          sub={contrast.ct != null ? `ملونة ${fmt(contrast.ct)} · عادية ${ctTotal != null ? fmt(ctTotal - contrast.ct) : '—'}` : null} />
        <Stat label="مجموع الفحوصات" value={fmt(tot.count)} sub={DEVICES.map((d) => `${d.key.toUpperCase()} ${fmt(st.devices?.[d.key]?.count)}`).join(' · ')} />
        <Stat label="المبلغ الكلي" value={fmt(tot.amount)} tone="accent" />
      </div>

      <section className="card">
        <div className="card-head"><h3>المخزون الحالي</h3><button className="link" onClick={() => go('inventory')}>فتح الجرد</button></div>
        <div className="stock-list">
          {activeMaterials.map((m) => {
            const { remaining, diff } = itemFor(inventory, m.id, ym);
            const low = m.minStock != null && remaining != null && remaining < m.minStock;
            const pct = m.minStock ? Math.min(100, ((remaining || 0) / (m.minStock * 3)) * 100) : 50;
            return (
              <div key={m.id} className={`stock ${low ? 'low' : ''}`}>
                <div className="stock-top"><b>{m.name}</b><span>{fmt(remaining)} {m.unit}</span></div>
                <div className="meter"><div style={{ width: `${pct}%` }} /></div>
                <div className="muted small">
                  {low ? `أقل من الحد الأدنى (${m.minStock})` : `الحد الأدنى ${fmt(m.minStock)}`}
                  {diff ? ` · فرق الجرد ${fmt(diff)}` : ''}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="card">
        <h3>فحوصات الرنين آخر 12 شهر</h3>
        <BarChart data={last12.map((s) => ({ label: s, short: shortLabel(s), value: num(stats[s]?.devices?.mri?.count) || 0 }))} />
      </section>
      <section className="card">
        <h3>المبلغ الكلي آخر 12 شهر</h3>
        <BarChart color="var(--accent-2)" format={(v) => fmt(v / 1000, 1) + 'k'}
          data={last12.map((s) => ({ label: s, short: shortLabel(s), value: deviceTotals(stats[s]).amount }))} />
      </section>

      {missing.length > 0 && (
        <section className="card">
          <h3>أشهر غير مكتملة</h3>
          <div className="chips">
            {missing.map((s) => {
              const { y, m } = parseYm(s);
              return <button key={s} className="chip" onClick={() => { setYm(s); go('inventory'); }}>{MONTHS[m - 1]} {y}</button>;
            })}
          </div>
        </section>
      )}
    </div>
  );
}
