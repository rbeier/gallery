import { Component, computed, inject, input } from '@angular/core'
import { Router, RouterLink } from '@angular/router'
import { ContentShell } from '../../components/content-shell/content-shell'
import { FacetGroup } from '../../components/facet-group/facet-group'
import { PhotoGrid } from '../../components/photo-grid/photo-grid'
import type { FacetKind } from '../../models/facet-kind'
import type { SearchFilters } from '../../models/search-filters'
import { GalleryService } from '../../services/gallery.service'
import { SeoService } from '../../services/seo.service'

const splitParam = (v: string | undefined): string[] => (v ? v.split(',').filter(Boolean) : [])

// Router input binding passes `undefined` for absent query params, which would
// override the declared default — coerce back to an empty string.
const asString = (v?: string): string => v ?? ''

@Component({
  selector: 'app-search',
  imports: [RouterLink, ContentShell, FacetGroup, PhotoGrid],
  templateUrl: './search.html',
  styleUrl: './search.css',
})
export class Search {
  // Query-param inputs (require withComponentInputBinding).
  readonly q = input('', { transform: asString })
  readonly tag = input('', { transform: asString })
  readonly camera = input('', { transform: asString })
  readonly place = input('', { transform: asString })
  readonly year = input('', { transform: asString })

  protected readonly gallery = inject(GalleryService)
  private readonly router = inject(Router)

  private readonly filters = computed<SearchFilters>(() => ({
    q: this.q(),
    tag: splitParam(this.tag()),
    camera: splitParam(this.camera()),
    place: splitParam(this.place()),
    year: splitParam(this.year()),
  }))

  protected readonly results = computed(() => this.gallery.search(this.filters()))
  protected readonly resultLabel = computed(() => {
    const n = this.results().length
    return `${n} ${n === 1 ? 'result' : 'results'}`
  })

  protected readonly linkParams = computed(() => ({
    from: 'search',
    q: this.q() || null,
    tag: this.tag() || null,
    camera: this.camera() || null,
    place: this.place() || null,
    year: this.year() || null,
  }))

  constructor() {
    inject(SeoService).set(
      `Search — ${this.gallery.photographer}`,
      'Search and filter the photograph library by text, tag, camera, place, and year.',
    )
  }

  protected selectedFor(kind: FacetKind): string[] {
    return splitParam(this[kind]())
  }

  protected onQuery(value: string): void {
    this.router.navigate([], {
      queryParams: { q: value || null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    })
  }

  protected toggle(kind: FacetKind, value: string): void {
    const current = this.selectedFor(kind)
    const next = current.includes(value) ? current.filter((x) => x !== value) : [...current, value]
    this.router.navigate([], {
      queryParams: { [kind]: next.length ? next.join(',') : null },
      queryParamsHandling: 'merge',
    })
  }
}
