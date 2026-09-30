import type { Article, ArticleStatus } from '../../types'
import { isoDay } from './calendar'
import { mockClients } from './clients'
import { hashSeed, seeded } from './rng'

const TITLES: Record<string, string[]> = {
  'cli-a': [
    'Quanto custa um implante dentário',
    'Clareamento a laser dói',
    'Lente de contato dental vale a pena',
    'Quanto tempo dura um canal',
    'Aparelho invisível funciona mesmo',
    'Como escolher uma clínica odontológica',
    'Implante em dente da frente',
    'Prótese fixa ou removível',
    'Limpeza dental de quanto em quanto tempo',
    'Enxerto ósseo para implante',
  ],
  'cli-b': [
    'Prazo do inventário extrajudicial',
    'Holding familiar protege o patrimônio',
    'Usucapião de imóvel urbano',
    'Divórcio consensual quanto tempo leva',
    'Quem paga as custas do inventário',
    'Testamento vale mais que a partilha',
    'Partilha de bens com filhos menores',
    'Contrato de namoro tem valor',
    'Inventário com imóvel financiado',
  ],
  'cli-c': [
    'Cores para sala de estar pequena',
    'Como escolher tapete para sala',
    'Luminária de piso ou de teto',
    'Decoração de apartamento alugado',
    'Papel de parede em quarto de bebê',
    'Como combinar almofadas',
    'Espelho grande na sala aumenta o ambiente',
    'Mesa de centro redonda ou retangular',
    'Cortina blackout vale o investimento',
    'Plantas que vivem em ambiente fechado',
    'Como montar uma galeria de quadros',
    'Iluminação para home office',
  ],
  'cli-d': [
    'Documentos para financiar imóvel na planta',
    'Vale a pena comprar na planta',
    'O que é permuta de terreno',
    'Prazo de entrega de obra atrasou',
    'Como funciona o financiamento direto',
    'Diferença entre escritura e matrícula',
    'ITBI quem paga na compra',
    'Como avaliar a planta de um apartamento',
  ],
  'cli-e': [
    'Treino para iniciantes em musculação',
    'Quantas vezes treinar por semana',
    'Musculação ou funcional para emagrecer',
    'Quanto tempo para ver resultado na academia',
    'Aula coletiva vale a pena',
    'Como não perder a motivação na academia',
    'Treino de 45 minutos funciona',
    'Suplemento é necessário para começar',
    'Academia 24 horas compensa',
    'Avaliação física de quanto em quanto tempo',
  ],
}

const OWNERS = ['Ana Bezerra', 'Caio Fontes', 'Marina Duarte', 'Letícia Amaral']

/**
 * Corpo montado por código a partir do título e do segmento. É texto de
 * protótipo, sem número inventado apresentado como dado real.
 */
function buildBody(title: string, segment: string): string[] {
  return [
    `Este rascunho responde à pergunta "${title.toLowerCase()}" na primeira linha, do jeito que o leitor pergunta. A abertura entrega a resposta curta e o resto do texto sustenta essa resposta.`,
    `O contexto é de ${segment.toLowerCase()}. A seção seguinte compara as alternativas que o leitor considera antes de decidir, com os critérios que pesam na escolha e o que costuma ser ignorado.`,
    'Depois vem a parte prática: o que perguntar no primeiro contato, quais documentos ou informações separar antes e como identificar uma proposta mal explicada.',
    'O fechamento retoma a resposta da abertura e encaminha para o próximo passo, sem promessa de resultado e sem número que não possa ser verificado.',
    'Observação para aprovação: os dados numéricos e as referências entram depois da sua validação, junto com as imagens.',
  ]
}

function statusFor(index: number, total: number): ArticleStatus {
  if (index < Math.max(2, Math.round(total * 0.25))) return 'em_producao'
  if (index < Math.max(4, Math.round(total * 0.5))) return 'aguardando_aprovacao'
  return 'publicado'
}

function buildArticles(clientId: string, segment: string): Article[] {
  const titles = TITLES[clientId]
  const next = seeded(hashSeed(`articles:${clientId}`))

  return titles.map((title, index) => {
    const status = statusFor(index, titles.length)
    const id = `art-${clientId.slice(-1)}-${String(index + 1).padStart(2, '0')}`
    const base: Article = {
      id,
      clientId,
      title,
      status,
      owner: OWNERS[Math.floor(next() * OWNERS.length) % OWNERS.length],
      updatedAt: isoDay(-Math.floor(next() * 12) - 1),
      body: buildBody(title, segment),
    }

    if (status === 'aguardando_aprovacao') {
      // Alguns passam de 7 dias, para alimentar o alerta da Diretoria.
      const days = index % 2 === 0 ? 3 + Math.floor(next() * 4) : 9 + Math.floor(next() * 14)
      return { ...base, waitingSince: isoDay(-days) }
    }

    if (status === 'publicado') {
      const position = Number((2 + next() * 16).toFixed(1))
      const leads = Math.max(0, Math.round((22 - position) * (0.4 + next() * 1.6)))
      return {
        ...base,
        publishedAt: isoDay(-20 - Math.floor(next() * 130)),
        googlePosition: position,
        leads,
      }
    }

    return base
  })
}

export const mockArticles: Record<string, Article[]> = mockClients.reduce<
  Record<string, Article[]>
>((acc, client) => {
  acc[client.id] = buildArticles(client.id, client.segment)
  return acc
}, {})
