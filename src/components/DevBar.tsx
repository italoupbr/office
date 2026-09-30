import { useViewMode } from '../auth/viewModeContext'
import { AGENCY_MODE, clientMode } from '../auth/permissions'
import type { Client } from '../types'

/**
 * Barra de desenvolvimento. No produto o modo vem do login; aqui ela existe
 * só para trocar de papel sem sair da prévia.
 */
export default function DevBar({ clients }: { clients: Client[] }) {
  const { mode, setMode } = useViewMode()

  return (
    <footer className="devbar">
      <span className="devbar__label">Ver como</span>
      <div className="devbar__options">
        <button
          type="button"
          className={`devbar__pill${mode.kind === 'agency' ? ' devbar__pill--on' : ''}`}
          onClick={() => setMode(AGENCY_MODE)}
        >
          Agência
        </button>
        {clients.map((client) => (
          <button
            key={client.id}
            type="button"
            className={`devbar__pill${
              mode.kind === 'client' && mode.clientId === client.id ? ' devbar__pill--on' : ''
            }`}
            onClick={() => setMode(clientMode(client.id))}
          >
            {client.name}
          </button>
        ))}
      </div>
      <span className="devbar__note">
        Simula o login. Em modo cliente as salas internas não são construídas.
      </span>
    </footer>
  )
}
