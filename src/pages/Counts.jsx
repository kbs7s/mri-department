import { useState } from 'react';
import { useStore } from '../data/store.jsx';
import { save, remove } from '../data/backend.js';
import { fmt, invId, itemFor, num, todayIso, ymLabel } from '../data/model.js';
import { MonthPicker, CellNum, Icon } from '../components/ui.jsx';

const TYPES = { mid: 'جرد أثناء الشهر', end: 'جرد نهاية الشهر' };

// نقطة المقارنة: آخر جرد سابق للمادة، أو مدوّر الشهر إذا لا يوجد
function baselineFor(counts, inventory, materialId, count) {
  const prev = counts.find((c) => c.id !== count.id && num(c.items?.[materialId]) !== null &&
    (c.date < count.date || (c.date === count.date && c.id < count.id)));
  if (prev && prev.date >= `${count.ym}-01`) return { label: `جرد ${prev.date}`, date: prev.date, value: num(prev.items[materialId]), inclusive: false };
  const { opening } = itemFor(inventory, materialId, count.ym);
  if (opening != null) return { label: 'مدوّر الشهر', date: `${count.ym}-01`, value: opening, inclusive: true };
  if (prev) return { label: `جرد ${prev.date}`, date: prev.date, value: num(prev.items[materialId]), inclusive: false };
  return null;
}

function purchasedBetween(purchases, materialId, from, inclusive, to) {
  return purchases
    .filter((p) => p.materialId === materialId && p.status !== 'ordered' && p.date &&
      (inclusive ? p.date >= from : p.date > from) && p.date <= to)
    .reduce((s, p) => s + (num(p.qty) || 0), 0);
}

export default function Counts({ ym, setYm }) {
  const { activeMaterials, materials, counts, purchases, inventory, isAdmin } = useStore();
  const monthCounts = counts.filter((c) => c.ym === ym);

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-head-title">
          <h2>جرد المواد</h2>
          <span className="page-sub">عدّ المواد فعليًا أثناء الشهر وفي نهايته، ومعرفة الاستهلاك الحقيقي بين كل جردين.</span>
        </div>
        <MonthPicker ym={ym} onChange={setYm} />
      </div>

      {isAdmin && <CountForm ym={ym} materials={activeMaterials} />}

      {!monthCounts.length && (
        <section className="card"><p className="muted">لا يوجد جرد مسجل في {ymLabel(ym)}.</p></section>
      )}

      {monthCounts.map((c) => (
        <CountCard key={c.id} count={c} materials={materials.filter((m) => m.active !== false || c.items?.[m.id] != null)}
          counts={counts} purchases={purchases} inventory={inventory} editable={isAdmin} />
      ))}
    </div>
  );
}

function CountCard({ count: c, materials, counts, purchases, inventory, editable }) {
  const applyEnd = () => {
    if (!confirm(`اعتماد هذا الجرد كمتبقي فعلي لشهر ${ymLabel(c.ym)}؟ (إذا كان المصروف فارغًا سيُحسب تلقائيًا)`)) return;
    for (const m of materials) {
      const v = num(c.items?.[m.id]);
      if (v === null) continue;
      const data = { ym: c.ym, materialId: m.id, remaining: v };
      // إذا لم يُسجَّل المصروف، يُحسب من الجرد: المدوّر + الشراء − البيع − التالف − المتبقي
      const { item, opening } = itemFor(inventory, m.id, c.ym);
      if (num(item?.consumed) === null && opening != null) {
        data.consumed = Math.round((opening + (num(item?.purchased) || 0) - (num(item?.sold) || 0) - (num(item?.damaged) || 0) - v) * 100) / 100;
      }
      save('inventory', invId(c.ym, m.id), data);
    }
    save('counts', c.id, { applied: true });
  };

  return (
    <section className="card">
      <div className="card-head">
        <h3>
          <span className="card-title-icon"><Icon name="clipboard" size={16} /></span>
          <span>{TYPES[c.type] || TYPES.mid} · {c.date}</span>
        </h3>
        <div className="row">
          {c.applied && <span className="badge ok"><Icon name="check" size={13} /><span>معتمد في الجرد الشهري</span></span>}
          {editable && c.type === 'end' && (
            <button className={`btn small ${c.applied ? 'ghost' : 'primary'}`} onClick={applyEnd}>
              <Icon name="check" size={15} />
              <span>{c.applied ? 'إعادة الاعتماد' : 'اعتماد كمتبقي نهاية الشهر'}</span>
            </button>
          )}
          {editable && (
            <button className="btn danger-ghost small" aria-label="حذف" onClick={() => confirm('حذف هذا الجرد؟') && remove('counts', c.id)}>
              <Icon name="trash" size={15} />
            </button>
          )}
        </div>
      </div>
      <div className="table-wrap">
        <table className="table compact">
          <thead>
            <tr><th>المادة</th><th>العدد الفعلي</th><th>المقارنة مع</th><th>الرصيد السابق</th><th>مشتريات بينهما</th><th>الاستهلاك الفعلي</th></tr>
          </thead>
          <tbody>
            {materials.map((m) => {
              const counted = num(c.items?.[m.id]);
              const base = baselineFor(counts, inventory, m.id, c);
              const bought = base ? purchasedBetween(purchases, m.id, base.date, base.inclusive, c.date) : null;
              const used = counted !== null && base ? Math.round((base.value + bought - counted) * 100) / 100 : null;
              return (
                <tr key={m.id}>
                  <th>{m.name}</th>
                  <td><CellNum value={c.items?.[m.id]} disabled={!editable} onSave={(v) => save('counts', c.id, { items: { [m.id]: v } })} /></td>
                  <td className="muted">{base?.label || '—'}</td>
                  <td>{fmt(base?.value)}</td>
                  <td>{bought ? fmt(bought) : '—'}</td>
                  <td><b className={used != null && used < 0 ? 'neg' : ''}>{used == null ? '—' : `${fmt(used)} ${m.unit}`}</b></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {c.notes && <p className="muted small">{c.notes}</p>}
      <p className="muted small">الاستهلاك الفعلي = الرصيد السابق + المشتريات بينهما − العدد الفعلي. القيمة السالبة تعني زيادة في المخزون تحتاج مراجعة.</p>
    </section>
  );
}

function CountForm({ ym, materials }) {
  const today = todayIso();
  const defDate = today.startsWith(ym) ? today : `${ym}-01`;
  const [date, setDate] = useState(defDate);
  const [type, setType] = useState(Number(defDate.slice(8)) >= 25 ? 'end' : 'mid');
  const [items, setItems] = useState({});
  const [notes, setNotes] = useState('');
  const [msg, setMsg] = useState('');

  const add = () => {
    const vals = Object.fromEntries(Object.entries(items).map(([k, v]) => [k, num(v)]).filter(([, v]) => v !== null));
    if (!Object.keys(vals).length) return setMsg('اكتب العدد الفعلي لمادة واحدة على الأقل');
    save('counts', 'c' + Date.now().toString(36), { date, ym: date.slice(0, 7), type, items: vals, notes: notes.trim() || null });
    setItems({}); setNotes('');
    setMsg(date.slice(0, 7) === ym ? 'تم حفظ الجرد ✓' : `تم حفظ الجرد في ${ymLabel(date.slice(0, 7))} ✓`);
  };

  return (
    <section className="card">
      <div className="card-head">
        <h3>
          <span className="card-title-icon"><Icon name="plus" size={16} /></span>
          <span>جرد جديد</span>
        </h3>
      </div>
      <div className="fields">
        <label className="field"><span className="field-label">التاريخ</span>
          <input type="date" value={date} onChange={(e) => { setDate(e.target.value); setType(Number(e.target.value.slice(8)) >= 25 ? 'end' : 'mid'); }} />
        </label>
        <label className="field"><span className="field-label">نوع الجرد</span>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="mid">{TYPES.mid}</option>
            <option value="end">{TYPES.end}</option>
          </select>
        </label>
        {materials.map((m) => (
          <label className="field" key={m.id}>
            <span className="field-label">{m.name} ({m.unit})</span>
            <input type="number" inputMode="decimal" step="any" value={items[m.id] ?? ''} onChange={(e) => setItems({ ...items, [m.id]: e.target.value })} />
          </label>
        ))}
        <label className="field wide"><span className="field-label">ملاحظات</span><input value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
      </div>
      <div className="row between">
        <span className="muted small">جرد نهاية الشهر يمكن اعتماده كمتبقي فعلي في الجرد الشهري.</span>
        <button className="btn primary" onClick={add}><Icon name="check" size={16} /><span>حفظ الجرد</span></button>
      </div>
      {msg && <div className="msg"><span>{msg}</span></div>}
    </section>
  );
}
