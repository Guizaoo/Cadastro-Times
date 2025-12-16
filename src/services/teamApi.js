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

export async function fetchTeams() {
  return readFromStorage()
}

export async function saveTeam(team) {
  const existing = readFromStorage()
  const newList = [team, ...existing]
  persist(newList)
  return team
}

export async function removeTeam(id) {
  const existing = readFromStorage()
  const filtered = existing.filter((team) => team.id !== id)
  persist(filtered)
  return filtered
}
