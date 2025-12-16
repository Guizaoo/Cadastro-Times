import { useEffect, useMemo, useState } from 'react'
import { fetchTeams, removeTeam, saveTeam } from './services/teamApi'

const sportOptions = {
  futebol: {
    label: 'Futebol',
    helper: 'Clubes que vão marcar presença no estádio da Copa João Guilherme.',
  },
  volei: {
    label: 'Vôlei',
    helper: 'Equipes de quadra ou praia prontas para animar o ginásio.',
    categorias: ['Masculino', 'Feminino', 'Misto'],
  },
}

const statusLabels = {
  pendente: 'Pendente',
  aprovado: 'Aprovado',
  reprovado: 'Reprovado',
}

const statusStyles = {
  pendente: 'bg-amber-500/10 text-amber-100 border-amber-400/50',
  aprovado: 'bg-emerald-500/10 text-emerald-100 border-emerald-400/50',
  reprovado: 'bg-red-500/10 text-red-100 border-red-400/50',
}

const initialForm = {
  modalidade: 'futebol',
  nome: '',
  nomeEquipe: '',
  cpf: '',
  celular: '',
  integrantes: '',
  categoriaVolei: '',
}

const requiredFields = {
  nome: 'Nome',
  nomeEquipe: 'Nome da equipe',
  cpf: 'CPF',
  celular: 'Número de celular',
  integrantes: 'Nome dos integrantes',
}

const formatCreatedAt = (dateString) =>
  new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

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

  const [ddd, number] = [digits.slice(0, 2), digits.slice(2)]
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

  const firstDigit = calcCheckDigit(digits.slice(0, 9), 10)
  const secondDigit = calcCheckDigit(digits.slice(0, 10), 11)

  return String(firstDigit) === digits[9] && String(secondDigit) === digits[10]
}

const validateCelular = (value) => {
  const digits = sanitizeDigits(value)
  return digits.length >= 10 && digits.length <= 11
}

const parseIntegrantes = (value) => value.split(/[\n,]/).map((item) => item.trim()).filter(Boolean)

function App() {
  const [route, setRoute] = useState(window.location.pathname)
  const [formData, setFormData] = useState(initialForm)
  const [times, setTimes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erroServidor, setErroServidor] = useState('')
  const [errors, setErrors] = useState([])

  useEffect(() => {
    const carregarTimes = async () => {
      try {
        const existentes = await fetchTeams()
        setTimes(existentes)
      } catch (error) {
        console.error('Erro ao buscar times', error)
        setErroServidor('Não foi possível carregar os times salvos. Tente novamente mais tarde.')
      } finally {
        setCarregando(false)
      }
    }

    carregarTimes()
  }, [])

  useEffect(() => {
    const handlePopState = () => setRoute(window.location.pathname)
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigate = (path) => {
    if (path === route) return
    window.history.pushState({}, '', path)
    setRoute(path)
  }

  const estatisticas = useMemo(() => {
    const modalidades = new Set(times.map((time) => time.modalidade)).size
    const categoriasVolei = new Set(times.filter((time) => time.modalidade === 'volei').map((time) => time.categoriaVolei)).size

    return {
      total: times.length,
      modalidades,
      categoriasVolei,
      contatos: times.filter((time) => time.celular.trim()).length,
    }
  }, [times])

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const integrantesList = parseIntegrantes(formData.integrantes)

    const missing = [
      ...Object.entries(requiredFields)
        .filter(([field]) => !formData[field].trim())
        .map(([, label]) => label),
      ...(formData.modalidade === 'volei' && !formData.categoriaVolei.trim() ? ['Categoria do vôlei'] : []),
    ]

    const validationErrors = [
      ...(missing.length ? missing : []),
      ...(!validateCPF(formData.cpf) ? ['CPF inválido'] : []),
      ...(!validateCelular(formData.celular) ? ['Número de celular inválido (use DDD e 9 dígitos)'] : []),
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

    const integrantesFormatados = integrantesList.join(', ')
    const cpfFormatado = formatCPF(formData.cpf)
    const celularFormatado = formatCelular(formData.celular)

    const novoTime = {
      ...formData,
      nome: normalizeText(formData.nome),
      nomeEquipe: normalizeText(formData.nomeEquipe),
      cpf: cpfFormatado,
      celular: celularFormatado,
      integrantes: integrantesFormatados,
      categoriaVolei: normalizeText(formData.categoriaVolei),
      status: 'pendente',
      id: crypto.randomUUID(),
      criadoEm: new Date().toISOString(),
    }

    try {
      await saveTeam(novoTime)
    } catch (error) {
      console.error('Erro ao salvar time', error)
      setErroServidor('Não foi possível salvar no momento. Tente novamente em instantes.')
      return
    }

    setTimes((current) => [novoTime, ...current])
    setFormData(initialForm)
    setErrors([])
  }

  const handleDelete = async (timeId) => {
    try {
      await removeTeam(timeId)
      setTimes((current) => current.filter((time) => time.id !== timeId))
    } catch (error) {
      console.error('Erro ao remover time', error)
      setErroServidor('Não foi possível remover este time. Tente de novo.')
    }
  }

  const handleStatusChange = async (timeId, status) => {
    try {
      await updateTeamStatus(timeId, status)
      setTimes((current) => current.map((time) => (time.id === timeId ? { ...time, status } : time)))
    } catch (error) {
      console.error('Erro ao atualizar status', error)
      setErroServidor('Não foi possível atualizar o status agora. Tente novamente em instantes.')
    }
  }

  const isAdminRoute = route.startsWith('/admin')

  if (isAdminRoute) {
    return (
      <AdminPage
        times={times}
        carregando={carregando}
        erroServidor={erroServidor}
        onDelete={handleDelete}
        onStatusChange={handleStatusChange}
        onNavigateHome={() => navigate('/')}
      />
    )
  }

  return (
    <HomePage
      formData={formData}
      setFormData={setFormData}
      estatisticas={estatisticas}
      sportOptions={sportOptions}
      errors={errors}
      erroServidor={erroServidor}
      handleChange={handleChange}
      handleSubmit={handleSubmit}
      onNavigateAdmin={() => navigate('/admin')}
      times={times}
    />
  )
}

function HomePage({
  formData,
  setFormData,
  estatisticas,
  sportOptions,
  errors,
  erroServidor,
  handleChange,
  handleSubmit,
  onNavigateAdmin,
  times,
}) {
  return (
    <div className="min-h-screen bg-linear-to-b from-amber-900 via-slate-950 to-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <NavigationBar onNavigateAdmin={onNavigateAdmin} />

        <header className="flex flex-col gap-5 rounded-3xl bg-slate-900/80 p-6 shadow-2xl shadow-black/40 ring-1 ring-white/5">
          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-[0.25em] text-amber-200">Copa João Guilherme</p>
            <h1 className="text-3xl font-bold sm:text-4xl">Bem-vindos ao cadastro oficial da Copa</h1>
            <p className="text-sm text-slate-200">
              Deixe tudo pronto para receber as torcidas: escolha a modalidade, confirme os dados básicos e salve. Tudo foi
              pensado para quem chega se sentir acolhido.
            </p>
            <p className="text-sm text-amber-100">
              O formulário pede somente o essencial (nome, equipe, integrantes, CPF e celular) para que cada clube se sinta
              convidado desde o primeiro clique.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Times na Copa" value={estatisticas.total} />
            <StatCard label="Modalidades" value={estatisticas.modalidades} />
            <StatCard label="Categorias de vôlei" value={estatisticas.categoriasVolei} />
            <StatCard label="Contatos enviados" value={estatisticas.contatos} />
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-amber-100">
            <span className="rounded-full bg-amber-500/15 px-3 py-1">Ambiente acolhedor para atletas e torcedores</span>
            <span className="rounded-full bg-amber-400/15 px-3 py-1 text-amber-50">Comunicação humana e transparente</span>
          </div>
        </header>

        {erroServidor && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">{erroServidor}</div>
        )}

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="rounded-2xl bg-slate-900/70 p-5 shadow-lg shadow-amber-900/30 ring-1 ring-white/5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-amber-200">Modalidade</p>
                  <h2 className="text-lg font-semibold text-slate-50">Escolha antes de cadastrar</h2>
                  <p className="text-sm text-slate-300">Selecione o esporte antes de preencher os dados obrigatórios.</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {Object.entries(sportOptions).map(([key, option]) => {
                  const isActive = formData.modalidade === key
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() =>
                        setFormData((current) => ({
                          ...current,
                          modalidade: key,
                          categoriaVolei: key === 'volei' ? current.categoriaVolei : '',
                        }))
                      }
                      className={`rounded-xl border px-4 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-amber-400/70 ${
                        isActive
                          ? 'border-amber-400/70 bg-amber-500/10 text-amber-50 shadow-amber-500/20'
                          : 'border-slate-700 bg-slate-900 text-slate-200 hover:border-amber-400/40'
                      }`}
                    >
                      <p className="text-sm font-semibold">{option.label}</p>
                      <p className="text-xs text-slate-300">{option.helper}</p>
                    </button>
                  )
                })}
              </div>
              <p className="mt-2 text-xs text-slate-400">Tudo pronto para receber o time escolhido.</p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-4 rounded-2xl bg-slate-900/70 p-6 shadow-lg shadow-amber-900/30 ring-1 ring-white/5"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InputField
                  id="nome"
                  label="Nome*"
                  value={formData.nome}
                  onChange={handleChange}
                  placeholder="Seu nome completo"
                />
                <InputField
                  id="nomeEquipe"
                  label="Nome da equipe*"
                  value={formData.nomeEquipe}
                  onChange={handleChange}
                  placeholder="Esporte Clube Horizonte"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InputField
                  id="cpf"
                  label="CPF*"
                  value={formData.cpf}
                  onChange={handleChange}
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
                <InputField
                  id="celular"
                  label="Número de celular*"
                  value={formData.celular}
                  onChange={handleChange}
                  placeholder="(00) 90000-0000"
                  maxLength={16}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-200" htmlFor="integrantes">
                  Nome dos integrantes*
                </label>
                <textarea
                  id="integrantes"
                  name="integrantes"
                  value={formData.integrantes}
                  onChange={handleChange}
                  className="min-h-[72px] w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-500/40"
                  placeholder="João, Gabriel, Pedro, Augusto..."
                />
                <p className="text-xs text-slate-400">
                  {formData.modalidade === 'volei'
                    ? 'Apenas duplas: informe exatamente 2 nomes, separados por vírgula ou quebra de linha.'
                    : 'Limite de 15 pessoas: separe os nomes por vírgula ou quebra de linha.'}
                </p>
              </div>

              {formData.modalidade === 'volei' && (
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-200" htmlFor="categoriaVolei">
                    Categoria do vôlei*
                  </label>
                  <select
                    id="categoriaVolei"
                    name="categoriaVolei"
                    value={formData.categoriaVolei}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-500/40"
                  >
                    <option value="" disabled>
                      Selecione a categoria
                    </option>
                    {sportOptions.volei.categorias.map((categoria) => (
                      <option key={categoria} value={categoria}>
                        {categoria}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {errors.length > 0 && (
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  Revise os itens abaixo antes de enviar: {errors.join(' • ')}.
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:translate-y-[1px] hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300/70"
                >
                  Salvar cadastro
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(initialForm)
                    setErrors([])
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-5 py-2 text-sm font-semibold text-slate-100 transition hover:border-amber-400 hover:text-amber-100"
                >
                  Limpar tudo
                </button>
                <button
                  type="button"
                  onClick={onNavigateAdmin}
                  className="inline-flex items-center gap-2 rounded-lg border border-amber-400/60 px-5 py-2 text-sm font-semibold text-amber-100 transition hover:border-amber-300 hover:text-amber-50"
                >
                  Ir para a área admin
                </button>
                <p className="text-xs text-slate-400">Campos marcados com * são obrigatórios.</p>
              </div>
            </form>
          </div>

          <aside className="flex flex-col gap-4 rounded-2xl bg-slate-900/70 p-5 shadow-lg shadow-black/30 ring-1 ring-white/5">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.25em] text-amber-200">Painel da Copa</p>
              <h2 className="text-xl font-semibold text-slate-50">Números em tempo real</h2>
              <p className="text-sm text-slate-300">Veja como o evento cresce a cada novo cadastro.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm text-slate-100">
              <SmallStat label="Times" value={estatisticas.total} />
              <SmallStat label="Modalidades" value={estatisticas.modalidades} />
              <SmallStat label="Vôlei" value={estatisticas.categoriasVolei} />
              <SmallStat label="Contatos" value={estatisticas.contatos} />
            </div>
            <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
              Cada novo time é recebido com cuidado e celebração.
            </p>
          </aside>
        </section>

        <section className="space-y-4 rounded-2xl bg-slate-900/70 p-6 shadow-lg shadow-black/30 ring-1 ring-white/5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-amber-200">Times confirmados</p>
              <h2 className="text-2xl font-semibold">Convidados da Copa</h2>
              <p className="text-sm text-slate-300">Cards acolhedores destacam modalidade, contato e documentação.</p>
            </div>
            <button
              type="button"
              onClick={onNavigateAdmin}
              className="rounded-lg border border-amber-400/60 px-4 py-2 text-xs font-semibold text-amber-100 transition hover:border-amber-300 hover:text-amber-50"
            >
              Abrir painel administrativo
            </button>
          </div>

          {times.length === 0 ? (
            <div className="rounded-xl border border-dashed border-amber-600/50 bg-slate-900/70 px-4 py-10 text-center text-sm text-slate-300">
              Nenhum time cadastrado ainda. Selecione a modalidade, preencha o formulário e salve para celebrar na Copa João Guilherme.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {times.map((time) => (
                <article
                  key={time.id}
                  className="relative flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-inner shadow-black/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-amber-500/15 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-50">
                          {time.modalidade}
                        </span>
                        {time.modalidade === 'volei' && (
                          <p className="text-xs uppercase tracking-[0.18em] text-amber-200">{time.categoriaVolei}</p>
                        )}
                        <StatusBadge status={time.status} />
                      </div>
                      <h3 className="text-lg font-semibold leading-tight text-slate-50">{time.nomeEquipe}</h3>
                      <p className="text-sm text-slate-300">Responsável: {time.nome}</p>
                      <p className="text-sm text-slate-200">Integrantes: {time.integrantes}</p>
                    </div>
                    <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-200">CPF {time.cpf}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Celular: {time.celular || 'não informado'}</span>
                    <time dateTime={time.criadoEm}>{formatCreatedAt(time.criadoEm)}</time>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function AdminPage({ times, carregando, erroServidor, onDelete, onStatusChange, onNavigateHome }) {
  const totalAprovados = times.filter((time) => time.status === 'aprovado').length
  const totalReprovados = times.filter((time) => time.status === 'reprovado').length
  const totalPendentes = times.filter((time) => time.status === 'pendente').length

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
            <SmallStat label="Pendentes" value={totalPendentes} />
            <SmallStat label="Aprovados" value={totalAprovados} />
            <SmallStat label="Reprovados" value={totalReprovados} />
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
                            onClick={() => onStatusChange(time.id, 'aprovado')}
                            className="rounded-lg border border-emerald-500/50 px-3 py-2 font-semibold text-emerald-100 transition hover:bg-emerald-500/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                          >
                            Aprovar
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

function NavigationBar({ onNavigateAdmin, onNavigateHome }) {
  return (
    <nav className="flex items-center justify-between gap-4 rounded-2xl border border-white/5 bg-slate-950/50 px-4 py-3 text-sm shadow-inner shadow-black/30">
      <div className="flex items-center gap-2">
        <span className="text-xs uppercase tracking-[0.25em] text-amber-200">Copa</span>
        <span className="text-sm font-semibold text-slate-50">João Guilherme</span>
      </div>
      <div className="flex items-center gap-2">
        {onNavigateHome && (
          <button
            type="button"
            onClick={onNavigateHome}
            className="rounded-lg border border-slate-700 px-3 py-2 font-semibold text-slate-100 transition hover:border-amber-400 hover:text-amber-100"
          >
            Página inicial
          </button>
        )}
        {onNavigateAdmin && (
          <button
            type="button"
            onClick={onNavigateAdmin}
            className="rounded-lg border border-amber-400/60 px-3 py-2 font-semibold text-amber-100 transition hover:border-amber-300 hover:text-amber-50"
          >
            Área admin
          </button>
        )}
      </div>
    </nav>
  )
}

function StatusBadge({ status }) {
  const label = statusLabels[status] ?? 'Pendente'
  const style = statusStyles[status] ?? statusStyles.pendente
  return <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${style}`}>{label}</span>
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-3 shadow-inner shadow-black/30">
      <p className="text-xs text-slate-400">{label}</p>
      <strong className="text-2xl">{value}</strong>
    </div>
  )
}

function SmallStat({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-3 text-center shadow-inner shadow-black/30">
      <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-xl font-semibold text-slate-50">{value}</p>
    </div>
  )
}

function InputField({ id, label, value, onChange, placeholder, type = 'text', className = '', ...rest }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-slate-200" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        type={type}
        placeholder={placeholder}
        className={`w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-500/40 ${className}`}
        {...rest}
      />
    </div>
  )
}

export default App
