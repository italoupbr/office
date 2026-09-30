/** Salas do sistema. O escopo decide quem pode ver. */
export type RoomId =
  // acompanhamento, visíveis nos dois modos
  | 'resultados'
  | 'conteudo'
  | 'sites'
  | 'comercial'
  | 'midia_paga'
  | 'reunioes'
  // internas da agência, dentro do prédio do cliente
  | 'sites_oficina'
  // internas da agência, prédio Upsend
  | 'diretoria'
  | 'revisao'

export type RoomScope = 'client' | 'internal'

export type BuildingKind = 'client' | 'upsend'

export interface RoomDef {
  id: RoomId
  name: string
  /** rótulo curto para placa e minimapa */
  short: string
  purpose: string
  scope: RoomScope
  building: BuildingKind
  accent: string
  /** posição na grade de salas do prédio */
  slot: { col: number; row: number }
  /** sala alta, ocupa as duas linhas da grade */
  tall?: boolean
}

export interface BuildingDef {
  id: string
  kind: BuildingKind
  name: string
  /** presente apenas quando kind é 'client' */
  clientId?: string
  /** posição no campus, em tiles */
  spot: { col: number; row: number }
}

/** Contadores que a placa da sala mostra no mapa. */
export interface RoomBadge {
  roomId: RoomId
  /** linha principal, ex: "12 em produção" */
  primary: string
  /** linha de alerta, ex: "3 atrasados". Vazio some da placa. */
  alert: string
  /** verde, amarelo ou vermelho */
  health: 'ok' | 'attention' | 'late'
}
