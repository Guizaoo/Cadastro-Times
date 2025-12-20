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
  onNavigateAdmin,
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
        />

        <header className="rounded-3xl bg-slate-900/80 p-6 shadow-xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs tracking-widest text-amber-300 uppercase">
                Pagamento PIX
              </p>
              <h1 className="text-2xl font-bold mt-1">
                Finalize o cadastro da equipe
              </h1>
            </div>
            <StatusBadge status={team.status} />
          </div>
        </header>

        <section className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-xl bg-slate-900/70 p-5 border border-slate-800">
            <p className="text-3xl font-bold">
              {formatCurrency(DEFAULT_PIX_AMOUNT)}
            </p>

            <div className="mt-5 inline-flex rounded-2xl bg-slate-900/80 p-2 backdrop-blur-md border border-slate-700">
              <button
                onClick={handlePayViaKey}
                className="ml-2 px-6 py-3 rounded-xl text-white font-medium bg-slate-800 hover:bg-slate-700 transition"
              >
                Copiar chave PIX
              </button>

              <button
                onClick={handlePayViaQr}
                className="ml-2 px-6 py-3 rounded-xl text-white font-medium bg-slate-800 hover:bg-slate-700 transition"
              >
              </button>

              <button
                onClick={handleSendReceipt}
                className="ml-2 px-6 py-3 rounded-xl text-white font-medium bg-slate-800 hover:bg-slate-700 transition"
              >
                Enviar comprovante via WhatsApp
              </button>
            </div>

            {paymentHint && (
              <div className="mt-4 rounded-lg bg-slate-950/60 border px-4 py-3 text-xs">
                {paymentHint}
              </div>
            )}
          </div>

          <div ref={qrRef} className="rounded-xl bg-slate-900/70 p-5 text-center">
            <img
              src={BANK_QR_IMAGE_PATH}
              alt="QR Code PIX"
              className="mx-auto w-64"
            />
          </div>
        </section>
      </div>
    </div>
  )
}
