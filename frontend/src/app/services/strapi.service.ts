import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { firstValueFrom } from 'rxjs'
import { STRAPI_BASE_URL, STRAPI_MEDIA_URL } from '../config/strapi.config'
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
  width: number | null
  /** Inline WebP data-URI blur placeholder — present only on the thumbnail format. */
  placeholder?: string
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
  lens: { name: string } | null
  location: { name: string } | null
  date: string | null
  tags: { name: string }[] | null
  description: string | null
  image: StrapiMedia | null
  album: { slug: string } | null
}

interface StrapiGlobal {
  photographer: string | null
  heading: string | null
  location: string | null
  bio: string | null
  avatar: StrapiMedia | null
}

@Injectable({ providedIn: 'root' })
export class StrapiService {
  private readonly http = inject(HttpClient)
  private readonly base = inject(STRAPI_BASE_URL)
  private readonly mediaBase = inject(STRAPI_MEDIA_URL)

  /** Fetch the full dataset the frontend renders in one shot. */
  async fetchGallery(): Promise<GalleryData> {
    const [photos, albums, global] = await Promise.all([
      firstValueFrom(
        this.http.get<StrapiList<StrapiPhoto>>(`${this.base}/api/photos`, {
          params: {
            'populate[album][fields][0]': 'slug',
            'populate[lens][fields][0]': 'name',
            'populate[location][fields][0]': 'name',
            'populate[tags][fields][0]': 'name',
            'populate[image][fields][0]': 'url',
            'populate[image][fields][1]': 'formats',
            'populate[image][fields][2]': 'width',
            'populate[image][fields][3]': 'height',
            'pagination[pageSize]': '200',
            sort: ['date:desc', 'id:desc'],
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
      firstValueFrom(
        this.http.get<StrapiSingle<StrapiGlobal>>(`${this.base}/api/global`, {
          params: {
            'populate[avatar][fields][0]': 'url',
            'populate[avatar][fields][1]': 'formats',
          },
        }),
      ),
    ])

    const g = global.data
    return {
      photos: photos.data.map((p) => this.mapPhoto(p)),
      albums: albums.data.map((a) => this.mapAlbum(a)),
      profile: {
        name: g?.photographer ?? '',
        heading: g?.heading ?? '',
        location: g?.location ?? '',
        bio: g?.bio ?? '',
        avatar: this.avatarUrl(g?.avatar ?? null),
        avatarSrcset: this.avatarSrcset(g?.avatar ?? null),
      },
    }
  }

  private mapPhoto(p: StrapiPhoto): Photo {
    return {
      id: p.id,
      title: p.title,
      album: (p.album?.slug ?? '') as AlbumId,
      lens: p.lens?.name ?? '',
      location: p.location?.name ?? '',
      date: p.date ?? '',
      tags: (p.tags ?? []).map((t) => t.name),
      ratio: ratioOf(p.image),
      description: p.description ?? '',
      grad: gradientFor(p.id),
      lqip: this.blurPlaceholder(p.image),
      src: this.imageUrl(p.image),
      srcset: this.gridSrcset(p.image),
      srcFull: this.viewerUrl(p.image),
    }
  }

  private mapAlbum(a: StrapiAlbum): Album {
    return {
      id: a.slug as AlbumId,
      name: a.name,
      description: a.description ?? '',
      cover: this.imageUrl(a.cover),
      coverLqip: this.blurPlaceholder(a.cover),
      coverSrcset: this.gridSrcset(a.cover),
    }
  }

  /** Absolute URL of the best display format, or undefined when no image. */
  private imageUrl(media: StrapiMedia | null): string | undefined {
    if (!media) return undefined
    const rel = media.formats?.['large']?.url ?? media.formats?.['medium']?.url ?? media.url
    return this.absolute(rel)
  }

  /**
   * URL for the 76px profile avatar. Uses the smallest generated format instead
   * of {@link imageUrl}'s display-sized `large` — a ~1000px file into a 76px slot
   * wastes ~99% of the bytes. Retina crispness comes from {@link avatarSrcset}.
   */
  private avatarUrl(media: StrapiMedia | null): string | undefined {
    if (!media) return undefined
    const rel = media.formats?.['thumbnail']?.url ?? media.formats?.['small']?.url ?? media.url
    return this.absolute(rel)
  }

  /** `srcset` of the two smallest formats so a 2x display picks a sharp source. */
  private avatarSrcset(media: StrapiMedia | null): string | undefined {
    if (!media?.formats) return undefined
    const entries = AVATAR_FORMATS.map((k) => media.formats?.[k])
      .filter((f): f is StrapiFormat => !!f && f.width != null)
      .map((f) => `${this.absolute(f.url)} ${f.width}w`)
    return entries.length ? entries.join(', ') : undefined
  }

  /**
   * Inline WebP blur placeholder (data URI) carried on the thumbnail format.
   * Already a data URI, so it needs no host prefix and costs no extra request.
   */
  private blurPlaceholder(media: StrapiMedia | null): string | undefined {
    return media?.formats?.['thumbnail']?.placeholder ?? undefined
  }

  /**
   * Responsive `srcset` of the smaller grid-sized formats so a small tile fetches
   * a small image instead of the full display format. Ordered smallest→largest;
   * omits the viewer-sized formats (xlarge/original).
   */
  private gridSrcset(media: StrapiMedia | null): string | undefined {
    if (!media?.formats) return undefined
    const entries = GRID_FORMATS.map((k) => media.formats?.[k])
      .filter((f): f is StrapiFormat => !!f && f.width != null)
      .map((f) => `${this.absolute(f.url)} ${f.width}w`)
    return entries.length ? entries.join(', ') : undefined
  }

  /**
   * URL for the full-screen viewer: the largest generated format whose width
   * stays within {@link VIEWER_MAX_WIDTH}. Never returns the raw original, so a
   * visitor can't grab the full-resolution file. Falls back to the original only
   * when it is itself within the cap (small images that spawn no larger format).
   */
  private viewerUrl(media: StrapiMedia | null): string | undefined {
    if (!media) return undefined
    const capped = Object.values(media.formats ?? {})
      .filter((f) => f.width != null && f.width <= VIEWER_MAX_WIDTH)
      .sort((a, b) => (b.width ?? 0) - (a.width ?? 0))
    if (capped.length) return this.absolute(capped[0].url)
    // No format within the cap — safe to use the original only if it's small enough.
    if (media.width != null && media.width <= VIEWER_MAX_WIDTH) return this.absolute(media.url)
    // Otherwise fall back to the display-sized format rather than the original.
    return this.imageUrl(media)
  }

  /**
   * Resolve a Strapi media path to a browser-facing URL. Uses {@link mediaBase}
   * (public/relative), never the internal API base, so SSR does not bake the
   * unreachable container host (cms:1337) into rendered <img> tags.
   */
  private absolute(rel: string): string {
    return rel.startsWith('http') ? rel : `${this.mediaBase}${rel}`
  }
}

/** Hard cap on the viewer image width — keeps the full-resolution original private. */
const VIEWER_MAX_WIDTH = 2000

/** Strapi formats used for grid `srcset`, smallest→largest (no viewer-sized ones). */
const GRID_FORMATS = ['thumbnail', 'small', 'medium', 'large'] as const

/** Strapi formats used for the small avatar `srcset` (1x thumbnail, 2x small). */
const AVATAR_FORMATS = ['thumbnail', 'small'] as const

/** Aspect ratio (width / height) derived from the image's own dimensions. */
function ratioOf(media: StrapiMedia | null): number {
  if (!media?.width || !media?.height) return 1.5
  return Math.round((media.width / media.height) * 100) / 100
}
