import type { WorkItem, WorkStatus } from '../types'

export const STATUS_ORDER: WorkStatus[] = [
  'novo',
  'em_producao',
  'em_revisao',
  'aguardando_cliente',
  'concluido',
]

export const STATUS_LABEL: Record<WorkStatus, string> = {
  novo: 'Novo',
  em_producao: 'Em produção',
  em_revisao: 'Em revisão',
  aguardando_cliente: 'Aguardando cliente',
  concluido: 'Concluído',
}

export const STATUS_COLOR: Record<WorkStatus, string> = {
  novo: '#4a7fb5',
  em_producao: '#c2803f',
  em_revisao: '#8a6bb0',
  aguardando_cliente: '#89919f',
  concluido: '#5b9b4d',
}

export const OVERDUE_COLOR = '#d64a41'

function startOfDayUtc(date: Date): number {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
}

export function todayIso(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

/** Converte yyyy-mm-dd em timestamp UTC, evitando o deslocamento de fuso. */
function parseIso(iso: string): number {
  const [year, month, day] = iso.split('-').map(Number)
  return Date.UTC(year, month - 1, day)
}

export function daysFromToday(iso: string): number {
  const dayMs = 86_400_000
  return Math.round((parseIso(iso) - startOfDayUtc(new Date())) / dayMs)
}

export function isOverdue(item: WorkItem): boolean {
  return item.status !== 'concluido' && daysFromToday(item.dueDate) < 0
}

export function formatDueDate(iso: string): string {
  const [year, month, day] = iso.split('-')
  return `${day}/${month}/${year}`
}

/** Texto curto de prazo, usado no painel lateral. */
export function dueLabel(item: WorkItem): string {
  const days = daysFromToday(item.dueDate)
  if (item.status === 'concluido') return 'entregue'
  if (days < -1) return `atrasado há ${Math.abs(days)} dias`
  if (days === -1) return 'atrasado há 1 dia'
  if (days === 0) return 'vence hoje'
  if (days === 1) return 'vence amanhã'
  return `vence em ${days} dias`
}
