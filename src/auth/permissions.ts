import { BUILDINGS, ROOMS } from '../config/rooms'
import type { BuildingDef, BuildingKind, RoomDef, RoomId } from '../types'

/**
 * REGRA DE VISIBILIDADE, EM UM ÚNICO LUGAR.
 *
 * No futuro o modo vem do login. No protótipo vem da barra "Ver como".
 * Nada de esconder com CSS: as funções daqui são usadas tanto pela camada
 * de dados (src/data/source.ts) quanto pela montagem do mapa e dos painéis,
 * então sala interna em modo cliente não é lida, não é renderizada e não
 * chega a componente nenhum.
 */

export type ViewMode =
  | { kind: 'agency' }
  | { kind: 'client'; clientId: string }

export const AGENCY_MODE: ViewMode = { kind: 'agency' }

export function clientMode(clientId: string): ViewMode {
  return { kind: 'client', clientId }
}

export function isAgency(mode: ViewMode): boolean {
  return mode.kind === 'agency'
}

/** A função pedida: recebe (modo, sala) e diz se pode ver. */
export function canViewRoom(mode: ViewMode, room: RoomDef): boolean {
  if (mode.kind === 'agency') return true
  return room.scope === 'client'
}

export function canViewRoomId(mode: ViewMode, roomId: RoomId): boolean {
  const room = ROOMS.find((r) => r.id === roomId)
  if (!room) return false
  return canViewRoom(mode, room)
}

export function canViewBuilding(mode: ViewMode, building: BuildingDef): boolean {
  if (mode.kind === 'agency') return true
  return building.kind === 'client' && building.clientId === mode.clientId
}

/** Cliente só alcança os próprios dados. */
export function canViewClientData(mode: ViewMode, clientId: string): boolean {
  if (mode.kind === 'agency') return true
  return mode.clientId === clientId
}

/** Salas que devem ser construídas no mapa e listadas na Visão direta. */
export function visibleRooms(mode: ViewMode, building: BuildingKind): RoomDef[] {
  return ROOMS.filter((room) => room.building === building && canViewRoom(mode, room))
}

export function visibleBuildings(mode: ViewMode): BuildingDef[] {
  return BUILDINGS.filter((building) => canViewBuilding(mode, building))
}

export class PermissionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PermissionError'
  }
}

/** Barreira usada pela camada de dados antes de devolver qualquer registro. */
export function assertRoomVisible(mode: ViewMode, roomId: RoomId): void {
  if (!canViewRoomId(mode, roomId)) {
    throw new PermissionError(`sala "${roomId}" fora do escopo do modo atual`)
  }
}

export function assertClientVisible(mode: ViewMode, clientId: string): void {
  if (!canViewClientData(mode, clientId)) {
    throw new PermissionError(`cliente "${clientId}" fora do escopo do modo atual`)
  }
}
