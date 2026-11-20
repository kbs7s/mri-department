import { useEffect, useState } from 'react';
import { login, signup, resetPassword, isSetupDone } from '../data/backend.js';
import { Icon } from '../components/ui.jsx';

const ERRORS = {
  'auth/invalid-credential': 'البريد أو كلمة المرور غير صحيحة',
  'auth/invalid-email': 'البريد غير صحيح',
  'auth/email-already-in-use': 'هذا البريد مسجل مسبقًا، استخدم تسجيل الدخول',
  'auth/user-disabled': 'هذا الحساب موقوف',
  'auth/weak-password': 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
  'auth/network-request-failed': 'لا يوجد اتصال بالإنترنت. أول تسجيل دخول يحتاج إنترنت',
  'auth/too-many-requests': 'محاولات كثيرة، حاول بعد قليل'
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [mode, setMode] = useState('login');
  const [msg, setMsg] = useState({ text: '', isError: false });
  const [busy, setBusy] = useState(false);
  const [setupDone, setSetupDone] = useState(true);
  useEffect(() => { isSetupDone().then(setSetupDone); }, []);

  const switchMode = (next) => {
    setMode(next);
    setMsg({ text: '', isError: false });
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg({ text: '', isError: false });
    try {
      if (mode === 'login') await login(email, pass);
      else if (mode === 'signup') await signup(email, pass);
      else {
        await resetPassword(email);
        setMsg({ text: 'تم إرسال رابط تغيير كلمة المرور إلى بريدك', isError: false });
      }
    } catch (err) {
      setMsg({ text: ERRORS[err.code] || err.message, isError: true });
    }
    setBusy(false);
  };

  return (
    <div className="splash">
      <form className="card narrow login" onSubmit={submit}>
        <div className="login-header">
          <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" className="login-logo" />
          <h2>جرد قسم الأشعة</h2>
          <p className="muted small">نظام إدارة مخزون وإحصائيات الرنين والمفراس</p>
        </div>

        {mode === 'signup' && (
          <div className="msg">
            <Icon name="shield" size={16} />
            <span>إعداد أول مرة: هذا الحساب سيصبح صاحب الموقع بصلاحية كاملة.</span>
          </div>
        )}

        <label className="field">
          <span className="field-label">البريد الإلكتروني</span>
          <input
            type="email"
            dir="ltr"
            required
            placeholder="name@hospital.org"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
          />
        </label>

        {mode !== 'reset' && (
          <label className="field">
            <span className="field-label">كلمة المرور</span>
            <div className="password-wrap">
              <input
                type={showPass ? 'text' : 'password'}
                dir="ltr"
                required
                placeholder="••••••••"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPass((s) => !s)}
                aria-label={showPass ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                <Icon name={showPass ? 'eyeOff' : 'eye'} size={17} />
              </button>
            </div>
          </label>
        )}

        {msg.text && (
          <div className={`msg ${msg.isError ? 'error' : ''}`}>
            <Icon name={msg.isError ? 'alert' : 'check'} size={16} />
            <span>{msg.text}</span>
          </div>
        )}

        <button className="btn primary block" disabled={busy}>
          {busy
            ? 'جارِ التنفيذ…'
            : mode === 'login'
              ? 'تسجيل الدخول'
              : mode === 'signup'
                ? 'إنشاء حساب جديد'
                : 'إرسال رابط التغيير'}
        </button>

        <div className="login-links">
          {mode === 'login' ? (
            <button type="button" className="link" onClick={() => switchMode('reset')}>
              نسيت كلمة المرور؟
            </button>
          ) : (
            <button type="button" className="link" onClick={() => switchMode('login')}>
              العودة إلى تسجيل الدخول
            </button>
          )}
          {mode === 'login' && !setupDone && (
            <button type="button" className="link" onClick={() => switchMode('signup')}>
              إعداد أول مرة
            </button>
          )}
        </div>
        {mode === 'login' && (
          <p className="muted small" style={{ textAlign: 'center', margin: 0 }}>
            لا يمكن إنشاء حساب من هنا. يضيف مسؤول الموقع الحسابات من الإعدادات.
          </p>
        )}
      </form>
    </div>
  );
}
