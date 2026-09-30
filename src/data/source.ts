/**
 * Camada de acesso a dados.
 *
 * A interface e o ponto de troca ficam aqui. Hoje existe apenas a
 * implementação que lê de src/data/mock.ts. Para ligar no Supabase depois,
 * basta criar um objeto que implemente OfficeDataSource (consultando as
 * tabelas reais) e trocar a atribuição de officeData no fim do arquivo.
 * Nenhum componente React e nenhuma cena Phaser importa o mock diretamente.
 */
import type { Client, TeamMember, WorkItem } from '../types'
import { mockClients, mockTeam, mockWorkItems } from './mock'

export interface WorkItemQuery {
  /** null ou ausente significa todos os clientes */
  clientId?: string | null
}

export interface OfficeDataSource {
  listClients(): Promise<Client[]>
  listTeam(): Promise<TeamMember[]>
  listWorkItems(query?: WorkItemQuery): Promise<WorkItem[]>
}

const mockDataSource: OfficeDataSource = {
  async listClients() {
    return mockClients
  },

  async listTeam() {
    return mockTeam
  },

  async listWorkItems(query) {
    const clientId = query?.clientId
    if (!clientId) return mockWorkItems
    return mockWorkItems.filter((item) => item.clientId === clientId)
  },
}

export const officeData: OfficeDataSource = mockDataSource
