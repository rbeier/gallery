import { Component, computed, effect, inject, input } from '@angular/core'
import { RouterLink } from '@angular/router'
import { ContentShell } from '../../components/content-shell/content-shell'
import { PhotoGrid } from '../../components/photo-grid/photo-grid'
import type { AlbumId } from '../../models/album-id'
import { GalleryService } from '../../services/gallery.service'
import { SeoService } from '../../services/seo.service'

@Component({
  selector: 'app-album-detail',
  imports: [RouterLink, ContentShell, PhotoGrid],
  templateUrl: './album-detail.html',
  styleUrl: './album-detail.css',
})
export class AlbumDetail {
  readonly albumId = input.required<string>()

  protected readonly gallery = inject(GalleryService)
  private readonly seo = inject(SeoService)

  protected readonly album = computed(() => this.gallery.albumById(this.albumId() as AlbumId))
  protected readonly photos = computed(() => this.gallery.photosOf(this.albumId() as AlbumId))

  constructor() {
    effect(() => {
      const album = this.album()
      if (album) {
        this.seo.set({
          title: `${album.name} — ${this.gallery.photographer}`,
          description: album.description,
          image: album.cover,
          imageAlt: album.name,
        })
      }
    })
  }
}
