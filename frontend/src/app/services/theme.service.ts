import { DOCUMENT, isPlatformBrowser } from '@angular/common'
import { afterNextRender, computed, Injectable, inject, PLATFORM_ID, signal } from '@angular/core'

type ThemeChoice = 'light' | 'dark' | null

const STORAGE_KEY = 'theme'

/**
 * Manages the explicit light/dark override. When no choice is stored the
 * pure-CSS `@media (prefers-color-scheme)` block governs (SSR-safe, no flash).
 * A manual choice sets `data-theme` on <html>, wins over the media query, and
 * persists to localStorage only.
 *
 * localStorage (not a cookie) keeps this a purely client-side functional
 * preference — never sent to the server — so it needs no EU cookie consent.
 * Trade-off: the server can't know a manual choice, so a user whose stored
 * choice differs from their OS setting may see a brief flash on first paint;
 * everyone else is covered flash-free by the CSS media query.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT)
  private readonly platformId = inject(PLATFORM_ID)

  private readonly choice = signal<ThemeChoice>(this.initialChoice())
  private readonly systemDark = signal(false)

  readonly isDark = computed(() => {
    const c = this.choice()
    return c ? c === 'dark' : this.systemDark()
  })
  readonly label = computed(() => (this.isDark() ? '◑ Light' : '◐ Dark'))
  readonly glyph = computed(() => (this.isDark() ? '◑' : '◐'))

  constructor() {
    // Reflect a stored choice onto <html> as early as possible on the client.
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
    if (!isPlatformBrowser(this.platformId)) return null
    try {
      const value = localStorage.getItem(STORAGE_KEY)
      return value === 'dark' || value === 'light' ? value : null
    } catch {
      return null
    }
  }

  private persist(value: string): void {
    if (!isPlatformBrowser(this.platformId)) return
    try {
      localStorage.setItem(STORAGE_KEY, value)
    } catch {
      // storage unavailable (private mode etc.) — the in-memory signal still works
    }
  }
}
