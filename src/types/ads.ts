export type AdPlatform = 'meta' | 'google' | 'youtube'

export interface AdAccount {
  clientId: string
  platform: AdPlatform
  invested: number
  impressions: number
  clicks: number
  leads: number
  costPerLead: number
  sales: number
  revenue: number
  /** variação do custo por lead contra o mês anterior, em pontos percentuais */
  cplDeltaPct: number
}

export interface AdSuggestion {
  id: string
  clientId: string
  platform: AdPlatform
  title: string
  rationale: string
  expectedEffect: string
  status: 'aguardando_aprovacao' | 'aprovada' | 'descartada'
}
