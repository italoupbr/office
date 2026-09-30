export interface MonthlyMetrics {
  /** yyyy-mm */
  month: string
  /** rótulo curto, ex: "abr" */
  label: string
  organicSessions: number
  /** sessões que chegaram por respostas de IA */
  aiSessions: number
  siteLeads: number
  /** posição média no Google, menor é melhor */
  avgPosition: number
  /** visualizações do Perfil da Empresa no Google */
  gbpViews: number
}

export type MetricKey = keyof Omit<MonthlyMetrics, 'month' | 'label'>

export interface LeadsByPage {
  page: string
  leads: number
}
