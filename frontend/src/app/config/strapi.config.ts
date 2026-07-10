import { InjectionToken, PLATFORM_ID, inject, isDevMode } from '@angular/core'
import { isPlatformServer } from '@angular/common'

/** Base URL of the Strapi backend. Override in providers to point elsewhere. */
export const STRAPI_BASE_URL = new InjectionToken<string>('STRAPI_BASE_URL', {
  providedIn: 'root',
  factory: () => {
    const platformId = inject(PLATFORM_ID)

    if (isPlatformServer(platformId)) {
      // On the server, read from environment variable or default to localhost
      return process.env['STRAPI_BASE_URL'] || 'http://localhost:1337'
    } else {
      // In the browser:
      if (!isDevMode() && typeof window !== 'undefined') {
        // In production single-domain setup, use the current page's origin
        return window.location.origin
      }
      // In development, fall back to the local backend URL
      return 'http://localhost:1337'
    }
  },
})

/**
 * Base URL used to build browser-facing media (image) URLs.
 *
 * This is deliberately separate from {@link STRAPI_BASE_URL}: during SSR the API
 * base is the internal container host (e.g. http://cms:1337), which the browser
 * cannot reach. Media URLs must instead resolve against the public origin.
 *
 * Default is an empty string → origin-relative URLs (`/uploads/...`), which the
 * browser resolves against the current page origin. Set STRAPI_PUBLIC_URL on the
 * server only for a cross-domain media/CDN host.
 */
export const STRAPI_MEDIA_URL = new InjectionToken<string>('STRAPI_MEDIA_URL', {
  providedIn: 'root',
  factory: () => {
    const platformId = inject(PLATFORM_ID)
    if (isPlatformServer(platformId)) {
      // Public URL if given (cross-domain media host), else relative to origin.
      return process.env['STRAPI_PUBLIC_URL'] || ''
    }
    // Browser: always origin-relative — the visitor is already on the public domain.
    return ''
  },
})
