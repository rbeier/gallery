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

/** "2024-09-14" -> "14 Sep 2024"; "2024-09" -> "Sep 2024" */
export function formatMonth(date: string): string {
  const [year, month, day] = date.split('-')
  const label = `${MONTHS_SHORT[Number(month) - 1]} ${year}`
  return day ? `${Number(day)} ${label}` : label
}
