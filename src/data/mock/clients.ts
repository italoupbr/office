import type { Client } from '../../types'

export const mockClients: Client[] = [
  { id: 'cli-a', name: 'Cliente A', segment: 'Clínica odontológica', city: 'Fortaleza', accent: '#328FF8' },
  { id: 'cli-b', name: 'Cliente B', segment: 'Escritório de advocacia', city: 'Recife', accent: '#5EA84E' },
  { id: 'cli-c', name: 'Cliente C', segment: 'E-commerce de decoração', city: 'Curitiba', accent: '#E08A3C' },
  { id: 'cli-d', name: 'Cliente D', segment: 'Construtora', city: 'Goiânia', accent: '#C25A57' },
  { id: 'cli-e', name: 'Cliente E', segment: 'Rede de academias', city: 'Belo Horizonte', accent: '#7E6BC4' },
]

export const mockClientById: Record<string, Client> = mockClients.reduce<Record<string, Client>>(
  (acc, client) => {
    acc[client.id] = client
    return acc
  },
  {},
)

/**
 * Perfil de cada cliente. Controla a escala e a tendência das métricas, para
 * que os cinco não sejam cópias com números trocados: um cresce forte, um
 * está de lado, um caiu no último mês.
 */
export interface ClientProfile {
  clientId: string
  baseSessions: number
  /** crescimento médio por mês */
  growth: number
  /** fatia das sessões que vem de respostas de IA, no primeiro mês */
  aiShare: number
  /** ganho mensal da fatia de IA */
  aiShareGain: number
  /** taxa de conversão do site em lead */
  leadRate: number
  startPosition: number
  positionGain: number
  ticket: number
  /** ticket alto fecha menos: mantém o funil coerente com o segmento */
  closeFactor: number
  /** aplicado apenas no mês corrente, para criar um mês ruim */
  lastMonthShock: number
}

export const clientProfiles: ClientProfile[] = [
  { clientId: 'cli-a', baseSessions: 4200, growth: 0.11, aiShare: 0.05, aiShareGain: 0.012, leadRate: 0.032, startPosition: 18.4, positionGain: 1.6, ticket: 3800, closeFactor: 0.95, lastMonthShock: 1 },
  { clientId: 'cli-b', baseSessions: 2600, growth: 0.07, aiShare: 0.06, aiShareGain: 0.015, leadRate: 0.024, startPosition: 22.1, positionGain: 1.9, ticket: 9500, closeFactor: 0.5, lastMonthShock: 1 },
  { clientId: 'cli-c', baseSessions: 11800, growth: 0.05, aiShare: 0.04, aiShareGain: 0.008, leadRate: 0.018, startPosition: 14.7, positionGain: 1.1, ticket: 640, closeFactor: 1.25, lastMonthShock: 0.88 },
  { clientId: 'cli-d', baseSessions: 1900, growth: 0.16, aiShare: 0.07, aiShareGain: 0.02, leadRate: 0.041, startPosition: 26.3, positionGain: 2.6, ticket: 42000, closeFactor: 0.16, lastMonthShock: 1 },
  { clientId: 'cli-e', baseSessions: 7400, growth: 0.02, aiShare: 0.05, aiShareGain: 0.009, leadRate: 0.021, startPosition: 16.2, positionGain: 0.5, ticket: 1450, closeFactor: 1.1, lastMonthShock: 1 },
]

export const profileByClient: Record<string, ClientProfile> = clientProfiles.reduce<
  Record<string, ClientProfile>
>((acc, profile) => {
  acc[profile.clientId] = profile
  return acc
}, {})
