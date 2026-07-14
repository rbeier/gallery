import { Component, computed, effect, inject, input } from '@angular/core'
import { Router, RouterLink } from '@angular/router'
import { Brand } from '../../components/brand/brand'
import type { AlbumId } from '../../models/album-id'
import type { PhotoView } from '../../models/photo-view'
import { GalleryService } from '../../services/gallery.service'
import { SeoService } from '../../services/seo.service'
import { formatMonth } from '../../util/format-month'

const asString = (v?: string): string => v ?? ''

/** Minimum horizontal travel (px) to register a swipe as a photo change. */
const SWIPE_MIN_PX = 45

@Component({
  selector: 'app-photo-detail',
  imports: [Brand, RouterLink],
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

  protected readonly metaRows = computed<
    { key: string; value: string; link?: (string | AlbumId)[] }[]
  >(() => {
    const p = this.photo()
    if (!p) return []
    return [
      { key: 'Lens', value: p.lens },
      { key: 'Location', value: p.location },
      { key: 'Date', value: p.date ? formatMonth(p.date) : '' },
      {
        key: 'Album',
        value: this.gallery.albumName(p.album),
        link: p.album ? ['/albums', p.album] : undefined,
      },
    ].filter((row) => row.value)
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

  private touchStartX = 0
  private touchStartY = 0

  protected onTouchStart(event: TouchEvent): void {
    const t = event.changedTouches[0]
    this.touchStartX = t.clientX
    this.touchStartY = t.clientY
  }

  /** Horizontal flick cycles photos; vertical motion is left for scrolling. */
  protected onTouchEnd(event: TouchEvent): void {
    const t = event.changedTouches[0]
    const dx = t.clientX - this.touchStartX
    const dy = t.clientY - this.touchStartY
    if (Math.abs(dx) > SWIPE_MIN_PX && Math.abs(dx) > Math.abs(dy) * 1.5) {
      this.step(dx < 0 ? 1 : -1) // swipe left → next, right → previous
    }
  }

  private split(v: string): string[] {
    return v ? v.split(',').filter(Boolean) : []
  }
}
