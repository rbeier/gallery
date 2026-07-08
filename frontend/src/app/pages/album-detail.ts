import { Component, computed, effect, inject, input } from '@angular/core'
import { RouterLink } from '@angular/router'
import { ContentShell } from '../components/content-shell'
import { PhotoGrid } from '../components/photo-grid'
import type { AlbumId } from '../models/gallery.models'
import { GalleryService } from '../services/gallery.service'
import { SeoService } from '../services/seo.service'

@Component({
  selector: 'app-album-detail',
  imports: [RouterLink, ContentShell, PhotoGrid],
  template: `
    <app-content-shell>
      @if (album(); as album) {
        <div class="mb-[clamp(18px,3vw,28px)]">
          <a
            routerLink="/albums"
            class="cursor-pointer font-mono text-[11px] tracking-[.06em] text-muted"
            >← Portfolios</a
          >
          <h1 class="mt-3 font-serif text-[clamp(30px,5.4vw,48px)] font-normal tracking-[-.015em]">
            {{ album.name }}
          </h1>
          <p class="mt-[10px] max-w-[34em] text-[15px] leading-[1.6] text-muted">
            {{ album.description }}
          </p>
          <div class="mt-[14px] font-mono text-[11px] tracking-[.06em] text-muted">
            {{ album.count }} photos
          </div>
        </div>
        <app-photo-grid [photos]="photos()" [linkParams]="{ from: 'album:' + album.id }" />
      } @else {
        <div class="py-16 text-center font-serif text-[20px] text-muted">Portfolio not found.</div>
      }
    </app-content-shell>
  `,
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
        this.seo.set(`${album.name} — ${this.gallery.photographer}`, album.description)
      }
    })
  }
}
