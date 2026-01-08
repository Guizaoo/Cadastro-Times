export const sanitizeDigits = (value) =>
  value.replace(/\D+/g, '')

export const buildProtectedCpf = (cpf) => {
  const digits = sanitizeDigits(cpf)
  if (digits.length !== 11) return cpf

  return `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-**`
}

export const formatCpfForDisplay = (cpf) => {
  const digits = sanitizeDigits(cpf)
  if (digits.length !== 11) return cpf

  return buildProtectedCpf(digits)
}

export const parseIntegrantesList = (value) => {
  if (!value) return []
  return value.split(',').map((item) => item.trim())
}

export const validateCPF = (cpf) => {
  const digits = sanitizeDigits(cpf)
  if (digits.length !== 11) return false
  if (/^(\d)\1+$/.test(digits)) return false

  let sum = 0
  let remainder

  for (let i = 1; i <= 9; i++) {
    sum = sum + parseInt(digits.substring(i - 1, i)) * (11 - i)
  }

  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(digits.substring(9, 10))) return false

  sum = 0
  for (let i = 1; i <= 10; i++) {
    sum = sum + parseInt(digits.substring(i - 1, i)) * (12 - i)
  }

  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(digits.substring(10, 11))) return false

  return true
}

export const validateCelular = (celular) => {
  const digits = sanitizeDigits(celular)
  return digits.length === 11
}

export const formatCPF = (cpf) => {
  const digits = sanitizeDigits(cpf)
  if (digits.length !== 11) return cpf?.trim?.() ?? cpf

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

export const formatCelular = (celular) => {
  const digits = sanitizeDigits(celular)
  if (digits.length !== 11) return celular?.trim?.() ?? celular

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export const normalizeText = (value) =>
  value?.trim?.().replace(/\s+/g, ' ') ?? value

export const cpfExists = (times, cpfDigits, modalidade, excludeId = '') => {
  if (!cpfDigits) return false

  return times.some((time) => {
    if (excludeId && time.id === excludeId) return false
    if (modalidade && time.modalidade !== modalidade) return false
    return sanitizeDigits(time.cpf || '') === cpfDigits
  })
}
