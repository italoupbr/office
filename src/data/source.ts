import type { ViewMode } from '../auth/permissions'
import { assertClientVisible, assertRoomVisible, visibleBuildings } from '../auth/permissions'
import type {
  AdAccount,
  AdSuggestion,
  Article,
  BuildingDef,
  Client,
  Funnel,
  LeadFromArticle,
  LeadsByPage,
  Meeting,
  MeetingMinute,
  MonthlyMetrics,
  Seller,
  SiteChange,
  SiteInfo,
  SiteJob,
} from '../types'
import * as mock from './mock'

/**
 * CAMADA ÚNICA DE LEITURA.
 *
 * Duas regras valem para tudo aqui:
 *
 * 1. Toda função recebe o ViewMode e passa por src/auth/permissions.ts antes
 *    de devolver qualquer coisa. Cliente pedindo dado de outro cliente, ou
 *    dado de sala interna, recebe erro de permissão, não uma lista filtrada.
 *    A UI nunca é a responsável por esconder.
 *
 * 2. Nada de import de src/data/mock fora deste arquivo. Para ligar no
 *    Supabase, basta escrever outro objeto que implemente OfficeDataSource e
 *    trocar a atribuição de officeData no fim do arquivo.
 */

export interface OfficeDataSource {
  // catálogo
  listClients(mode: ViewMode): Promise<Client[]>
  getClient(mode: ViewMode, clientId: string): Promise<Client | null>
  listBuildings(mode: ViewMode): Promise<BuildingDef[]>

  // sala Resultados
  listMetrics(mode: ViewMode, clientId: string): Promise<MonthlyMetrics[]>
  listLeadsByPage(mode: ViewMode, clientId: string): Promise<LeadsByPage[]>

  // sala Conteúdo
  listArticles(mode: ViewMode, clientId: string): Promise<Article[]>

  // sala Sites
  getSite(mode: ViewMode, clientId: string): Promise<SiteInfo | null>
  listSiteChanges(mode: ViewMode, clientId: string): Promise<SiteChange[]>

  // sala Comercial
  getFunnel(mode: ViewMode, clientId: string): Promise<Funnel | null>
  listSellers(mode: ViewMode, clientId: string): Promise<Seller[]>
  listLeadsFromArticles(mode: ViewMode, clientId: string): Promise<LeadFromArticle[]>

  // sala Mídia Paga
  listAdAccounts(mode: ViewMode, clientId: string): Promise<AdAccount[]>
  listAdSuggestions(mode: ViewMode, clientId: string): Promise<AdSuggestion[]>

  // sala Reuniões
  listMeetings(mode: ViewMode, clientId: string): Promise<Meeting[]>
  listMinutes(mode: ViewMode, clientId: string): Promise<MeetingMinute[]>

  // salas internas da agência
  listSiteJobs(mode: ViewMode): Promise<SiteJob[]>
  listAllArticles(mode: ViewMode): Promise<Article[]>
  listAllAdSuggestions(mode: ViewMode): Promise<AdSuggestion[]>
}

const mockDataSource: OfficeDataSource = {
  async listClients(mode) {
    if (mode.kind === 'agency') return mock.mockClients
    return mock.mockClients.filter((client) => client.id === mode.clientId)
  },

  async getClient(mode, clientId) {
    assertClientVisible(mode, clientId)
    return mock.mockClientById[clientId] ?? null
  },

  async listBuildings(mode) {
    return visibleBuildings(mode)
  },

  async listMetrics(mode, clientId) {
    assertClientVisible(mode, clientId)
    assertRoomVisible(mode, 'resultados')
    return mock.mockMetrics[clientId] ?? []
  },

  async listLeadsByPage(mode, clientId) {
    assertClientVisible(mode, clientId)
    assertRoomVisible(mode, 'resultados')
    return mock.mockLeadsByPage[clientId] ?? []
  },

  async listArticles(mode, clientId) {
    assertClientVisible(mode, clientId)
    assertRoomVisible(mode, 'conteudo')
    return mock.mockArticles[clientId] ?? []
  },

  async getSite(mode, clientId) {
    assertClientVisible(mode, clientId)
    assertRoomVisible(mode, 'sites')
    return mock.mockSites[clientId] ?? null
  },

  async listSiteChanges(mode, clientId) {
    assertClientVisible(mode, clientId)
    assertRoomVisible(mode, 'sites')
    return mock.mockSiteChanges[clientId] ?? []
  },

  async getFunnel(mode, clientId) {
    assertClientVisible(mode, clientId)
    assertRoomVisible(mode, 'comercial')
    return mock.mockFunnels[clientId] ?? null
  },

  async listSellers(mode, clientId) {
    assertClientVisible(mode, clientId)
    assertRoomVisible(mode, 'comercial')
    return mock.mockSellers[clientId] ?? []
  },

  async listLeadsFromArticles(mode, clientId) {
    assertClientVisible(mode, clientId)
    assertRoomVisible(mode, 'comercial')
    return mock.mockLeadsFromArticles[clientId] ?? []
  },

  async listAdAccounts(mode, clientId) {
    assertClientVisible(mode, clientId)
    assertRoomVisible(mode, 'midia_paga')
    return mock.mockAdAccounts.filter((account) => account.clientId === clientId)
  },

  async listAdSuggestions(mode, clientId) {
    assertClientVisible(mode, clientId)
    assertRoomVisible(mode, 'midia_paga')
    return mock.mockAdSuggestions.filter((suggestion) => suggestion.clientId === clientId)
  },

  async listMeetings(mode, clientId) {
    assertClientVisible(mode, clientId)
    assertRoomVisible(mode, 'reunioes')
    return mock.mockMeetings[clientId] ?? []
  },

  async listMinutes(mode, clientId) {
    assertClientVisible(mode, clientId)
    assertRoomVisible(mode, 'reunioes')
    return mock.mockMinutes[clientId] ?? []
  },

  async listSiteJobs(mode) {
    assertRoomVisible(mode, 'sites_oficina')
    return mock.mockSiteJobs
  },

  async listAllArticles(mode) {
    assertRoomVisible(mode, 'diretoria')
    return mock.mockClients.flatMap((client) => mock.mockArticles[client.id] ?? [])
  },

  async listAllAdSuggestions(mode) {
    assertRoomVisible(mode, 'revisao')
    return mock.mockAdSuggestions
  },
}

export const officeData: OfficeDataSource = mockDataSource
