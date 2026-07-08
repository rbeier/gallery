import { InjectionToken } from '@angular/core'

/** Base URL of the Strapi backend. Override in providers to point elsewhere. */
export const STRAPI_BASE_URL = new InjectionToken<string>('STRAPI_BASE_URL', {
  providedIn: 'root',
  factory: () => 'http://localhost:1337',
})
