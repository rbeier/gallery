import { Component, inject } from '@angular/core'
import { AlbumGrid } from '../components/album-grid'
import { ContentShell } from '../components/content-shell'
import { GalleryService } from '../services/gallery.service'
import { SeoService } from '../services/seo.service'

@Component({
  selector: 'app-albums',
  imports: [ContentShell, AlbumGrid],
  template: `
    <app-content-shell>
      <div class="mb-[clamp(22px,3vw,34px)]">
        <div class="font-mono text-[11px] uppercase tracking-[.16em] text-muted">
          {{ gallery.photographer }}
        </div>
        <h1 class="mt-2 font-serif text-[clamp(28px,5vw,46px)] font-normal tracking-[-.01em]">
          Portfolios
        </h1>
      </div>
      <app-album-grid [albums]="gallery.albums()" />
    </app-content-shell>
  `,
})
export class Albums {
  protected readonly gallery = inject(GalleryService)

  constructor() {
    inject(SeoService).set(
      `Portfolios — ${this.gallery.photographer}`,
      'Browse photography portfolios: coastlines, cities, still life, and mountains.',
    )
  }
}
