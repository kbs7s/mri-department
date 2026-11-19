import { useEffect, useState } from 'react';
import { MONTHS, parseYm, ymOf, shiftYm, num } from '../data/model.js';

// حقل رقمي يحفظ عند مغادرة الحقل
export function NumField({ label, value, onSave, disabled, hint, placeholder, className = '' }) {
  const [v, setV] = useState(value ?? '');
  useEffect(() => { setV(value ?? ''); }, [value]);
  const commit = () => {
    const next = v === '' ? null : num(String(v).replace(',', '.'));
    if (next !== (num(value))) onSave(next);
  };
  return (
    <label className={`field ${className}`}>
      <span className="field-label">{label}</span>
      <input type="number" inputMode="decimal" step="any" value={v} disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => setV(e.target.value)} onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }} />
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

export function TextField({ label, value, onSave, disabled, type = 'text', className = '', placeholder }) {
  const [v, setV] = useState(value ?? '');
  useEffect(() => { setV(value ?? ''); }, [value]);
  const commit = () => { if ((v || '') !== (value || '')) onSave(v || null); };
  return (
    <label className={`field ${className}`}>
      {label && <span className="field-label">{label}</span>}
      <input type={type} value={v} disabled={disabled} placeholder={placeholder}
        onChange={(e) => setV(e.target.value)} onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter' && type !== 'textarea') e.currentTarget.blur(); }} />
    </label>
  );
}

export function CellNum({ value, onSave, disabled }) {
  const [v, setV] = useState(value ?? '');
  useEffect(() => { setV(value ?? ''); }, [value]);
  const commit = () => {
    const next = v === '' ? null : num(v);
    if (next !== num(value)) onSave(next);
  };
  return <input className="cell-input" type="number" inputMode="decimal" step="any" value={v} disabled={disabled}
    onChange={(e) => setV(e.target.value)} onBlur={commit}
    onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }} />;
}

export function MonthPicker({ ym, onChange }) {
  const { y, m } = parseYm(ym);
  const years = [];
  const thisYear = new Date().getFullYear();
  for (let i = 2023; i <= thisYear + 1; i++) years.push(i);
  return (
    <div className="month-picker">
      <button className="icon-btn" onClick={() => onChange(shiftYm(ym, -1))} aria-label="الشهر السابق">›</button>
      <select value={m} onChange={(e) => onChange(ymOf(y, Number(e.target.value)))}>
        {MONTHS.map((name, i) => <option key={i} value={i + 1}>{i + 1} - {name}</option>)}
      </select>
      <select value={y} onChange={(e) => onChange(ymOf(Number(e.target.value), m))}>
        {years.map((yy) => <option key={yy} value={yy}>{yy}</option>)}
      </select>
      <button className="icon-btn" onClick={() => onChange(shiftYm(ym, 1))} aria-label="الشهر التالي">‹</button>
    </div>
  );
}

export function YearPicker({ year, onChange }) {
  const thisYear = new Date().getFullYear();
  const years = [];
  for (let i = 2023; i <= thisYear + 1; i++) years.push(i);
  return (
    <select className="year-select" value={year} onChange={(e) => onChange(Number(e.target.value))}>
      {years.map((yy) => <option key={yy} value={yy}>{yy}</option>)}
    </select>
  );
}

export function Stat({ label, value, sub, tone }) {
  return (
    <div className={`stat ${tone || ''}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

// رسم أعمدة بسيط
export function BarChart({ data, height = 160, color = 'var(--accent)', format = (v) => v }) {
  const max = Math.max(1, ...data.map((d) => d.value || 0));
  return (
    <div className="bar-chart" style={{ height }}>
      {data.map((d, i) => (
        <div className="bar-col" key={i} title={`${d.label}: ${format(d.value)}`}>
          <div className="bar-val">{d.value ? format(d.value) : ''}</div>
          <div className="bar" style={{ height: `${((d.value || 0) / max) * 100}%`, background: color }} />
          <div className="bar-label">{d.short ?? d.label}</div>
        </div>
      ))}
    </div>
  );
}

export function usePersistentState(key, initial) {
  const [v, setV] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : initial; } catch { return initial; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* ignore */ } }, [key, v]);
  return [v, setV];
}
