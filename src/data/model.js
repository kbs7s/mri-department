export const MONTHS = ['كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران', 'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول'];

export const DEVICES = [
  { key: 'mri', label: 'الرنين MRI' },
  { key: 'ct', label: 'المفراس CT' },
  { key: 'report', label: 'التقارير' },
  { key: 'xray', label: 'الأشعة X-Ray' }
];

// المواد الافتراضية مطابقة لجداول الجرد السابقة
export const DEFAULT_MATERIALS = [
  { id: 'mri_contrast', name: 'صبغة الرنين', unit: 'فيال', order: 1, active: true, hasSale: false, minStock: 30,
    countFields: [{ key: 'exams', label: 'عدد الفحوصات الملونة', device: 'mri' }] },
  { id: 'ct_contrast', name: 'صبغة المفراس', unit: 'قنينة', order: 2, active: true, hasSale: true, minStock: 20,
    countFields: [{ key: 'iv', label: 'عدد IV', device: 'ct' }, { key: 'oral', label: 'عدد Oral', device: 'ct' }] },
  { id: 'films', name: 'أفلام الطباعة', unit: 'فلم', order: 3, active: true, hasSale: false, minStock: 300,
    countFields: [{ key: 'mri', label: 'عدد الرنين' }, { key: 'ct', label: 'عدد المفراس' }, { key: 'old', label: 'فلم قديم' }] },
  { id: 'xray_films', name: 'أفلام الأشعة', unit: 'فلم', order: 4, active: true, hasSale: false, minStock: 100,
    countFields: [{ key: 'patients', label: 'عدد المرضى' }] }
];

export const DEFAULT_SALARY_FIELDS = [
  { id: 'base', name: 'الراتب الأساسي', type: 'add', order: 1 },
  { id: 'bonus', name: 'مكافأة', type: 'add', order: 2 },
  { id: 'deduct', name: 'خصم', type: 'deduct', order: 3 }
];

export const pad = (n) => String(n).padStart(2, '0');
export const ymOf = (y, m) => `${y}-${pad(m)}`;
export const parseYm = (s) => { const [y, m] = s.split('-').map(Number); return { y, m }; };
export function shiftYm(s, delta) {
  const { y, m } = parseYm(s);
  const d = new Date(y, m - 1 + delta, 1);
  return ymOf(d.getFullYear(), d.getMonth() + 1);
}
export const currentYm = () => { const d = new Date(); return ymOf(d.getFullYear(), d.getMonth() + 1); };
export const ymLabel = (s) => { const { y, m } = parseYm(s); return `${MONTHS[m - 1]} ${y}`; };
export const invId = (ym, materialId) => `${ym}_${materialId}`;

export const num = (v) => (v === null || v === undefined || v === '' || isNaN(Number(v)) ? null : Number(v));
export const n0 = (v) => num(v) ?? 0;
export const fmt = (v, digits = 2) => {
  const x = num(v);
  if (x === null) return '—';
  return x.toLocaleString('en-US', { maximumFractionDigits: digits });
};

// المتبقي المتوقع = المدور + الشراء − المصروف − البيع − التالف
export function computeItem(item, autoOpening) {
  const it = item || {};
  const opening = num(it.opening) ?? autoOpening ?? null;
  const hasData = ['consumed', 'purchased', 'sold', 'damaged', 'remaining'].some((k) => num(it[k]) !== null);
  const expected = opening === null && !hasData ? null
    : n0(opening) + n0(it.purchased) - n0(it.consumed) - n0(it.sold) - n0(it.damaged);
  const actual = num(it.remaining);
  const remaining = actual ?? expected;
  const diff = actual !== null && expected !== null ? Math.round((actual - expected) * 100) / 100 : null;
  return { opening, openingIsAuto: num(it.opening) === null && autoOpening != null, expected, actual, remaining, diff };
}

// المدور التلقائي = متبقي الشهر السابق
export function autoOpening(invMap, materialId, ym, depth = 0) {
  if (depth > 24) return null;
  const prevYm = shiftYm(ym, -1);
  const prev = invMap[invId(prevYm, materialId)];
  if (!prev) return null;
  const prevAuto = num(prev.opening) === null ? autoOpening(invMap, materialId, prevYm, depth + 1) : null;
  return computeItem(prev, prevAuto).remaining;
}

export function itemFor(invMap, materialId, ym) {
  const item = invMap[invId(ym, materialId)] || null;
  const auto = autoOpening(invMap, materialId, ym);
  return { item, ...computeItem(item, auto) };
}

export const sortByOrder = (a, b) => (a.order ?? 99) - (b.order ?? 99) || String(a.name).localeCompare(String(b.name), 'ar');

export function salaryNet(fields, values) {
  let total = 0;
  for (const f of fields) {
    const v = n0(values?.[f.id]);
    total += f.type === 'deduct' ? -v : v;
  }
  return total;
}
