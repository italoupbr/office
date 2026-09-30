import type { BuildingDef, RoomDef, RoomId } from '../types'

/**
 * Catálogo de salas e prédios. É estrutura, não dado de cliente.
 * O campo scope é a única coisa que separa acompanhamento de operação
 * interna, e quem interpreta esse campo é src/auth/permissions.ts.
 */
export const ROOMS: RoomDef[] = [
  {
    id: 'resultados',
    name: 'Resultados',
    short: 'Resultados',
    purpose: 'Painel de métricas e agente explicador',
    scope: 'client',
    building: 'client',
    accent: '#328FF8',
    slot: { col: 0, row: 0 },
  },
  {
    id: 'conteudo',
    name: 'Conteúdo',
    short: 'Conteúdo',
    purpose: 'Artigos em produção, aprovação e publicados',
    scope: 'client',
    building: 'client',
    accent: '#E08A3C',
    slot: { col: 1, row: 0 },
  },
  {
    id: 'sites',
    name: 'Sites',
    short: 'Sites',
    purpose: 'Status do site e alterações publicadas',
    scope: 'client',
    building: 'client',
    accent: '#3FA9A0',
    slot: { col: 2, row: 0 },
  },
  {
    id: 'comercial',
    name: 'Comercial',
    short: 'Comercial',
    purpose: 'Funil, vendedores e leads vindos de artigos',
    scope: 'client',
    building: 'client',
    accent: '#5EA84E',
    slot: { col: 0, row: 1 },
  },
  {
    id: 'midia_paga',
    name: 'Mídia Paga',
    short: 'Mídia Paga',
    purpose: 'Meta Ads, Google Ads e YouTube',
    scope: 'client',
    building: 'client',
    accent: '#C25A57',
    slot: { col: 1, row: 1 },
  },
  {
    id: 'reunioes',
    name: 'Reuniões',
    short: 'Reuniões',
    purpose: 'Próximas reuniões e atas anteriores',
    scope: 'client',
    building: 'client',
    accent: '#7E6BC4',
    slot: { col: 2, row: 1 },
  },
  {
    id: 'sites_oficina',
    name: 'Sites · Oficina',
    short: 'Oficina',
    purpose: 'Fila de jobs de alteração de site',
    scope: 'internal',
    building: 'client',
    accent: '#425D80',
    slot: { col: 3, row: 0 },
    tall: true,
  },
  {
    id: 'diretoria',
    name: 'Diretoria',
    short: 'Diretoria',
    purpose: 'Visão de todos os clientes',
    scope: 'internal',
    building: 'upsend',
    accent: '#B08A2E',
    slot: { col: 0, row: 0 },
    tall: true,
  },
  {
    id: 'revisao',
    name: 'Revisão',
    short: 'Revisão',
    purpose: 'Fila única de aprovações da agência',
    scope: 'internal',
    building: 'upsend',
    accent: '#8A6BB0',
    slot: { col: 1, row: 0 },
    tall: true,
  },
]

export const ROOM_BY_ID: Record<RoomId, RoomDef> = ROOMS.reduce(
  (acc, room) => {
    acc[room.id] = room
    return acc
  },
  {} as Record<RoomId, RoomDef>,
)

/** Campus do modo agência: um prédio por cliente, mais o prédio Upsend. */
export const BUILDINGS: BuildingDef[] = [
  { id: 'bld-upsend', kind: 'upsend', name: 'Upsend', spot: { col: 20, row: 4 } },
  { id: 'bld-cli-a', kind: 'client', name: 'Cliente A', clientId: 'cli-a', spot: { col: 4, row: 14 } },
  { id: 'bld-cli-b', kind: 'client', name: 'Cliente B', clientId: 'cli-b', spot: { col: 14, row: 14 } },
  { id: 'bld-cli-c', kind: 'client', name: 'Cliente C', clientId: 'cli-c', spot: { col: 24, row: 14 } },
  { id: 'bld-cli-d', kind: 'client', name: 'Cliente D', clientId: 'cli-d', spot: { col: 34, row: 14 } },
  { id: 'bld-cli-e', kind: 'client', name: 'Cliente E', clientId: 'cli-e', spot: { col: 44, row: 14 } },
]

export const BUILDING_BY_ID: Record<string, BuildingDef> = BUILDINGS.reduce<
  Record<string, BuildingDef>
>((acc, building) => {
  acc[building.id] = building
  return acc
}, {})

export function buildingForClient(clientId: string): BuildingDef | undefined {
  return BUILDINGS.find((b) => b.kind === 'client' && b.clientId === clientId)
}
