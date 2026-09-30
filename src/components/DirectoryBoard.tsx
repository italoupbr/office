import type { WorkItem } from '../types'
import { STATUS_COLOR, STATUS_LABEL, STATUS_ORDER, isOverdue } from '../lib/status'

interface DirectoryBoardProps {
  items: WorkItem[]
  scopeLabel: string
}

/**
 * Painel resumo da Diretoria. Aparece quando o personagem entra na sala e
 * respeita o filtro de cliente ativo na barra superior.
 */
export default function DirectoryBoard({ items, scopeLabel }: DirectoryBoardProps) {
  const overdue = items.filter(isOverdue).length
  const counts = STATUS_ORDER.map((status) => ({
    status,
    total: items.filter((item) => item.status === status).length,
  }))
  const peak = Math.max(1, ...counts.map((entry) => entry.total))

  return (
    <aside className="panel panel--board">
      <header className="panel__head panel__head--tight">
        <div>
          <span className="panel__eyebrow panel__eyebrow--gold">Diretoria</span>
          <h2 className="panel__title">Resumo da operação</h2>
          <p className="panel__meta">{scopeLabel}</p>
        </div>
      </header>

      <div className="board">
        {counts.map(({ status, total }) => (
          <div key={status} className="board__row">
            <span className="board__label">{STATUS_LABEL[status]}</span>
            <span className="board__track">
              <span
                className="board__fill"
                style={{
                  width: `${(total / peak) * 100}%`,
                  background: STATUS_COLOR[status],
                }}
              />
            </span>
            <span className="board__value">{total}</span>
          </div>
        ))}
      </div>

      <footer className="board__footer">
        <div className="board__stat">
          <span className="board__stat-value">{items.length}</span>
          <span className="board__stat-label">total de itens</span>
        </div>
        <div className={`board__stat${overdue > 0 ? ' board__stat--alert' : ''}`}>
          <span className="board__stat-value">{overdue}</span>
          <span className="board__stat-label">atrasados</span>
        </div>
      </footer>
    </aside>
  )
}
