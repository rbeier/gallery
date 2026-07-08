import { Component, inject } from '@angular/core'
import { AlbumGrid } from '../../components/album-grid/album-grid'
import { ContentShell } from '../../components/content-shell/content-shell'
import { GalleryService } from '../../services/gallery.service'
import { SeoService } from '../../services/seo.service'

@Component({
  selector: 'app-albums',
  imports: [ContentShell, AlbumGrid],
  templateUrl: './albums.html',
  styleUrl: './albums.css',
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
