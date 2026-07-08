import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { firstValueFrom } from 'rxjs'
import { STRAPI_BASE_URL } from '../config/strapi.config'
import type { Album } from '../models/album'
import type { AlbumId } from '../models/album-id'
import type { GalleryData } from '../models/gallery-data'
import type { Photo } from '../models/photo'
import { gradientFor } from '../util/gradient'

/** Strapi v5 REST list envelope. Attributes are flattened onto each entry. */
interface StrapiList<T> {
  data: T[]
}

interface StrapiSingle<T> {
  data: T | null
}

interface StrapiAlbum {
  slug: string
  name: string
  description: string | null
  order: number | null
  cover: StrapiMedia | null
}

interface StrapiFormat {
  url: string
}

interface StrapiMedia {
  url: string
  width: number | null
  height: number | null
  formats: Record<string, StrapiFormat> | null
}

interface StrapiPhoto {
  id: number
  title: string
  camera: string | null
  lens: string | null
  location: { address?: string } | null
  date: string | null
  tags: { name: string }[] | null
  ratio: number | null
  description: string | null
  image: StrapiMedia | null
  album: { slug: string } | null
}

interface StrapiGlobal {
  photographer: string | null
}

@Injectable({ providedIn: 'root' })
export class StrapiService {
  private readonly http = inject(HttpClient)
  private readonly base = inject(STRAPI_BASE_URL)

  /** Fetch the full dataset the frontend renders in one shot. */
  async fetchGallery(): Promise<GalleryData> {
    const [photos, albums, global] = await Promise.all([
      firstValueFrom(
        this.http.get<StrapiList<StrapiPhoto>>(`${this.base}/api/photos`, {
          params: {
            'populate[album][fields][0]': 'slug',
            'populate[tags][fields][0]': 'name',
            'populate[image][fields][0]': 'url',
            'populate[image][fields][1]': 'formats',
            'populate[image][fields][2]': 'width',
            'populate[image][fields][3]': 'height',
            'pagination[pageSize]': '200',
            sort: 'id:asc',
          },
        }),
      ),
      firstValueFrom(
        this.http.get<StrapiList<StrapiAlbum>>(`${this.base}/api/albums`, {
          params: {
            'populate[cover][fields][0]': 'url',
            'populate[cover][fields][1]': 'formats',
            sort: 'order:asc',
          },
        }),
      ),
      firstValueFrom(this.http.get<StrapiSingle<StrapiGlobal>>(`${this.base}/api/global`)),
    ])

    return {
      photos: photos.data.map((p) => this.mapPhoto(p)),
      albums: albums.data.map((a) => this.mapAlbum(a)),
      photographer: global.data?.photographer ?? '',
    }
  }

  private mapPhoto(p: StrapiPhoto): Photo {
    return {
      id: p.id,
      title: p.title,
      album: (p.album?.slug ?? '') as AlbumId,
      camera: p.camera ?? '',
      lens: p.lens ?? '',
      location: p.location?.address ?? '',
      date: p.date ?? '',
      tags: (p.tags ?? []).map((t) => t.name),
      ratio: p.ratio ?? 1.5,
      description: p.description ?? '',
      grad: gradientFor(p.id),
      src: this.imageUrl(p.image),
    }
  }

  private mapAlbum(a: StrapiAlbum): Album {
    return {
      id: a.slug as AlbumId,
      name: a.name,
      description: a.description ?? '',
      cover: this.imageUrl(a.cover),
    }
  }

  /** Absolute URL of the best display format, or undefined when no image. */
  private imageUrl(media: StrapiMedia | null): string | undefined {
    if (!media) return undefined
    const rel = media.formats?.['large']?.url ?? media.formats?.['medium']?.url ?? media.url
    return rel.startsWith('http') ? rel : `${this.base}${rel}`
  }
}
