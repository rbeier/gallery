import { isPlatformBrowser } from '@angular/common'
import { Component, computed, inject, input, PLATFORM_ID, REQUEST, signal } from '@angular/core'
import type { Params } from '@angular/router'
import type { PhotoView } from '../../models/photo-view'
import { PhotoTile } from '../photo-tile/photo-tile'

// Prototype breakpoints (see styles.css): d = desktop (>=880), w = wide (>=1300).
const BREAKPOINT_D = 880
const BREAKPOINT_W = 1300

// Tiles rendered eagerly (real image in SSR, fetchpriority=high) to cover the
// above-the-fold row for the LCP. Sized for the widest layout (4 columns).
const PRIORITY_COUNT = 4

function columnsForWidth(width: number): number {
  if (width >= BREAKPOINT_W) return 4
  if (width >= BREAKPOINT_D) return 3
  return 2
}

/**
 * Server can't measure the viewport, so it guesses column count from the
 * User-Agent. Phones map to the 2-column mobile layout — matching what the
 * client resolves on first paint — which prevents a 3->2 re-bucket (and the
 * resulting layout shift) during hydration. Non-phones keep the desktop default.
 */
function columnsForUserAgent(userAgent: string | null): number {
  if (userAgent && /Mobi|Android|iPhone|iPod/i.test(userAgent)) return 2
  return 3
}

@Component({
  selector: 'app-photo-grid',
  imports: [PhotoTile],
  templateUrl: './photo-grid.html',
  styleUrl: './photo-grid.css',
  host: {
    '(window:resize)': 'onResize()',
  },
})
export class PhotoGrid {
  readonly photos = input.required<PhotoView[]>()
  readonly linkParams = input<Params>({})

  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID))
  private readonly request = inject(REQUEST, { optional: true })

  // Column count drives left-to-right fill: item i lands in column i % count, so
  // the newest photo is top-left and the next one sits to its right. Resolved from
  // the real width in the browser, and guessed from the User-Agent on the server
  // so the SSR markup already matches what the client paints (no hydration shift).
  private readonly columnCount = signal(
    this.isBrowser
      ? columnsForWidth(window.innerWidth)
      : columnsForUserAgent(this.request?.headers.get('user-agent') ?? null),
  )

  // Ids of the above-the-fold tiles that should load eagerly for the LCP.
  readonly prioritySet = computed(
    () =>
      new Set(
        this.photos()
          .slice(0, PRIORITY_COUNT)
          .map((p) => p.id),
      ),
  )

  // Round-robin distribution into columns, preserving newest-first order L-to-R.
  readonly columns = computed<PhotoView[][]>(() => {
    const count = this.columnCount()
    const buckets: PhotoView[][] = Array.from({ length: count }, () => [])
    this.photos().forEach((photo, i) => {
      buckets[i % count].push(photo)
    })
    return buckets
  })

  protected onResize(): void {
    this.columnCount.set(columnsForWidth(window.innerWidth))
  }
}
