import { useState } from 'react';
import { useStore } from '../data/store.jsx';
import { DEVICES, MONTHS, fmt, itemFor, ymOf, n0, num, salaryNet, purchaseTotal, currencyLabel } from '../data/model.js';
import { contrastCounts, deviceTotals } from '../data/derived.js';
import { YearPicker, BarChart, Stat, Icon, usePersistentState } from '../components/ui.jsx';

const monthsOf = (year) => MONTHS.map((name, i) => ({ ym: ymOf(year, i + 1), name, m: i + 1 }));

function materialRows(m, inventory, year) {
  return monthsOf(year).map(({ ym, m: mm }) => {
    const r = itemFor(inventory, m.id, ym);
    const it = r.item || {};
    return {
      month: mm, opening: r.opening,
      counts: Object.fromEntries((m.countFields || []).map((f) => [f.key, num(it.counts?.[f.key])])),
      consumed: num(it.consumed), purchased: num(it.purchased), sold: num(it.sold), damaged: num(it.damaged),
      remaining: r.remaining, diff: r.diff, vendor: it.vendor, price: it.price, notes: it.notes, has: !!r.item
    };
  });
}

export default function Reports() {
  const store = useStore();
  const { materials, activeMaterials, inventory, stats, activeStaff, staff, salaryFields, salaries, canSalaries } = store;
  const [year, setYear] = usePersistentState('mri-report-year', new Date().getFullYear());
  const [matId, setMatId] = useState(activeMaterials[0]?.id);
  const [section, setSection] = useState('all');
  const mat = materials.find((m) => m.id === matId) || activeMaterials[0];
  const months = monthsOf(year);
  const rows = mat ? materialRows(mat, inventory, year) : [];
  const sum = (arr, k) => arr.reduce((s, r) => s + n0(r[k]), 0);

  const yearExams = months.reduce((s, { ym }) => s + deviceTotals(stats[ym]).count, 0);
  const yearAmount = months.reduce((s, { ym }) => s + deviceTotals(stats[ym]).amount, 0);
  const yearMri = months.reduce((s, { ym }) => s + n0(stats[ym]?.devices?.mri?.count), 0);
  const yearCt = months.reduce((s, { ym }) => s + n0(stats[ym]?.devices?.ct?.count), 0);

  const show = (key) => section === 'all' || section === key;

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-head-title">
          <h2>التقارير السنوية</h2>
          <span className="page-sub">الجداول التراكمية والتصدير لسنة {year}</span>
        </div>
        <div className="row no-print">
          <YearPicker year={year} onChange={setYear} />
          <button className="btn small" onClick={() => window.print()}>
            <Icon name="printer" size={16} />
            <span>طباعة</span>
          </button>
          <button className="btn primary small" onClick={() => exportYear(store, year)}>
            <Icon name="download" size={16} />
            <span>تصدير Excel</span>
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <Stat label={`إجمالي الفحوصات (${year})`} value={fmt(yearExams)} icon="stats" sub={`MRI ${fmt(yearMri)} · CT ${fmt(yearCt)}`} />
        <Stat label={`إجمالي الإيرادات (${year})`} value={fmt(yearAmount)} icon="salaries" tone="accent" />
      </div>

      <div className="chips no-print" role="tablist" aria-label="تصفية أقسام التقرير">
        <button className={`chip ${section === 'all' ? 'active' : ''}`} onClick={() => setSection('all')}>الكل</button>
        <button className={`chip ${section === 'materials' ? 'active' : ''}`} onClick={() => setSection('materials')}>حركة المواد</button>
        <button className={`chip ${section === 'devices' ? 'active' : ''}`} onClick={() => setSection('devices')}>الأجهزة والمبالغ</button>
        <button className={`chip ${section === 'staff' ? 'active' : ''}`} onClick={() => setSection('staff')}>عمل الموظفين</button>
        {canSalaries && salaryFields.length > 0 && (
          <button className={`chip ${section === 'salaries' ? 'active' : ''}`} onClick={() => setSection('salaries')}>صافي الرواتب</button>
        )}
      </div>

      {show('materials') && (
        <section className="card">
          <div className="card-head">
            <h3>
              <span className="card-title-icon"><Icon name="inventory" size={16} /></span>
              <span>حركة المواد</span>
            </h3>
            <select value={mat?.id} onChange={(e) => setMatId(e.target.value)} aria-label="اختيار المادة">
              {materials.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          {mat && (
            <div className="table-wrap">
              <table className="table compact">
                <thead>
                  <tr>
                    <th className="sticky-col">الشهر</th>
                    <th>المدوّر</th>
                    {(mat.countFields || []).map((f) => <th key={f.key}>{f.label}</th>)}
                    <th>المصروف</th><th>الشراء</th>{mat.hasSale && <th>بيع</th>}<th>تالف</th><th>المتبقي</th><th>الفرق</th><th>ملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.month} className={r.has ? '' : 'empty'}>
                      <th className="sticky-col">{r.month}</th><td>{fmt(r.opening)}</td>
                      {(mat.countFields || []).map((f) => <td key={f.key}>{fmt(r.counts[f.key])}</td>)}
                      <td>{fmt(r.consumed)}</td><td>{fmt(r.purchased)}</td>{mat.hasSale && <td>{fmt(r.sold)}</td>}
                      <td>{fmt(r.damaged)}</td><td><b>{fmt(r.remaining)}</b></td>
                      <td className={r.diff ? (r.diff < 0 ? 'neg' : 'pos') : ''}>{r.diff ? fmt(r.diff) : ''}</td>
                      <td className="notes">{r.notes || ''}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th className="sticky-col">المجموع</th><td></td>
                    {(mat.countFields || []).map((f) => <td key={f.key}>{fmt(rows.reduce((s, r) => s + n0(r.counts[f.key]), 0))}</td>)}
                    <td>{fmt(sum(rows, 'consumed'))}</td><td>{fmt(sum(rows, 'purchased'))}</td>{mat.hasSale && <td>{fmt(sum(rows, 'sold'))}</td>}
                    <td>{fmt(sum(rows, 'damaged'))}</td><td></td><td></td><td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
          <h4>المصروف الشهري</h4>
          <BarChart data={rows.map((r) => ({ label: MONTHS[r.month - 1], short: r.month, value: r.consumed || 0 }))} />
        </section>
      )}

      {show('devices') && (
        <section className="card">
          <div className="card-head">
            <h3>
              <span className="card-title-icon"><Icon name="activity" size={16} /></span>
              <span>عمل الأجهزة والمبالغ</span>
            </h3>
          </div>
          <div className="table-wrap">
            <table className="table compact">
              <thead>
                <tr>
                  <th className="sticky-col">الشهر</th>
                  {DEVICES.map((d) => <th key={d.key} colSpan={2}>{d.label}</th>)}
                  <th>المبلغ الكلي</th><th>رنين ملون</th><th>رنين عادي</th>
                </tr>
                <tr>
                  <th className="sticky-col"></th>
                  {DEVICES.map((d) => [<th key={d.key + 'c'}>العدد</th>, <th key={d.key + 'a'}>المبلغ</th>])}
                  <th></th><th></th><th></th>
                </tr>
              </thead>
              <tbody>
                {months.map(({ ym, m }) => {
                  const st = stats[ym];
                  const c = contrastCounts(materials, inventory, ym).mri;
                  const mri = num(st?.devices?.mri?.count);
                  return (
                    <tr key={ym} className={st ? '' : 'empty'}>
                      <th className="sticky-col">{m}</th>
                      {DEVICES.map((d) => [<td key={d.key + 'c'}>{fmt(st?.devices?.[d.key]?.count)}</td>, <td key={d.key + 'a'}>{fmt(st?.devices?.[d.key]?.amount)}</td>])}
                      <td><b>{st ? fmt(deviceTotals(st).amount) : '—'}</b></td>
                      <td>{fmt(c)}</td><td>{mri != null && c != null ? fmt(mri - c) : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <th className="sticky-col">المجموع</th>
                  {DEVICES.map((d) => [
                    <td key={d.key + 'c'}>{fmt(months.reduce((s, { ym }) => s + n0(stats[ym]?.devices?.[d.key]?.count), 0))}</td>,
                    <td key={d.key + 'a'}>{fmt(months.reduce((s, { ym }) => s + n0(stats[ym]?.devices?.[d.key]?.amount), 0))}</td>
                  ])}
                  <td><b>{fmt(yearAmount)}</b></td><td></td><td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      )}

      {show('staff') && (
        <section className="card">
          <div className="card-head">
            <h3>
              <span className="card-title-icon"><Icon name="users" size={16} /></span>
              <span>عمل الموظفين</span>
            </h3>
          </div>
          <div className="table-wrap">
            <table className="table compact">
              <thead>
                <tr><th className="sticky-col">الشهر</th>{activeStaff.map((s) => <th key={s.id} colSpan={2}>{s.name}</th>)}</tr>
                <tr><th className="sticky-col"></th>{activeStaff.map((s) => [<th key={s.id + 'm'}>MRI</th>, <th key={s.id + 'c'}>CT</th>])}</tr>
              </thead>
              <tbody>
                {months.map(({ ym, m }) => (
                  <tr key={ym} className={stats[ym] ? '' : 'empty'}>
                    <th className="sticky-col">{m}</th>
                    {activeStaff.map((s) => [<td key={s.id + 'm'}>{fmt(stats[ym]?.staff?.[s.id]?.mri)}</td>, <td key={s.id + 'c'}>{fmt(stats[ym]?.staff?.[s.id]?.ct)}</td>])}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th className="sticky-col">المجموع</th>
                  {activeStaff.map((s) => [
                    <td key={s.id + 'm'}>{fmt(months.reduce((t, { ym }) => t + n0(stats[ym]?.staff?.[s.id]?.mri), 0))}</td>,
                    <td key={s.id + 'c'}>{fmt(months.reduce((t, { ym }) => t + n0(stats[ym]?.staff?.[s.id]?.ct), 0))}</td>
                  ])}
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      )}

      {show('salaries') && canSalaries && salaryFields.length > 0 && (
        <section className="card">
          <div className="card-head">
            <h3>
              <span className="card-title-icon"><Icon name="salaries" size={16} /></span>
              <span>صافي الرواتب</span>
            </h3>
          </div>
          <div className="table-wrap">
            <table className="table compact">
              <thead><tr><th className="sticky-col">الشهر</th>{staff.map((s) => <th key={s.id}>{s.name}</th>)}<th>المجموع</th></tr></thead>
              <tbody>
                {months.map(({ ym, m }) => {
                  const nets = staff.map((s) => salaries[`${ym}_${s.id}`] ? salaryNet(salaryFields, salaries[`${ym}_${s.id}`].values) : null);
                  return (
                    <tr key={ym}>
                      <th className="sticky-col">{m}</th>
                      {nets.map((v, i) => <td key={i}>{fmt(v)}</td>)}
                      <td><b>{fmt(nets.reduce((a, b) => a + (b || 0), 0))}</b></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

async function exportYear(store, year) {
  const XLSX = await import('xlsx');
  const { materials, inventory, stats, staff, salaryFields, salaries, canSalaries, purchases, counts } = store;
  const matName = (id) => materials.find((m) => m.id === id)?.name || id;
  const wb = XLSX.utils.book_new();
  const months = monthsOf(year);
  const addSheet = (name, aoa) => {
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!views'] = [{ RTL: true }];
    ws['!cols'] = aoa[0].map(() => ({ wch: 14 }));
    XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
  };

  for (const m of materials) {
    const rows = materialRows(m, inventory, year);
    const head = ['الشهر', 'المدور', ...(m.countFields || []).map((f) => f.label), 'المصروف', 'الشراء', ...(m.hasSale ? ['بيع'] : []), 'تالف', 'المتبقي', 'الفرق', 'البائع', 'السعر', 'الملاحظات'];
    addSheet(m.name, [head, ...rows.map((r) => [
      r.month, r.opening, ...(m.countFields || []).map((f) => r.counts[f.key]), r.consumed, r.purchased,
      ...(m.hasSale ? [r.sold] : []), r.damaged, r.remaining, r.diff, r.vendor || '', r.price || '', r.notes || ''
    ])]);
  }

  addSheet('إحصائية الأجهزة', [
    ['الشهر', ...DEVICES.flatMap((d) => [d.label, 'المبلغ']), 'المبلغ الكلي', 'رنين ملون', 'رنين عادي'],
    ...months.map(({ ym, m }) => {
      const st = stats[ym];
      const c = contrastCounts(materials, inventory, ym).mri ?? null;
      const mri = num(st?.devices?.mri?.count);
      return [m, ...DEVICES.flatMap((d) => [num(st?.devices?.[d.key]?.count), num(st?.devices?.[d.key]?.amount)]),
        st ? deviceTotals(st).amount : null, c, mri != null && c != null ? mri - c : null];
    })
  ]);

  addSheet('إحصائية الموظفين', [
    ['الشهر', ...staff.flatMap((s) => [`${s.name} MRI`, `${s.name} CT`])],
    ...months.map(({ ym, m }) => [m, ...staff.flatMap((s) => [num(stats[ym]?.staff?.[s.id]?.mri), num(stats[ym]?.staff?.[s.id]?.ct)])])
  ]);

  if (canSalaries && salaryFields.length) {
    const aoa = [['الشهر', 'الموظف', ...salaryFields.map((f) => f.name), 'الصافي']];
    for (const { ym, m } of months) for (const s of staff) {
      const d = salaries[`${ym}_${s.id}`];
      if (d) aoa.push([m, s.name, ...salaryFields.map((f) => num(d.values?.[f.id])), salaryNet(salaryFields, d.values)]);
    }
    addSheet('الرواتب', aoa);
  }

  const yp = purchases.filter((p) => p.date?.startsWith(String(year)));
  if (yp.length) {
    addSheet('المشتريات', [
      ['التاريخ', 'المادة', 'الكمية', 'سعر الوحدة', 'المجموع', 'العملة', 'البائع', 'رقم الفاتورة', 'الحالة', 'ملاحظات'],
      ...[...yp].reverse().map((p) => [p.date, matName(p.materialId), num(p.qty), num(p.unitPrice), purchaseTotal(p),
        currencyLabel(p.currency), p.vendor || '', p.invoiceNo || '', p.status === 'ordered' ? 'طلب' : 'مستلم', p.notes || ''])
    ]);
  }
  const yc = counts.filter((c) => c.date?.startsWith(String(year)));
  if (yc.length) {
    addSheet('جرد المواد', [
      ['التاريخ', 'النوع', ...materials.map((m) => m.name), 'ملاحظات'],
      ...[...yc].reverse().map((c) => [c.date, c.type === 'end' ? 'نهاية الشهر' : 'أثناء الشهر',
        ...materials.map((m) => num(c.items?.[m.id])), c.notes || ''])
    ]);
  }

  XLSX.writeFile(wb, `جرد-قسم-الأشعة-${year}.xlsx`);
}
