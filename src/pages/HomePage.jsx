import React from 'react'
import { InputField, NavigationBar, SmallStat, StatCard, StatusBadge } from '../components/ui'

import { sportOptions } from './homePageConfig'

const formatCreatedAt = (dateString) =>
  new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

export function HomePage({
  formData,
  setFormData,
  estatisticas,
  errors,
  erroServidor,
  handleChange,
  handleSubmit,
  onNavigateAdmin,
  onNavigateAuth,
  onResetForm,
  times,
}) {
  return (
    <div className="min-h-screen bg-linear-to-b from-amber-900 via-slate-950 to-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
       <NavigationBar onNavigateAdmin={onNavigateAdmin} onNavigateAuth={onNavigateAuth} />

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
                    className=".min-h-[72px] w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-500/40"
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
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-5 py-2 text-sm font-semibold text-slate-950 transition .hover:translate-y-[1px] hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300/70"
                >
                  Salvar cadastro
                </button>
                <button
                  type="button"
                  onClick={onResetForm}
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

