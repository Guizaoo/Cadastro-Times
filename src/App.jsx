import { useEffect, useMemo, useState } from 'react'
import { AdminPage } from './pages/AdminPage'
import { HomePage, initialForm } from './pages/HomePage'
import { LAST_PAYMENT_KEY, PaymentPage } from './pages/PaymentPage'
import { fetchTeams, removeTeam, saveTeam, updateTeamStatus } from './services/teamApi'



const requiredFields = {
  nome: 'Nome',
  nomeEquipe: 'Nome da equipe',
  cpf: 'CPF',
  celular: 'Número de celular',
  integrantes: 'Nome dos integrantes',
}

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

// limitando cpf
const cpfExistsInModalidade = (list, cpfDigits, modalidade) =>
  Boolean(cpfDigits) && list.some((time) => sanitizeDigits(time.cpf) === cpfDigits && time.modalidade === modalidade)

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
    const cpfDigits = sanitizeDigits(formData.cpf)

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
      // Impede o mesmo CPF de cadastrar mais de um time na mesma modalidade
      ...(
        cpfExistsInModalidade(times, cpfDigits, formData.modalidade)
          ? [`Este CPF já possui um time de ${formData.modalidade === 'futebol' ? 'futebol' : 'vôlei'} cadastrado.`]
          : []
      ),
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
    localStorage.setItem(LAST_PAYMENT_KEY, novoTime.id)
    navigate(`/pagamento?id=${novoTime.id}`)
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
  const isPaymentRoute = route.startsWith('/pagamento')

  if (isPaymentRoute) {
    return (
      <PaymentPage
        times={times}
        onMarkPaid={handleStatusChange}
        onNavigateHome={() => navigate('/')}
      />
    )
  }

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
      errors={errors}
      erroServidor={erroServidor}
      handleChange={handleChange}
      handleSubmit={handleSubmit}
      onResetForm={() => {
        setFormData(initialForm)
        setErrors([])
      }}
      times={times}
    />
  )
}

export default App
