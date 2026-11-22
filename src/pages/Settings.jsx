import { useState } from 'react';
import { useStore } from '../data/store.jsx';
import { save, remove, saveMany, isCloud, createAccount, resetPassword } from '../data/backend.js';
import { DEFAULT_MATERIALS, DEVICES } from '../data/model.js';
import { Icon } from '../components/ui.jsx';

export default function Settings() {
  const { isAdmin } = useStore();
  return (
    <div className="page">
      <div className="page-head">
        <div className="page-head-title">
          <h2>الإعدادات</h2>
          <span className="page-sub">إدارة المواد والموظفين والصلاحيات والنسخ الاحتياطي</span>
        </div>
      </div>
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
      <div className="card-head">
        <h3>
          <span className="card-title-icon"><Icon name="inventory" size={16} /></span>
          <span>المواد</span>
        </h3>
        <span className="badge gray">{materials.length} مادة</span>
      </div>
      {!materials.length && (
        <button
          className="btn primary small"
          onClick={() => saveMany(DEFAULT_MATERIALS.map(({ id, ...data }) => ({ col: 'materials', id, data })))}
        >
          <Icon name="plus" size={15} />
          <span>إضافة المواد الافتراضية</span>
        </button>
      )}
      <div className="stack">
        {materials.map((m) => <MaterialRow key={m.id} m={m} />)}
      </div>
      <div className="row">
        <input
          placeholder="اسم مادة جديدة (مثلًا: كفوف، سرنجات)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') add(); }}
        />
        <button className="btn primary small" onClick={add}>
          <Icon name="plus" size={15} />
          <span>إضافة</span>
        </button>
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
        <div>
          <b>{m.name}</b>
          <span className="muted small"> · {m.unit || 'قطعة'}{m.minStock != null ? ` · حد أدنى ${m.minStock}` : ''}</span>
        </div>
        <div className="row">
          <label className="switch">
            <input type="checkbox" checked={m.active !== false} onChange={(e) => put({ active: e.target.checked })} />
            <span>فعّالة</span>
          </label>
          <button className="btn ghost small" onClick={() => setOpen(!open)}>
            <span>{open ? 'إغلاق' : 'تعديل'}</span>
            <Icon name="chevronDown" size={15} className={`accordion-chevron ${open ? 'open' : ''}`} />
          </button>
        </div>
      </div>
      {open && (
        <div className="stack" style={{ marginTop: '.75rem' }}>
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
          <label className="switch">
            <input type="checkbox" checked={!!m.hasSale} onChange={(e) => put({ hasSale: e.target.checked })} />
            <span>فيها بيع</span>
          </label>
          <div className="muted small">حقول العدّ (تظهر في الجرد). اربط الحقل بجهاز ليُحسب ضمن الفحوصات الملونة لذلك الجهاز.</div>
          {cfs.map((f, i) => (
            <div className="row" key={f.key}>
              <input defaultValue={f.label} onBlur={(e) => setCF(cfs.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} />
              <select value={f.device || ''} onChange={(e) => setCF(cfs.map((x, j) => j === i ? { ...x, device: e.target.value || null } : x))}>
                <option value="">غير مرتبط</option>
                {DEVICES.map((d) => <option key={d.key} value={d.key}>ملون {d.label}</option>)}
              </select>
              <button className="btn danger-ghost small" onClick={() => setCF(cfs.filter((_, j) => j !== i))}>
                <Icon name="trash" size={15} />
                <span>حذف</span>
              </button>
            </div>
          ))}
          <div>
            <button className="btn small" onClick={() => setCF([...cfs, { key: 'c' + Date.now().toString(36), label: 'عدد جديد' }])}>
              <Icon name="plus" size={15} />
              <span>حقل عدّ جديد</span>
            </button>
          </div>
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
      <div className="card-head">
        <h3>
          <span className="card-title-icon"><Icon name="users" size={16} /></span>
          <span>الموظفون</span>
        </h3>
        <span className="badge gray">{staff.length} موظف</span>
      </div>
      <div className="stack">
        {staff.map((s) => (
          <div className="row" key={s.id}>
            <input
              defaultValue={s.name}
              onBlur={(e) => e.target.value.trim() && e.target.value !== s.name && save('staff', s.id, { name: e.target.value.trim() })}
            />
            <label className="switch">
              <input type="checkbox" checked={s.active !== false} onChange={(e) => save('staff', s.id, { active: e.target.checked })} />
              <span>فعّال</span>
            </label>
          </div>
        ))}
      </div>
      <div className="row">
        <input
          placeholder="اسم موظف جديد"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') add(); }}
        />
        <button className="btn primary small" onClick={add}>
          <Icon name="plus" size={15} />
          <span>إضافة</span>
        </button>
      </div>
    </section>
  );
}

const ROLE_LABELS = { manager: 'مدير المركز: اطلاع + رواتب', admin: 'مسؤول: صلاحية كاملة' };
const ACCOUNT_ERRORS = {
  'auth/invalid-email': 'البريد غير صحيح',
  'auth/weak-password': 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
  'auth/network-request-failed': 'إضافة حساب تحتاج اتصالًا بالإنترنت',
  'auth/operation-not-allowed': 'فعّل Email/Password في Firebase Authentication'
};

function UsersEditor() {
  const { users, user } = useStore();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [role, setRole] = useState('manager');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const add = async () => {
    const e = email.trim().toLowerCase();
    if (!e.includes('@')) return setMsg({ err: true, text: 'اكتب بريدًا صحيحًا' });
    if (pass.length < 6) return setMsg({ err: true, text: 'كلمة المرور المؤقتة يجب أن تكون 6 أحرف على الأقل' });
    setBusy(true); setMsg(null);
    try {
      let existed = false;
      try { await createAccount(e, pass); }
      catch (err) { if (err.code === 'auth/email-already-in-use') existed = true; else throw err; }
      await save('users', e, { role, addedBy: user.email });
      setMsg({ err: false, text: existed
        ? `البريد ${e} كان له حساب سابق. أُعطي الصلاحية، ويدخل بكلمة مروره القديمة أو من "نسيت كلمة المرور".`
        : `تم إنشاء حساب ${e}. أرسل له البريد وكلمة المرور المؤقتة، ويمكنه تغييرها من "نسيت كلمة المرور".` });
      setEmail(''); setPass('');
    } catch (err) {
      setMsg({ err: true, text: ACCOUNT_ERRORS[err.code] || err.message });
    }
    setBusy(false);
  };

  const sendReset = async (e) => {
    try { await resetPassword(e); setMsg({ err: false, text: `أُرسل رابط تغيير كلمة المرور إلى ${e}` }); }
    catch (err) { setMsg({ err: true, text: ACCOUNT_ERRORS[err.code] || err.message }); }
  };

  return (
    <section className="card">
      <div className="card-head">
        <h3>
          <span className="card-title-icon"><Icon name="shield" size={16} /></span>
          <span>المستخدمون والصلاحيات</span>
        </h3>
        <span className="badge gray">{users.length} مستخدم</span>
      </div>
      <p className="muted small">
        لا يوجد تسجيل ذاتي في الموقع. المسؤول فقط يضيف الأشخاص هنا ويحدد صلاحيتهم. إزالة الشخص تسحب صلاحيته فورًا.
      </p>
      <ul className="plain small muted">
        <li><b>مسؤول:</b> كل الصفحات، ويعدّل كل شيء، ويضيف ويزيل المستخدمين.</li>
        <li><b>مدير المركز:</b> يطّلع على الرئيسية والجرد والإحصائية والتقارير، ويعدّل الرواتب فقط، ولا يرى الإعدادات.</li>
      </ul>
      <div className="stack">
        {users.map((u) => (
          <div className="sub-card" key={u.id}>
            <div className="row">
              <span dir="ltr" className="grow"><b>{u.id}</b></span>
              <select value={u.role} disabled={u.id === user.email}
                onChange={(e) => save('users', u.id, { role: e.target.value })}>
                <option value="manager">{ROLE_LABELS.manager}</option>
                <option value="admin">{ROLE_LABELS.admin}</option>
              </select>
              <button className="btn ghost small" onClick={() => sendReset(u.id)}>
                <span>رابط كلمة مرور</span>
              </button>
              {u.id !== user.email && (
                <button className="btn danger-ghost small" onClick={() => confirm(`إزالة صلاحية ${u.id}؟`) && remove('users', u.id)}>
                  <Icon name="trash" size={15} />
                  <span>إزالة</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <h4>إضافة شخص جديد</h4>
      <div className="row">
        <input type="email" dir="ltr" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" />
        <input type="text" dir="ltr" placeholder="كلمة مرور مؤقتة" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="new-password" />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="manager">مدير المركز</option>
          <option value="admin">مسؤول</option>
        </select>
        <button className="btn primary small" onClick={add} disabled={busy}>
          <Icon name="plus" size={15} />
          <span>{busy ? 'جارِ الإضافة…' : 'إضافة'}</span>
        </button>
      </div>
      {msg && <div className={`msg ${msg.err ? 'error' : ''}`}><span>{msg.text}</span></div>}
    </section>
  );
}

const BACKUP_COLS = ['materials', 'staff', 'inventory', 'stats', 'salaryFields', 'salaries', 'purchases', 'counts'];

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
      inventory: Object.values(store.rawInventory), stats: Object.values(store.stats), salaries: Object.values(store.salaries),
      purchases: store.purchases, counts: store.counts
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
      <div className="card-head">
        <h3>
          <span className="card-title-icon"><Icon name="database" size={16} /></span>
          <span>استيراد وتصدير البيانات</span>
        </h3>
      </div>
      <p className="muted small">استيراد البيانات السابقة أو نسخة احتياطية بصيغة JSON، أو تنزيل نسخة احتياطية كاملة.</p>
      <div className="row">
        <label className="btn">
          <Icon name="upload" size={16} />
          <span>استيراد ملف JSON</span>
          <input type="file" accept=".json,application/json" hidden onChange={(e) => e.target.files[0] && doImport(e.target.files[0])} />
        </label>
        <button className="btn primary" onClick={doExport}>
          <Icon name="download" size={16} />
          <span>تنزيل نسخة احتياطية</span>
        </button>
      </div>
      {status && <div className="msg">{status}</div>}
    </section>
  );
}

function About() {
  const { user, online, isCloud: cloud } = useStore();
  return (
    <section className="card">
      <div className="card-head">
        <h3>
          <span className="card-title-icon"><Icon name="info" size={16} /></span>
          <span>حول الموقع</span>
        </h3>
      </div>
      <div className="info-grid">
        <div className="info-item">
          <span className="info-label">المستخدم الحالي</span>
          <span className="info-value" dir="ltr">{user.email}</span>
        </div>
        <div className="info-item">
          <span className="info-label">الصلاحية</span>
          <span className="info-value">{user.role === 'admin' ? 'مسؤول (صلاحية كاملة)' : 'مدير المركز (اطلاع + رواتب)'}</span>
        </div>
        <div className="info-item">
          <span className="info-label">التخزين</span>
          <span className="info-value">{cloud ? 'Firebase سحابي مع نسخة محلية' : 'محلي على هذا الجهاز (تجريبي)'}</span>
        </div>
        <div className="info-item">
          <span className="info-label">حالة الاتصال</span>
          <span className="info-value">{online ? 'متصل بالإنترنت' : 'بدون إنترنت (الحفظ محلي مؤقتًا)'}</span>
        </div>
      </div>
      <p className="muted small" style={{ marginTop: '.75rem', marginBottom: 0 }}>
        لتثبيت الموقع كتطبيق على الهاتف أو الحاسوب: من قائمة المتصفح اختر "إضافة إلى الشاشة الرئيسية".
      </p>
    </section>
  );
}
