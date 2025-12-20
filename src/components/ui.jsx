export function NavigationBar({ onNavigateAdmin, onNavigateAuth, onNavigateHome }) {

return (
    <nav className="flex items-center justify-between gap-4 rounded-2xl border border-white/5 bg-slate-950/50 px-4 py-3 text-sm shadow-inner shadow-black/30">
      <div className="flex items-center gap-2">
        <span className="text-xs uppercase tracking-[0.25em] text-amber-200">Copa</span>
        <span className="text-sm font-semibold text-slate-50">João Guilherme</span>
      </div>
      <div className="flex items-center gap-2">
        {onNavigateHome && (
          <button
            type="button"
            onClick={onNavigateHome}
            className="rounded-lg border border-slate-700 px-3 py-2 font-semibold text-slate-100 transition hover:border-amber-400 hover:text-amber-100"
          >
            Página inicial
          </button>
        )}

        {onNavigateAuth && (
          <button
            type="button"
            onClick={onNavigateAuth}
            className="rounded-lg border border-slate-700 px-3 py-2 font-semibold text-slate-100 transition hover:border-amber-400 hover:text-amber-100"
          >
            Acesso
          </button>
        )}

        {onNavigateAdmin && (
          <button
            type="button"
            onClick={onNavigateAdmin}
            className="rounded-lg border border-amber-400/60 px-3 py-2 font-semibold text-amber-100 transition hover:border-amber-300 hover:text-amber-50"
          >
            Área admin
          </button>
        )}
      </div>
    </nav>
  )
}

const statusLabels = {
  pendente: 'Pendente',
  pago: 'Pago',
  reprovado: 'Reprovado',
}

const statusStyles = {
  pendente: 'bg-amber-500/10 text-amber-100 border-amber-400/50',
  pago: 'bg-emerald-500/10 text-emerald-100 border-emerald-400/50',
  reprovado: 'bg-red-500/10 text-red-100 border-red-400/50',
}

export function StatusBadge({ status }) {
  const label = statusLabels[status] ?? 'Pendente'
  const style = statusStyles[status] ?? statusStyles.pendente
  return <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${style}`}>{label}</span>
}

export function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-3 shadow-inner shadow-black/30">
      <p className="text-xs text-slate-400">{label}</p>
      <strong className="text-2xl">{value}</strong>
    </div>
  )
}

export function SmallStat({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-3 text-center shadow-inner shadow-black/30">
      <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-xl font-semibold text-slate-50">{value}</p>
    </div>
  )
}

export function InputField({ id, label, value, onChange, placeholder, type = 'text', className = '', ...rest }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-slate-200" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        type={type}
        placeholder={placeholder}
        className={`w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-500/40 ${className}`}
        {...rest}
      />
    </div>
  )
}
