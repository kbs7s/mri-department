import { useEffect, useState } from 'react';
import { MONTHS, parseYm, ymOf, shiftYm, num } from '../data/model.js';

// مجموعة أيقونات SVG خفيفة بدون مكتبات خارجية
const ICON_PATHS = {
  home: (
    <>
      <path d="M3 10.5L12 3l9 7.5" />
      <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
    </>
  ),
  inventory: (
    <>
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </>
  ),
  stats: (
    <>
      <path d="M3 3v18h18" />
      <rect x="7" y="10" width="3" height="7" rx="1" />
      <rect x="12" y="6" width="3" height="11" rx="1" />
      <rect x="17" y="13" width="3" height="4" rx="1" />
    </>
  ),
  salaries: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <circle cx="12" cy="12" r="3" />
      <path d="M6 12h.01M18 12h.01" />
    </>
  ),
  reports: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8M8 17h5M8 9h2" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.6.85 1 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </>
  ),
  chevronRight: <path d="m9 18 6-6-6-6" />,
  chevronLeft: <path d="m15 18-6-6 6-6" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </>
  ),
  moon: <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />,
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </>
  ),
  download: (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m7 10 5 5 5-5" />
      <path d="M12 15V3" />
    </>
  ),
  upload: (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m17 8-5-5-5 5" />
      <path d="M12 3v12" />
    </>
  ),
  printer: (
    <>
      <path d="M6 9V2h12v7" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  trash: (
    <>
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </>
  ),
  alert: (
    <>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4M12 17h.01" />
    </>
  ),
  check: <path d="M20 6 9 17l-5-5" />,
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  shield: (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </>
  ),
  activity: <path d="M22 12h-4l-3 9L9 3l-3 9H2" />,
  scan: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v3M12 18v3" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <path d="M2 2 22 22" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </>
  ),
  cart: (
    <>
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
      <path d="M2.5 3h2.6l2.4 11.6a1.6 1.6 0 0 0 1.6 1.3h8.6a1.6 1.6 0 0 0 1.6-1.2L21 7.5H6" />
    </>
  ),
  clipboard: (
    <>
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="m9 14 2 2 4-4" />
    </>
  )
};

export function Icon({ name, size = 18, className = '' }) {
  return (
    <svg
      className={`ui-icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICON_PATHS[name] || null}
    </svg>
  );
}

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
      <input
        type="number"
        inputMode="decimal"
        step="any"
        value={v}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => setV(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
      />
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
      <input
        type={type}
        value={v}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => setV(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter' && type !== 'textarea') e.currentTarget.blur(); }}
      />
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
  return (
    <input
      className="cell-input"
      type="number"
      inputMode="decimal"
      step="any"
      value={v}
      disabled={disabled}
      placeholder="—"
      onChange={(e) => setV(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
    />
  );
}

export function MonthPicker({ ym, onChange }) {
  const { y, m } = parseYm(ym);
  const years = [];
  const thisYear = new Date().getFullYear();
  for (let i = 2023; i <= thisYear + 1; i++) years.push(i);
  return (
    <div className="month-picker">
      <button type="button" className="icon-btn" onClick={() => onChange(shiftYm(ym, -1))} aria-label="الشهر السابق" title="الشهر السابق">
        <Icon name="chevronRight" size={18} />
      </button>
      <div className="month-picker-selects">
        <select value={m} onChange={(e) => onChange(ymOf(y, Number(e.target.value)))} aria-label="الشهر">
          {MONTHS.map((name, i) => <option key={i} value={i + 1}>{i + 1} - {name}</option>)}
        </select>
        <select value={y} onChange={(e) => onChange(ymOf(Number(e.target.value), m))} aria-label="السنة">
          {years.map((yy) => <option key={yy} value={yy}>{yy}</option>)}
        </select>
      </div>
      <button type="button" className="icon-btn" onClick={() => onChange(shiftYm(ym, 1))} aria-label="الشهر التالي" title="الشهر التالي">
        <Icon name="chevronLeft" size={18} />
      </button>
    </div>
  );
}

export function YearPicker({ year, onChange }) {
  const thisYear = new Date().getFullYear();
  const years = [];
  for (let i = 2023; i <= thisYear + 1; i++) years.push(i);
  return (
    <div className="year-picker-wrap">
      <Icon name="calendar" size={16} className="year-picker-icon" />
      <select className="year-select" value={year} onChange={(e) => onChange(Number(e.target.value))} aria-label="السنة">
        {years.map((yy) => <option key={yy} value={yy}>{yy}</option>)}
      </select>
    </div>
  );
}

export function Stat({ label, value, sub, tone, icon }) {
  return (
    <div className={`stat ${tone || ''}`}>
      <div className="stat-top">
        <div className="stat-label">{label}</div>
        {icon && (
          <div className="stat-icon">
            <Icon name={icon} size={18} />
          </div>
        )}
      </div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

// رسم أعمدة حديث بخطوط إرشادية وتفاعل عند التمرير
export function BarChart({ data, height = 190, color = 'var(--accent)', format = (v) => v }) {
  const max = Math.max(1, ...data.map((d) => d.value || 0));
  const hasAny = data.some((d) => (d.value || 0) > 0);
  return (
    <div className="bar-chart-wrap">
      {!hasAny && <div className="chart-empty muted small">لا توجد بيانات مسجلة لهذه الفترة</div>}
      <div className="bar-chart" style={{ height }}>
        <div className="bar-grid" aria-hidden="true">
          <span /><span /><span />
        </div>
        {data.map((d, i) => {
          const val = d.value || 0;
          const pct = val > 0 ? Math.max(4, (val / max) * 100) : 0;
          return (
            <div className={`bar-col ${val > 0 ? 'has-val' : ''}`} key={i} title={`${d.label}: ${format(val)}`}>
              <div className="bar-val">{val ? format(val) : ''}</div>
              <div className="bar-track">
                <div className="bar" style={{ height: `${pct}%`, background: color }} />
              </div>
              <div className="bar-label">{d.short ?? d.label}</div>
            </div>
          );
        })}
      </div>
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
