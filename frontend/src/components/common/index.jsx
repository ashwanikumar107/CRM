import React from 'react';

// ── KPI Card ──────────────────────────────────────────────
export function KpiCard({ title, value, sub, icon, color = 'brand', trend }) {
  const colorMap = {
    brand:   'from-brand-500/20 to-brand-600/10 border-brand-500/30 text-brand-300',
    emerald: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-300',
    amber:   'from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-300',
    rose:    'from-rose-500/20 to-rose-600/10 border-rose-500/30 text-rose-300',
    purple:  'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-300',
  };
  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} border rounded-2xl p-5`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        {trend !== undefined && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full
            ${trend >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-sm text-muted mt-1">{title}</div>
      {sub && <div className="text-xs text-muted/70 mt-0.5">{sub}</div>}
    </div>
  );
}

// ── Page Header ──────────────────────────────────────────
export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-sm text-muted mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

// ── Button ───────────────────────────────────────────────
export function Button({ children, variant = 'primary', size = 'md', loading, className = '', ...props }) {
  const base = 'inline-flex items-center gap-2 font-medium rounded-lg transition-all duration-150 disabled:opacity-50';
  const variants = {
    primary: 'bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/25',
    secondary: 'bg-white/10 hover:bg-white/15 text-white border border-white/10',
    danger: 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30',
    ghost: 'text-muted hover:text-white hover:bg-white/5',
    ai: 'bg-gradient-to-r from-brand-500 to-purple-600 hover:from-brand-600 hover:to-purple-700 text-white shadow-lg',
  };
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-5 py-2.5 text-base' };
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} disabled={loading} {...props}>
      {loading && <span className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />}
      {children}
    </button>
  );
}

// ── Input ────────────────────────────────────────────────
export function Input({ label, error, className = '', ...props }) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-xs font-medium text-muted">{label}</label>}
      <input
        className={`w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white
          placeholder-muted focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30
          transition-colors ${error ? 'border-rose-500' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  );
}

// ── Select ────────────────────────────────────────────────
export function Select({ label, children, className = '', ...props }) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-xs font-medium text-muted">{label}</label>}
      <select
        className={`w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white
          focus:outline-none focus:border-brand-500 transition-colors ${className}`}
        {...props}>
        {children}
      </select>
    </div>
  );
}

// ── Badge ────────────────────────────────────────────────
export function Badge({ children, color = 'gray' }) {
  const colors = {
    gray:    'bg-white/10 text-white/70',
    green:   'bg-emerald-500/20 text-emerald-300',
    blue:    'bg-brand-500/20 text-brand-300',
    amber:   'bg-amber-500/20 text-amber-300',
    red:     'bg-rose-500/20 text-rose-300',
    purple:  'bg-purple-500/20 text-purple-300',
  };
  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${colors[color]}`}>
      {children}
    </span>
  );
}

// ── Table ────────────────────────────────────────────────
export function Table({ columns, data, onRowClick, emptyMessage = 'No data found' }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-white/[0.02]">
            {columns.map(col => (
              <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.length === 0 ? (
            <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-muted">{emptyMessage}</td></tr>
          ) : data.map((row, i) => (
            <tr key={i}
              onClick={() => onRowClick?.(row)}
              className={`transition-colors ${onRowClick ? 'cursor-pointer hover:bg-white/[0.03]' : ''}`}>
              {columns.map(col => (
                <td key={col.key} className="px-4 py-3 text-white/80">
                  {col.render ? col.render(row[col.key], row) : row[col.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Modal ────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-card border border-border rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-muted hover:text-white text-xl leading-none">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ── Loading Spinner ──────────────────────────────────────
export function Spinner({ className = '' }) {
  return (
    <div className={`flex items-center justify-center py-12 ${className}`}>
      <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
    </div>
  );
}

// ── Stat Bar ─────────────────────────────────────────────
export function StatBar({ label, value, max, color = 'bg-brand-500' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted">{label}</span>
        <span className="text-white font-medium">{value.toLocaleString()} <span className="text-muted">({pct}%)</span></span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────
export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="text-center py-16">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-white font-semibold mb-1">{title}</h3>
      <p className="text-muted text-sm mb-5">{description}</p>
      {action}
    </div>
  );
}
