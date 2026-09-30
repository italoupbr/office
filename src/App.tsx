import { useEffect, useMemo, useState } from 'react'
import PhaserGame from './game/PhaserGame'
import type { WorldSpec } from './game/OfficeScene'
import * as bus from './game/bus'
import { useViewMode } from './auth/viewModeContext'
import { visibleBuildings, visibleRooms } from './auth/permissions'
import { officeData } from './data/source'
import DevBar from './components/DevBar'
import type { Client, RoomId } from './types'

export default function App() {
  const { mode } = useViewMode()
  const [clients, setClients] = useState<Client[]>([])
  const [requestedBuilding, setRequestedBuilding] = useState<string | null>(null)
  const [openRoom, setOpenRoom] = useState<RoomId | null>(null)
  const [camera, setCamera] = useState<bus.CameraState>({ zoom: 1, mode: 'follow' })

  const buildings = useMemo(() => visibleBuildings(mode), [mode])

  useEffect(() => {
    officeData.listClients(mode).then(setClients)
  }, [mode])

  /**
   * O prédio aberto é derivado, não guardado. Trocar de modo troca o conjunto
   * visível, e um id fora do escopo simplesmente deixa de resolver em vez de
   * ficar preso no estado.
   */
  const building = useMemo(() => {
    const requested = buildings.find((b) => b.id === requestedBuilding)
    if (requested) return requested
    return buildings.find((b) => b.kind === 'client') ?? buildings[0] ?? null
  }, [buildings, requestedBuilding])

  const rooms = useMemo(
    () => (building ? visibleRooms(mode, building.kind) : []),
    [mode, building],
  )

  const world = useMemo<WorldSpec>(
    () => ({ rooms, label: building?.name ?? '' }),
    [rooms, building],
  )

  useEffect(() => {
    const offs = [
      bus.on('room:open', (roomId) => setOpenRoom(roomId)),
      bus.on('camera:state', setCamera),
    ]
    return () => offs.forEach((off) => off())
  }, [])

  useEffect(() => {
    bus.emit('room:highlight', openRoom)
  }, [openRoom])

  const openRoomDef = rooms.find((room) => room.id === openRoom) ?? null

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar__brand">
          <span className="topbar__mark" aria-hidden="true" />
          <div>
            <strong>Upsend</strong>
            <span className="topbar__subtitle">
              {mode.kind === 'agency' ? 'Modo agência' : 'Modo cliente'}
            </span>
          </div>
        </div>

        <label className="field">
          <span className="field__label">Prédio</span>
          <select
            className="field__control"
            value={building?.id ?? ''}
            onChange={(event) => setRequestedBuilding(event.target.value)}
          >
            {buildings.map((option) => (
              <option key={option.id} value={option.id}>
                {option.kind === 'upsend' ? 'Upsend (operação interna)' : option.name}
              </option>
            ))}
          </select>
        </label>

        <div className="topbar__group topbar__group--end">
          <div className="zoom">
            <button
              type="button"
              className="btn btn--icon"
              onClick={() => bus.emit('camera:command', 'zoom-out')}
              aria-label="Reduzir zoom"
            >
              -
            </button>
            <span className="zoom__value">{Math.round(camera.zoom * 100)}%</span>
            <button
              type="button"
              className="btn btn--icon"
              onClick={() => bus.emit('camera:command', 'zoom-in')}
              aria-label="Aumentar zoom"
            >
              +
            </button>
          </div>
          <button
            type="button"
            className={`btn${camera.mode === 'overview' ? ' btn--active' : ''}`}
            onClick={() =>
              bus.emit('camera:command', camera.mode === 'overview' ? 'follow' : 'overview')
            }
          >
            {camera.mode === 'overview' ? 'Seguir personagem' : 'Visão geral'}
          </button>
        </div>
      </header>

      <main className="stage">
        <PhaserGame world={world} />

        <nav className="rail">
          <span className="rail__title">Salas visíveis</span>
          <ul className="rail__list">
            {rooms.map((room) => (
              <li key={room.id}>
                <button
                  type="button"
                  className={`rail__item${openRoom === room.id ? ' rail__item--on' : ''}`}
                  onClick={() => {
                    setOpenRoom(room.id)
                    bus.emit('room:goto', room.id)
                  }}
                >
                  <span className="rail__dot" style={{ background: room.accent }} aria-hidden="true" />
                  <span>
                    {room.name}
                    {room.scope === 'internal' && <em className="rail__tag">interna</em>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="rail__note">
            {rooms.length} {rooms.length === 1 ? 'sala' : 'salas'} construídas no mapa.
          </p>
        </nav>

        {openRoomDef && (
          <aside className="panel panel--stub">
            <header className="panel__head">
              <div>
                <span className="panel__eyebrow" style={{ color: openRoomDef.accent }}>
                  {openRoomDef.scope === 'internal' ? 'Sala interna' : 'Acompanhamento'}
                </span>
                <h2 className="panel__title">{openRoomDef.name}</h2>
                <p className="panel__meta">{openRoomDef.purpose}</p>
              </div>
              <button type="button" className="btn btn--ghost" onClick={() => setOpenRoom(null)}>
                Fechar
              </button>
            </header>
            <div className="panel__body">
              <p className="panel__empty">
                A interface desta sala entra na etapa 4. Nesta etapa o que existe é a
                estrutura de dados, a regra de permissão e a barra de modo.
              </p>
            </div>
          </aside>
        )}
      </main>

      <DevBar clients={clients} />
    </div>
  )
}
