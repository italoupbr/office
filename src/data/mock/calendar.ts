/** Datas do mock são relativas a hoje, para a prévia nunca ficar velha. */
export function isoDay(offsetDays: number): string {
  const now = new Date()
  const target = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + offsetDays),
  )
  return target.toISOString().slice(0, 10)
}

export function isoDateTime(offsetDays: number, hour: number, minute = 0): string {
  const now = new Date()
  const target = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + offsetDays, hour, minute),
  )
  return target.toISOString()
}

const MONTH_LABELS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

/** Últimos `count` meses terminando no mês corrente, do mais antigo ao atual. */
export function lastMonths(count: number): { month: string; label: string }[] {
  const now = new Date()
  const out: { month: string; label: string }[] = []
  for (let i = count - 1; i >= 0; i -= 1) {
    const date = new Date(Date.UTC(now.getFullYear(), now.getMonth() - i, 1))
    const month = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
    out.push({ month, label: MONTH_LABELS[date.getUTCMonth()] })
  }
  return out
}

export function currentMonth(): string {
  return lastMonths(1)[0].month
}
