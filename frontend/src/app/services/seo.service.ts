import { DOCUMENT, isPlatformServer } from '@angular/common'
import { Injectable, inject, PLATFORM_ID, REQUEST } from '@angular/core'
import { Meta, Title } from '@angular/platform-browser'
import type { SeoMeta } from '../models/seo-meta'
import { GalleryService } from './gallery.service'

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title)
  private readonly meta = inject(Meta)
  private readonly gallery = inject(GalleryService)
  private readonly platformId = inject(PLATFORM_ID)
  private readonly request = inject(REQUEST, { optional: true })
  private readonly document = inject(DOCUMENT)

  /**
   * Set the document title and the Open Graph / Twitter tags a messenger reads
   * to build a link preview. `og:image` (absolute — crawlers reject relative
   * URLs) falls back to the newest photo when the caller passes none.
   */
  set(meta: SeoMeta): void {
    this.title.setTitle(meta.title)

    const image = this.absolute(meta.image ?? this.latestPhotoImage())
    const imageAlt = meta.imageAlt ?? meta.title

    const tags: Record<string, string | undefined> = {
      description: meta.description,
      'og:title': meta.title,
      'og:description': meta.description,
      'og:type': meta.type ?? 'website',
      'og:site_name': this.gallery.photographer,
      'og:url': this.canonicalUrl(),
      'og:image': image,
      'og:image:alt': image ? imageAlt : undefined,
      'twitter:card': 'summary_large_image',
      'twitter:title': meta.title,
      'twitter:description': meta.description,
      'twitter:image': image,
      'twitter:image:alt': image ? imageAlt : undefined,
    }

    for (const [key, content] of Object.entries(tags)) {
      if (content === undefined) continue
      // og:* are Open Graph "property" tags; the rest are standard "name" tags.
      if (key.startsWith('og:')) this.meta.updateTag({ property: key, content })
      else this.meta.updateTag({ name: key, content })
    }
  }

  /** Newest photo's share-sized image (viewer format ≤2000px), if any. */
  private latestPhotoImage(): string | undefined {
    const latest = this.gallery.allPhotos()[0]
    return latest?.srcFull ?? latest?.src
  }

  /** Resolve a media path to an absolute URL; passes through absolute inputs. */
  private absolute(path: string | undefined): string | undefined {
    if (!path) return undefined
    if (/^https?:\/\//.test(path)) return path
    const origin = this.origin()
    if (!origin) return undefined
    return `${origin}${path.startsWith('/') ? '' : '/'}${path}`
  }

  /** Canonical page URL (origin + path, no query) for `og:url`. */
  private canonicalUrl(): string | undefined {
    const origin = this.origin()
    if (!origin) return undefined
    let path = '/'
    if (isPlatformServer(this.platformId)) {
      try {
        path = new URL(this.request?.url ?? '/', 'http://localhost').pathname
      } catch {
        path = '/'
      }
    } else {
      path = this.document.location.pathname
    }
    return `${origin}${path}`
  }

  /** Public origin: forwarded headers on the server (https default), else the page origin. */
  private origin(): string {
    if (isPlatformServer(this.platformId)) {
      const headers = this.request?.headers
      const host = headers?.get('x-forwarded-host') ?? headers?.get('host')
      const proto = headers?.get('x-forwarded-proto') ?? 'https'
      return host ? `${proto}://${host}` : ''
    }
    return this.document.location.origin
  }
}
