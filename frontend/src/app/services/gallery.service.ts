import { Injectable, inject, makeStateKey, TransferState } from '@angular/core'
import { ALBUMS, PHOTOS, PROFILE } from '../data/seed'
import type { AlbumId } from '../models/album-id'
import type { AlbumView } from '../models/album-view'
import type { FacetGroup } from '../models/facet-group'
import type { GalleryData } from '../models/gallery-data'
import type { PhotoView } from '../models/photo-view'
import type { Profile } from '../models/profile'
import type { SearchFilters } from '../models/search-filters'
import { shortLocation } from '../util/short-location'
import { toView } from '../util/to-view'
import { StrapiService } from './strapi.service'

const GALLERY_KEY = makeStateKey<GalleryData>('gallery')

const SEED: GalleryData = {
  photos: PHOTOS,
  albums: ALBUMS,
  profile: PROFILE,
}

@Injectable({ providedIn: 'root' })
export class GalleryService {
  private readonly state = inject(TransferState)
  private readonly strapi = inject(StrapiService)
  private data: GalleryData = SEED

  /**
   * Populate the dataset before the app renders. Runs as an app initializer.
   * The server fetches from Strapi and hands the result to the client via
   * TransferState, so the client reuses it instead of refetching. If Strapi is
   * unreachable, the bundled seed keeps the app rendering.
   */
  async load(): Promise<void> {
    const cached = this.state.get<GalleryData | null>(GALLERY_KEY, null)
    if (cached) {
      this.data = cached
      return
    }
    try {
      this.data = await this.strapi.fetchGallery()
    } catch {
      this.data = SEED
    }
    this.state.set(GALLERY_KEY, this.data)
  }

  get photographer(): string {
    return this.data.profile.name
  }

  profile(): Profile {
    return this.data.profile
  }

  allPhotos(): PhotoView[] {
    return this.data.photos.map(toView)
  }

  photosOf(albumId: AlbumId): PhotoView[] {
    return this.data.photos.filter((p) => p.album === albumId).map(toView)
  }

  photoById(id: number): PhotoView | undefined {
    const p = this.data.photos.find((x) => x.id === id)
    return p ? toView(p) : undefined
  }

  albums(): AlbumView[] {
    return this.data.albums.map((a) => {
      const photos = this.data.photos.filter((p) => p.album === a.id)
      return {
        ...a,
        count: photos.length,
        cover: a.cover ?? photos[0]?.src,
        coverSrcset: a.cover ? a.coverSrcset : photos[0]?.srcset,
        grad: photos[0]?.grad,
      }
    })
  }

  albumById(id: AlbumId): AlbumView | undefined {
    return this.albums().find((a) => a.id === id)
  }

  albumName(id: AlbumId): string {
    return this.data.albums.find((a) => a.id === id)?.name ?? ''
  }

  stat(): string {
    return `${this.data.photos.length} images · ${this.data.albums.length} albums`
  }

  facets(): FacetGroup[] {
    const uniq = (arr: string[]) => Array.from(new Set(arr))
    const photos = this.data.photos
    return [
      { kind: 'tag', label: 'Tag', options: uniq(photos.flatMap((p) => p.tags)).sort() },
      {
        kind: 'place',
        label: 'Place',
        options: uniq(photos.map((p) => shortLocation(p.location))).sort(),
      },
      {
        kind: 'year',
        label: 'Year',
        options: uniq(photos.map((p) => p.date.split('-')[0]))
          .sort()
          .reverse(),
      },
    ]
  }

  /** Free text (title/desc/lens/location/tags) AND facets (OR within group). */
  search(filters: SearchFilters): PhotoView[] {
    const q = filters.q.trim().toLowerCase()
    return this.data.photos
      .filter((p) => {
        if (q) {
          const hay =
            `${p.title} ${p.description} ${p.lens} ${p.location} ${p.tags.join(' ')}`.toLowerCase()
          if (!hay.includes(q)) return false
        }
        if (filters.tag.length && !p.tags.some((t) => filters.tag.includes(t))) return false
        if (filters.place.length && !filters.place.includes(shortLocation(p.location))) return false
        if (filters.year.length && !filters.year.includes(p.date.split('-')[0])) return false
        return true
      })
      .map(toView)
  }
}
