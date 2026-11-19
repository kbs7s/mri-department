// إعدادات Firebase: انسخها من Firebase Console > Project settings > Your apps > Web app.
// ما دام apiKey فارغًا يعمل الموقع في "الوضع التجريبي" وتُحفظ البيانات على هذا الجهاز فقط.
export const firebaseConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: ''
};

// بريد صاحب الموقع (المدير العام للبيانات). يجب أن يطابق البريد المكتوب في firestore.rules.
export const OWNER_EMAIL = '';
