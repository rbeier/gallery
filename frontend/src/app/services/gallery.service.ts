import { Injectable, inject, makeStateKey, TransferState } from '@angular/core'
import { ALBUMS, PHOTOGRAPHER, PHOTOS } from '../data/seed'
import type {
  Album,
  AlbumId,
  AlbumView,
  FacetGroup,
  Photo,
  PhotoView,
} from '../models/gallery.models'
import { distribute, shortLocation, toView } from '../util/gallery.util'

export interface GalleryData {
  photos: Photo[]
  albums: Album[]
  photographer: string
}

export interface SearchFilters {
  q: string
  tag: string[]
  camera: string[]
  place: string[]
  year: string[]
}

const GALLERY_KEY = makeStateKey<GalleryData>('gallery')

@Injectable({ providedIn: 'root' })
export class GalleryService {
  private readonly state = inject(TransferState)
  private readonly data: GalleryData

  constructor() {
    // On the server, seed TransferState; on the client, reuse it so the
    // dataset isn't rebuilt/refetched after hydration.
    this.data = this.state.get(GALLERY_KEY, {
      photos: PHOTOS,
      albums: ALBUMS,
      photographer: PHOTOGRAPHER,
    })
    this.state.set(GALLERY_KEY, this.data)
  }

  get photographer(): string {
    return this.data.photographer
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
      return { ...a, count: photos.length, cover: photos[0]?.grad }
    })
  }

  albumById(id: AlbumId): AlbumView | undefined {
    return this.albums().find((a) => a.id === id)
  }

  albumName(id: AlbumId): string {
    return this.data.albums.find((a) => a.id === id)?.name ?? ''
  }

  stat(): string {
    return `${this.data.photos.length} images · ${this.data.albums.length} portfolios`
  }

  facets(): FacetGroup[] {
    const uniq = (arr: string[]) => Array.from(new Set(arr))
    const photos = this.data.photos
    return [
      { kind: 'tag', label: 'Tag', options: uniq(photos.flatMap((p) => p.tags)).sort() },
      { kind: 'camera', label: 'Camera', options: uniq(photos.map((p) => p.camera)).sort() },
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

  /** Free text (title/desc/camera/location/tags) AND facets (OR within group). */
  search(filters: SearchFilters): PhotoView[] {
    const q = filters.q.trim().toLowerCase()
    return this.data.photos
      .filter((p) => {
        if (q) {
          const hay =
            `${p.title} ${p.description} ${p.camera} ${p.location} ${p.tags.join(' ')}`.toLowerCase()
          if (!hay.includes(q)) return false
        }
        if (filters.tag.length && !p.tags.some((t) => filters.tag.includes(t))) return false
        if (filters.camera.length && !filters.camera.includes(p.camera)) return false
        if (filters.place.length && !filters.place.includes(shortLocation(p.location))) return false
        if (filters.year.length && !filters.year.includes(p.date.split('-')[0])) return false
        return true
      })
      .map(toView)
  }
}

export { distribute }
