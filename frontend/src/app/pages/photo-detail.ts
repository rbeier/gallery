import { Component, computed, effect, inject, input } from '@angular/core'
import { Router } from '@angular/router'
import type { AlbumId, PhotoView } from '../models/gallery.models'
import { GalleryService } from '../services/gallery.service'
import { SeoService } from '../services/seo.service'
import { formatMonth } from '../util/gallery.util'

const asString = (v?: string): string => v ?? ''

@Component({
  selector: 'app-photo-detail',
  host: {
    class: 'block',
    '(window:keydown)': 'onKey($event)',
  },
  template: `
    @if (photo(); as photo) {
      <div
        class="flex min-h-screen animate-fade flex-col bg-bg text-ink d:h-screen d:flex-row d:overflow-hidden"
      >
        <!-- Image pane -->
        <div
          class="relative flex min-h-[48vh] flex-none items-center justify-center bg-viewer-mat d:min-h-0 d:flex-[1.7] d:p-[52px]"
        >
          <div
            class="w-full max-w-full d:h-[min(82vh,100%)] d:w-auto"
            [style.aspect-ratio]="photo.ratio"
            [style.background]="photo.grad"
            [style.max-height.vh]="56"
            [style.border-radius.px]="3"
          ></div>
          <button
            type="button"
            (click)="step(-1)"
            aria-label="Previous photograph"
            class="absolute left-4 top-1/2 flex h-[46px] w-[46px] -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface text-[18px] text-ink opacity-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            ←
          </button>
          <button
            type="button"
            (click)="step(1)"
            aria-label="Next photograph"
            class="absolute right-4 top-1/2 flex h-[46px] w-[46px] -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface text-[18px] text-ink opacity-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            →
          </button>
        </div>

        <!-- Caption panel -->
        <div
          class="flex flex-none animate-rise flex-col overflow-y-auto px-[22px] pt-[26px] pb-[56px] d:max-w-[460px] d:flex-1 d:p-[52px]"
        >
          <button
            type="button"
            (click)="close()"
            class="mb-[22px] cursor-pointer self-start border-0 bg-transparent p-0 font-mono text-[11px] tracking-[.08em] text-muted"
          >
            ← {{ backLabel() }}
          </button>
          <div class="font-mono text-[11px] tracking-[.12em] text-muted">{{ counter() }}</div>
          <h1 class="mt-[14px] font-serif text-title font-normal">{{ photo.title }}</h1>
          <p class="mt-4 max-w-[26em] text-[15px] leading-[1.65] text-ink/80">
            {{ photo.description }}
          </p>

          <dl class="mt-7 flex flex-col gap-[15px] border-t border-line pt-[22px]">
            @for (row of metaRows(); track row.key) {
              <div class="flex gap-4">
                <dt
                  class="w-[88px] flex-none pt-[2px] font-mono text-[10px] uppercase tracking-[.1em] text-muted"
                >
                  {{ row.key }}
                </dt>
                <dd class="m-0 text-[14px] leading-[1.4] text-ink">{{ row.value }}</dd>
              </div>
            }
          </dl>

          <div class="mt-[22px] flex flex-wrap gap-[7px]">
            @for (tag of photo.tags; track tag) {
              <span class="rounded-pill bg-chip px-[10px] py-[5px] font-mono text-[11px] text-muted"
                >#{{ tag }}</span
              >
            }
          </div>
        </div>
      </div>
    } @else {
      <div class="flex min-h-screen items-center justify-center bg-bg text-muted">
        <p class="font-serif text-[20px]">Photograph not found.</p>
      </div>
    }
  `,
})
export class PhotoDetail {
  readonly id = input.required<string>()
  readonly from = input('all', { transform: (v?: string) => v ?? 'all' })
  readonly q = input('', { transform: asString })
  readonly tag = input('', { transform: asString })
  readonly camera = input('', { transform: asString })
  readonly place = input('', { transform: asString })
  readonly year = input('', { transform: asString })

  private readonly gallery = inject(GalleryService)
  private readonly router = inject(Router)
  private readonly seo = inject(SeoService)

  /** The ordered list the photo was opened from — prev/next cycle this. */
  protected readonly list = computed<PhotoView[]>(() => {
    const from = this.from()
    if (from.startsWith('album:')) {
      return this.gallery.photosOf(from.slice(6) as AlbumId)
    }
    if (from === 'search') {
      return this.gallery.search({
        q: this.q(),
        tag: this.split(this.tag()),
        camera: this.split(this.camera()),
        place: this.split(this.place()),
        year: this.split(this.year()),
      })
    }
    return this.gallery.allPhotos()
  })

  protected readonly index = computed(() =>
    this.list().findIndex((p) => p.id === Number(this.id())),
  )
  protected readonly photo = computed(() => this.list()[this.index()])
  protected readonly counter = computed(() => `${this.index() + 1} / ${this.list().length}`)

  protected readonly backLabel = computed(() => {
    const from = this.from()
    if (from.startsWith('album:')) return this.gallery.albumName(from.slice(6) as AlbumId)
    if (from === 'search') return 'Search'
    return 'All photographs'
  })

  protected readonly metaRows = computed(() => {
    const p = this.photo()
    if (!p) return []
    return [
      { key: 'Camera', value: p.lens ? `${p.camera} · ${p.lens}` : p.camera },
      { key: 'Location', value: p.location },
      { key: 'Date', value: formatMonth(p.date) },
      { key: 'Portfolio', value: this.gallery.albumName(p.album) },
    ]
  })

  constructor() {
    effect(() => {
      const p = this.photo()
      if (p) this.seo.set(`${p.title} — ${this.gallery.photographer}`, p.description, 'article')
    })
  }

  protected step(direction: number): void {
    const list = this.list()
    if (!list.length) return
    const next = (this.index() + direction + list.length) % list.length
    this.router.navigate(['/photo', list[next].id], { queryParamsHandling: 'preserve' })
  }

  protected close(): void {
    const from = this.from()
    if (from.startsWith('album:')) {
      this.router.navigate(['/albums', from.slice(6)])
    } else if (from === 'search') {
      this.router.navigate(['/search'], {
        queryParams: {
          q: this.q() || null,
          tag: this.tag() || null,
          camera: this.camera() || null,
          place: this.place() || null,
          year: this.year() || null,
        },
      })
    } else {
      this.router.navigate(['/'])
    }
  }

  protected onKey(event: KeyboardEvent): void {
    if (event.key === 'ArrowRight') this.step(1)
    else if (event.key === 'ArrowLeft') this.step(-1)
    else if (event.key === 'Escape') this.close()
  }

  private split(v: string): string[] {
    return v ? v.split(',').filter(Boolean) : []
  }
}
