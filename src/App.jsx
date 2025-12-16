import { useMemo, useState } from 'react'

const sportOptions = {
  futebol: {
    label: 'Futebol',
    helper: 'Clubes que vão marcar presença no estádio da Copa João Guilherme.',
    estadioPlaceholder: 'Estádio ou arena',
    ligaPlaceholder: 'Campeonato (Série A, Copa etc.)',
  },
  volei: {
    label: 'Vôlei',
    helper: 'Equipes de quadra ou praia prontas para animar o ginásio.',
    estadioPlaceholder: 'Ginásio ou centro de treinamento',
    ligaPlaceholder: 'Superliga, estadual ou torneio',
  },
}

const initialForm = {
  modalidade: 'futebol',
  nome: '',
  cidade: '',
  estado: '',
  liga: '',
  estadio: '',
  fundacao: '',
  tecnico: '',
  cores: '',
  titulos: '',
  contato: '',
  site: '',
  observacoes: '',
}

const requiredFields = {
  nome: 'Nome do time',
  cidade: 'Cidade',
  estado: 'Estado',
  liga: 'Liga ou campeonato',
  estadio: 'Estádio ou ginásio',
}

const sanitizeTitulos = (value) => {
  const parsed = Number.parseInt(value, 10)
  if (Number.isNaN(parsed) || parsed < 0) return '0'
  return String(parsed)
}

const normalizeEstado = (value) => value.trim().slice(0, 2).toUpperCase()

const formatCreatedAt = (dateString) =>
  new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

const sendToBackend = async (payload) => {
  // Espaço reservado para registrar no sistema oficial da Copa João Guilherme.
  return payload
}

function App() {
  const [formData, setFormData] = useState(initialForm)
  const [times, setTimes] = useState([])
  const [errors, setErrors] = useState([])

  const estatisticas = useMemo(() => {
    const totalTitulos = times.reduce((total, time) => {
      const qtdTitulos = Number.parseInt(time.titulos, 10)
      return Number.isNaN(qtdTitulos) ? total : total + qtdTitulos
    }, 0)

    return {
      total: times.length,
      estados: new Set(times.map((time) => time.estado.trim().toUpperCase())).size,
      ligas: new Set(times.map((time) => time.liga.trim().toUpperCase())).size,
      titulos: totalTitulos,
    }
  }, [times])

  const handleChange = (event) => {
    const { name, value } = event.target

    if (name === 'estado') {
      setFormData((current) => ({ ...current, estado: normalizeEstado(value) }))
      return
    }

    if (name === 'titulos') {
      setFormData((current) => ({ ...current, titulos: sanitizeTitulos(value) }))
      return
    }

    setFormData((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const missing = Object.entries(requiredFields)
      .filter(([field]) => !formData[field].trim())
      .map(([, label]) => label)

    if (missing.length) {
      setErrors(missing)
      return
    }

    const novoTime = {
      ...formData,
      estado: normalizeEstado(formData.estado),
      titulos: sanitizeTitulos(formData.titulos),
      id: crypto.randomUUID(),
      criadoEm: new Date().toISOString(),
    }

    await sendToBackend(novoTime)

    setTimes((current) => [novoTime, ...current])
    setFormData(initialForm)
    setErrors([])
  }

  const modalidadeAtual = sportOptions[formData.modalidade]

  return (
    <div className="min-h-screen bg-linear-to-b from-amber-900 via-slate-950 to-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-5 rounded-3xl bg-slate-900/80 p-6 shadow-2xl shadow-black/40 ring-1 ring-white/5">
          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-[0.25em] text-amber-200">Copa João Guilherme</p>
            <h1 className="text-3xl font-bold sm:text-4xl">Bem-vindos ao cadastro oficial da Copa</h1>
            <p className="text-sm text-slate-200">
              Deixe tudo pronto para receber as torcidas: escolha a modalidade, conte um pouco da equipe e salve. Tudo foi pensado
              para quem chega se sentir acolhido.
            </p>
            <p className="text-sm text-amber-100">
              O formulário tem linguagem acolhedora e visual quente para que cada clube se sinta convidado desde o primeiro clique.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Times na Copa" value={estatisticas.total} />
            <StatCard label="Ligas/competições" value={estatisticas.ligas} />
            <StatCard label="Estados presentes" value={estatisticas.estados} />
            <StatCard label="Títulos somados" value={estatisticas.titulos} />
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-amber-100">
            <span className="rounded-full bg-amber-500/15 px-3 py-1">Ambiente acolhedor para atletas e torcedores</span>
            <span className="rounded-full bg-amber-400/15 px-3 py-1 text-amber-50">Comunicação humana e transparente</span>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="rounded-2xl bg-slate-900/70 p-5 shadow-lg shadow-amber-900/30 ring-1 ring-white/5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-amber-200">Modalidade</p>
                  <h2 className="text-lg font-semibold text-slate-50">Escolha antes de cadastrar</h2>
                  <p className="text-sm text-slate-300">
                    Campos e exemplos mudam para futebol ou vôlei, mantendo o tom acolhedor do evento.
                  </p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {Object.entries(sportOptions).map(([key, option]) => {
                  const isActive = formData.modalidade === key
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFormData((current) => ({ ...current, modalidade: key }))}
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
                  label="Nome do time*"
                  value={formData.nome}
                  onChange={handleChange}
                  placeholder="Esporte Clube Horizonte"
                />
                <InputField
                  id="cidade"
                  label="Cidade*"
                  value={formData.cidade}
                  onChange={handleChange}
                  placeholder="Fortaleza"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <InputField
                  id="estado"
                  label="Estado*"
                  value={formData.estado}
                  onChange={handleChange}
                  placeholder="CE"
                  maxLength={2}
                  className="uppercase"
                />
                <InputField
                  id="liga"
                  label="Liga/Campeonato*"
                  value={formData.liga}
                  onChange={handleChange}
                  placeholder={modalidadeAtual.ligaPlaceholder}
                />
                <InputField
                  id="estadio"
                  label={formData.modalidade === 'volei' ? 'Ginásio*' : 'Estádio*'}
                  value={formData.estadio}
                  onChange={handleChange}
                  placeholder={modalidadeAtual.estadioPlaceholder}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <InputField
                  id="fundacao"
                  label="Fundação"
                  type="number"
                  value={formData.fundacao}
                  onChange={handleChange}
                  placeholder="1985"
                />
                <InputField
                  id="tecnico"
                  label="Técnico"
                  value={formData.tecnico}
                  onChange={handleChange}
                  placeholder="Nome do treinador"
                />
                <InputField
                  id="cores"
                  label="Cores oficiais"
                  value={formData.cores}
                  onChange={handleChange}
                  placeholder="Azul e branco"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <InputField
                  id="titulos"
                  label="Títulos conquistados"
                  type="number"
                  value={formData.titulos}
                  onChange={handleChange}
                  placeholder="0"
                  min={0}
                />
                <InputField
                  id="contato"
                  label="Contato principal"
                  value={formData.contato}
                  onChange={handleChange}
                  placeholder="contato@time.com"
                />
                <InputField
                  id="site"
                  label="Site oficial"
                  value={formData.site}
                  onChange={handleChange}
                  placeholder="https://time.com"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-200" htmlFor="observacoes">
                  Observações
                </label>
                <textarea
                  id="observacoes"
                  name="observacoes"
                  value={formData.observacoes}
                  onChange={handleChange}
                  className=".min-h-[90px] w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-500/40"
                  placeholder="Histórico, destaques ou pendências."
                />
              </div>

              {errors.length > 0 && (
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  {errors.length === 1 ? 'Complete o campo obrigatório: ' : 'Complete os campos obrigatórios: '}
                  {errors.join(', ')}.
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
              <SmallStat label="Ligas" value={estatisticas.ligas} />
              <SmallStat label="Estados" value={estatisticas.estados} />
              <SmallStat label="Títulos" value={estatisticas.titulos} />
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
              <p className="text-sm text-slate-300">Cards acolhedores destacam modalidade, contato e títulos.</p>
            </div>
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
                        <p className="text-xs uppercase tracking-[0.18em] text-amber-200">{time.liga}</p>
                      </div>
                      <h3 className="text-lg font-semibold leading-tight text-slate-50">{time.nome}</h3>
                      <p className="text-sm text-slate-300">
                        {time.cidade} • {time.estado.toUpperCase()} • {time.estadio}
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-200">
                      {sanitizeTitulos(time.titulos)} títulos
                    </span>
                  </div>

                  {(time.tecnico || time.cores || time.site) && (
                    <dl className="space-y-1 text-sm text-slate-200">
                      {time.tecnico && (
                        <div className="flex items-center gap-1">
                          <dt className="text-slate-400">Técnico:</dt>
                          <dd className="font-medium text-slate-100">{time.tecnico}</dd>
                        </div>
                      )}
                      {time.cores && (
                        <div className="flex items-center gap-1">
                          <dt className="text-slate-400">Cores:</dt>
                          <dd className="font-medium text-slate-100">{time.cores}</dd>
                        </div>
                      )}
                      {time.site && (
                        <div className="flex items-center gap-1">
                          <dt className="text-slate-400">Site:</dt>
                          <dd className="font-medium text-amber-200">{time.site}</dd>
                        </div>
                      )}
                    </dl>
                  )}

                  {time.observacoes && (
                    <p className="rounded-lg bg-slate-800/80 px-3 py-2 text-sm text-slate-200">{time.observacoes}</p>
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Contato: {time.contato || 'não informado'}</span>
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
