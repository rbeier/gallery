import { afterNextRender, DestroyRef, Directive, ElementRef, inject, signal } from '@angular/core'

/**
 * Exposes a `visible` signal that flips true once the host scrolls within 200px
 * of the viewport, then stops observing. Used to lazy-load grid images only when
 * (nearly) on screen — tighter than native loading="lazy", which Chrome fetches
 * with a very large margin on slow connections.
 *
 *   <a appInViewport #vp="inViewport"> @if (vp.visible()) { <img …> } </a>
 */
@Directive({
  selector: '[appInViewport]',
  exportAs: 'inViewport',
})
export class InViewport {
  private readonly host = inject(ElementRef<HTMLElement>)
  private readonly destroyRef = inject(DestroyRef)

  readonly visible = signal(false)

  constructor() {
    // Client-only; on the server `visible` stays false and nothing is requested.
    afterNextRender(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            this.visible.set(true)
            observer.disconnect()
          }
        },
        { rootMargin: '200px' },
      )
      observer.observe(this.host.nativeElement)
      this.destroyRef.onDestroy(() => observer.disconnect())
    })
  }
}
