const INT = new Intl.NumberFormat('pt-BR')
const MONEY = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})
const MONEY_CENTS = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export function int(value: number): string {
  return INT.format(Math.round(value))
}

export function money(value: number): string {
  return MONEY.format(value)
}

export function moneyCents(value: number): string {
  return MONEY_CENTS.format(value)
}

export function decimal(value: number, digits = 1): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

/** Variação percentual entre dois números, já arredondada. */
export function deltaPct(current: number, previous: number): number {
  if (previous === 0) return 0
  return Number((((current - previous) / previous) * 100).toFixed(1))
}

export function signedPct(value: number): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${decimal(value)}%`
}

export function formatDate(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split('-')
  return `${day}/${month}/${year}`
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso)
  const day = String(date.getUTCDate()).padStart(2, '0')
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const hour = String(date.getUTCHours()).padStart(2, '0')
  const minute = String(date.getUTCMinutes()).padStart(2, '0')
  return `${day}/${month} às ${hour}:${minute}`
}

export function pluralize(count: number, one: string, many: string): string {
  return count === 1 ? one : many
}
