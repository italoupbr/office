/**
 * Dados 100% fictícios da prévia visual.
 * Nada aqui vem de cliente real. Este é o único arquivo que precisa sair de
 * cena quando a operação passar a ler de uma fonte real de dados.
 */
import type { Client, RoomId, TeamMember, WorkItem, WorkStatus } from '../types'

export const mockClients: Client[] = [
  { id: 'cli-a', name: 'Cliente A', segment: 'Clínica odontológica' },
  { id: 'cli-b', name: 'Cliente B', segment: 'Escritório de advocacia' },
  { id: 'cli-c', name: 'Cliente C', segment: 'E-commerce de decoração' },
  { id: 'cli-d', name: 'Cliente D', segment: 'Construtora' },
  { id: 'cli-e', name: 'Cliente E', segment: 'Rede de academias' },
]

export const mockTeam: TeamMember[] = [
  { id: 'tm-sofia', name: 'Sofia Queiroz', role: 'Coordenação de projetos' },
  { id: 'tm-ana', name: 'Ana Bezerra', role: 'Redação sênior' },
  { id: 'tm-caio', name: 'Caio Fontes', role: 'Redação' },
  { id: 'tm-marina', name: 'Marina Duarte', role: 'Edição de conteúdo' },
  { id: 'tm-rafael', name: 'Rafael Lino', role: 'Desenvolvimento front-end' },
  { id: 'tm-julia', name: 'Júlia Petri', role: 'Design de interface' },
  { id: 'tm-diego', name: 'Diego Sales', role: 'SEO local' },
  { id: 'tm-bruna', name: 'Bruna Tavares', role: 'SEO local' },
  { id: 'tm-igor', name: 'Igor Cavalli', role: 'Gestão de tráfego' },
  { id: 'tm-leticia', name: 'Letícia Amaral', role: 'Revisão' },
  { id: 'tm-henrique', name: 'Henrique Vaz', role: 'Direção de operações' },
]

/**
 * Prazos ficam relativos ao dia de hoje (dueInDays) para que a prévia sempre
 * mostre itens atrasados, no prazo e concluídos, independente da data de uso.
 */
interface MockItemSeed {
  id: string
  title: string
  clientId: string
  status: WorkStatus
  ownerId: string
  dueInDays: number
  deskId: string
  roomId: RoomId
}

const seeds: MockItemSeed[] = [
  // Recepção: entrada de tarefas
  { id: 'it-01', title: 'Briefing da landing page de implantes', clientId: 'cli-a', status: 'novo', ownerId: 'tm-sofia', dueInDays: 3, deskId: 'rec-1', roomId: 'recepcao' },
  { id: 'it-02', title: 'Pedido de 4 pautas para o blog de decoração', clientId: 'cli-c', status: 'novo', ownerId: 'tm-sofia', dueInDays: 5, deskId: 'rec-1', roomId: 'recepcao' },
  { id: 'it-03', title: 'Briefing da página do empreendimento', clientId: 'cli-d', status: 'novo', ownerId: 'tm-sofia', dueInDays: -1, deskId: 'rec-2', roomId: 'recepcao' },
  { id: 'it-04', title: 'Solicitação de auditoria do perfil no Google', clientId: 'cli-e', status: 'novo', ownerId: 'tm-sofia', dueInDays: 8, deskId: 'rec-2', roomId: 'recepcao' },

  // Conteúdo
  { id: 'it-05', title: 'Artigo: quanto custa um implante dentário', clientId: 'cli-a', status: 'em_producao', ownerId: 'tm-ana', dueInDays: 2, deskId: 'con-1', roomId: 'conteudo' },
  { id: 'it-06', title: 'Artigo: prazo do inventário extrajudicial', clientId: 'cli-b', status: 'em_producao', ownerId: 'tm-ana', dueInDays: -2, deskId: 'con-1', roomId: 'conteudo' },
  { id: 'it-07', title: 'Guia de cores para sala de estar', clientId: 'cli-c', status: 'em_producao', ownerId: 'tm-caio', dueInDays: 4, deskId: 'con-2', roomId: 'conteudo' },
  { id: 'it-08', title: 'Artigo: treino para iniciantes em musculação', clientId: 'cli-e', status: 'novo', ownerId: 'tm-caio', dueInDays: 6, deskId: 'con-2', roomId: 'conteudo' },
  { id: 'it-09', title: 'Artigo: documentos para financiar imóvel na planta', clientId: 'cli-d', status: 'em_revisao', ownerId: 'tm-marina', dueInDays: 1, deskId: 'con-3', roomId: 'conteudo' },
  { id: 'it-10', title: 'Artigo: clareamento dental a laser', clientId: 'cli-a', status: 'concluido', ownerId: 'tm-marina', dueInDays: -6, deskId: 'con-3', roomId: 'conteudo' },
  { id: 'it-11', title: 'Artigo sobre holding familiar', clientId: 'cli-b', status: 'aguardando_cliente', ownerId: 'tm-ana', dueInDays: 7, deskId: 'con-4', roomId: 'conteudo' },

  // Sites
  { id: 'it-12', title: 'Página de categoria: tapetes', clientId: 'cli-c', status: 'em_producao', ownerId: 'tm-rafael', dueInDays: 5, deskId: 'sit-1', roomId: 'sites' },
  { id: 'it-13', title: 'Landing page do empreendimento Vista Norte', clientId: 'cli-d', status: 'em_producao', ownerId: 'tm-rafael', dueInDays: -3, deskId: 'sit-1', roomId: 'sites' },
  { id: 'it-14', title: 'Redesenho da home da clínica', clientId: 'cli-a', status: 'em_revisao', ownerId: 'tm-julia', dueInDays: 2, deskId: 'sit-2', roomId: 'sites' },
  { id: 'it-15', title: 'Correção de Core Web Vitals', clientId: 'cli-b', status: 'concluido', ownerId: 'tm-rafael', dueInDays: -8, deskId: 'sit-3', roomId: 'sites' },
  { id: 'it-16', title: 'Aprovação do protótipo do checkout', clientId: 'cli-c', status: 'aguardando_cliente', ownerId: 'tm-julia', dueInDays: 4, deskId: 'sit-4', roomId: 'sites' },

  // SEO Local
  { id: 'it-17', title: 'Core 30 de categorias da clínica', clientId: 'cli-a', status: 'em_producao', ownerId: 'tm-diego', dueInDays: 3, deskId: 'seo-1', roomId: 'seo_local' },
  { id: 'it-18', title: 'Otimização das 12 unidades da rede', clientId: 'cli-e', status: 'em_producao', ownerId: 'tm-diego', dueInDays: -1, deskId: 'seo-1', roomId: 'seo_local' },
  { id: 'it-19', title: 'Auditoria de citações locais', clientId: 'cli-b', status: 'em_revisao', ownerId: 'tm-bruna', dueInDays: 2, deskId: 'seo-3', roomId: 'seo_local' },
  { id: 'it-20', title: 'Padronização de NAP em 18 diretórios', clientId: 'cli-a', status: 'concluido', ownerId: 'tm-diego', dueInDays: -10, deskId: 'seo-3', roomId: 'seo_local' },
  { id: 'it-21', title: 'Validação das fotos do perfil', clientId: 'cli-c', status: 'aguardando_cliente', ownerId: 'tm-bruna', dueInDays: 5, deskId: 'seo-4', roomId: 'seo_local' },

  // Mídia Paga
  { id: 'it-22', title: 'Campanha de captação do plano anual', clientId: 'cli-e', status: 'em_producao', ownerId: 'tm-igor', dueInDays: 2, deskId: 'mid-1', roomId: 'midia_paga' },
  { id: 'it-23', title: 'Reestruturação dos grupos de anúncios', clientId: 'cli-a', status: 'em_producao', ownerId: 'tm-igor', dueInDays: -4, deskId: 'mid-1', roomId: 'midia_paga' },
  { id: 'it-24', title: 'Criativos de remarketing de carrinho', clientId: 'cli-c', status: 'em_revisao', ownerId: 'tm-igor', dueInDays: 1, deskId: 'mid-3', roomId: 'midia_paga' },
  { id: 'it-25', title: 'Ajuste de lances por localização', clientId: 'cli-b', status: 'concluido', ownerId: 'tm-igor', dueInDays: -5, deskId: 'mid-4', roomId: 'midia_paga' },

  // Revisão
  { id: 'it-26', title: 'Revisão final do artigo de implantes', clientId: 'cli-a', status: 'em_revisao', ownerId: 'tm-leticia', dueInDays: -2, deskId: 'rev-1', roomId: 'revisao' },
  { id: 'it-27', title: 'Revisão do guia de cores', clientId: 'cli-c', status: 'em_revisao', ownerId: 'tm-leticia', dueInDays: 1, deskId: 'rev-1', roomId: 'revisao' },
  { id: 'it-28', title: 'Revisão dos textos da página de planos', clientId: 'cli-e', status: 'concluido', ownerId: 'tm-leticia', dueInDays: -3, deskId: 'rev-3', roomId: 'revisao' },

  // Sala de Reunião
  { id: 'it-29', title: 'Alinhamento trimestral de metas', clientId: 'cli-b', status: 'novo', ownerId: 'tm-henrique', dueInDays: 2, deskId: 'reu-1', roomId: 'reuniao' },
  { id: 'it-30', title: 'Apresentação do plano de lançamento', clientId: 'cli-d', status: 'aguardando_cliente', ownerId: 'tm-henrique', dueInDays: -1, deskId: 'reu-1', roomId: 'reuniao' },

  // Diretoria
  { id: 'it-31', title: 'Proposta de expansão do contrato', clientId: 'cli-a', status: 'em_revisao', ownerId: 'tm-henrique', dueInDays: 5, deskId: 'dir-1', roomId: 'diretoria' },
  { id: 'it-32', title: 'Revisão de margem por cliente', clientId: 'cli-c', status: 'em_producao', ownerId: 'tm-henrique', dueInDays: -2, deskId: 'dir-1', roomId: 'diretoria' },
  { id: 'it-33', title: 'Fechamento do relatório mensal', clientId: 'cli-b', status: 'concluido', ownerId: 'tm-henrique', dueInDays: -7, deskId: 'dir-2', roomId: 'diretoria' },
]

function isoFromOffset(days: number): string {
  const base = new Date()
  const target = new Date(Date.UTC(base.getFullYear(), base.getMonth(), base.getDate() + days))
  return target.toISOString().slice(0, 10)
}

export const mockWorkItems: WorkItem[] = seeds.map(({ dueInDays, ...rest }) => ({
  ...rest,
  dueDate: isoFromOffset(dueInDays),
}))
