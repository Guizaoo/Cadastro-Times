import { useCallback, useEffect, useMemo, useState } from 'react'
import { AdminPage } from './pages/AdminPage'
import { AuthPage } from './pages/AuthPage.jsx'
import { CartPage } from './pages/CartPage'
import { HomePage } from './pages/HomePage'
import { initialForm } from './pages/homePageConfig'
import { PaymentPage } from './pages/PaymentPage'
import { supabase } from './services/supabase'
import { fetchTeams, saveTeam } from './services/teamApi'

// ==============================
// Helpers (format/validate)
// ==============================
const normalizeText = (value) => value.trim()
const sanitizeDigits = (value) => value.replace(/\D+/g, '')

const formatCPF = (value) => {
  const digits = sanitizeDigits(value)
  if (digits.length !== 11) return normalizeText(value)
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

const formatCelular = (value) => {
  const digits = sanitizeDigits(value)
  if (digits.length < 10) return normalizeText(value)

  const ddd = digits.slice(0, 2)
  const number = digits.slice(2)
  const hasNineDigits = number.length === 9

  const partA = number.slice(0, hasNineDigits ? 5 : 4)
  const partB = number.slice(hasNineDigits ? 5 : 4)

  return `(${ddd}) ${partA}-${partB}`
}

const validateCPF = (value) => {
  const digits = sanitizeDigits(value)
  if (digits.length !== 11) return false

  const invalids = [
    '00000000000',
    '11111111111',
    '22222222222',
    '33333333333',
    '44444444444',
    '55555555555',
    '66666666666',
    '77777777777',
    '88888888888',
    '99999999999',
  ]
  if (invalids.includes(digits)) return false

  const calcCheckDigit = (base, factor) => {
    const sum = base.split('').reduce((acc, curr) => acc + Number(curr) * factor--, 0)
    const remainder = (sum * 10) % 11
    return remainder === 10 ? 0 : remainder
  }

  const first = calcCheckDigit(digits.slice(0, 9), 10)
  const second = calcCheckDigit(digits.slice(0, 10), 11)

  return String(first) === digits[9] && String(second) === digits[10]
}

const validateCelular = (value) => {
  const digits = sanitizeDigits(value)
  return digits.length >= 10 && digits.length <= 11
}

const parseIntegrantes = (value) =>
  value.split(/[\n,]/).map((item) => item.trim()).filter(Boolean)

// Impede o mesmo CPF de cadastrar mais de um time na mesma modalidade (na lista local)
const cpfExists = (list, cpfDigits, modalidade) =>
  Boolean(cpfDigits) &&
  list.some((time) => sanitizeDigits(time.cpf) === cpfDigits && time.modalidade === modalidade)

// ==============================
// App
// ==============================
function App() {
  // Normaliza rotas antigas
  const normalizeRoute = (path) => (path.startsWith('/acessar') ? '/acesso' : path)

  // Estado de rota (router manual)
  const [route, setRoute] = useState(() => normalizeRoute(window.location.pathname))

  // Estados principais do app
  const [formData, setFormData] = useState(initialForm)
  const [times, setTimes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erroServidor, setErroServidor] = useState('')
  const [errors, setErrors] = useState([])

  // Auth (Supabase)
  const [authReady, setAuthReady] = useState(false)
  const [user, setUser] = useState(null)

  // Navegação memoizada (evita warning + comportamento consistente)
  const navigate = useCallback(
    (path) => {
      const normalizedPath = normalizeRoute(path)
      if (normalizedPath === route) return
      window.history.pushState({}, '', normalizedPath)
      setRoute(normalizedPath)
    },
    [route]
  )

  // Nome curto para UI (2 palavras) baseado em full_name ou email
  const displayName = useMemo(() => {
    if (!user) return ''

    const pickShortName = (value) => {
      const cleaned = value.trim()
      if (!cleaned) return ''
      const parts = cleaned.split(/\s+/).filter(Boolean)
      return parts.slice(0, 2).join(' ')
    }

    const fullName = user.user_metadata?.full_name?.trim()
    if (fullName) return pickShortName(fullName)

    const email = user.email?.trim()
    if (!email) return ''

    const emailName = email.split('@')[0].replace(/[._-]+/g, ' ')
    return pickShortName(emailName)
  }, [user])

  // ==============================
  // 1) Carregar times do banco
  // ==============================
  useEffect(() => {
    const carregarTimes = async () => {
      try {
        const existentes = await fetchTeams()
        setTimes(existentes)
      } catch (error) {
        console.error('Erro ao buscar times', error)
        const message =
          error?.message?.includes('Supabase não configurado')
            ? 'Configuração do Supabase ausente. Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.'
            : 'Não foi possível carregar os times salvos. Tente novamente mais tarde.'
        setErroServidor(message)
      } finally {
        setCarregando(false)
      }
    }

    carregarTimes()
  }, [])

  // ==============================
  // 2) Ouvir back/forward do navegador
  // ==============================
  useEffect(() => {
    const normalizedPath = normalizeRoute(window.location.pathname)
    if (normalizedPath !== window.location.pathname) {
      window.history.replaceState({}, '', normalizedPath)
    }

    const handlePopState = () => setRoute(normalizeRoute(window.location.pathname))
    window.addEventListener('popstate', handlePopState)

    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // ==============================
  // 3) Inicializar e ouvir sessão do Supabase
  // ==============================
  useEffect(() => {
    if (!supabase) {
      setAuthReady(true)
      return
    }

    supabase.auth.getSession().then(({ data, error }) => {
      if (!error) setUser(data.session?.user ?? null)
      setAuthReady(true)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setAuthReady(true)
    })

    return () => {
      listener?.subscription?.unsubscribe()
    }
  }, [])

  // ==============================
  // Rotas derivadas
  // ==============================
  const isAdminRoute = route.startsWith('/admin')
  const isPaymentRoute = route.startsWith('/pagamento')
  const isCartRoute = route.startsWith('/carrinho')
  const isAuthRoute = route.startsWith('/acesso')

  // ==============================
  // 4) Guard de autenticação
  // ==============================
  useEffect(() => {
    if (!authReady) return

    if (!user && !isAuthRoute) {
      navigate('/acesso')
    } else if (user && isAuthRoute) {
      navigate('/')
    }
  }, [authReady, user, isAuthRoute, navigate])

  // ==============================
  // Estatísticas da home
  // ==============================
  const estatisticas = useMemo(() => {
    const modalidades = new Set(times.map((time) => time.modalidade)).size
    const categoriasVolei = new Set(
      times
        .filter((time) => time.modalidade === 'volei')
        .map((time) => time.categoriaVolei)
    ).size

    return {
      total: times.length,
      modalidades,
      categoriasVolei,
      contatos: times.filter((time) => time.celular?.trim()).length,
    }
  }, [times])

  // ==============================
  // Eventos do formulário
  // ==============================
  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    // Reset de mensagens anteriores
    setErroServidor('')
    setErrors([])

    const integrantesList = parseIntegrantes(formData.integrantes)
    const cpfDigits = sanitizeDigits(formData.cpf)

    // Validações básicas
    const validationErrors = [
      ...(!formData.nome?.trim() ? ['Nome é obrigatório'] : []),
      ...(!formData.nomeEquipe?.trim() ? ['Nome da equipe é obrigatório'] : []),
      ...(!formData.cpf?.trim() ? ['CPF é obrigatório'] : []),
      ...(!formData.celular?.trim() ? ['Celular é obrigatório'] : []),
      ...(!formData.integrantes?.trim() ? ['Integrantes é obrigatório'] : []),
      ...(formData.modalidade === 'volei' && !formData.categoriaVolei?.trim()
        ? ['Categoria do vôlei é obrigatória']
        : []),

      ...(!validateCPF(formData.cpf) ? ['CPF inválido'] : []),
      ...(!validateCelular(formData.celular) ? ['Número de celular inválido'] : []),

      ...(cpfExists(times, cpfDigits, formData.modalidade)
        ? ['Este CPF já possui um time cadastrado nesta modalidade.']
        : []),

      ...(formData.modalidade === 'futebol' && integrantesList.length > 15
        ? ['Limite de 15 integrantes para futebol']
        : []),

      ...(formData.modalidade === 'volei' && integrantesList.length !== 2
        ? ['No vôlei, informe exatamente 2 integrantes (dupla)']
        : []),
    ]

    if (validationErrors.length) {
      setErrors(validationErrors)
      return
    }

    // Normalizações
    const novoTime = {
      ...formData,
      nome: normalizeText(formData.nome),
      nomeEquipe: normalizeText(formData.nomeEquipe),
      cpf: formatCPF(formData.cpf),
      celular: formatCelular(formData.celular),
      integrantes: integrantesList.join(', '),
      categoriaVolei: normalizeText(formData.categoriaVolei || ''),
      status: 'pendente',
      id: crypto.randomUUID(),
      criadoEm: new Date().toISOString(),
    }

    try {
      const result = await saveTeam(novoTime)
      const savedTeam = { ...novoTime, ...result }

      setTimes((current) => [savedTeam, ...current])
      setFormData(initialForm)
      setErrors([])
      navigate('/carrinho')
    } catch (error) {
      console.error('Erro ao salvar time', error)
      const message =
        error?.message?.includes('Supabase não configurado')
          ? 'Configuração do Supabase ausente. Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.'
          : 'Não foi possível salvar no momento. Tente novamente em instantes.'
      setErroServidor(message)
    }
  }

  const handleLogout = async () => {
    setUser(null)

    if (!supabase) {
      navigate('/acesso')
      return
    }

    try {
      const { error } = await supabase.auth.signOut()
      if (error) console.error('Erro ao sair', error)
    } catch (error) {
      console.error('Erro ao sair', error)
    } finally {
      navigate('/acesso')
    }
  }

  // ==============================
  // Loading (usando carregando de verdade)
  // ==============================
  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <div className="text-lg font-semibold">Carregando...</div>
          <div className="text-sm opacity-70">Buscando dados e preparando o sistema.</div>
        </div>
      </div>
    )
  }

  // Enquanto auth ainda não ficou pronto (e usuário ainda não existe)
  if (!authReady && !user) {
    return (
      <AuthPage
        onNavigateHome={() => navigate('/')}
        onLoginSuccess={() => navigate('/')}
      />
    )
  }

  // ==============================
  // Render por rota
  // ==============================
  if (isAuthRoute) {
    return (
      <AuthPage
        onNavigateHome={() => navigate('/')}
        onLoginSuccess={() => navigate('/')}
      />
    )
  }

  if (isPaymentRoute) {
    return (
      <PaymentPage
        times={times}
        onNavigateHome={() => navigate('/')}
        onNavigateCart={() => navigate('/carrinho')}
      />
    )
  }

  if (isCartRoute) {
    return (
      <CartPage
        times={times}
        onNavigateHome={() => navigate('/')}
        onNavigateCart={() => navigate('/carrinho')}
        onNavigatePayment={(id) => navigate(`/pagamento?id=${id}`)}
        onNavigateLogin={() => navigate('/acesso')}
        userDisplayName={displayName}
      />
    )
  }

  if (isAdminRoute) {
    return (
      <AdminPage
        times={times}
        carregando={carregando}
        erroServidor={erroServidor}
        // Se seu AdminPage exigir essas props, você precisa implementar de volta
        // onDelete={...}
        // onStatusChange={...}
        onNavigateHome={() => navigate('/')}
        onNavigateCart={() => navigate('/carrinho')}
        userDisplayName={displayName}
      />
    )
  }

  return (
    <HomePage
      formData={formData}
      setFormData={setFormData}
      estatisticas={estatisticas}
      errors={errors}
      erroServidor={erroServidor}
      handleChange={handleChange}
      handleSubmit={handleSubmit}
      onNavigateAuth={handleLogout}
      onNavigateCart={() => navigate('/carrinho')}
      onNavigatePayment={() => navigate('/pagamento')}
      onResetForm={() => {
        setFormData(initialForm)
        setErrors([])
        setErroServidor('')
      }}
      times={times}
      userDisplayName={displayName}
    />
  )
}

export default App
