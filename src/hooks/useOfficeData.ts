import { useEffect, useMemo, useState } from 'react'
import { officeData } from '../data/source'
import type { Client, TeamMember, WorkItem } from '../types'

/**
 * Lê tudo pela camada src/data/source.ts. O filtro de cliente vai como
 * consulta, e não como filtro local, para que uma fonte real possa resolvê-lo
 * no servidor sem mudar a interface.
 */
export function useOfficeData(clientId: string | null) {
  const [clients, setClients] = useState<Client[]>([])
  const [team, setTeam] = useState<TeamMember[]>([])
  const [items, setItems] = useState<WorkItem[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true
    Promise.all([officeData.listClients(), officeData.listTeam()]).then(
      ([loadedClients, loadedTeam]) => {
        if (!active) return
        setClients(loadedClients)
        setTeam(loadedTeam)
      },
    )
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true
    officeData.listWorkItems({ clientId }).then((loaded) => {
      if (!active) return
      setItems(loaded)
      setReady(true)
    })
    return () => {
      active = false
    }
  }, [clientId])

  const clientById = useMemo(
    () => new Map(clients.map((client) => [client.id, client])),
    [clients],
  )
  const memberById = useMemo(
    () => new Map(team.map((member) => [member.id, member])),
    [team],
  )
  const itemsByDesk = useMemo(() => {
    const map = new Map<string, WorkItem[]>()
    for (const item of items) {
      const list = map.get(item.deskId)
      if (list) list.push(item)
      else map.set(item.deskId, [item])
    }
    return map
  }, [items])

  return { clients, team, items, clientById, memberById, itemsByDesk, ready }
}
