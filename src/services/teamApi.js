import { supabase, supabaseConfigError } from './supabase'

const VALID_STATUSES = ['pendente', 'pago', 'reprovado']
const LEGACY_STATUS_MAP = {
  pagamento_pendente: 'pendente',
  aguardando_validacao: 'pendente',
  aprovado: 'pago',
}

const normalizeStatus = (status) => {
  if (VALID_STATUSES.includes(status)) return status
  if (status in LEGACY_STATUS_MAP) return LEGACY_STATUS_MAP[status]
  return 'pendente'
}

const ensureStatus = (team) => ({ ...team, status: normalizeStatus(team.status) })

const toSupabaseTeam = (team) => ({
  id: team.id,
  nome: team.nome,
  cpf: team.cpf,
  telefone: team.celular,
  nome_time: team.nomeEquipe,
  modalidade: team.modalidade,
  integrantes: team.integrantes,
  categoria_volei: team.categoriaVolei,
  status: team.status,
  created_at: team.criadoEm,
})

const fromSupabaseTeam = (team) =>
  ensureStatus({
    id: team.id,
    cpf: team.cpf ?? '',
    celular: team.telefone ?? team.celular ?? '',
    nomeEquipe: team.nome_time ?? team.nomeEquipe ?? '',
    modalidade: team.modalidade ?? 'futebol',
    integrantes: team.integrantes ?? '',
    nome: team.nome ?? '',
    categoriaVolei: team.categoria_volei ?? team.categoriaVolei ?? '',
    status: team.status ?? 'pendente',
    criadoEm: team.created_at ?? team.criado_em ?? team.criadoEm ?? '',
  })

export async function fetchTeams() {
  if (!supabase) {
    throw new Error(supabaseConfigError)
  }

  const { data, error } = await supabase
    .from('inscricoes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map(fromSupabaseTeam)
}

export async function saveTeam(team) {
  if (!supabase) {
    throw new Error(supabaseConfigError)
  }

  const { data, error } = await supabase
    .from('inscricoes')
    .insert([toSupabaseTeam(team)])
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return data ? fromSupabaseTeam(data) : team
}

export async function removeTeam(id) {
  if (!supabase) {
    throw new Error(supabaseConfigError)
  }

  const { error } = await supabase
    .from('inscricoes')
    .delete()
    .eq('id', id)

  if (error) {
    throw error
  }

  return id
}

export async function updateTeamStatus(id, status) {
  if (!supabase) {
    throw new Error(supabaseConfigError)
  }

  const { data, error } = await supabase
    .from('inscricoes')
    .update({ status })
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return data ? fromSupabaseTeam(data) : null
}
