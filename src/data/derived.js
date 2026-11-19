import { DEVICES, n0, num, invId } from './model.js';

// عدد الفحوصات الملونة لكل جهاز من جداول الجرد (الحقول المرتبطة بجهاز)
export function contrastCounts(materials, inventory, ym) {
  const out = {};
  for (const m of materials) {
    for (const f of m.countFields || []) {
      if (!f.device) continue;
      const v = num(inventory[invId(ym, m.id)]?.counts?.[f.key]);
      if (v !== null) out[f.device] = (out[f.device] || 0) + v;
    }
  }
  return out;
}

export function deviceTotals(stat) {
  let count = 0, amount = 0;
  for (const d of DEVICES) { count += n0(stat?.devices?.[d.key]?.count); amount += n0(stat?.devices?.[d.key]?.amount); }
  return { count, amount };
}

export function staffTotals(stat, staff) {
  const t = { mri: 0, ct: 0 };
  for (const s of staff) { t.mri += n0(stat?.staff?.[s.id]?.mri); t.ct += n0(stat?.staff?.[s.id]?.ct); }
  return t;
}
