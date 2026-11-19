import { useState } from 'react';
import { useStore } from '../data/store.jsx';
import { save, saveMany } from '../data/backend.js';
import { DEFAULT_MATERIALS, invId, itemFor, fmt, ymLabel, num } from '../data/model.js';
import { MonthPicker, NumField, TextField } from '../components/ui.jsx';

export default function Inventory({ ym, setYm }) {
  const { activeMaterials, materials, inventory, isAdmin } = useStore();

  if (!materials.length) {
    return (
      <div className="card">
        <h3>لا توجد مواد بعد</h3>
        <p className="muted">أضف المواد الافتراضية (صبغة الرنين، صبغة المفراس، أفلام الطباعة، أفلام الأشعة)، ويمكنك تعديلها لاحقًا من الإعدادات.</p>
        {isAdmin && (
          <button className="btn primary" onClick={() =>
            saveMany(DEFAULT_MATERIALS.map(({ id, ...data }) => ({ col: 'materials', id, data })))}>
            إضافة المواد الافتراضية
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-head">
        <h2>الجرد الشهري</h2>
        <MonthPicker ym={ym} onChange={setYm} />
      </div>
      <p className="muted small">يُحفظ كل حقل تلقائيًا عند الانتقال منه. المدوّر يُحسب من متبقي الشهر السابق إذا تُرك فارغًا.</p>
      <div className="grid-cards">
        {activeMaterials.map((m) => (
          <MaterialCard key={m.id} material={m} ym={ym} inv={inventory} editable={isAdmin} />
        ))}
      </div>
    </div>
  );
}

function MaterialCard({ material: m, ym, inv, editable }) {
  const { item, opening, openingIsAuto, expected, actual, diff } = itemFor(inv, m.id, ym);
  const it = item || {};
  const [open, setOpen] = useState(false);
  const id = invId(ym, m.id);
  const put = (data) => save('inventory', id, { ym, materialId: m.id, ...data });
  const low = m.minStock != null && (actual ?? expected) != null && (actual ?? expected) < m.minStock;
  const countSum = (m.countFields || []).filter((f) => f.key !== 'old').reduce((s, f) => s + (num(it.counts?.[f.key]) || 0), 0);
  const perExam = countSum && num(it.consumed) ? num(it.consumed) / countSum : null;

  return (
    <section className={`card material ${low ? 'low' : ''}`}>
      <header className="card-head">
        <h3>{m.name}</h3>
        <span className="muted small">{m.unit} · {ymLabel(ym)}</span>
      </header>

      <div className="fields">
        <NumField label="المدوّر" value={it.opening} disabled={!editable} onSave={(v) => put({ opening: v })}
          placeholder={openingIsAuto ? fmt(opening) : ''} hint={openingIsAuto ? 'تلقائي من الشهر السابق' : null} />
        {(m.countFields || []).map((f) => (
          <NumField key={f.key} label={f.label} value={it.counts?.[f.key]} disabled={!editable}
            onSave={(v) => put({ counts: { [f.key]: v } })} />
        ))}
        <NumField label="المصروف" value={it.consumed} disabled={!editable} onSave={(v) => put({ consumed: v })} />
        <NumField label="الشراء" value={it.purchased} disabled={!editable} onSave={(v) => put({ purchased: v })} />
        {m.hasSale && <NumField label="بيع" value={it.sold} disabled={!editable} onSave={(v) => put({ sold: v })} />}
        <NumField label="تالف" value={it.damaged} disabled={!editable} onSave={(v) => put({ damaged: v })} />
        <NumField label="المتبقي (الجرد الفعلي)" value={it.remaining} disabled={!editable}
          onSave={(v) => put({ remaining: v })} placeholder={expected != null ? fmt(expected) : ''} />
      </div>

      <div className="summary-row">
        <div><span className="muted">المتبقي المحسوب</span><b>{fmt(expected)}</b></div>
        <div><span className="muted">الفرق</span>
          <b className={diff ? (diff < 0 ? 'neg' : 'pos') : ''}>{diff == null ? '—' : diff === 0 ? 'مطابق ✓' : fmt(diff)}</b></div>
        {perExam != null && <div><span className="muted">صرف لكل فحص</span><b>{fmt(perExam, 2)}</b></div>}
      </div>
      {low && <div className="warn-line">المخزون أقل من الحد الأدنى ({m.minStock})</div>}

      <button className="link" onClick={() => setOpen(!open)}>{open ? 'إخفاء تفاصيل الشراء والملاحظات' : 'تفاصيل الشراء والملاحظات'}</button>
      {open && (
        <div className="fields">
          <TextField label="تاريخ الشراء" type="date" value={it.purchaseDate} disabled={!editable} onSave={(v) => put({ purchaseDate: v })} />
          <TextField label="البائع" value={it.vendor} disabled={!editable} onSave={(v) => put({ vendor: v })} />
          <TextField label="السعر" value={it.price} disabled={!editable} onSave={(v) => put({ price: v })} />
          {m.hasSale && <TextField label="سعر البيع" value={it.salePrice} disabled={!editable} onSave={(v) => put({ salePrice: v })} />}
          <TextField label="ملاحظات" className="wide" value={it.notes} disabled={!editable} onSave={(v) => put({ notes: v })} />
        </div>
      )}
    </section>
  );
}
