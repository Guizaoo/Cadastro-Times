import React, { useEffect, useMemo, useState } from 'react'
import { NavigationBar, StatusBadge } from '../components/ui'

const PIX_KEY = '000.111.222-33 (chave fictícia para testes)'

const formatCreatedAt = (dateString) =>
  new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

const LAST_PAYMENT_KEY = 'copa:lastPaymentTeamId'

export function PaymentPage({ times, onMarkPaid, onNavigateHome, onNavigateAdmin }) {
  const [teamId] = useState(() => {
    const search = new URLSearchParams(window.location.search)
    return search.get('id') || localStorage.getItem(LAST_PAYMENT_KEY) || ''
  })

  const team = useMemo(() => times.find((item) => item.id === teamId) || times[0], [teamId, times])

  useEffect(() => {
    if (team?.id) {
      localStorage.setItem(LAST_PAYMENT_KEY, team.id)
    }
  }, [team])

  if (!team) {
    return (
      <div className="min-h-screen bg-linear-to-b from-slate-950 via-slate-950 to-amber-900 text-slate-50">
        <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
          <NavigationBar onNavigateHome={onNavigateHome} onNavigateAdmin={onNavigateAdmin} />
          <div className="rounded-2xl border border-dashed border-amber-600/50 bg-slate-900/70 px-4 py-10 text-center text-sm text-slate-300">
            Nenhum time encontrado para pagamento. Cadastre um time ou abra o painel para escolher outro cadastro.
            <div className="mt-4 flex flex-wrap justify-center gap-3 text-xs">
              <button
                type="button"
                onClick={onNavigateHome}
                className="rounded-lg border border-slate-700 px-4 py-2 font-semibold text-slate-100 transition hover:border-amber-400 hover:text-amber-100"
              >
                Voltar à página inicial
              </button>
              <button
                type="button"
                onClick={onNavigateAdmin}
                className="rounded-lg border border-amber-400/60 px-4 py-2 font-semibold text-amber-100 transition hover:border-amber-300 hover:text-amber-50"
              >
                Abrir área admin
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleMarkPaid = () => {
    onMarkPaid(team.id, 'aguardando_validacao')
    const mensagem = encodeURIComponent(
      `Olá! Confirmo o pagamento PIX da equipe ${team.nomeEquipe} (modalidade ${team.modalidade}${
        team.modalidade === 'volei' && team.categoriaVolei ? `, categoria ${team.categoriaVolei}` : ''
      }).`
    )
    window.open(`https://wa.me/?text=${mensagem}`)
  }

  const copyPixKey = async () => {
    try {
      await navigator.clipboard.writeText(PIX_KEY)
      alert('Chave PIX copiada!')
    } catch (error) {
      console.error('Erro ao copiar PIX', error)
      alert('Não foi possível copiar agora. Copie manualmente, por favor.')
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-950 via-slate-950 to-amber-900 text-slate-50">
      <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <NavigationBar onNavigateHome={onNavigateHome} onNavigateAdmin={onNavigateAdmin} />

        <header className="flex flex-col gap-3 rounded-3xl bg-slate-900/80 p-6 shadow-2xl shadow-black/40 ring-1 ring-white/5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-amber-200">Pagamento PIX</p>
              <h1 className="text-2xl font-bold">Finalize o cadastro da equipe</h1>
              <p className="text-sm text-slate-200">
                Use a chave abaixo para pagar via PIX. Após concluir, abra o WhatsApp e envie o comprovante para validação manual.
              </p>
            </div>
            <StatusBadge status={team.status} />
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-100">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-200">Equipe</p>
            <div className="mt-1 font-semibold text-lg text-slate-50">{team.nomeEquipe}</div>
            <div className="text-sm text-slate-300">
              Responsável: {team.nome} • CPF {team.cpf} • Celular {team.celular}
            </div>
            <div className="text-xs text-slate-400">Criado em {formatCreatedAt(team.criadoEm)}</div>
          </div>
        </header>

        <section className="space-y-4 rounded-2xl bg-slate-900/70 p-6 shadow-lg shadow-black/30 ring-1 ring-white/5">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.25em] text-amber-200">Chave PIX</p>
            <div className="rounded-lg border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-amber-50">{PIX_KEY}</div>
            <p className="text-xs text-slate-400">Esta chave é fictícia para testes. Copie e confirme o pagamento para liberar a validação.</p>
          </div>

          <div className="flex flex-wrap gap-3 text-sm">
            <button
              type="button"
              onClick={copyPixKey}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 font-semibold text-slate-950 transition hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300/70"
            >
              Copiar chave PIX
            </button>
            <button
              type="button"
              onClick={handleMarkPaid}
              className="inline-flex items-center gap-2 rounded-lg border border-green-400/60 px-4 py-2 font-semibold text-green-100 transition hover:border-green-300 hover:text-green-50 focus:outline-none focus:ring-2 focus:ring-green-400/40"
            >
              Já paguei, validar no WhatsApp
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

export { LAST_PAYMENT_KEY }
