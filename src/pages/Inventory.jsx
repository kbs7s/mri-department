import { useState } from 'react';
import { useStore } from '../data/store.jsx';
import { save, saveMany } from '../data/backend.js';
import { DEFAULT_MATERIALS, invId, itemFor, fmt, ymLabel, num } from '../data/model.js';
import { MonthPicker, NumField, TextField, Icon } from '../components/ui.jsx';

export default function Inventory({ ym, setYm }) {
  const { activeMaterials, materials, inventory, isAdmin } = useStore();

  if (!materials.length) {
    return (
      <div className="page">
        <div className="page-head">
          <h2>الجرد الشهري</h2>
          <MonthPicker ym={ym} onChange={setYm} />
        </div>
        <div className="card">
          <div className="card-head">
            <h3>
              <span className="card-title-icon"><Icon name="inventory" size={16} /></span>
              <span>لا توجد مواد بعد</span>
            </h3>
          </div>
          <p className="muted">أضف المواد الافتراضية (صبغة الرنين، صبغة المفراس، أفلام الطباعة، أفلام الأشعة)، ويمكنك تعديلها لاحقًا من الإعدادات.</p>
          {isAdmin && (
            <button
              className="btn primary"
              onClick={() => saveMany(DEFAULT_MATERIALS.map(({ id, ...data }) => ({ col: 'materials', id, data })))}
            >
              <Icon name="plus" size={16} />
              <span>إضافة المواد الافتراضية</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const lowCount = activeMaterials.filter((m) => {
    const { expected, actual } = itemFor(inventory, m.id, ym);
    const cur = actual ?? expected;
    return m.minStock != null && cur != null && cur < m.minStock;
  }).length;

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-head-title">
          <h2>الجرد الشهري</h2>
          <span className="page-sub">يُحفظ كل حقل تلقائيًا عند الانتقال منه · المدوّر يُحسب تلقائيًا من الشهر السابق عند تركه فارغًا</span>
        </div>
        <MonthPicker ym={ym} onChange={setYm} />
      </div>

      <div className="row">
        <span className="badge accent">{activeMaterials.length} مواد فعّالة</span>
        {lowCount > 0 ? (
          <span className="badge warn">
            <Icon name="alert" size={13} />
            <span>{lowCount} دون الحد الأدنى</span>
          </span>
        ) : (
          <span className="badge ok">
            <Icon name="check" size={13} />
            <span>جميع المواد ضمن الحد الآمن</span>
          </span>
        )}
        {!isAdmin && <span className="badge gray">وضع الاطلاع فقط</span>}
      </div>

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
        <div>
          <h3>{m.name}</h3>
          <span className="muted small">{m.unit} · {ymLabel(ym)}</span>
        </div>
        <span className={`badge ${low ? 'warn' : 'ok'}`}>
          {low ? 'مخزون منخفض' : 'طبيعي'}
        </span>
      </header>

      <div className="fields">
        <NumField
          label="المدوّر"
          value={it.opening}
          disabled={!editable}
          onSave={(v) => put({ opening: v })}
          placeholder={openingIsAuto ? fmt(opening) : ''}
          hint={openingIsAuto ? 'تلقائي من الشهر السابق' : null}
        />
        {(m.countFields || []).map((f) => (
          <NumField
            key={f.key}
            label={f.label}
            value={it.counts?.[f.key]}
            disabled={!editable}
            onSave={(v) => put({ counts: { [f.key]: v } })}
          />
        ))}
        <NumField label="المصروف" value={it.consumed} disabled={!editable} onSave={(v) => put({ consumed: v })} />
        <NumField label="الشراء" value={it.purchased} disabled={!editable} onSave={(v) => put({ purchased: v })} />
        {m.hasSale && <NumField label="بيع" value={it.sold} disabled={!editable} onSave={(v) => put({ sold: v })} />}
        <NumField label="تالف" value={it.damaged} disabled={!editable} onSave={(v) => put({ damaged: v })} />
        <NumField
          label="المتبقي (الجرد الفعلي)"
          value={it.remaining}
          disabled={!editable}
          onSave={(v) => put({ remaining: v })}
          placeholder={expected != null ? fmt(expected) : ''}
        />
      </div>

      <div className="summary-row">
        <div>
          <span className="muted">المتبقي المحسوب</span>
          <b>{fmt(expected)}</b>
        </div>
        <div>
          <span className="muted">الفرق</span>
          <b className={diff ? (diff < 0 ? 'neg' : 'pos') : 'pos'}>
            {diff == null ? '—' : diff === 0 ? 'مطابق ✓' : fmt(diff)}
          </b>
        </div>
        {perExam != null && (
          <div>
            <span className="muted">صرف لكل فحص</span>
            <b>{fmt(perExam, 2)}</b>
          </div>
        )}
      </div>

      {low && (
        <div className="warn-line">
          <Icon name="alert" size={16} />
          <span>المخزون أقل من الحد الأدنى ({m.minStock} {m.unit})</span>
        </div>
      )}

      <button type="button" className="btn ghost accordion-trigger" onClick={() => setOpen(!open)}>
        <span>{open ? 'إخفاء تفاصيل الشراء والملاحظات' : 'تفاصيل الشراء والملاحظات'}</span>
        <Icon name="chevronDown" size={16} className={`accordion-chevron ${open ? 'open' : ''}`} />
      </button>

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
