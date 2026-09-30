export type ArticleStatus = 'em_producao' | 'aguardando_aprovacao' | 'publicado'

export interface Article {
  id: string
  clientId: string
  title: string
  status: ArticleStatus
  owner: string
  /** yyyy-mm-dd */
  updatedAt: string
  /** corpo em parágrafos, para a tela de leitura e aprovação */
  body: string[]
  /** desde quando aguarda o cliente, só em aguardando_aprovacao */
  waitingSince?: string
  publishedAt?: string
  googlePosition?: number
  leads?: number
  /** comentários de pedido de ajuste, preenchidos no estado local */
  comments?: string[]
}
