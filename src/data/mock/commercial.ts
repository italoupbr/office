import type { Funnel, LeadFromArticle, Seller } from '../../types'
import { currentMonth } from './calendar'
import { mockClients, profileByClient } from './clients'
import { hashSeed, seeded } from './rng'
import { mockMetrics } from './metrics'
import { mockArticles } from './articles'

const SELLER_NAMES: Record<string, string[]> = {
  'cli-a': ['Paula Rezende', 'Tiago Moura', 'Camila Braga'],
  'cli-b': ['Rodrigo Sá', 'Helena Prado', 'Vitor Amaral'],
  'cli-c': ['Bianca Lopes', 'Fernando Reis', 'Juliana Matos'],
  'cli-d': ['Marcelo Vaz', 'Renata Cunha', 'Otávio Lima'],
  'cli-e': ['Débora Pinto', 'Gustavo Nery', 'Larissa Fonseca'],
}

/**
 * Funil do mês corrente derivado dos leads reais da série de métricas, com
 * queda monotônica entre etapas: vendidos <= negociação <= atendidos <= leads.
 */
export const mockFunnels: Record<string, Funnel> = mockClients.reduce<Record<string, Funnel>>(
  (acc, client) => {
    const series = mockMetrics[client.id]
    const siteLeads = series[series.length - 1].siteLeads
    const next = seeded(hashSeed(`funnel:${client.id}`))
    const profile = profileByClient[client.id]

    const attended = Math.round(siteLeads * (0.72 + next() * 0.2))
    const negotiating = Math.round(attended * (0.42 + next() * 0.24))
    const won = Math.max(1, Math.round(negotiating * (0.24 + next() * 0.22) * profile.closeFactor))

    acc[client.id] = {
      clientId: client.id,
      month: currentMonth(),
      siteLeads,
      attended,
      negotiating,
      won,
      revenue: won * profile.ticket,
    }
    return acc
  },
  {},
)

export const mockSellers: Record<string, Seller[]> = mockClients.reduce<Record<string, Seller[]>>(
  (acc, client) => {
    const funnel = mockFunnels[client.id]
    const profile = profileByClient[client.id]
    const next = seeded(hashSeed(`sellers:${client.id}`))
    const names = SELLER_NAMES[client.id]

    const weights = names.map(() => 0.6 + next())
    const sum = weights.reduce((a, b) => a + b, 0)

    let leadsLeft = funnel.siteLeads
    let salesLeft = funnel.won

    acc[client.id] = names.map((name, index) => {
      const last = index === names.length - 1
      const leads = last ? leadsLeft : Math.round((funnel.siteLeads * weights[index]) / sum)
      const sales = last ? salesLeft : Math.min(leads, Math.round((funnel.won * weights[index]) / sum))
      leadsLeft -= leads
      salesLeft -= sales
      return {
        id: `sel-${client.id.slice(-1)}-${index + 1}`,
        clientId: client.id,
        name,
        leads: Math.max(0, leads),
        firstResponseMinutes: Math.round(4 + next() * 180),
        sales: Math.max(0, sales),
        revenue: Math.max(0, sales) * profile.ticket,
      }
    })
    return acc
  },
  {},
)

/** Caminho artigo, lead, venda. Usa artigos publicados que geraram leads. */
export const mockLeadsFromArticles: Record<string, LeadFromArticle[]> = mockClients.reduce<
  Record<string, LeadFromArticle[]>
>((acc, client) => {
  const profile = profileByClient[client.id]
  const next = seeded(hashSeed(`fromarticles:${client.id}`))
  const published = mockArticles[client.id]
    .filter((article) => article.status === 'publicado' && (article.leads ?? 0) > 0)
    .sort((a, b) => (b.leads ?? 0) - (a.leads ?? 0))
    .slice(0, 4)

  acc[client.id] = published.map((article, index) => {
    const leads = article.leads ?? 0
    const sales = Math.max(0, Math.round(leads * (0.1 + next() * 0.28)))
    return {
      id: `lfa-${client.id.slice(-1)}-${index + 1}`,
      clientId: client.id,
      articleId: article.id,
      articleTitle: article.title,
      leads,
      sales,
      revenue: sales * profile.ticket,
    }
  })
  return acc
}, {})
