import { isPlatformBrowser } from '@angular/common'
import { Injectable, inject, isDevMode, PLATFORM_ID, signal } from '@angular/core'

const STORAGE_KEY = 'isLoggedIn'

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID)

  readonly isLoggedIn = signal(this.initialLoggedIn())

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('storage', () => this.check())
      window.addEventListener('focus', () => this.check())
    }
  }

  check(): void {
    if (this.isDev()) {
      this.isLoggedIn.set(true)
      return
    }
    if (!isPlatformBrowser(this.platformId)) return
    try {
      this.isLoggedIn.set(localStorage.getItem(STORAGE_KEY) === 'true')
    } catch {
      this.isLoggedIn.set(false)
    }
  }

  isDev(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      const host = window.location.hostname
      if (host === 'localhost' || host === '127.0.0.1') return true
    }
    return isDevMode()
  }

  adminUrl(documentId?: string): string {
    let base = 'https://rbeier.dev/admin'
    if (this.isDev()) {
      base = 'http://localhost:1337/admin'
    } else if (isPlatformBrowser(this.platformId)) {
      base = `${window.location.origin}/admin`
    }

    if (documentId) {
      return `${base}/content-manager/collection-types/api::photo.photo/${documentId}`
    }
    return base
  }

  private initialLoggedIn(): boolean {
    if (this.isDev()) return true
    if (!isPlatformBrowser(this.platformId)) return false
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  }
}
