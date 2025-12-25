import { useMemo, useRef, useState } from 'react'

// ==============================
// Constantes auxiliares
// ==============================
const DEFAULT_PIX_KEY = '98988831316'
const DEFAULT_PIX_AMOUNT = 0.1
const BANK_QR_IMAGE_PATH = '/pix-qrcode.jpeg'
const WHATSAPP_NUMBER = '5598988831316'

// ==============================
// Helpers
// ==============================
const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)

// ==============================
// Componente
// ==============================
export function PaymentPage({
  times = [],
  onNavigateHome,
  onNavigateCart,
}) {
  const qrRef = useRef(null)
  const keyRef = useRef(null)
  const hasOpenedWhatsapp = useRef(false)

  const [manualHint] = useState(
    'O pagamento só será confirmado após a validação do PIX pela organização.'
  )

  // pega o ID do time pela URL (?id=...)
  const [teamId] = useState(() => {
    const search = new URLSearchParams(window.location.search)
    return search.get('id') || ''
  })

  // time selecionado
  const team = useMemo(
    () => times.find((t) => t.id === teamId),
    [times, teamId]
  )

  const pixAmount = useMemo(() => DEFAULT_PIX_AMOUNT, [])

  // abrir WhatsApp
  const openWhatsapp = () => {
    if (hasOpenedWhatsapp.current) return
    hasOpenedWhatsapp.current = true

    const message = encodeURIComponent(
      `Olá! Realizei o pagamento do PIX no valor de ${formatCurrency(
        pixAmount
      )} referente ao time "${team?.nomeEquipe ?? ''}".`
    )

    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`,
      '_blank'
    )
  }

  if (!team) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-lg font-semibold">
          Time não encontrado para pagamento.
        </p>
        <button
          onClick={onNavigateCart}
          className="px-4 py-2 rounded-lg bg-slate-900 text-white"
        >
          Voltar ao carrinho
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={onNavigateHome}
            className="text-sm underline opacity-80 hover:opacity-100"
          >
            Voltar
          </button>
          <h1 className="text-xl font-bold">Pagamento PIX</h1>
        </div>

        {/* Informações */}
        <div className="rounded-xl bg-slate-900 p-4 space-y-2">
          <p>
            <strong>Equipe:</strong> {team.nomeEquipe}
          </p>
          <p>
            <strong>Responsável:</strong> {team.nome}
          </p>
          <p>
            <strong>Valor:</strong>{' '}
            <span className="text-emerald-400 font-semibold">
              {formatCurrency(pixAmount)}
            </span>
          </p>
        </div>

        {/* QR Code */}
        <div className="rounded-xl bg-white p-4 flex flex-col items-center gap-3">
          <img
            ref={qrRef}
            src={BANK_QR_IMAGE_PATH}
            alt="QR Code PIX"
            className="w-56 h-56 object-contain"
          />

          <div className="text-center text-slate-900 text-sm">
            <p>Chave PIX</p>
            <p ref={keyRef} className="font-mono font-semibold">
              {DEFAULT_PIX_KEY}
            </p>
          </div>
        </div>

        {/* Aviso */}
        <p className="text-xs text-center opacity-70">
          {manualHint}
        </p>

        {/* Ações */}
        <div className="flex flex-col gap-3">
          <button
            onClick={openWhatsapp}
            className="w-full rounded-xl bg-emerald-500 text-slate-900 font-semibold py-3 hover:bg-emerald-400 transition"
          >
            Já paguei — confirmar no WhatsApp
          </button>

          <button
            onClick={onNavigateCart}
            className="w-full rounded-xl border border-slate-700 py-3 text-sm hover:bg-slate-900 transition"
          >
            Voltar ao carrinho
          </button>
        </div>
      </div>
    </div>
  )
}
