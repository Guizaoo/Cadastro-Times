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

const nivelVoleiOptions = ['Iniciante', 'Intermediário']

const initialForm = {
  modalidade: 'futebol',
  nome: '',
  nomeEquipe: '',
  cpf: '',
  celular: '',
  instagram: '',
  integrantes: '',
  categoriaVolei: '',
  nivelIntegrante1: '',
  nivelIntegrante2: '',
}

export { initialForm, nivelVoleiOptions, sportOptions }
