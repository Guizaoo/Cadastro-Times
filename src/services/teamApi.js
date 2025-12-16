
const STORAGE_KEY = 'copa:times'

const readFromStorage = () => {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error('Erro ao ler times salvos', error)
    return []
  }
}

const persist = (times) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(times))
}

const ensureStatus = (team) => ({ ...team, status: team.status ?? 'pendente' })

export async function fetchTeams() {
  const stored = readFromStorage()
  const normalized = stored.map(ensureStatus)
  return normalized
}

export async function saveTeam(team) {
  const existing = readFromStorage()
  const newList = [ensureStatus(team), ...existing.map(ensureStatus)]
  persist(newList)
  return team
}

export async function removeTeam(id) {
  const existing = readFromStorage()
  const filtered = existing.filter((team) => team.id !== id)
  persist(filtered)
  return filtered
}

export async function updateTeamStatus(id, status) {
  const existing = readFromStorage().map(ensureStatus)
  const updatedList = existing.map((team) => (team.id === id ? { ...team, status } : team))
  persist(updatedList)
  return updatedList.find((team) => team.id === id)
}
