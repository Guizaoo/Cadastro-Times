import { supabase, supabaseConfigError } from './supabase'
import { buildProtectedCpf, sanitizeDigits } from '../utils/cpf'

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
  instagram: team.instagram,
  nome_time: team.nomeEquipe,
  modalidade: team.modalidade,
  integrantes: team.integrantes,
  categoria_volei: team.categoriaVolei,
  nivel_integrante_1: team.nivelIntegrante1,
  nivel_integrante_2: team.nivelIntegrante2,
  status: team.status,
  created_at: team.criadoEm,
  user_id: team.userId ?? null,
})

const fromSupabaseTeam = (team) =>
  ensureStatus({
    id: team.id,
    cpf: team.cpf ?? '',
    celular: team.telefone ?? team.celular ?? '',
    instagram: team.instagram ?? '',
    nomeEquipe: team.nome_time ?? team.nomeEquipe ?? '',
    modalidade: team.modalidade ?? 'futebol',
    integrantes: team.integrantes ?? '',
    nome: team.nome ?? '',
    categoriaVolei: team.categoria_volei ?? team.categoriaVolei ?? '',
    nivelIntegrante1: team.nivel_integrante_1 ?? team.nivelIntegrante1 ?? '',
    nivelIntegrante2: team.nivel_integrante_2 ?? team.nivelIntegrante2 ?? '',
    status: team.status ?? 'pendente',
    criadoEm: team.created_at ?? team.criado_em ?? team.criadoEm ?? '',
    userId: team.user_id ?? team.userId ?? '',
  })

export async function fetchTeams({ userId, includeAll = false } = {}) {
  if (!supabase) {
    throw new Error(supabaseConfigError)
  }

  if (!includeAll && !userId) {
    return []
  }

  const baseQuery = supabase.from('inscricoes').select('*')
  const query = includeAll ? baseQuery : baseQuery.eq('user_id', userId)
  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map(fromSupabaseTeam)
}

export async function saveTeam(team) {
  if (!supabase) {
    throw new Error(supabaseConfigError)
  }

   const { error } = await supabase.from('inscricoes').insert([toSupabaseTeam(team)])

  if (error) {
    if (error.code === '23505') {
      throw new Error('Este CPF já possui um time cadastrado nesta modalidade.')
    }
    throw error
  }

  return team
}

export async function cpfAlreadyUsed(cpf, cpfDigits = '', modalidade = '', excludeId = '') {
  if (!supabase) {
    throw new Error(supabaseConfigError)
  }

  const cpfValue = cpf?.trim()
  const normalizedDigits = cpfDigits || sanitizeDigits(cpfValue)
  const protectedCpf = cpfValue ? await buildProtectedCpf(cpfValue) : ''

  if (protectedCpf) {
    let baseQuery = supabase.from('inscricoes').select('id').eq('cpf', protectedCpf)
    if (excludeId) {
      baseQuery = baseQuery.neq('id', excludeId)
    }
    const { data, error } = await (modalidade
      ? baseQuery.eq('modalidade', modalidade)
      : baseQuery
    ).limit(1).maybeSingle()

    if (error) {
      throw error
    }

    if (data?.id) {
      return true
    }
  }

  if (!normalizedDigits || normalizedDigits === cpfValue) {
    return false
  }

  let baseQuery = supabase.from('inscricoes').select('id').eq('cpf', normalizedDigits)
  if (excludeId) {
    baseQuery = baseQuery.neq('id', excludeId)
  }
  const { data, error } = await (modalidade
    ? baseQuery.eq('modalidade', modalidade)
    : baseQuery
  ).limit(1).maybeSingle()

  if (error) {
    throw error
  }

  return Boolean(data?.id)
}

export async function updateTeam(team) {
  if (!supabase) {
    throw new Error(supabaseConfigError)
  }

  const { data, error } = await supabase
    .from('inscricoes')
    .update(toSupabaseTeam(team))
    .eq('id', team.id)
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
