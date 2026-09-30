import type { SiteChange, SiteInfo, SiteJob } from '../../types'
import { isoDay } from './calendar'
import { mockClients } from './clients'
import { between, hashSeed, seeded } from './rng'

const DOMAINS: Record<string, string> = {
  'cli-a': 'clientea.com.br',
  'cli-b': 'clienteb.adv.br',
  'cli-c': 'clientec.com.br',
  'cli-d': 'cliented.com.br',
  'cli-e': 'clientee.com.br',
}

export const mockSites: Record<string, SiteInfo> = mockClients.reduce<Record<string, SiteInfo>>(
  (acc, client) => {
    const next = seeded(hashSeed(`site:${client.id}`))
    acc[client.id] = {
      clientId: client.id,
      domain: DOMAINS[client.id],
      status: client.id === 'cli-c' ? 'manutencao' : 'no_ar',
      uptimePct: Number((99.2 + next() * 0.79).toFixed(2)),
      lastDeploy: isoDay(-between(next, 1, 9)),
      performanceScore: between(next, 68, 98),
      pages: between(next, 18, 140),
    }
    return acc
  },
  {},
)

const CHANGES: Record<string, string[]> = {
  'cli-a': ['Novo bloco de depoimentos na home', 'Formulário de contato com WhatsApp', 'Página de implantes reescrita', 'Correção de imagens pesadas no blog'],
  'cli-b': ['Página de holding familiar publicada', 'Ajuste no menu de áreas de atuação', 'Selo de OAB no rodapé', 'Correção de links quebrados'],
  'cli-c': ['Filtro de cor na categoria tapetes', 'Frete calculado na página do produto', 'Banner de campanha trocado', 'Checkout em uma etapa'],
  'cli-d': ['Landing do Vista Norte no ar', 'Galeria de plantas com zoom', 'Simulador de financiamento', 'Mapa de localização atualizado'],
  'cli-e': ['Página de planos com comparativo', 'Lista de unidades por bairro', 'Agendamento de aula experimental', 'Vídeo de tour na home'],
}

export const mockSiteChanges: Record<string, SiteChange[]> = mockClients.reduce<
  Record<string, SiteChange[]>
>((acc, client) => {
  const next = seeded(hashSeed(`changes:${client.id}`))
  acc[client.id] = CHANGES[client.id].map((title, index) => ({
    id: `chg-${client.id.slice(-1)}-${index + 1}`,
    clientId: client.id,
    title,
    publishedAt: isoDay(-(index * 6 + between(next, 1, 5))),
    author: index % 2 === 0 ? 'Rafael Lino' : 'Júlia Petri',
  }))
  return acc
}, {})

/**
 * Fila da Oficina. Começa com jobs de clientes diferentes em etapas
 * diferentes, para o painel já nascer com movimento.
 */
export const mockSiteJobs: SiteJob[] = [
  {
    id: 'job-1',
    clientId: 'cli-a',
    description: 'Trocar o bloco de depoimentos da home por três cases com foto',
    stage: 'trabalhando',
    createdAt: isoDay(0),
    branch: 'feat/home-depoimentos',
    previewUrl: 'https://preview.upsend.test/cli-a/home-depoimentos',
  },
  {
    id: 'job-2',
    clientId: 'cli-c',
    description: 'Adicionar filtro por cor na categoria de luminárias',
    stage: 'previa_pronta',
    createdAt: isoDay(0),
    branch: 'feat/filtro-cor-luminarias',
    previewUrl: 'https://preview.upsend.test/cli-c/filtro-cor',
  },
  {
    id: 'job-3',
    clientId: 'cli-d',
    description: 'Criar seção de plantas baixas na landing do Vista Norte',
    stage: 'aguardando_aprovacao',
    createdAt: isoDay(-1),
    branch: 'feat/plantas-vista-norte',
    previewUrl: 'https://preview.upsend.test/cli-d/plantas',
  },
  {
    id: 'job-4',
    clientId: 'cli-e',
    description: 'Comparativo de planos em tabela responsiva',
    stage: 'na_fila',
    createdAt: isoDay(0),
    branch: 'feat/comparativo-planos',
    previewUrl: 'https://preview.upsend.test/cli-e/comparativo',
  },
  {
    id: 'job-5',
    clientId: 'cli-b',
    description: 'Selo de OAB e aviso de publicidade no rodapé',
    stage: 'publicado',
    createdAt: isoDay(-3),
    branch: 'feat/rodape-oab',
    previewUrl: 'https://preview.upsend.test/cli-b/rodape',
  },
]
