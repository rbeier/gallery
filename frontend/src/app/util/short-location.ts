/** "Cornwall, UK" -> "Cornwall" */
export function shortLocation(location: string): string {
  return location.split(',')[0].trim()
}
