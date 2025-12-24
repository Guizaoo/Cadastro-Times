import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { NavigationBar, StatusBadge } from '../components/ui'

const DEFAULT_PIX_KEY = '98988831316'
const DEFAULT_PIX_AMOUNT = 0.1
const BANK_QR_IMAGE_PATH = '/pix-qrcode.jpeg'
const WHATSAPP_NUMBER = '5598988831316'

// =================================================

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)

export function PaymentPage({
  times = [],
  onNavigateHome,
  onNavigateCart,
  onNavigatePayment,
}) {
  const qrRef = useRef(null)
  const keyRef = useRef(null)
  const hasOpenedWhatsapp = useRef(false)

  const [manualHint, setManualHint] = useState(
    'O pagamento só será confirmado após a validação do PIX pela organização.'
  )

  const [teamId] = useState(() => {
    const search = new URLSearchParams(window.location.search)
    return search.get('id') || ''
  })

  const safeTimes = useMemo(
    () => (Array.isArray(times) ? times : []),
    [times]
  )

  const team = useMemo(
    () => safeTimes.find((item) => item.id === teamId) || safeTimes[0],
    [teamId, safeTimes]
  )

  const whatsappMessage = useMemo(() => {
    if (!team) return ''
    return encodeURIComponent(
      `Olá! Confirmo o pagamento PIX da equipe ${team.nomeEquipe} (modalidade ${team.modalidade}${
        team.modalidade === 'volei' && team.categoriaVolei
          ? `, categoria ${team.categoriaVolei}`
          : ''
      }) no valor de ${formatCurrency(DEFAULT_PIX_AMOUNT)}. Segue comprovante para validação.`
    )
  }, [team])

  const openWhatsapp = useCallback(() => {
    if (!team || !whatsappMessage || hasOpenedWhatsapp.current) return
    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`,
      '_blank'
    )
    hasOpenedWhatsapp.current = true
  }, [team, whatsappMessage])

  useEffect(() => {
    if (team?.status === 'pago') {
      openWhatsapp()
    } else {
      hasOpenedWhatsapp.current = false
    }
  }, [team?.status, openWhatsapp])

  const paymentHint = useMemo(() => {
    if (team?.status === 'pago') {
      return 'Abrindo WhatsApp para finalizar a validação...'
    }
    return manualHint
  }, [team?.status, manualHint])

  if (!team) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center px-4 text-center">
        <div className="space-y-3">
          <div className="text-lg font-semibold">
            Nenhum time encontrado para pagamento.
          </div>
          <p className="text-sm text-slate-400">
            Abra o link de pagamento a partir do cadastro ou volte para a página inicial.
          </p>
          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              className="rounded-lg border border-amber-300/60 px-4 py-2 text-sm font-semibold text-amber-50"
            >
              Voltar para início
            </button>
          )}
        </div>
      </div>
    )
  }

  // ================= AÇÕES =================

  const copyPixKey = async () => {
    try {
      await navigator.clipboard.writeText(DEFAULT_PIX_KEY)
      setManualHint('Chave PIX copiada! Cole no app do banco para pagar.')
    } catch {
      alert('Não foi possível copiar a chave.')
    }
  }

  const handlePayViaQr = () => {
    qrRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setManualHint(
      'Abra o app do seu banco, escaneie o QR Code e finalize o pagamento.'
    )
  }

  const handlePayViaKey = async () => {
    await copyPixKey()
    keyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const handleSendReceipt = () => {
    if (!team) return
    setManualHint(
      'Envie o comprovante via WhatsApp. A confirmação só ocorre após a validação do PIX.'
    )
    hasOpenedWhatsapp.current = false
    openWhatsapp()
  }

  // ================= UI =================

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-950 via-slate-950 to-amber-900 text-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
        <NavigationBar
          onNavigateHome={onNavigateHome}
          onNavigateCart={onNavigateCart}
          onNavigatePayment={onNavigatePayment}
        />

        <header className="rounded-3xl border border-slate-800/60 bg-slate-900/80 p-6 shadow-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs tracking-widest text-amber-300 uppercase">
                Pagamento PIX
              </p>
              <h1 className="mt-1 text-2xl font-bold">
                Finalize o cadastro da equipe
              </h1>
              <p className="mt-2 max-w-xl text-sm text-slate-300">
                Revise os dados do time, copie a chave Pix ou escaneie o QR Code
                para concluir o pagamento.
              </p>
              {onNavigateHome && (
                <button
                  onClick={onNavigateHome}
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-300/50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-amber-100 transition hover:border-amber-200 hover:text-amber-50"
                >
                  Voltar para cadastro
                </button>
              )}
              {onNavigateCart && (
                <button
                  onClick={onNavigateCart}
                  className="mt-2 inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-100 transition hover:border-amber-200 hover:text-amber-50"
                >
                  Voltar para o carrinho
                </button>
              )}
            </div>
            <StatusBadge status={team.status} />
          </div>
        </header>

        <section className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-400">
                  Valor do pagamento
                </p>
                <p className="mt-2 text-3xl font-bold">
                  {formatCurrency(DEFAULT_PIX_AMOUNT)}
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-emerald-200">
                Pix imediato
              </div>
            </div>

            <div className="mt-6 grid gap-4 rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-400">
                  Identificação do time
                </p>
                <div className="mt-2 space-y-1 text-sm">
                  <div className="font-semibold text-slate-50">
                    {team.nomeEquipe}
                  </div>
                  <div className="text-slate-300">CPF {team.cpf}</div>
                  <div className="text-slate-400">
                    {team.modalidade}
                    {team.modalidade === 'volei' && team.categoriaVolei
                      ? ` • ${team.categoriaVolei}`
                      : ''}
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-400">
                  Chave Pix
                </p>
                <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm text-slate-200">
                  <span className="font-mono">{DEFAULT_PIX_KEY}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                onClick={handlePayViaKey}
                className="w-full rounded-xl border border-amber-300/30 bg-amber-400/10 px-5 py-3 text-sm font-semibold text-amber-100 transition hover:border-amber-200/60 hover:bg-amber-400/20"
              >
                Copiar chave Pix
              </button>

              <button
                onClick={handleSendReceipt}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/70 px-5 py-3 text-sm font-semibold text-white transition hover:border-slate-500 hover:bg-slate-700"
              >
                Enviar comprovante via WhatsApp
              </button>
            </div>

            {paymentHint && (
              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-xs text-slate-200">
                {paymentHint}
              </div>
            )}
          </div>

          <div
            ref={qrRef}
            className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-center shadow-lg"
          >
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs uppercase tracking-widest text-slate-400">
                Escaneie o QR Code Pix
              </p>
              <p className="text-sm text-slate-300">
                Aponte a câmera do app do seu banco para o código abaixo.
              </p>
            </div>
            <div className="mt-5 rounded-2xl bg-white p-4 shadow-lg">
              <img
                src={BANK_QR_IMAGE_PATH}
                alt="QR Code PIX"
                className="mx-auto w-64"
              />
            </div>
            <button
              onClick={handlePayViaQr}
              className="mt-5 w-full rounded-xl border border-slate-700 bg-slate-800/70 px-5 py-3 text-sm font-semibold text-white transition hover:border-slate-500 hover:bg-slate-700"
            >
              Pagar com QR Code
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
