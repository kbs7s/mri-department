import { useState } from 'react';
import { login, signup, resetPassword } from '../data/backend.js';

const ERRORS = {
  'auth/invalid-credential': 'البريد أو كلمة المرور غير صحيحة',
  'auth/invalid-email': 'البريد غير صحيح',
  'auth/email-already-in-use': 'هذا البريد مسجل مسبقًا، استخدم تسجيل الدخول',
  'auth/weak-password': 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
  'auth/network-request-failed': 'لا يوجد اتصال بالإنترنت. أول تسجيل دخول يحتاج إنترنت',
  'auth/too-many-requests': 'محاولات كثيرة، حاول بعد قليل'
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [mode, setMode] = useState('login');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setMsg('');
    try {
      if (mode === 'login') await login(email, pass);
      else if (mode === 'signup') await signup(email, pass);
      else { await resetPassword(email); setMsg('تم إرسال رابط تغيير كلمة المرور إلى بريدك'); }
    } catch (err) {
      setMsg(ERRORS[err.code] || err.message);
    }
    setBusy(false);
  };

  return (
    <div className="splash">
      <form className="card narrow login" onSubmit={submit}>
        <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" className="login-logo" />
        <h2>جرد قسم الأشعة</h2>
        <label className="field">
          <span className="field-label">البريد الإلكتروني</span>
          <input type="email" dir="ltr" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
        </label>
        {mode !== 'reset' && (
          <label className="field">
            <span className="field-label">كلمة المرور</span>
            <input type="password" dir="ltr" required value={pass} onChange={(e) => setPass(e.target.value)}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
          </label>
        )}
        {msg && <div className="msg">{msg}</div>}
        <button className="btn primary block" disabled={busy}>
          {mode === 'login' ? 'تسجيل الدخول' : mode === 'signup' ? 'إنشاء حساب' : 'إرسال رابط التغيير'}
        </button>
        <div className="login-links">
          {mode !== 'login' && <button type="button" className="link" onClick={() => setMode('login')}>تسجيل الدخول</button>}
          {mode !== 'signup' && <button type="button" className="link" onClick={() => setMode('signup')}>حساب جديد (لأول مرة)</button>}
          {mode !== 'reset' && <button type="button" className="link" onClick={() => setMode('reset')}>نسيت كلمة المرور</button>}
        </div>
      </form>
    </div>
  );
}
