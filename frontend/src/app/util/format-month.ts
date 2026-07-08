const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

/** "2024-09" -> "Sep 2024" */
export function formatMonth(ym: string): string {
  const [year, month] = ym.split('-')
  return `${MONTHS_SHORT[Number(month) - 1]} ${year}`
}
