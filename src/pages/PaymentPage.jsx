import React, { useEffect, useMemo, useRef, useState } from 'react'
import { NavigationBar, StatusBadge } from '../components/ui'

// ================= CONFIGURAÇÕES =================

// 🔑 Chave PIX (use uma CHAVE ALEATÓRIA do banco)
const DEFAULT_PIX_KEY = 'COLE_SUA_CHAVE_PIX_ALEATORIA_AQUI'

// 💰 Valor fixo
const DEFAULT_PIX_AMOUNT = 0.1

// 🖼 QR Code fixo do banco (arquivo em /public)
const BANK_QR_IMAGE_PATH = '/pix-qrcode.jpeg'

// 📱 WhatsApp (Brasil = 55)
const WHATSAPP_NUMBER = '5598988831316'

// =================================================

const LAST_PAYMENT_KEY = 'copa:lastPaymentTeamId'

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)

const formatCreatedAt = (dateString) =>
  new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

export function PaymentPage({ times, onMarkPaid, onNavigateHome, onNavigateAdmin }) {
  const qrRef = useRef(null)
  const keyRef = useRef(null)

  const [paymentHint, setPaymentHint] = useState('')

  const [teamId] = useState(() => {
    const search = new URLSearchParams(window.location.search)
    return search.get('id') || localStorage.getItem(LAST_PAYMENT_KEY) || ''
  })

  const team = useMemo(
    () => times.find((item) => item.id === teamId) || times[0],
    [teamId, times]
  )

  useEffect(() => {
    if (team?.id) {
      localStorage.setItem(LAST_PAYMENT_KEY, team.id)
    }
  }, [team])

  if (!team) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center">
        Nenhum time encontrado.
      </div>
    )
  }

  // ================= AÇÕES =================

  const copyPixKey = async () => {
    try {
      await navigator.clipboard.writeText(DEFAULT_PIX_KEY)
      setPaymentHint('Chave PIX copiada! Cole no app do banco para pagar.')
    } catch {
      alert('Não foi possível copiar a chave.')
    }
  }

  const handlePayViaQr = () => {
    qrRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setPaymentHint(
      'Abra o app do seu banco, escaneie o QR Code e finalize o pagamento. Depois volte e clique em “Já paguei”.'
    )
  }

  const handlePayViaKey = async () => {
    await copyPixKey()
    keyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const handleMarkPaid = () => {
    onMarkPaid(team.id, 'aguardando_validacao')

    const mensagem = encodeURIComponent(
      `Olá! Confirmo o pagamento PIX da equipe ${team.nomeEquipe} (modalidade ${team.modalidade}${
        team.modalidade === 'volei' && team.categoriaVolei
          ? `, categoria ${team.categoriaVolei}`
          : ''
      }) no valor de ${formatCurrency(
        DEFAULT_PIX_AMOUNT
      )}. Segue comprovante para validação.`
    )

    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${mensagem}`,
      '_blank'
    )
  }

  // ================= UI =================

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-950 via-slate-950 to-amber-900 text-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
        <NavigationBar
          onNavigateHome={onNavigateHome}
          onNavigateAdmin={onNavigateAdmin}
        />

        {/* HEADER */}
        <header className="rounded-3xl bg-slate-900/80 p-6 shadow-xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs tracking-widest text-amber-300 uppercase">
                Pagamento PIX
              </p>
              <h1 className="text-2xl font-bold mt-1">
                Finalize o cadastro da equipe
              </h1>
              <p className="text-sm text-slate-300 mt-2">
                Escolha como deseja pagar e envie o comprovante no WhatsApp.
              </p>
            </div>
            <StatusBadge status={team.status} />
          </div>

          <div className="mt-4 text-sm text-slate-300">
            <strong>{team.nomeEquipe}</strong> • {team.nome} • {team.celular}
            <div className="text-xs text-slate-400">
              Criado em {formatCreatedAt(team.criadoEm)}
            </div>
          </div>
        </header>

        {/* CONTEÚDO */}
        <section className="grid lg:grid-cols-2 gap-6">
          {/* ESQUERDA */}
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-900/70 p-5 border border-slate-800">
              <p className="text-xs tracking-widest uppercase text-amber-300">
                Valor
              </p>
              <p className="text-3xl font-bold mt-1">
                {formatCurrency(DEFAULT_PIX_AMOUNT)}
              </p>

              <div
                ref={keyRef}
                className="mt-5 rounded-lg bg-slate-950/50 border border-slate-800 p-4"
              >
                <p className="text-xs uppercase tracking-widest text-amber-300">
                  Chave PIX (opcional)
                </p>
                <div className="mt-2 rounded bg-slate-900 px-3 py-2 text-sm">
                  {DEFAULT_PIX_KEY}
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Use apenas se não conseguir escanear o QR Code.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 mt-5">
                <button
                  onClick={handlePayViaQr}
                  className="rounded-lg bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700"
                >
                  Pagar via QR Code
                </button>

                <button
                  onClick={handlePayViaKey}
                  className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-amber-300"
                >
                  Pagar via chave
                </button>

                <button
                  onClick={handleMarkPaid}
                  className="rounded-lg border border-green-400 px-4 py-2 text-sm text-green-100 hover:border-green-300"
                >
                  Já paguei, validar no WhatsApp
                </button>
              </div>

              {paymentHint && (
                <div className="mt-4 rounded-lg bg-slate-950/60 border border-slate-800 px-4 py-3 text-xs text-slate-300">
                  {paymentHint}
                </div>
              )}
            </div>
          </div>

          {/* DIREITA */}
          <div
            ref={qrRef}
            className="rounded-xl bg-slate-900/70 p-5 border border-slate-800 text-center"
          >
            <p className="text-xs tracking-widest uppercase text-amber-300">
              QR Code do Banco
            </p>

            <div className="mt-4 bg-white p-4 rounded-xl inline-block">
              <img
                src={BANK_QR_IMAGE_PATH}
                alt="QR Code PIX"
                className="w-64 h-64 object-contain"
              />
            </div>

            <p className="text-xs text-slate-400 mt-4">
              Abra o app do seu banco, escaneie o QR Code e finalize o pagamento.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}

export { LAST_PAYMENT_KEY }
