import { useMemo, useState } from 'react';
import { useStore } from '../data/store.jsx';
import { save, remove } from '../data/backend.js';
import { CURRENCIES, currencyLabel, fmt, itemFor, num, purchaseTotal, todayIso, ymLabel, parseYm } from '../data/model.js';
import { MonthPicker, Stat, Icon } from '../components/ui.jsx';

const STATUS = { received: 'مستلم', ordered: 'طلب (لم يُستلم)' };

export default function Purchases({ ym, setYm }) {
  const { activeMaterials, materials, purchases, inventory, isAdmin } = useStore();
  const [scope, setScope] = useState('month');
  const matName = (id) => materials.find((m) => m.id === id)?.name || id;
  const matUnit = (id) => materials.find((m) => m.id === id)?.unit || '';
  const { y } = parseYm(ym);

  const list = purchases.filter((p) => (scope === 'month' ? p.date?.startsWith(ym) : p.date?.startsWith(String(y))));
  const received = list.filter((p) => p.status !== 'ordered');
  const pending = purchases.filter((p) => p.status === 'ordered');
  const totals = {};
  for (const p of received) totals[p.currency || 'USD'] = (totals[p.currency || 'USD'] || 0) + purchaseTotal(p);

  const needs = activeMaterials.filter((m) => {
    const { remaining } = itemFor(inventory, m.id, ym);
    return m.minStock != null && remaining != null && remaining < m.minStock;
  });

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-head-title">
          <h2>المشتريات</h2>
          <span className="page-sub">شراء الصبغات والأفلام. المستلم منها يُضاف تلقائيًا إلى "الشراء" في الجرد الشهري.</span>
        </div>
        <MonthPicker ym={ym} onChange={setYm} />
      </div>

      <div className="stats-grid">
        <Stat label={scope === 'month' ? `مشتريات ${ymLabel(ym)}` : `مشتريات ${y}`} value={fmt(received.length)} icon="cart" />
        <Stat label="الكلفة" icon="salaries" tone="accent"
          value={Object.keys(totals).length ? Object.entries(totals).map(([c, v]) => `${fmt(v)} ${currencyLabel(c)}`).join(' + ') : '0'} />
        <Stat label="طلبات لم تُستلم" value={fmt(pending.length)} icon="alert" />
      </div>

      {needs.length > 0 && (
        <div className="warn-line">
          <Icon name="alert" size={16} />
          <span>تحتاج شراء (أقل من الحد الأدنى): {needs.map((m) => m.name).join('، ')}</span>
        </div>
      )}

      {isAdmin && <PurchaseForm materials={activeMaterials} purchases={purchases} />}

      <section className="card">
        <div className="card-head">
          <h3>
            <span className="card-title-icon"><Icon name="cart" size={16} /></span>
            <span>سجل المشتريات</span>
          </h3>
          <select value={scope} onChange={(e) => setScope(e.target.value)}>
            <option value="month">{ymLabel(ym)}</option>
            <option value="year">كل سنة {y}</option>
          </select>
        </div>
        {!list.length ? (
          <p className="muted">لا توجد مشتريات مسجلة في هذه الفترة.</p>
        ) : (
          <div className="table-wrap">
            <table className="table compact">
              <thead>
                <tr><th>التاريخ</th><th>المادة</th><th>الكمية</th><th>سعر الوحدة</th><th>المجموع</th><th>البائع</th><th>رقم الفاتورة</th><th>الحالة</th><th>ملاحظات</th>{isAdmin && <th></th>}</tr>
              </thead>
              <tbody>
                {list.map((p) => (
                  <tr key={p.id}>
                    <th>{p.date}</th>
                    <td>{matName(p.materialId)}</td>
                    <td>{fmt(p.qty)} {matUnit(p.materialId)}</td>
                    <td>{fmt(p.unitPrice)} {currencyLabel(p.currency)}</td>
                    <td><b>{fmt(purchaseTotal(p))} {currencyLabel(p.currency)}</b></td>
                    <td>{p.vendor || ''}</td>
                    <td>{p.invoiceNo || ''}</td>
                    <td><span className={`badge ${p.status === 'ordered' ? 'warn' : 'ok'}`}>{STATUS[p.status] || STATUS.received}</span></td>
                    <td className="notes">{p.notes || ''}</td>
                    {isAdmin && (
                      <td>
                        <div className="row" style={{ flexWrap: 'nowrap' }}>
                          {p.status === 'ordered' && (
                            <button className="btn ghost small" onClick={() => save('purchases', p.id, { status: 'received', date: todayIso() })}>تم الاستلام</button>
                          )}
                          <button className="btn danger-ghost small" aria-label="حذف"
                            onClick={() => confirm(`حذف شراء ${matName(p.materialId)} بتاريخ ${p.date}؟`) && remove('purchases', p.id)}>
                            <Icon name="trash" size={15} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function PurchaseForm({ materials, purchases }) {
  const empty = { date: todayIso(), materialId: materials[0]?.id || '', qty: '', unitPrice: '', currency: 'USD', vendor: '', invoiceNo: '', status: 'received', notes: '' };
  const [f, setF] = useState(empty);
  const [msg, setMsg] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const vendors = useMemo(() => [...new Set(purchases.map((p) => p.vendor).filter(Boolean))], [purchases]);

  const add = () => {
    if (!f.materialId || !f.date) return setMsg('اختر المادة والتاريخ');
    if (!(num(f.qty) > 0)) return setMsg('اكتب كمية صحيحة');
    const id = 'p' + Date.now().toString(36);
    save('purchases', id, {
      date: f.date, ym: f.date.slice(0, 7), materialId: f.materialId, qty: num(f.qty), unitPrice: num(f.unitPrice),
      currency: f.currency, vendor: f.vendor.trim() || null, invoiceNo: f.invoiceNo.trim() || null, status: f.status, notes: f.notes.trim() || null
    });
    setF({ ...empty, materialId: f.materialId, currency: f.currency, vendor: f.vendor, date: f.date });
    setMsg('تمت إضافة الشراء ✓');
  };

  const total = (num(f.qty) || 0) * (num(f.unitPrice) || 0);
  return (
    <section className="card">
      <div className="card-head">
        <h3>
          <span className="card-title-icon"><Icon name="plus" size={16} /></span>
          <span>إضافة شراء</span>
        </h3>
      </div>
      <div className="fields">
        <label className="field"><span className="field-label">التاريخ</span><input type="date" value={f.date} onChange={set('date')} /></label>
        <label className="field"><span className="field-label">المادة</span>
          <select value={f.materialId} onChange={set('materialId')}>
            {materials.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </label>
        <label className="field"><span className="field-label">الكمية</span><input type="number" inputMode="decimal" step="any" value={f.qty} onChange={set('qty')} /></label>
        <label className="field"><span className="field-label">سعر الوحدة</span><input type="number" inputMode="decimal" step="any" value={f.unitPrice} onChange={set('unitPrice')} /></label>
        <label className="field"><span className="field-label">العملة</span>
          <select value={f.currency} onChange={set('currency')}>
            {CURRENCIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </label>
        <label className="field"><span className="field-label">البائع</span>
          <input list="vendors" value={f.vendor} onChange={set('vendor')} />
          <datalist id="vendors">{vendors.map((v) => <option key={v} value={v} />)}</datalist>
        </label>
        <label className="field"><span className="field-label">رقم الفاتورة</span><input value={f.invoiceNo} onChange={set('invoiceNo')} /></label>
        <label className="field"><span className="field-label">الحالة</span>
          <select value={f.status} onChange={set('status')}>
            <option value="received">مستلم</option>
            <option value="ordered">طلب (لم يُستلم بعد)</option>
          </select>
        </label>
        <label className="field wide"><span className="field-label">ملاحظات</span><input value={f.notes} onChange={set('notes')} /></label>
      </div>
      <div className="row between">
        <span className="muted">المجموع: <b>{fmt(total)} {currencyLabel(f.currency)}</b></span>
        <button className="btn primary" onClick={add}><Icon name="plus" size={16} /><span>إضافة</span></button>
      </div>
      {msg && <div className="msg"><span>{msg}</span></div>}
    </section>
  );
}
