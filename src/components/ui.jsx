export function NavigationBar({ onNavigateCart, onNavigateLogin }) {
  return (
    <nav className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800/70 bg-slate-900/60 px-4 py-3 text-xs uppercase tracking-[0.2em] text-slate-200 shadow-lg shadow-black/30">
      <div className="flex flex-1 items-center justify-start">
        {onNavigateLogin && (
          <button
            type="button"
            onClick={onNavigateLogin}
            className="rounded-full border border-transparent px-3 py-2 font-semibold text-slate-200 transition hover:border-amber-400 hover:text-amber-100"
          >
            Voltar ao login
          </button>
        )}
      </div>
      <div className="flex flex-1 items-center justify-end">
        {onNavigateCart && (
          <button
            type="button"
            onClick={onNavigateCart}
            className="inline-flex items-center gap-2 rounded-full border border-transparent px-3 py-2 font-semibold text-slate-200 transition hover:border-amber-400 hover:text-amber-100"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-4 w-4 text-amber-200"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 6h15l-1.4 7.2a2 2 0 0 1-2 1.6H8.6a2 2 0 0 1-2-1.5L4.5 4H2" />
              <circle cx="9" cy="19" r="1.4" />
              <circle cx="18" cy="19" r="1.4" />
            </svg>
            Carrinho
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
