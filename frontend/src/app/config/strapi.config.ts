import { InjectionToken, PLATFORM_ID, inject, makeStateKey, TransferState } from '@angular/core'
import { isPlatformServer } from '@angular/common'

const STRAPI_URL_KEY = makeStateKey<string>('STRAPI_BASE_URL')

/** Base URL of the Strapi backend. Override in providers to point elsewhere. */
export const STRAPI_BASE_URL = new InjectionToken<string>('STRAPI_BASE_URL', {
  providedIn: 'root',
  factory: () => {
    const platformId = inject(PLATFORM_ID)
    const transferState = inject(TransferState)

    if (isPlatformServer(platformId)) {
      const url = process.env['STRAPI_BASE_URL'] || 'http://localhost:1337'
      transferState.set(STRAPI_URL_KEY, url)
      return url
    } else {
      return transferState.get(STRAPI_URL_KEY, 'http://localhost:1337')
    }
  },
})
