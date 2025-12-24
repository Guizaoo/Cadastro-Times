import React, { useMemo } from 'react'
import { NavigationBar, StatusBadge } from '../components/ui'

const formatCreatedAt = (dateString) =>
  new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

export function CartPage({
  times = [],
  onNavigateHome,
  onNavigatePayment,
  onNavigateCart,
}) {
  const pendentes = useMemo(
    () => (Array.isArray(times) ? times : []).filter((time) => time.status === 'pendente'),
    [times]
  )

  const handleNavigatePayment = () => {
    if (!onNavigatePayment) return
    const firstPending = pendentes[0]?.id
    onNavigatePayment(firstPending ?? '')
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-950 via-slate-950 to-amber-900 text-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <NavigationBar
          onNavigateHome={onNavigateHome}
          onNavigateCart={onNavigateCart}
          onNavigatePayment={handleNavigatePayment}
        />

        <header className="flex flex-col gap-4 rounded-3xl bg-slate-900/80 p-6 shadow-2xl shadow-black/40 ring-1 ring-white/5">
          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-[0.25em] text-amber-200">Carrinho</p>
            <h1 className="text-3xl font-bold">Inscrições salvas para pagamento</h1>
            <p className="text-sm text-slate-200">
              Aqui ficam os cadastros pendentes. Você pode voltar ao formulário ou seguir para o pagamento quando quiser.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
            <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1 font-semibold text-amber-100">
              {pendentes.length} pendente(s)
            </span>
            <span className="rounded-full border border-slate-700 px-3 py-1">
              Pagamento rápido via Pix
            </span>
          </div>
        </header>

        {pendentes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 px-6 py-8 text-center text-sm text-slate-300">
            Nenhuma inscrição pendente no carrinho ainda. Volte ao cadastro e salve uma equipe para pagar depois.
          </div>
        ) : (
          <section className="grid gap-4">
            {pendentes.map((time) => (
              <article
                key={time.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/30"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.25em] text-amber-200">Equipe</p>
                    <h2 className="text-xl font-semibold text-slate-50">{time.nomeEquipe}</h2>
                    <div className="text-sm text-slate-300">CPF {time.cpf}</div>
                    <div className="text-sm text-slate-400">
                      {time.modalidade}
                      {time.modalidade === 'volei' && time.categoriaVolei ? ` • ${time.categoriaVolei}` : ''}
                    </div>
                    <div className="text-xs text-slate-400">Criado em {formatCreatedAt(time.criadoEm)}</div>
                  </div>
                  <div className="flex flex-col gap-3 sm:items-end">
                    <StatusBadge status={time.status} />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onNavigatePayment?.(time.id)}
                        className="rounded-lg border border-emerald-500/50 px-4 py-2 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-500/10"
                      >
                        Ir para pagamento
                      </button>
                      <button
                        type="button"
                        onClick={onNavigateHome}
                        className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:border-amber-400 hover:text-amber-100"
                      >
                        Voltar ao cadastro
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </div>
  )
}
