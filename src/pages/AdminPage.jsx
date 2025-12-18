import React, { useMemo } from 'react'
import { NavigationBar, SmallStat, StatusBadge } from '../components/ui'



const formatCreatedAt = (dateString) =>
  new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

export function AdminPage({ times, carregando, erroServidor, onDelete, onStatusChange, onNavigateHome }) {
  const { pagos, reprovados, pendentes } = useMemo(
    () => ({
      pagos: times.filter((time) => time.status === 'pago').length,
      reprovados: times.filter((time) => time.status === 'reprovado').length,
      pendentes: times.filter((time) => time.status === 'pendente').length,
    }),
    [times]
  )

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-950 via-slate-950 to-amber-900 text-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <NavigationBar onNavigateHome={onNavigateHome} />

        <header className="flex flex-col gap-4 rounded-3xl bg-slate-900/80 p-6 shadow-2xl shadow-black/40 ring-1 ring-white/5">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.25em] text-amber-200">/admin</p>
              <h1 className="text-3xl font-bold">Painel administrativo</h1>
              <p className="text-sm text-slate-200">
                Aprove ou reprove cadastros sem sair do site. Todas as ações são gravadas no armazenamento local.
              </p>
            </div>
            <span className="rounded-full border border-amber-400/50 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-100">
              {times.length} cadastros recebidos
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SmallStat label="Pendentes" value={pendentes} />
            <SmallStat label="Pagos" value={pagos} />
            <SmallStat label="Reprovados" value={reprovados} />
            <SmallStat label="Total" value={times.length} />
          </div>
        </header>

        {erroServidor && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">{erroServidor}</div>
        )}

        {carregando ? (
          <div className="rounded-xl border border-dashed border-slate-700 px-4 py-6 text-center text-sm text-slate-300">
            Buscando cadastros salvos...
          </div>
        ) : times.length === 0 ? (
          <div className="rounded-xl border border-dashed border-amber-600/50 bg-slate-900/70 px-4 py-6 text-center text-sm text-slate-300">
            Nenhum cadastro salvo por enquanto.
          </div>
        ) : (
          <section className="space-y-3 rounded-2xl bg-slate-900/70 p-5 shadow-lg shadow-black/30 ring-1 ring-white/5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-amber-200">Aprovação</p>
                <h2 className="text-xl font-semibold text-slate-50">Controle de times salvos</h2>
                <p className="text-sm text-slate-300">Consulte, valide e apague cadastros diretamente do site.</p>
              </div>
              <button
                type="button"
                onClick={onNavigateHome}
                className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:border-amber-400 hover:text-amber-100"
              >
                Voltar para o site
              </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/40 shadow-inner shadow-black/30">
              <table className="w-full text-sm text-slate-200">
                <thead className="bg-slate-900/80 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-4 py-3 text-left">Equipe</th>
                    <th className="px-4 py-3 text-left">Modalidade</th>
                    <th className="px-4 py-3 text-left">Integrantes</th>
                    <th className="px-4 py-3 text-left">Contato</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Criado em</th>
                    <th className="px-4 py-3 text-left">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {times.map((time) => (
                    <tr key={time.id} className="border-t border-slate-800/80">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-50">{time.nomeEquipe}</div>
                        <div className="text-xs text-slate-400">CPF {time.cpf}</div>
                      </td>
                      <td className="px-4 py-3 capitalize">
                        {time.modalidade}
                        {time.modalidade === 'volei' && ` • ${time.categoriaVolei}`}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-300">{time.integrantes}</td>
                      <td className="px-4 py-3 text-xs text-slate-300">{time.celular}</td>
                      <td className="px-4 py-3 text-xs">
                        <StatusBadge status={time.status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-300">{formatCreatedAt(time.criadoEm)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => onStatusChange(time.id, 'pago')}
                            className="rounded-lg border border-emerald-500/50 px-3 py-2 font-semibold text-emerald-100 transition hover:bg-emerald-500/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                          >
                            Pago
                          </button>
                          <button
                            type="button"
                            onClick={() => onStatusChange(time.id, 'reprovado')}
                            className="rounded-lg border border-amber-500/50 px-3 py-2 font-semibold text-amber-100 transition hover:bg-amber-500/10 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                          >
                            Reprovar
                          </button>
                          <button
                            type="button"
                            onClick={() => onStatusChange(time.id, 'pendente')}
                            className="rounded-lg border border-slate-600 px-3 py-2 font-semibold text-slate-100 transition hover:bg-slate-800/60 focus:outline-none focus:ring-2 focus:ring-slate-600/40"
                          >
                            Pendente
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(time.id)}
                            className="rounded-lg border border-red-500/40 px-3 py-2 font-semibold text-red-100 transition hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-red-500/40"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
