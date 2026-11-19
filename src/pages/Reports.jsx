import { useState } from 'react';
import { useStore } from '../data/store.jsx';
import { DEVICES, MONTHS, fmt, itemFor, ymOf, n0, num, salaryNet } from '../data/model.js';
import { contrastCounts, deviceTotals } from '../data/derived.js';
import { YearPicker, BarChart, usePersistentState } from '../components/ui.jsx';

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
  const mat = materials.find((m) => m.id === matId) || activeMaterials[0];
  const months = monthsOf(year);
  const rows = mat ? materialRows(mat, inventory, year) : [];
  const sum = (arr, k) => arr.reduce((s, r) => s + n0(r[k]), 0);

  return (
    <div className="page">
      <div className="page-head">
        <h2>التقارير السنوية</h2>
        <div className="row">
          <YearPicker year={year} onChange={setYear} />
          <button className="btn primary small" onClick={() => exportYear(store, year)}>تصدير Excel</button>
        </div>
      </div>

      <section className="card">
        <div className="card-head">
          <h3>حركة المواد</h3>
          <select value={mat?.id} onChange={(e) => setMatId(e.target.value)}>
            {materials.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        {mat && (
          <div className="table-wrap">
            <table className="table compact">
              <thead>
                <tr>
                  <th>الشهر</th><th>المدوّر</th>
                  {(mat.countFields || []).map((f) => <th key={f.key}>{f.label}</th>)}
                  <th>المصروف</th><th>الشراء</th>{mat.hasSale && <th>بيع</th>}<th>تالف</th><th>المتبقي</th><th>الفرق</th><th>ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.month} className={r.has ? '' : 'empty'}>
                    <th>{r.month}</th><td>{fmt(r.opening)}</td>
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
                  <th>المجموع</th><td></td>
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

      <section className="card">
        <h3>عمل الأجهزة والمبالغ</h3>
        <div className="table-wrap">
          <table className="table compact">
            <thead>
              <tr><th>الشهر</th>{DEVICES.map((d) => <th key={d.key} colSpan={2}>{d.label}</th>)}<th>المبلغ الكلي</th><th>رنين ملون</th><th>رنين عادي</th></tr>
              <tr><th></th>{DEVICES.map((d) => [<th key={d.key + 'c'}>العدد</th>, <th key={d.key + 'a'}>المبلغ</th>])}<th></th><th></th><th></th></tr>
            </thead>
            <tbody>
              {months.map(({ ym, m }) => {
                const st = stats[ym];
                const c = contrastCounts(materials, inventory, ym).mri;
                const mri = num(st?.devices?.mri?.count);
                return (
                  <tr key={ym} className={st ? '' : 'empty'}>
                    <th>{m}</th>
                    {DEVICES.map((d) => [<td key={d.key + 'c'}>{fmt(st?.devices?.[d.key]?.count)}</td>, <td key={d.key + 'a'}>{fmt(st?.devices?.[d.key]?.amount)}</td>])}
                    <td><b>{st ? fmt(deviceTotals(st).amount) : '—'}</b></td>
                    <td>{fmt(c)}</td><td>{mri != null && c != null ? fmt(mri - c) : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <th>المجموع</th>
                {DEVICES.map((d) => [
                  <td key={d.key + 'c'}>{fmt(months.reduce((s, { ym }) => s + n0(stats[ym]?.devices?.[d.key]?.count), 0))}</td>,
                  <td key={d.key + 'a'}>{fmt(months.reduce((s, { ym }) => s + n0(stats[ym]?.devices?.[d.key]?.amount), 0))}</td>
                ])}
                <td><b>{fmt(months.reduce((s, { ym }) => s + deviceTotals(stats[ym]).amount, 0))}</b></td><td></td><td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <section className="card">
        <h3>عمل الموظفين</h3>
        <div className="table-wrap">
          <table className="table compact">
            <thead>
              <tr><th>الشهر</th>{activeStaff.map((s) => <th key={s.id} colSpan={2}>{s.name}</th>)}</tr>
              <tr><th></th>{activeStaff.map((s) => [<th key={s.id + 'm'}>MRI</th>, <th key={s.id + 'c'}>CT</th>])}</tr>
            </thead>
            <tbody>
              {months.map(({ ym, m }) => (
                <tr key={ym} className={stats[ym] ? '' : 'empty'}>
                  <th>{m}</th>
                  {activeStaff.map((s) => [<td key={s.id + 'm'}>{fmt(stats[ym]?.staff?.[s.id]?.mri)}</td>, <td key={s.id + 'c'}>{fmt(stats[ym]?.staff?.[s.id]?.ct)}</td>])}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th>المجموع</th>
                {activeStaff.map((s) => [
                  <td key={s.id + 'm'}>{fmt(months.reduce((t, { ym }) => t + n0(stats[ym]?.staff?.[s.id]?.mri), 0))}</td>,
                  <td key={s.id + 'c'}>{fmt(months.reduce((t, { ym }) => t + n0(stats[ym]?.staff?.[s.id]?.ct), 0))}</td>
                ])}
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {canSalaries && salaryFields.length > 0 && (
        <section className="card">
          <h3>صافي الرواتب</h3>
          <div className="table-wrap">
            <table className="table compact">
              <thead><tr><th>الشهر</th>{staff.map((s) => <th key={s.id}>{s.name}</th>)}<th>المجموع</th></tr></thead>
              <tbody>
                {months.map(({ ym, m }) => {
                  const nets = staff.map((s) => salaries[`${ym}_${s.id}`] ? salaryNet(salaryFields, salaries[`${ym}_${s.id}`].values) : null);
                  return (
                    <tr key={ym}><th>{m}</th>{nets.map((v, i) => <td key={i}>{fmt(v)}</td>)}<td><b>{fmt(nets.reduce((a, b) => a + (b || 0), 0))}</b></td></tr>
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
  const { materials, inventory, stats, staff, salaryFields, salaries, canSalaries } = store;
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

  XLSX.writeFile(wb, `جرد-قسم-الأشعة-${year}.xlsx`);
}
