import { STATUS_COLOR, STATUS_LABEL, STATUS_ORDER, OVERDUE_COLOR } from '../lib/status'

export default function StatusLegend() {
  return (
    <div className="hud">
      <div className="hud__block">
        <span className="hud__title">Controles</span>
        <span className="hud__text">WASD ou setas para andar. Clique em uma mesa para ver os itens.</span>
      </div>
      <div className="hud__block">
        <span className="hud__title">Status</span>
        <ul className="legend">
          {STATUS_ORDER.map((status) => (
            <li key={status} className="legend__item">
              <span className="legend__dot" style={{ background: STATUS_COLOR[status] }} aria-hidden="true" />
              {STATUS_LABEL[status]}
            </li>
          ))}
          <li className="legend__item">
            <span className="legend__dot" style={{ background: OVERDUE_COLOR }} aria-hidden="true" />
            Marcador de atraso na mesa
          </li>
        </ul>
      </div>
    </div>
  )
}
