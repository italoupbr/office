import type { Client } from '../types'

interface TopBarProps {
  clients: Client[]
  selectedClientId: string | null
  onSelectClient: (clientId: string | null) => void
  zoom: number
  cameraMode: 'follow' | 'overview'
  onZoomIn: () => void
  onZoomOut: () => void
  onToggleOverview: () => void
  totalItems: number
  overdueItems: number
}

export default function TopBar({
  clients,
  selectedClientId,
  onSelectClient,
  zoom,
  cameraMode,
  onZoomIn,
  onZoomOut,
  onToggleOverview,
  totalItems,
  overdueItems,
}: TopBarProps) {
  return (
    <header className="topbar">
      <div className="topbar__brand">
        <span className="topbar__mark" aria-hidden="true" />
        <div>
          <strong>Escritório virtual</strong>
          <span className="topbar__subtitle">Prévia visual da operação</span>
        </div>
      </div>

      <div className="topbar__group">
        <label className="field">
          <span className="field__label">Cliente</span>
          <select
            className="field__control"
            value={selectedClientId ?? 'todos'}
            onChange={(event) => {
              const value = event.target.value
              onSelectClient(value === 'todos' ? null : value)
            }}
          >
            <option value="todos">Todos</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </label>

        <div className="counters">
          <div className="counters__cell">
            <span className="counters__value">{totalItems}</span>
            <span className="counters__label">itens</span>
          </div>
          <div className={`counters__cell${overdueItems > 0 ? ' counters__cell--alert' : ''}`}>
            <span className="counters__value">{overdueItems}</span>
            <span className="counters__label">atrasados</span>
          </div>
        </div>
      </div>

      <div className="topbar__group topbar__group--end">
        <div className="zoom">
          <button type="button" className="btn btn--icon" onClick={onZoomOut} aria-label="Reduzir zoom">
            -
          </button>
          <span className="zoom__value">{Math.round(zoom * 100)}%</span>
          <button type="button" className="btn btn--icon" onClick={onZoomIn} aria-label="Aumentar zoom">
            +
          </button>
        </div>
        <button
          type="button"
          className={`btn${cameraMode === 'overview' ? ' btn--active' : ''}`}
          onClick={onToggleOverview}
        >
          {cameraMode === 'overview' ? 'Seguir personagem' : 'Visão geral'}
        </button>
      </div>
    </header>
  )
}
