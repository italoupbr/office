export interface Funnel {
  clientId: string
  /** yyyy-mm */
  month: string
  siteLeads: number
  attended: number
  negotiating: number
  won: number
  revenue: number
}

export interface Seller {
  id: string
  clientId: string
  name: string
  leads: number
  /** tempo médio de primeira resposta, em minutos */
  firstResponseMinutes: number
  sales: number
  revenue: number
}

export interface LeadFromArticle {
  id: string
  clientId: string
  articleId: string
  articleTitle: string
  leads: number
  sales: number
  revenue: number
}
