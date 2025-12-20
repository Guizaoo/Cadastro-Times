import React, { useEffect, useMemo, useState } from 'react'
import { InputField, NavigationBar } from '../components/ui'
import { supabase, supabaseConfigError } from '../services/supabase'

const initialLogin = {
  email: '',
  senha: '',
  lembrar: false,
}

const initialRegister = {
  nome: '',
  email: '',
  senha: '',
  confirmar: '',
  aceitar: false,
}

const benefits = [
  'Acompanhe o status dos cadastros em tempo real.',
  'Receba lembretes sobre pagamentos e aprovações.',
  'Gerencie seus dados e equipes em um só lugar.',
]

export function AuthPage({ onNavigateHome, onNavigateAdmin }) {
  const [view, setView] = useState('login')
  const [loginData, setLoginData] = useState(initialLogin)
  const [registerData, setRegisterData] = useState(initialRegister)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [user, setUser] = useState(null)

  const isLogin = view === 'login'

  useEffect(() => {
    if (!supabase) {
      setError(supabaseConfigError)
      return
    }

    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (sessionError) {
        setError(sessionError.message)
        return
      }
      setUser(sessionError ? null : data.session?.user ?? null)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      listener?.subscription?.unsubscribe()
    }
  }, [])

  const handleLoginChange = (event) => {
    const { name, value, type, checked } = event.target
    setLoginData((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleRegisterChange = (event) => {
    const { name, value, type, checked } = event.target
    setRegisterData((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const registerStatus = useMemo(() => {
    if (!registerData.senha || !registerData.confirmar) return ''
    return registerData.senha === registerData.confirmar ? 'Senha confirmada.' : 'As senhas não conferem.'
  }, [registerData.confirmar, registerData.senha])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFeedback('')
    setError('')

    if (!supabase) {
      setError(supabaseConfigError)
      return
    }

    setBusy(true)

    try {
      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: loginData.email,
          password: loginData.senha,
        })

        if (signInError) {
          setError(signInError.message)
          return
        }

        setFeedback('Login realizado! Sua sessão fica salva neste navegador.')
        onNavigateAdmin?.()
      } else {
        if (registerData.senha !== registerData.confirmar) {
          setError('As senhas precisam ser iguais.')
          return
        }

        if (!registerData.aceitar) {
          setError('Você precisa aceitar os termos para continuar.')
          return
        }

        const { error: signUpError } = await supabase.auth.signUp({
          email: registerData.email,
          password: registerData.senha,
          options: {
            data: {
              full_name: registerData.nome,
            },
          },
        })

        if (signUpError) {
          setError(signUpError.message)
          return
        }

        setFeedback('Cadastro criado! Verifique seu e-mail para confirmar o acesso.')
      }
    } finally {
      setBusy(false)
    }
  }

  const handleLogout = async () => {
    if (!supabase) return
    setBusy(true)
    setError('')
    try {
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) {
        setError(signOutError.message)
      } else {
        setFeedback('Você saiu da sua conta.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-950 via-slate-950 to-amber-900 text-slate-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <NavigationBar onNavigateHome={onNavigateHome} />

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl bg-slate-900/80 p-6 shadow-2xl shadow-black/40 ring-1 ring-white/5">
            <div className="flex flex-col gap-2">
              <p className="text-xs uppercase tracking-[0.25em] text-amber-200">Área de acesso</p>
              <h1 className="text-3xl font-bold">{isLogin ? 'Entrar na plataforma' : 'Criar sua conta'}</h1>
              <p className="text-sm text-slate-200">
                {isLogin
                  ? 'Use seu e-mail e senha para acompanhar inscrições e pagamentos.'
                  : 'Registre-se para ter um painel completo com alertas e status das equipes.'}
              </p>
            </div>

            <div className="mt-6 flex rounded-full border border-slate-700 bg-slate-950/50 p-1 text-sm">
              <button
                type="button"
                onClick={() => {
                  setView('login')
                  setFeedback('')
                  setError('')
                }}
                className={`flex-1 rounded-full px-4 py-2 font-semibold transition ${
                  isLogin ? 'bg-amber-400 text-slate-950' : 'text-slate-200 hover:text-amber-100'
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => {
                  setView('register')
                  setFeedback('')
                  setError('')
                }}
                className={`flex-1 rounded-full px-4 py-2 font-semibold transition ${
                  !isLogin ? 'bg-amber-400 text-slate-950' : 'text-slate-200 hover:text-amber-100'
                }`}
              >
                Registrar-se
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {user && (
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-100">
                  Você está conectado como {user.email}.
                </div>
              )}
              {isLogin ? (
                <>
                  <InputField
                    id="email"
                    label="E-mail"
                    value={loginData.email}
                    onChange={handleLoginChange}
                    placeholder="voce@email.com"
                    type="email"
                  />
                  <InputField
                    id="senha"
                    label="Senha"
                    value={loginData.senha}
                    onChange={handleLoginChange}
                    placeholder="Digite sua senha"
                    type="password"
                  />
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="lembrar"
                        checked={loginData.lembrar}
                        onChange={handleLoginChange}
                        className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-amber-400 focus:ring-amber-400/60"
                      />
                      Lembrar acesso
                    </label>
                    <button type="button" className="text-amber-200 hover:text-amber-100">
                      Esqueci minha senha
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <InputField
                    id="nome"
                    label="Nome completo"
                    value={registerData.nome}
                    onChange={handleRegisterChange}
                    placeholder="Seu nome"
                  />
                  <InputField
                    id="email"
                    label="E-mail"
                    value={registerData.email}
                    onChange={handleRegisterChange}
                    placeholder="voce@email.com"
                    type="email"
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <InputField
                      id="senha"
                      label="Senha"
                      value={registerData.senha}
                      onChange={handleRegisterChange}
                      placeholder="Crie uma senha"
                      type="password"
                    />
                    <InputField
                      id="confirmar"
                      label="Confirmar senha"
                      value={registerData.confirmar}
                      onChange={handleRegisterChange}
                      placeholder="Repita a senha"
                      type="password"
                    />
                  </div>
                  {registerStatus && (
                    <p
                      className={`rounded-lg border px-3 py-2 text-xs ${
                        registerStatus === 'Senha confirmada.'
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100'
                          : 'border-amber-500/40 bg-amber-500/10 text-amber-100'
                      }`}
                    >
                      {registerStatus}
                    </p>
                  )}
                  <label className="flex items-center gap-2 text-xs text-slate-300">
                    <input
                      type="checkbox"
                      name="aceitar"
                      checked={registerData.aceitar}
                      onChange={handleRegisterChange}
                      className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-amber-400 focus:ring-amber-400/60"
                    />
                    Li e aceito os termos de uso e política da copa.
                  </label>
                </>
              )}

              {error && (
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs text-red-100">
                  {error}
                </div>
              )}

              {feedback && (
                <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-100">
                  {feedback}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex items-center justify-center rounded-lg bg-amber-400 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300/70 disabled:cursor-not-allowed disabled:bg-amber-200"
                >
                  {busy ? 'Processando...' : isLogin ? 'Entrar agora' : 'Criar conta'}
                </button>
                {user && (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-5 py-2 text-sm font-semibold text-slate-100 transition hover:border-amber-400 hover:text-amber-100"
                  >
                    Sair da conta
                  </button>
                )}
              </div>
            </form>
          </section>

          <aside className="flex flex-col justify-between gap-6 rounded-3xl bg-slate-900/70 p-6 shadow-xl shadow-black/30 ring-1 ring-white/5">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.25em] text-amber-200">Por que acessar?</p>
              <h2 className="text-2xl font-semibold">Tudo em um painel amigável</h2>
              <p className="text-sm text-slate-200">
                Organize seus times, acompanhe pagamentos e tenha atendimento rápido com mensagens prontas.
              </p>
              <ul className="space-y-2 text-sm text-slate-300">
                {benefits.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-amber-400"></span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-4 text-xs text-amber-100">
              Os acessos ficam salvos no Supabase Auth. Use as credenciais para entrar novamente com tudo preservado.
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}