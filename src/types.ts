/**
 * Tipos de domínio da prévia visual do escritório.
 * São independentes de Phaser e de React para que a troca do mock por uma
 * fonte real (Supabase) não exija mudança de interface nem de cena.
 */

export type WorkStatus =
  | 'novo'
  | 'em_producao'
  | 'em_revisao'
  | 'aguardando_cliente'
  | 'concluido'

export type RoomId =
  | 'recepcao'
  | 'conteudo'
  | 'sites'
  | 'seo_local'
  | 'midia_paga'
  | 'revisao'
  | 'reuniao'
  | 'diretoria'

export interface Client {
  id: string
  name: string
  segment: string
}

export interface TeamMember {
  id: string
  name: string
  role: string
}

export interface WorkItem {
  id: string
  title: string
  clientId: string
  status: WorkStatus
  /** id do TeamMember responsável pela entrega */
  ownerId: string
  /** data no formato ISO curto (yyyy-mm-dd) */
  dueDate: string
  deskId: string
  roomId: RoomId
}

/**
 * Agregado por mesa. É o único formato que a cena Phaser consome,
 * o que mantém o mapa desacoplado do modelo completo de dados.
 */
export interface DeskSummary {
  deskId: string
  total: number
  overdue: number
  /** status dos itens da mesa, na ordem de exibição */
  statuses: WorkStatus[]
}
