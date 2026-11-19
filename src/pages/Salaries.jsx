import { useState } from 'react';
import { useStore } from '../data/store.jsx';
import { save, saveMany, remove } from '../data/backend.js';
import { DEFAULT_SALARY_FIELDS, fmt, salaryNet, ymLabel } from '../data/model.js';
import { MonthPicker, CellNum, Stat, Icon } from '../components/ui.jsx';

export default function Salaries({ ym, setYm, go }) {
  const { activeStaff, salaryFields, salaries, canSalaries } = useStore();
  const [showFields, setShowFields] = useState(false);
  const fields = salaryFields;

  const totalNet = activeStaff.reduce((sum, s) => sum + salaryNet(fields, salaries[`${ym}_${s.id}`]?.values), 0);
  const totalAdd = activeStaff.reduce((sum, s) => {
    const vals = salaries[`${ym}_${s.id}`]?.values || {};
    return sum + fields.filter((f) => f.type !== 'deduct').reduce((a, f) => a + (Number(vals[f.id]) || 0), 0);
  }, 0);
  const totalDeduct = activeStaff.reduce((sum, s) => {
    const vals = salaries[`${ym}_${s.id}`]?.values || {};
    return sum + fields.filter((f) => f.type === 'deduct').reduce((a, f) => a + (Number(vals[f.id]) || 0), 0);
  }, 0);

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-head-title">
          <h2>رواتب الموظفين</h2>
          <span className="page-sub">كشف الرواتب والمكافآت والخصومات لشهر {ymLabel(ym)}</span>
        </div>
        <MonthPicker ym={ym} onChange={setYm} />
      </div>

      {fields.length > 0 && activeStaff.length > 0 && (
        <div className="stats-grid">
          <Stat label="صافي الرواتب الكلي" value={fmt(totalNet)} icon="salaries" tone="accent" sub={`${activeStaff.length} موظف فعّال`} />
          <Stat label="مجموع الإضافات" value={fmt(totalAdd)} icon="plus" />
          <Stat label="مجموع الخصومات" value={fmt(totalDeduct)} icon="alert" />
        </div>
      )}

      {!fields.length ? (
        <section className="card">
          <div className="card-head">
            <h3>
              <span className="card-title-icon"><Icon name="salaries" size={16} /></span>
              <span>إعداد حقول الرواتب</span>
            </h3>
          </div>
          <p className="muted">لا توجد حقول للرواتب بعد. ابدأ بإضافة الحقول الأساسية ويمكنك تعديلها لاحقًا.</p>
          <button
            className="btn primary"
            onClick={() => saveMany(DEFAULT_SALARY_FIELDS.map(({ id, ...data }) => ({ col: 'salaryFields', id, data })))}
          >
            <Icon name="plus" size={16} />
            <span>إضافة الحقول الأساسية (راتب، مكافأة، خصم)</span>
          </button>
        </section>
      ) : !activeStaff.length ? (
        <section className="card">
          <p className="muted">لا يوجد موظفون. <button className="link" onClick={() => go('settings')}>أضفهم من الإعدادات</button></p>
        </section>
      ) : (
        <section className="card">
          <div className="card-head">
            <h3>
              <span className="card-title-icon"><Icon name="users" size={16} /></span>
              <span>كشف الرواتب الشهري</span>
            </h3>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th className="sticky-col">الموظف</th>
                  {fields.map((f) => (
                    <th key={f.id} className={f.type === 'deduct' ? 'neg' : ''}>
                      {f.name}{f.type === 'deduct' ? ' (−)' : ''}
                    </th>
                  ))}
                  <th>الصافي</th>
                </tr>
              </thead>
              <tbody>
                {activeStaff.map((s) => {
                  const id = `${ym}_${s.id}`;
                  const values = salaries[id]?.values || {};
                  return (
                    <tr key={s.id}>
                      <th className="sticky-col">{s.name}</th>
                      {fields.map((f) => (
                        <td key={f.id}>
                          <CellNum
                            value={values[f.id]}
                            disabled={!canSalaries}
                            onSave={(v) => save('salaries', id, { ym, staffId: s.id, values: { [f.id]: v } })}
                          />
                        </td>
                      ))}
                      <td><b className="pos">{fmt(salaryNet(fields, values))}</b></td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <th className="sticky-col">المجموع</th>
                  {fields.map((f) => (
                    <td key={f.id} className={f.type === 'deduct' ? 'neg' : ''}>
                      {fmt(activeStaff.reduce((sum, s) => sum + (Number(salaries[`${ym}_${s.id}`]?.values?.[f.id]) || 0), 0))}
                    </td>
                  ))}
                  <td><b>{fmt(totalNet)}</b></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      )}

      {canSalaries && (
        <section className="card no-print">
          <button
            type="button"
            className="btn ghost accordion-trigger"
            style={{ marginTop: 0 }}
            onClick={() => setShowFields(!showFields)}
          >
            <span>{showFields ? 'إخفاء إدارة حقول الرواتب' : 'إدارة حقول الرواتب'}</span>
            <Icon name="chevronDown" size={16} className={`accordion-chevron ${showFields ? 'open' : ''}`} />
          </button>
          {showFields && <FieldsEditor fields={fields} />}
        </section>
      )}
    </div>
  );
}

function FieldsEditor({ fields }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('add');
  const add = () => {
    if (!name.trim()) return;
    const id = 'f' + Date.now().toString(36);
    save('salaryFields', id, { name: name.trim(), type, order: fields.length + 1 });
    setName('');
  };
  return (
    <div className="stack" style={{ marginTop: '.85rem' }}>
      {fields.map((f) => (
        <div className="row" key={f.id}>
          <input
            defaultValue={f.name}
            onBlur={(e) => e.target.value.trim() && e.target.value !== f.name && save('salaryFields', f.id, { name: e.target.value.trim() })}
          />
          <select value={f.type} onChange={(e) => save('salaryFields', f.id, { type: e.target.value })}>
            <option value="add">إضافة (+)</option>
            <option value="deduct">خصم (−)</option>
          </select>
          <button
            className="btn danger-ghost small"
            onClick={() => { if (confirm(`حذف الحقل "${f.name}"؟`)) remove('salaryFields', f.id); }}
            title="حذف الحقل"
          >
            <Icon name="trash" size={15} />
            <span>حذف</span>
          </button>
        </div>
      ))}
      <div className="row">
        <input
          placeholder="اسم حقل جديد (مثلًا: مخصصات خطورة)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') add(); }}
        />
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="add">إضافة (+)</option>
          <option value="deduct">خصم (−)</option>
        </select>
        <button className="btn primary small" onClick={add}>
          <Icon name="plus" size={15} />
          <span>إضافة</span>
        </button>
      </div>
    </div>
  );
}
