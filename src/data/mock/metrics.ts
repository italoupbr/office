import type { LeadsByPage, MonthlyMetrics } from '../../types'
import { lastMonths } from './calendar'
import { clientProfiles, profileByClient } from './clients'
import { between, hashSeed, seeded } from './rng'

/**
 * Seis meses por cliente. As invariantes valem em todo mês:
 * sessões de IA menores que as orgânicas, leads menores que a soma das duas,
 * posição média positiva e caindo (melhorando) ao longo do tempo.
 */
function buildSeries(clientId: string): MonthlyMetrics[] {
  const profile = profileByClient[clientId]
  const next = seeded(hashSeed(`metrics:${clientId}`))
  const months = lastMonths(6)

  return months.map((entry, index) => {
    const isLast = index === months.length - 1
    const trend = Math.pow(1 + profile.growth, index)
    const noise = 0.94 + next() * 0.12
    const shock = isLast ? profile.lastMonthShock : 1

    const organicSessions = Math.round(profile.baseSessions * trend * noise * shock)
    const aiShare = Math.min(0.28, profile.aiShare + profile.aiShareGain * index)
    const aiSessions = Math.round(organicSessions * aiShare * (0.9 + next() * 0.2))
    const siteLeads = Math.max(
      3,
      Math.round((organicSessions + aiSessions) * profile.leadRate * (0.88 + next() * 0.24)),
    )
    const avgPosition = Math.max(
      1.8,
      Number((profile.startPosition - profile.positionGain * index + (next() - 0.5) * 0.8).toFixed(1)),
    )
    const gbpViews = Math.round(organicSessions * (0.55 + next() * 0.35))

    return {
      month: entry.month,
      label: entry.label,
      organicSessions,
      aiSessions,
      siteLeads,
      avgPosition,
      gbpViews,
    }
  })
}

export const mockMetrics: Record<string, MonthlyMetrics[]> = clientProfiles.reduce<
  Record<string, MonthlyMetrics[]>
>((acc, profile) => {
  acc[profile.clientId] = buildSeries(profile.clientId)
  return acc
}, {})

const PAGE_POOL: Record<string, string[]> = {
  'cli-a': ['/implantes-dentarios', '/clareamento', '/blog/quanto-custa-implante', '/contato', '/blog/lente-de-contato-dental'],
  'cli-b': ['/inventario', '/blog/prazo-inventario', '/holding-familiar', '/contato', '/blog/usucapiao'],
  'cli-c': ['/tapetes', '/blog/cores-sala-de-estar', '/luminarias', '/ofertas', '/blog/decoracao-apartamento-pequeno'],
  'cli-d': ['/empreendimentos/vista-norte', '/blog/financiar-na-planta', '/contato', '/plantas', '/blog/documentos-financiamento'],
  'cli-e': ['/planos', '/blog/treino-para-iniciantes', '/unidades', '/aulas-coletivas', '/blog/quantas-vezes-treinar'],
}

/** Distribui os leads do mês corrente entre as páginas de origem. */
export const mockLeadsByPage: Record<string, LeadsByPage[]> = clientProfiles.reduce<
  Record<string, LeadsByPage[]>
>((acc, profile) => {
  const series = mockMetrics[profile.clientId]
  const total = series[series.length - 1].siteLeads
  const pages = PAGE_POOL[profile.clientId]
  const next = seeded(hashSeed(`pages:${profile.clientId}`))

  const weights = pages.map(() => 0.5 + next())
  const sum = weights.reduce((a, b) => a + b, 0)
  const rows = pages.map((page, index) => ({
    page,
    leads: Math.max(1, Math.round((total * weights[index]) / sum)),
  }))

  // Ajusta a última página para o somatório fechar com o total do mês.
  const diff = total - rows.reduce((a, row) => a + row.leads, 0)
  rows[rows.length - 1].leads = Math.max(1, rows[rows.length - 1].leads + diff)

  acc[profile.clientId] = rows.sort((a, b) => b.leads - a.leads)
  return acc
}, {})

/** Usado só para dar variedade a rótulos de apoio. */
export function jitter(clientId: string, key: string, min: number, max: number): number {
  return between(seeded(hashSeed(`${clientId}:${key}`)), min, max)
}
