import { Component, inject } from '@angular/core'
import { RouterLink } from '@angular/router'
import { AlbumStrip } from '../../components/album-strip/album-strip'
import { ContentShell } from '../../components/content-shell/content-shell'
import { PhotoGrid } from '../../components/photo-grid/photo-grid'
import { GalleryService } from '../../services/gallery.service'
import { SeoService } from '../../services/seo.service'

@Component({
  selector: 'app-home',
  imports: [RouterLink, ContentShell, AlbumStrip, PhotoGrid],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  protected readonly gallery = inject(GalleryService)
  protected readonly profile = this.gallery.profile()

  constructor() {
    inject(SeoService).set(
      `${this.gallery.photographer} — Photography`,
      this.profile.bio || `A minimalist photography portfolio. ${this.gallery.stat()}.`,
    )
  }
}
