/** Active search state: free text plus the selected facet values per group. */
export interface SearchFilters {
  q: string
  tag: string[]
  camera: string[]
  place: string[]
  year: string[]
}
