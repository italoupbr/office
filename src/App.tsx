import { useCallback, useEffect, useMemo, useState } from 'react'
import PhaserGame from './game/PhaserGame'
import * as bus from './game/bus'
import { DESK_BY_ID, ROOM_BY_ID } from './game/layout'
import TopBar from './components/TopBar'
import DeskPanel from './components/DeskPanel'
import DirectoryBoard from './components/DirectoryBoard'
import StatusLegend from './components/StatusLegend'
import { useOfficeData } from './hooks/useOfficeData'
import { isOverdue } from './lib/status'
import type { DeskSummary, RoomId } from './types'

export default function App() {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [selectedDeskId, setSelectedDeskId] = useState<string | null>(null)
  const [currentRoom, setCurrentRoom] = useState<RoomId | null>(null)
  const [camera, setCamera] = useState<bus.CameraState>({ zoom: 1.5, mode: 'follow' })

  const { clients, items, clientById, memberById, itemsByDesk, ready } =
    useOfficeData(selectedClientId)

  // Phaser -> React
  useEffect(() => {
    const offs = [
      bus.on('desk:click', (deskId) => setSelectedDeskId(deskId)),
      bus.on('room:enter', (roomId) => setCurrentRoom(roomId)),
      bus.on('camera:state', (state) => setCamera(state)),
    ]
    return () => offs.forEach((off) => off())
  }, [])

  // React -> Phaser: agregado por mesa, já filtrado por cliente
  const summaries = useMemo<DeskSummary[]>(
    () =>
      [...itemsByDesk.entries()].map(([deskId, deskItems]) => ({
        deskId,
        total: deskItems.length,
        overdue: deskItems.filter(isOverdue).length,
        statuses: deskItems.map((item) => item.status),
      })),
    [itemsByDesk],
  )

  useEffect(() => {
    if (!ready) return
    bus.emit('desks:update', summaries)
  }, [summaries, ready])

  useEffect(() => {
    bus.emit('desk:selected', selectedDeskId)
  }, [selectedDeskId])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedDeskId(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const closeDesk = useCallback(() => setSelectedDeskId(null), [])
  const zoomIn = useCallback(() => bus.emit('camera:command', 'zoom-in'), [])
  const zoomOut = useCallback(() => bus.emit('camera:command', 'zoom-out'), [])
  const toggleOverview = useCallback(() => {
    bus.emit('camera:command', camera.mode === 'overview' ? 'follow' : 'overview')
  }, [camera.mode])

  const selectedClientName = selectedClientId
    ? clientById.get(selectedClientId)?.name ?? null
    : null
  const scopeLabel = selectedClientName ? `Filtro: ${selectedClientName}` : 'Todos os clientes'

  const desk = selectedDeskId ? DESK_BY_ID[selectedDeskId] : null
  const deskRoom = desk ? ROOM_BY_ID[desk.roomId] : null
  const deskItems = selectedDeskId ? itemsByDesk.get(selectedDeskId) ?? [] : []
  const overdueTotal = items.filter(isOverdue).length

  return (
    <div className="app">
      <TopBar
        clients={clients}
        selectedClientId={selectedClientId}
        onSelectClient={setSelectedClientId}
        zoom={camera.zoom}
        cameraMode={camera.mode}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onToggleOverview={toggleOverview}
        totalItems={items.length}
        overdueItems={overdueTotal}
      />

      <main className="stage">
        <PhaserGame />

        {currentRoom === 'diretoria' && (
          <DirectoryBoard items={items} scopeLabel={scopeLabel} />
        )}

        {desk && deskRoom && (
          <DeskPanel
            desk={desk}
            room={deskRoom}
            items={deskItems}
            clientById={clientById}
            memberById={memberById}
            clientFilterName={selectedClientName}
            onClose={closeDesk}
          />
        )}

        <StatusLegend />
      </main>
    </div>
  )
}
