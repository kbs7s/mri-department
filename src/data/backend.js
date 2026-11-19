// طبقة البيانات: Firebase (سحابي + يعمل بدون إنترنت) أو تخزين محلي في الوضع التجريبي.
import { firebaseConfig, OWNER_EMAIL } from '../firebase-config.js';
import { initializeApp } from 'firebase/app';
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  collection, doc, onSnapshot, setDoc, deleteDoc, writeBatch, serverTimestamp
} from 'firebase/firestore';
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, sendPasswordResetEmail
} from 'firebase/auth';

export const isCloud = Boolean(firebaseConfig && firebaseConfig.apiKey);
export const ownerEmail = (OWNER_EMAIL || '').trim().toLowerCase();

export function deepMerge(target, src) {
  const out = { ...(target || {}) };
  for (const [k, v] of Object.entries(src || {})) {
    if (v && typeof v === 'object' && !Array.isArray(v)) out[k] = deepMerge(out[k], v);
    else out[k] = v;
  }
  return out;
}

/* ---------------- Firebase ---------------- */
let fdb = null, fauth = null;
if (isCloud) {
  const app = initializeApp(firebaseConfig);
  fdb = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
  });
  fauth = getAuth(app);
}

/* ---------------- Local (demo) ---------------- */
const LS_KEY = 'mri-dept-local-db';
const listeners = new Map();
function readLocal() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch { return {}; }
}
function writeLocal(dbObj) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(dbObj)); } catch (e) { console.error(e); }
}
function emitLocal(col) {
  const data = readLocal()[col] || {};
  const list = Object.entries(data).map(([id, d]) => ({ id, ...d }));
  (listeners.get(col) || []).forEach((cb) => cb(list, false));
}

/* ---------------- Public API ---------------- */
let currentEmail = '';

export function subscribe(col, cb, onError) {
  if (isCloud) {
    return onSnapshot(
      collection(fdb, col),
      { includeMetadataChanges: true },
      (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })), snap.metadata.hasPendingWrites),
      (err) => { console.error(col, err); onError && onError(err); }
    );
  }
  if (!listeners.has(col)) listeners.set(col, []);
  listeners.get(col).push(cb);
  setTimeout(() => emitLocal(col), 0);
  return () => listeners.set(col, listeners.get(col).filter((f) => f !== cb));
}

// الحفظ لا ينتظر الخادم: يظهر فورًا ويُزامن عند توفر الإنترنت.
export function save(col, id, data) {
  if (isCloud) {
    return setDoc(doc(fdb, col, id), { ...data, updatedAt: serverTimestamp(), updatedBy: currentEmail }, { merge: true })
      .catch((e) => { console.error(e); alert('تعذر الحفظ: ' + e.message); });
  }
  const dbObj = readLocal();
  dbObj[col] = dbObj[col] || {};
  dbObj[col][id] = deepMerge(dbObj[col][id], { ...data, updatedAt: new Date().toISOString() });
  writeLocal(dbObj);
  emitLocal(col);
  return Promise.resolve();
}

export function remove(col, id) {
  if (isCloud) return deleteDoc(doc(fdb, col, id)).catch((e) => alert('تعذر الحذف: ' + e.message));
  const dbObj = readLocal();
  if (dbObj[col]) delete dbObj[col][id];
  writeLocal(dbObj);
  emitLocal(col);
  return Promise.resolve();
}

// items: [{col, id, data}] — يكتب على دفعات (للاستيراد)
export async function saveMany(items, onProgress) {
  if (isCloud) {
    for (let i = 0; i < items.length; i += 400) {
      const batch = writeBatch(fdb);
      items.slice(i, i + 400).forEach(({ col, id, data }) =>
        batch.set(doc(fdb, col, id), { ...data, updatedAt: serverTimestamp(), updatedBy: currentEmail }, { merge: true }));
      await batch.commit();
      onProgress && onProgress(Math.min(i + 400, items.length), items.length);
    }
    return;
  }
  const dbObj = readLocal();
  const cols = new Set();
  for (const { col, id, data } of items) {
    dbObj[col] = dbObj[col] || {};
    dbObj[col][id] = deepMerge(dbObj[col][id], data);
    cols.add(col);
  }
  writeLocal(dbObj);
  cols.forEach(emitLocal);
  onProgress && onProgress(items.length, items.length);
}

/* ---------------- Auth & roles ---------------- */
// cb({email, role}) أو cb(null)
export function onAuth(cb) {
  if (!isCloud) {
    currentEmail = 'demo';
    setTimeout(() => cb({ email: 'وضع تجريبي', role: 'admin' }), 0);
    return () => {};
  }
  let unsubRole = null;
  const unsub = onAuthStateChanged(fauth, (user) => {
    unsubRole && unsubRole();
    unsubRole = null;
    if (!user) { currentEmail = ''; cb(null); return; }
    const email = (user.email || '').toLowerCase();
    currentEmail = email;
    if (email === ownerEmail) { cb({ email, role: 'admin' }); return; }
    unsubRole = onSnapshot(doc(fdb, 'users', email),
      (d) => cb({ email, role: d.exists() ? d.data().role : 'none' }),
      () => cb({ email, role: 'none' }));
  });
  return () => { unsub(); unsubRole && unsubRole(); };
}

export const login = (email, pass) => signInWithEmailAndPassword(fauth, email.trim(), pass);
export const signup = (email, pass) => createUserWithEmailAndPassword(fauth, email.trim(), pass);
export const logout = () => (isCloud ? signOut(fauth) : Promise.resolve());
export const resetPassword = (email) => sendPasswordResetEmail(fauth, email.trim());
