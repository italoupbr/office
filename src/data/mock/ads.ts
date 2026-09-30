import type { AdAccount, AdPlatform, AdSuggestion } from '../../types'
import { mockClients, profileByClient } from './clients'
import { hashSeed, seeded } from './rng'

export const AD_PLATFORMS: AdPlatform[] = ['meta', 'google', 'youtube']

export const AD_PLATFORM_LABEL: Record<AdPlatform, string> = {
  meta: 'Meta Ads',
  google: 'Google Ads',
  youtube: 'YouTube',
}

/** Investimento e resultado por plataforma, com custo por lead derivado. */
function buildAccount(clientId: string, platform: AdPlatform): AdAccount {
  const profile = profileByClient[clientId]
  const next = seeded(hashSeed(`ads:${clientId}:${platform}`))

  const scale = platform === 'google' ? 1 : platform === 'meta' ? 0.72 : 0.35
  const invested = Math.round((2200 + next() * 9800) * scale)
  const impressions = Math.round(invested * (38 + next() * 120))
  const clicks = Math.round(impressions * (0.008 + next() * 0.022))
  const leads = Math.max(1, Math.round(clicks * (0.03 + next() * 0.075)))
  const sales = Math.max(0, Math.round(leads * (0.08 + next() * 0.24)))

  return {
    clientId,
    platform,
    invested,
    impressions,
    clicks,
    leads,
    costPerLead: Number((invested / leads).toFixed(2)),
    sales,
    revenue: sales * profile.ticket,
    cplDeltaPct: Number(((next() - 0.45) * 42).toFixed(1)),
  }
}

export const mockAdAccounts: AdAccount[] = mockClients.flatMap((client) =>
  AD_PLATFORMS.map((platform) => buildAccount(client.id, platform)),
)

const SUGGESTION_POOL: Record<AdPlatform, { title: string; rationale: string; effect: string }[]> = {
  meta: [
    {
      title: 'Pausar o público frio de maior custo por lead',
      rationale: 'O conjunto de público frio está com custo por lead acima da média da conta no mês.',
      effect: 'Libera verba para os conjuntos que já convertem, sem mexer no investimento total.',
    },
    {
      title: 'Subir verba do público que já visitou o site',
      rationale: 'O remarketing está com o menor custo por lead da conta e não usa toda a verba disponível.',
      effect: 'Mais leads no mesmo investimento, com risco baixo.',
    },
  ],
  google: [
    {
      title: 'Adicionar termos negativos de busca informativa',
      rationale: 'Parte dos cliques vem de buscas que não têm intenção de compra.',
      effect: 'Reduz cliques sem intenção e derruba o custo por lead.',
    },
    {
      title: 'Separar campanha de marca do restante',
      rationale: 'As buscas pelo nome da empresa disputam verba com as buscas de serviço.',
      effect: 'Deixa claro quanto vem de marca e quanto vem de demanda nova.',
    },
  ],
  youtube: [
    {
      title: 'Cortar os 3 primeiros segundos do vídeo principal',
      rationale: 'A maior parte da desistência acontece antes da mensagem principal aparecer.',
      effect: 'Mais gente assistindo até a oferta, com o mesmo criativo.',
    },
    {
      title: 'Testar público de quem assistiu 75% do vídeo',
      rationale: 'Esse público ainda não recebe anúncio de conversão.',
      effect: 'Abre uma etapa intermediária entre o vídeo e o formulário.',
    },
  ],
}

export const mockAdSuggestions: AdSuggestion[] = mockClients.flatMap((client) =>
  AD_PLATFORMS.flatMap((platform) => {
    const next = seeded(hashSeed(`sugg:${client.id}:${platform}`))
    const pool = SUGGESTION_POOL[platform]
    const chosen = pool[Math.floor(next() * pool.length) % pool.length]
    return [
      {
        id: `sug-${client.id.slice(-1)}-${platform}`,
        clientId: client.id,
        platform,
        title: chosen.title,
        rationale: chosen.rationale,
        expectedEffect: chosen.effect,
        status: 'aguardando_aprovacao' as const,
      },
    ]
  }),
)
