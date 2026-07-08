import { afterNextRender, computed, Injectable, signal } from '@angular/core'

/**
 * Responsive breakpoints from the prototype. Defaults to the desktop width
 * (1280) so SSR output matches the client's first paint before measurement.
 * Breakpoints: mobile < 880 (2 cols), desktop >= 880 (3 cols), wide >= 1300
 * (4 cols).
 */
@Injectable({ providedIn: 'root' })
export class ViewportService {
  readonly width = signal(1280)

  readonly isDesktop = computed(() => this.width() >= 880)
  readonly isMobile = computed(() => !this.isDesktop())
  readonly isWide = computed(() => this.width() >= 1300)
  readonly columns = computed(() => (this.isWide() ? 4 : this.isDesktop() ? 3 : 2))
  readonly containerMax = computed(() =>
    this.isWide() ? '1500px' : this.isDesktop() ? '1180px' : '640px',
  )

  constructor() {
    afterNextRender(() => {
      const update = () => this.width.set(window.innerWidth)
      update()
      window.addEventListener('resize', update, { passive: true })
    })
  }
}
