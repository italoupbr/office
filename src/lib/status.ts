import type { ArticleStatus, JobStage } from '../types'

export const ARTICLE_STATUS_ORDER: ArticleStatus[] = [
  'em_producao',
  'aguardando_aprovacao',
  'publicado',
]

export const ARTICLE_STATUS_LABEL: Record<ArticleStatus, string> = {
  em_producao: 'Em produção',
  aguardando_aprovacao: 'Aguardando sua aprovação',
  publicado: 'Publicado',
}

export const ARTICLE_STATUS_SHORT: Record<ArticleStatus, string> = {
  em_producao: 'em produção',
  aguardando_aprovacao: 'aguardando aprovação',
  publicado: 'publicado',
}

export const ARTICLE_STATUS_COLOR: Record<ArticleStatus, string> = {
  em_producao: '#E08A3C',
  aguardando_aprovacao: '#328FF8',
  publicado: '#5EA84E',
}

export const JOB_STAGE_ORDER: JobStage[] = [
  'na_fila',
  'trabalhando',
  'previa_pronta',
  'aguardando_aprovacao',
  'publicado',
]

export const JOB_STAGE_LABEL: Record<JobStage, string> = {
  na_fila: 'Na fila',
  trabalhando: 'Trabalhando no branch',
  previa_pronta: 'Prévia pronta',
  aguardando_aprovacao: 'Aguardando sua aprovação',
  publicado: 'Publicado',
}

export type Health = 'ok' | 'attention' | 'late'

export const HEALTH_COLOR: Record<Health, string> = {
  ok: '#4EC06A',
  attention: '#E2B13C',
  late: '#D64A41',
}

function startOfDayUtc(date: Date): number {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
}

export function daysFromToday(iso: string): number {
  const [year, month, day] = iso.slice(0, 10).split('-').map(Number)
  return Math.round((Date.UTC(year, month - 1, day) - startOfDayUtc(new Date())) / 86_400_000)
}

export function daysWaiting(iso: string): number {
  return Math.max(0, -daysFromToday(iso))
}

export function isLate(due: string): boolean {
  return daysFromToday(due) < 0
}
