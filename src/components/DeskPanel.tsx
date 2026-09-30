import type { Client, TeamMember, WorkItem } from '../types'
import type { DeskDef, RoomDef } from '../game/layout'
import { STATUS_COLOR, STATUS_LABEL, dueLabel, formatDueDate, isOverdue } from '../lib/status'

interface DeskPanelProps {
  desk: DeskDef
  room: RoomDef
  items: WorkItem[]
  clientById: Map<string, Client>
  memberById: Map<string, TeamMember>
  clientFilterName: string | null
  onClose: () => void
}

export default function DeskPanel({
  desk,
  room,
  items,
  clientById,
  memberById,
  clientFilterName,
  onClose,
}: DeskPanelProps) {
  const overdue = items.filter(isOverdue).length

  return (
    <aside className="panel panel--desk">
      <header className="panel__head">
        <div>
          <span className="panel__eyebrow" style={{ color: room.accent }}>
            {room.name}
          </span>
          <h2 className="panel__title">{desk.label}</h2>
          <p className="panel__meta">
            {items.length} {items.length === 1 ? 'item' : 'itens'}
            {overdue > 0 ? ` / ${overdue} atrasado${overdue === 1 ? '' : 's'}` : ''}
            {clientFilterName ? ` / filtro: ${clientFilterName}` : ''}
          </p>
        </div>
        <button type="button" className="btn btn--ghost" onClick={onClose} aria-label="Fechar painel">
          Fechar
        </button>
      </header>

      <div className="panel__body">
        {items.length === 0 ? (
          <p className="panel__empty">
            Nenhum item nesta mesa com o filtro atual.
          </p>
        ) : (
          <ul className="itemlist">
            {items.map((item) => {
              const late = isOverdue(item)
              return (
                <li key={item.id} className={`itemcard${late ? ' itemcard--late' : ''}`}>
                  <h3 className="itemcard__title">{item.title}</h3>
                  <dl className="itemcard__grid">
                    <dt>Cliente</dt>
                    <dd>{clientById.get(item.clientId)?.name ?? item.clientId}</dd>

                    <dt>Status</dt>
                    <dd>
                      <span className="chip">
                        <span
                          className="chip__dot"
                          style={{ background: STATUS_COLOR[item.status] }}
                          aria-hidden="true"
                        />
                        {STATUS_LABEL[item.status]}
                      </span>
                    </dd>

                    <dt>Responsável</dt>
                    <dd>
                      {memberById.get(item.ownerId)?.name ?? item.ownerId}
                      <span className="itemcard__role">
                        {memberById.get(item.ownerId)?.role ?? ''}
                      </span>
                    </dd>

                    <dt>Prazo</dt>
                    <dd>
                      {formatDueDate(item.dueDate)}
                      <span className={`itemcard__due${late ? ' itemcard__due--late' : ''}`}>
                        {dueLabel(item)}
                      </span>
                    </dd>
                  </dl>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </aside>
  )
}
