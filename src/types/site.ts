export interface SiteInfo {
  clientId: string
  domain: string
  status: 'no_ar' | 'manutencao'
  uptimePct: number
  lastDeploy: string
  performanceScore: number
  pages: number
}

export interface SiteChange {
  id: string
  clientId: string
  title: string
  publishedAt: string
  author: string
}

export interface SiteRequest {
  id: string
  clientId: string
  description: string
  createdAt: string
  status: 'recebida'
}

export type JobStage =
  | 'na_fila'
  | 'trabalhando'
  | 'previa_pronta'
  | 'aguardando_aprovacao'
  | 'publicado'

export interface SiteJob {
  id: string
  clientId: string
  description: string
  stage: JobStage
  createdAt: string
  branch: string
  previewUrl: string
  /** ms restantes na etapa atual, usado pela animação simulada */
  stageMsLeft?: number
}
