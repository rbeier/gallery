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
