import { useState } from 'react';
import { useStore } from '../data/store.jsx';
import { save, saveMany, remove } from '../data/backend.js';
import { DEFAULT_SALARY_FIELDS, fmt, salaryNet } from '../data/model.js';
import { MonthPicker, CellNum } from '../components/ui.jsx';

export default function Salaries({ ym, setYm, go }) {
  const { activeStaff, salaryFields, salaries, canSalaries } = useStore();
  const [showFields, setShowFields] = useState(false);
  const fields = salaryFields;

  return (
    <div className="page">
      <div className="page-head">
        <h2>رواتب الموظفين</h2>
        <MonthPicker ym={ym} onChange={setYm} />
      </div>

      {!fields.length ? (
        <section className="card">
          <p className="muted">لا توجد حقول للرواتب بعد.</p>
          <button className="btn primary" onClick={() =>
            saveMany(DEFAULT_SALARY_FIELDS.map(({ id, ...data }) => ({ col: 'salaryFields', id, data })))}>
            إضافة الحقول الأساسية (راتب، مكافأة، خصم)
          </button>
        </section>
      ) : !activeStaff.length ? (
        <section className="card"><p className="muted">لا يوجد موظفون. <button className="link" onClick={() => go('settings')}>أضفهم من الإعدادات</button></p></section>
      ) : (
        <section className="card">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>الموظف</th>
                  {fields.map((f) => <th key={f.id} className={f.type === 'deduct' ? 'neg' : ''}>{f.name}{f.type === 'deduct' ? ' (−)' : ''}</th>)}
                  <th>الصافي</th>
                </tr>
              </thead>
              <tbody>
                {activeStaff.map((s) => {
                  const id = `${ym}_${s.id}`;
                  const values = salaries[id]?.values || {};
                  return (
                    <tr key={s.id}>
                      <th>{s.name}</th>
                      {fields.map((f) => (
                        <td key={f.id}><CellNum value={values[f.id]} disabled={!canSalaries}
                          onSave={(v) => save('salaries', id, { ym, staffId: s.id, values: { [f.id]: v } })} /></td>
                      ))}
                      <td><b>{fmt(salaryNet(fields, values))}</b></td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <th>المجموع</th>
                  {fields.map((f) => (
                    <td key={f.id}>{fmt(activeStaff.reduce((sum, s) => sum + (Number(salaries[`${ym}_${s.id}`]?.values?.[f.id]) || 0), 0))}</td>
                  ))}
                  <td><b>{fmt(activeStaff.reduce((sum, s) => sum + salaryNet(fields, salaries[`${ym}_${s.id}`]?.values), 0))}</b></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      )}

      {canSalaries && (
        <section className="card">
          <button className="link" onClick={() => setShowFields(!showFields)}>{showFields ? 'إخفاء' : 'إدارة حقول الرواتب'}</button>
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
    <div className="stack">
      {fields.map((f) => (
        <div className="row" key={f.id}>
          <input defaultValue={f.name} onBlur={(e) => e.target.value.trim() && e.target.value !== f.name && save('salaryFields', f.id, { name: e.target.value.trim() })} />
          <select value={f.type} onChange={(e) => save('salaryFields', f.id, { type: e.target.value })}>
            <option value="add">إضافة (+)</option>
            <option value="deduct">خصم (−)</option>
          </select>
          <button className="btn ghost small" onClick={() => { if (confirm(`حذف الحقل "${f.name}"؟`)) remove('salaryFields', f.id); }}>حذف</button>
        </div>
      ))}
      <div className="row">
        <input placeholder="اسم حقل جديد (مثلًا: مخصصات خطورة)" value={name} onChange={(e) => setName(e.target.value)} />
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="add">إضافة (+)</option>
          <option value="deduct">خصم (−)</option>
        </select>
        <button className="btn primary small" onClick={add}>إضافة</button>
      </div>
    </div>
  );
}
