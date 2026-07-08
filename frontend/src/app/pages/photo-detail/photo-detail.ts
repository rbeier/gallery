import { Component, computed, effect, inject, input } from '@angular/core'
import { Router } from '@angular/router'
import type { AlbumId, PhotoView } from '../../models/gallery.models'
import { GalleryService } from '../../services/gallery.service'
import { SeoService } from '../../services/seo.service'
import { formatMonth } from '../../util/gallery.util'

const asString = (v?: string): string => v ?? ''

@Component({
  selector: 'app-photo-detail',
  host: {
    class: 'block',
    '(window:keydown)': 'onKey($event)',
  },
  templateUrl: './photo-detail.html',
  styleUrl: './photo-detail.css',
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
