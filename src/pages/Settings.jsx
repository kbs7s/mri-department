import { useState } from 'react';
import { useStore } from '../data/store.jsx';
import { save, remove, saveMany, isCloud } from '../data/backend.js';
import { DEFAULT_MATERIALS, DEVICES } from '../data/model.js';

export default function Settings() {
  const { isAdmin } = useStore();
  return (
    <div className="page">
      <div className="page-head"><h2>الإعدادات</h2></div>
      {isAdmin && <MaterialsEditor />}
      {isAdmin && <StaffEditor />}
      {isAdmin && isCloud && <UsersEditor />}
      {isAdmin && <DataTools />}
      <About />
    </div>
  );
}

function MaterialsEditor() {
  const { materials } = useStore();
  const [newName, setNewName] = useState('');
  const add = () => {
    if (!newName.trim()) return;
    save('materials', 'm' + Date.now().toString(36), {
      name: newName.trim(), unit: 'قطعة', order: materials.length + 1, active: true, hasSale: false, minStock: null,
      countFields: [{ key: 'count', label: 'العدد' }]
    });
    setNewName('');
  };
  return (
    <section className="card">
      <h3>المواد</h3>
      {!materials.length && (
        <button className="btn" onClick={() => saveMany(DEFAULT_MATERIALS.map(({ id, ...data }) => ({ col: 'materials', id, data })))}>
          إضافة المواد الافتراضية
        </button>
      )}
      <div className="stack">
        {materials.map((m) => <MaterialRow key={m.id} m={m} />)}
      </div>
      <div className="row">
        <input placeholder="اسم مادة جديدة (مثلًا: كفوف، سرنجات)" value={newName} onChange={(e) => setNewName(e.target.value)} />
        <button className="btn primary small" onClick={add}>إضافة</button>
      </div>
    </section>
  );
}

function MaterialRow({ m }) {
  const [open, setOpen] = useState(false);
  const put = (d) => save('materials', m.id, d);
  const setCF = (cf) => put({ countFields: cf });
  const cfs = m.countFields || [];
  return (
    <div className={`sub-card ${m.active === false ? 'inactive' : ''}`}>
      <div className="row between">
        <b>{m.name}</b>
        <div className="row">
          <label className="check"><input type="checkbox" checked={m.active !== false} onChange={(e) => put({ active: e.target.checked })} /> فعّالة</label>
          <button className="link" onClick={() => setOpen(!open)}>{open ? 'إغلاق' : 'تعديل'}</button>
        </div>
      </div>
      {open && (
        <div className="stack">
          <div className="fields">
            <label className="field"><span className="field-label">الاسم</span>
              <input defaultValue={m.name} onBlur={(e) => e.target.value.trim() && put({ name: e.target.value.trim() })} /></label>
            <label className="field"><span className="field-label">الوحدة</span>
              <input defaultValue={m.unit} onBlur={(e) => put({ unit: e.target.value })} /></label>
            <label className="field"><span className="field-label">الحد الأدنى للتنبيه</span>
              <input type="number" inputMode="decimal" defaultValue={m.minStock ?? ''} onBlur={(e) => put({ minStock: e.target.value === '' ? null : Number(e.target.value) })} /></label>
            <label className="field"><span className="field-label">الترتيب</span>
              <input type="number" defaultValue={m.order ?? ''} onBlur={(e) => put({ order: Number(e.target.value) || 99 })} /></label>
          </div>
          <label className="check"><input type="checkbox" checked={!!m.hasSale} onChange={(e) => put({ hasSale: e.target.checked })} /> فيها بيع</label>
          <div className="muted small">حقول العدّ (تظهر في الجرد). اربط الحقل بجهاز ليُحسب ضمن الفحوصات الملونة لذلك الجهاز.</div>
          {cfs.map((f, i) => (
            <div className="row" key={f.key}>
              <input defaultValue={f.label} onBlur={(e) => setCF(cfs.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} />
              <select value={f.device || ''} onChange={(e) => setCF(cfs.map((x, j) => j === i ? { ...x, device: e.target.value || null } : x))}>
                <option value="">غير مرتبط</option>
                {DEVICES.map((d) => <option key={d.key} value={d.key}>ملون {d.label}</option>)}
              </select>
              <button className="btn ghost small" onClick={() => setCF(cfs.filter((_, j) => j !== i))}>حذف</button>
            </div>
          ))}
          <button className="btn ghost small" onClick={() => setCF([...cfs, { key: 'c' + Date.now().toString(36), label: 'عدد جديد' }])}>+ حقل عدّ</button>
        </div>
      )}
    </div>
  );
}

function StaffEditor() {
  const { staff } = useStore();
  const [name, setName] = useState('');
  const add = () => {
    if (!name.trim()) return;
    save('staff', 's' + Date.now().toString(36), { name: name.trim(), active: true, order: staff.length + 1 });
    setName('');
  };
  return (
    <section className="card">
      <h3>الموظفون</h3>
      <div className="stack">
        {staff.map((s) => (
          <div className="row" key={s.id}>
            <input defaultValue={s.name} onBlur={(e) => e.target.value.trim() && e.target.value !== s.name && save('staff', s.id, { name: e.target.value.trim() })} />
            <label className="check"><input type="checkbox" checked={s.active !== false} onChange={(e) => save('staff', s.id, { active: e.target.checked })} /> فعّال</label>
          </div>
        ))}
      </div>
      <div className="row">
        <input placeholder="اسم موظف جديد" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn primary small" onClick={add}>إضافة</button>
      </div>
    </section>
  );
}

function UsersEditor() {
  const { users } = useStore();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('manager');
  const add = () => {
    const e = email.trim().toLowerCase();
    if (!e.includes('@')) return alert('اكتب بريدًا صحيحًا');
    save('users', e, { role });
    setEmail('');
  };
  return (
    <section className="card">
      <h3>المستخدمون والصلاحيات</h3>
      <p className="muted small">أضف بريد الشخص هنا، ثم يفتح الموقع ويختار "حساب جديد" بنفس البريد.</p>
      <div className="stack">
        {users.map((u) => (
          <div className="row" key={u.id}>
            <span dir="ltr" className="grow">{u.id}</span>
            <select value={u.role} onChange={(e) => save('users', u.id, { role: e.target.value })}>
              <option value="manager">مدير المركز: اطلاع + رواتب</option>
              <option value="admin">مسؤول: صلاحية كاملة</option>
            </select>
            <button className="btn ghost small" onClick={() => confirm('إزالة صلاحية هذا المستخدم؟') && remove('users', u.id)}>إزالة</button>
          </div>
        ))}
      </div>
      <div className="row">
        <input type="email" dir="ltr" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="manager">مدير المركز</option>
          <option value="admin">مسؤول</option>
        </select>
        <button className="btn primary small" onClick={add}>إضافة</button>
      </div>
    </section>
  );
}

const BACKUP_COLS = ['materials', 'staff', 'inventory', 'stats', 'salaryFields', 'salaries'];

function DataTools() {
  const store = useStore();
  const [status, setStatus] = useState('');

  const doImport = async (file) => {
    try {
      const json = JSON.parse(await file.text());
      const cols = json.collections || {};
      const items = [];
      for (const col of BACKUP_COLS) for (const [id, data] of Object.entries(cols[col] || {})) {
        const { updatedAt, updatedBy, ...rest } = data;
        items.push({ col, id, data: rest });
      }
      if (!items.length) return setStatus('الملف لا يحتوي بيانات');
      if (!confirm(`سيتم استيراد ${items.length} سجل. البيانات الموجودة لنفس الأشهر ستُحدّث. متابعة؟`)) return;
      setStatus('جارِ الاستيراد…');
      await saveMany(items, (done, total) => setStatus(`تم ${done} من ${total}`));
      setStatus(`تم استيراد ${items.length} سجل بنجاح ✓`);
    } catch (e) {
      setStatus('خطأ في الملف: ' + e.message);
    }
  };

  const doExport = () => {
    const raw = {
      materials: store.materials, staff: store.staff, salaryFields: store.salaryFields,
      inventory: Object.values(store.inventory), stats: Object.values(store.stats), salaries: Object.values(store.salaries)
    };
    const collections = {};
    for (const [col, list] of Object.entries(raw)) {
      collections[col] = Object.fromEntries(list.map(({ id, updatedAt, ...d }) => [id, d]));
    }
    const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), collections }, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `نسخة-احتياطية-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  return (
    <section className="card">
      <h3>استيراد وتصدير البيانات</h3>
      <p className="muted small">استيراد البيانات السابقة أو نسخة احتياطية بصيغة JSON، أو تنزيل نسخة احتياطية كاملة.</p>
      <div className="row">
        <label className="btn">
          استيراد ملف JSON
          <input type="file" accept=".json,application/json" hidden onChange={(e) => e.target.files[0] && doImport(e.target.files[0])} />
        </label>
        <button className="btn" onClick={doExport}>تنزيل نسخة احتياطية</button>
      </div>
      {status && <div className="msg">{status}</div>}
    </section>
  );
}

function About() {
  const { user, online, isCloud: cloud } = useStore();
  return (
    <section className="card">
      <h3>حول الموقع</h3>
      <ul className="plain">
        <li>المستخدم: <span dir="ltr">{user.email}</span> ({user.role === 'admin' ? 'صلاحية كاملة' : 'مدير المركز'})</li>
        <li>التخزين: {cloud ? 'Firebase سحابي مع نسخة على الجهاز' : 'محلي على هذا الجهاز (تجريبي)'}</li>
        <li>الاتصال: {online ? 'متصل' : 'بدون إنترنت. التعديلات محفوظة وستُرفع عند الاتصال'}</li>
        <li>لتثبيت الموقع كتطبيق: من المتصفح اختر "إضافة إلى الشاشة الرئيسية".</li>
      </ul>
    </section>
  );
}
