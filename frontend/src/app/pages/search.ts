import { Component, computed, inject, input } from '@angular/core'
import { Router, RouterLink } from '@angular/router'
import { ContentShell } from '../components/content-shell'
import { FacetGroup } from '../components/facet-group'
import { PhotoGrid } from '../components/photo-grid'
import type { FacetKind } from '../models/gallery.models'
import { GalleryService, type SearchFilters } from '../services/gallery.service'
import { SeoService } from '../services/seo.service'

const splitParam = (v: string | undefined): string[] => (v ? v.split(',').filter(Boolean) : [])

// Router input binding passes `undefined` for absent query params, which would
// override the declared default — coerce back to an empty string.
const asString = (v?: string): string => v ?? ''

@Component({
  selector: 'app-search',
  imports: [RouterLink, ContentShell, FacetGroup, PhotoGrid],
  template: `
    <app-content-shell>
      <div class="mb-[clamp(20px,3vw,30px)]">
        <a routerLink="/" class="cursor-pointer font-mono text-[11px] tracking-[.06em] text-muted"
          >← Back</a
        >
        <div class="mt-[14px] flex items-center gap-3 border-b-[1.5px] border-ink pb-3">
          <span class="text-[20px] text-muted" aria-hidden="true">⌕</span>
          <label class="sr-only" for="search-input">Search photographs</label>
          <input
            id="search-input"
            [value]="q()"
            (input)="onQuery($any($event.target).value)"
            placeholder="Search photographs…"
            class="flex-1 border-0 bg-transparent font-serif text-[clamp(20px,3vw,28px)] font-normal text-ink outline-none"
          />
        </div>

        @for (group of gallery.facets(); track group.kind) {
          <app-facet-group
            [group]="group"
            [selected]="selectedFor(group.kind)"
            (toggle)="toggle(group.kind, $event)"
          />
        }

        <div
          class="mt-6 border-t border-line pt-4 font-mono text-[11px] tracking-[.06em] text-muted"
          aria-live="polite"
        >
          {{ resultLabel() }}
        </div>
      </div>

      @if (results().length) {
        <app-photo-grid [photos]="results()" [linkParams]="linkParams()" />
      } @else {
        <div class="py-10 text-center font-serif text-[20px] text-muted">
          No photographs match those filters.
        </div>
      }
    </app-content-shell>
  `,
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
