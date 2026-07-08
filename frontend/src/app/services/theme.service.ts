import { DOCUMENT, isPlatformBrowser } from '@angular/common'
import {
  afterNextRender,
  computed,
  Injectable,
  inject,
  PLATFORM_ID,
  REQUEST,
  signal,
} from '@angular/core'

type ThemeChoice = 'light' | 'dark' | null

const COOKIE = 'theme'

/**
 * Manages the explicit light/dark override. When no choice is stored the
 * pure-CSS `@media (prefers-color-scheme)` block governs (SSR-safe, no flash).
 * A manual choice sets `data-theme` on <html>, wins over the media query, and
 * persists to localStorage + a cookie so the server can emit it too.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT)
  private readonly platformId = inject(PLATFORM_ID)
  private readonly request = inject(REQUEST, { optional: true })

  private readonly choice = signal<ThemeChoice>(this.initialChoice())
  private readonly systemDark = signal(false)

  readonly isDark = computed(() => {
    const c = this.choice()
    return c ? c === 'dark' : this.systemDark()
  })
  readonly label = computed(() => (this.isDark() ? '◑ Light' : '◐ Dark'))
  readonly glyph = computed(() => (this.isDark() ? '◑' : '◐'))

  constructor() {
    // Reflect an explicit choice onto <html> for flash-free rendering on both
    // server and client.
    const c = this.choice()
    if (c) this.doc.documentElement.setAttribute('data-theme', c)

    afterNextRender(() => {
      const mql = window.matchMedia('(prefers-color-scheme: dark)')
      this.systemDark.set(mql.matches)
      mql.addEventListener('change', (e) => this.systemDark.set(e.matches))
    })
  }

  toggle(): void {
    const next: ThemeChoice = this.isDark() ? 'light' : 'dark'
    this.choice.set(next)
    this.doc.documentElement.setAttribute('data-theme', next)
    this.persist(next)
  }

  private initialChoice(): ThemeChoice {
    const value = this.readCookie(COOKIE)
    return value === 'dark' || value === 'light' ? value : null
  }

  private readCookie(name: string): string | null {
    const raw = isPlatformBrowser(this.platformId)
      ? this.doc.cookie
      : (this.request?.headers?.get('cookie') ?? '')
    for (const part of raw.split(';')) {
      const [k, ...v] = part.trim().split('=')
      if (k === name) return decodeURIComponent(v.join('='))
    }
    return null
  }

  private persist(value: string): void {
    if (!isPlatformBrowser(this.platformId)) return
    try {
      localStorage.setItem(COOKIE, value)
      this.doc.cookie = `${COOKIE}=${value};path=/;max-age=31536000;samesite=lax`
    } catch {
      // storage unavailable (private mode etc.) — the in-memory signal still works
    }
  }
}
