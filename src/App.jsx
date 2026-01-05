import { useCallback, useEffect, useMemo, useState } from 'react'
import { AdminPage } from './pages/AdminPage'
import { AuthPage } from './pages/AuthPage.jsx'
import { CartPage } from './pages/CartPage'
import { HomePage } from './pages/HomePage'
import { initialForm } from './pages/homePageConfig'
import { PaymentPage } from './pages/PaymentPage'
import { supabase } from './services/supabase'
import { cpfAlreadyUsed, fetchTeams, removeTeam, saveTeam, updateTeamStatus } from './services/teamApi'
import {
  cpfExists,
  formatCelular,
  formatCPF,
  normalizeText,
  parseIntegrantesList,
  sanitizeDigits,
  validateCPF,
  validateCelular,
} from './utils/cpf'

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
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminReady, setAdminReady] = useState(false)

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
      if (!authReady) return

      if (!user) {
        setTimes([])
        setCarregando(false)
        return
      }

      try {
        setCarregando(true)
        const existentes = await fetchTeams({
          userId: user.id,
          includeAll: isAdmin,
        })
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
  }, [authReady, user, isAdmin])

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
      if (!error) {
        setUser(data.session?.user ?? null)
        setIsAdmin(false)
        setAdminReady(false)
      }
      setAuthReady(true)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setIsAdmin(false)
      setAdminReady(false)
      setAuthReady(true)
    })

    return () => {
      listener?.subscription?.unsubscribe()
    }
  }, [])

  // ==============================
  // 3.1) Verificar se o usuário é admin
  // ==============================
  useEffect(() => {
    if (!authReady) return

    if (!supabase || !user) {
      setIsAdmin(false)
      setAdminReady(true)
      return
    }

    let active = true
    setAdminReady(false)

    const adminEmail = user.email?.trim().toLowerCase()
    if (!adminEmail) {
      setIsAdmin(false)
      setAdminReady(true)
      return () => {
        active = false
      }
    }

    supabase
      .from('admin_emails')
      .select('email')
      .ilike('email', adminEmail)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          console.error('Erro ao verificar admin', error)
          setIsAdmin(false)
        } else {
          setIsAdmin(Boolean(data?.email))
        }
        setAdminReady(true)
      })
      .catch((error) => {
        if (!active) return
        console.error('Erro ao verificar admin', error)
        setIsAdmin(false)
        setAdminReady(true)
      })

    return () => {
      active = false
    }
  }, [authReady, user])

  // ==============================
  // Rotas derivadas
  // ==============================
  const isAdminRoute = route.startsWith('/admin')
  const isPaymentRoute = route.startsWith('/pagamento')
  const isCartRoute = route.startsWith('/carrinho')
  const isAuthRoute = route.startsWith('/acesso')
  const isRecoveryFlow = useMemo(
    () =>
      isAuthRoute &&
      typeof window !== 'undefined' &&
      window.location.hash.includes('type=recovery'),
    [isAuthRoute]
  )
  // ==============================
  // 4) Guard de autenticação
  // ==============================
  useEffect(() => {
    if (!authReady) return

    if (!user && !isAuthRoute) {
      navigate('/acesso')
    } else if (user && isAuthRoute && !isRecoveryFlow) {
      navigate('/')
    }
  }, [authReady, user, isAuthRoute, isRecoveryFlow, navigate])

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

 if (!user?.id) {
      setErroServidor('Faça login para salvar o cadastro.')
      return
    }


    const integrantesList = parseIntegrantesList(formData.integrantes)
    const cpfDigits = sanitizeDigits(formData.cpf)
     const instagramTrimmed = formData.instagram?.trim() ?? ''
    const instagramRaw = instagramTrimmed.replace(/\s+/g, '')
    const instagramHandle =
      instagramRaw && !instagramRaw.startsWith('@') ? `@${instagramRaw}` : instagramRaw

    // Validações básicas
    const validationErrors = [
      ...(!formData.nome?.trim() ? ['Nome é obrigatório'] : []),
      ...(!formData.nomeEquipe?.trim() ? ['Nome da equipe é obrigatório'] : []),
      ...(!formData.cpf?.trim() ? ['CPF é obrigatório'] : []),
      ...(!formData.celular?.trim() ? ['Celular é obrigatório'] : []),
      ...(!instagramHandle || instagramHandle.length < 2 ? ['Instagram é obrigatório dos participantes'] : []),
      ...(!formData.integrantes?.trim() ? ['Integrantes é obrigatório'] : []),
      ...(formData.modalidade === 'volei' && !formData.categoriaVolei?.trim()
        ? ['Categoria do vôlei é obrigatória']
        : []),

      ...(!validateCPF(formData.cpf) ? ['CPF inválido'] : []),
      ...(!validateCelular(formData.celular) ? ['Número de celular inválido'] : []),

      ...(cpfExists(times, cpfDigits)
        ? ['Este CPF já foi usado em outra conta.']
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

    try {
      const cpfEmUso = await cpfAlreadyUsed(formData.cpf, cpfDigits)
      if (cpfEmUso) {
        setErrors(['Este CPF já foi usado em outra conta.'])
        return
      }
    } catch (error) {
      console.error('Erro ao validar CPF', error)
      const message =
        error?.message?.includes('Supabase não configurado')
          ? 'Configuração do Supabase ausente. Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.'
          : 'Não foi possível validar o CPF agora. Tente novamente em instantes.'
      setErroServidor(message)
      return
    }

    // Normalizações
    const novoTime = {
      ...formData,
      nome: normalizeText(formData.nome),
      nomeEquipe: normalizeText(formData.nomeEquipe),
      cpf: formatCPF(formData.cpf),
      celular: formatCelular(formData.celular),
      instagram: instagramHandle,
      integrantes: integrantesList.join(', '),
      categoriaVolei: normalizeText(formData.categoriaVolei || ''),
      status: 'pendente',
      id: crypto.randomUUID(),
      criadoEm: new Date().toISOString(),
      userId: user?.id ?? '',
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
      const message = error?.message?.includes('Supabase não configurado')
        ? 'Configuração do Supabase ausente. Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.'
        : error?.message?.includes('CPF já possui um time cadastrado')
          ? 'Este CPF já possui um time cadastrado nesta modalidade.'
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

  const handleStatusChange = async (id, status) => {
    setErroServidor('')
    try {
      const updatedTeam = await updateTeamStatus(id, status)
      setTimes((current) =>
        current.map((time) =>
          time.id === id ? (updatedTeam ?? { ...time, status }) : time
        )
      )
    } catch (error) {
      console.error('Erro ao atualizar status', error)
      const message =
        error?.message?.includes('Supabase não configurado')
          ? 'Configuração do Supabase ausente. Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.'
          : 'Não foi possível atualizar o status. Tente novamente mais tarde.'
      setErroServidor(message)
    }
  }

  const handleDelete = async (id) => {
    setErroServidor('')
    try {
      await removeTeam(id)
      setTimes((current) => current.filter((time) => time.id !== id))
    } catch (error) {
      console.error('Erro ao excluir time', error)
      const message =
        error?.message?.includes('Supabase não configurado')
          ? 'Configuração do Supabase ausente. Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.'
          : 'Não foi possível excluir o cadastro. Tente novamente mais tarde.'
      setErroServidor(message)
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
    if (!adminReady) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 text-center">
          <div>
            <div className="text-lg font-semibold">Carregando...</div>
            <div className="text-sm opacity-70">Verificando permissões de acesso.</div>
          </div>
        </div>
      )
    }

    if (!isAdmin) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-50">
          <div className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 text-center">
            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl shadow-black/40 ring-1 ring-white/5">
              <p className="text-xs uppercase tracking-[0.25em] text-amber-200">/admin</p>
              <h1 className="mt-3 text-2xl font-semibold">Você não tem acesso a esta página</h1>
              <p className="mt-2 text-sm text-slate-300">
                Este painel é restrito apenas a usuários autorizados. Se precisar de acesso,
                solicite liberação ao administrador.
              </p>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="mt-6 rounded-lg border border-amber-400/60 px-4 py-2 text-xs font-semibold text-amber-100 transition hover:bg-amber-400/10"
              >
                Voltar para o site
              </button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <AdminPage
        times={times}
        carregando={carregando}
        erroServidor={erroServidor}
        onDelete={handleDelete}
        onStatusChange={handleStatusChange}
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
