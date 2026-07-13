import { Component, computed, inject, input, PLATFORM_ID, signal } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'
import type { Params } from '@angular/router'
import type { PhotoView } from '../../models/photo-view'
import { PhotoTile } from '../photo-tile/photo-tile'

// Prototype breakpoints (see styles.css): d = desktop (>=880), w = wide (>=1300).
const BREAKPOINT_D = 880
const BREAKPOINT_W = 1300

function columnsForWidth(width: number): number {
  if (width >= BREAKPOINT_W) return 4
  if (width >= BREAKPOINT_D) return 3
  return 2
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

  // Column count drives left-to-right fill: item i lands in column i % count, so
  // the newest photo is top-left and the next one sits to its right. Defaults to
  // the desktop count on the server, then corrects on the first browser paint.
  private readonly columnCount = signal(
    this.isBrowser ? columnsForWidth(window.innerWidth) : 3,
  )

  // Round-robin distribution into columns, preserving newest-first order L-to-R.
  readonly columns = computed<PhotoView[][]>(() => {
    const count = this.columnCount()
    const buckets: PhotoView[][] = Array.from({ length: count }, () => [])
    this.photos().forEach((photo, i) => buckets[i % count].push(photo))
    return buckets
  })

  protected onResize(): void {
    this.columnCount.set(columnsForWidth(window.innerWidth))
  }
}
