import { Component, computed, inject, signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { NavigationEnd, Router, RouterOutlet } from '@angular/router'
import { filter } from 'rxjs'
import { TopBar } from './components/top-bar'

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TopBar],
  template: `
    @if (showChrome()) {
      <app-top-bar />
    }
    <router-outlet />
  `,
})
export class App {
  private readonly router = inject(Router)
  private readonly url = signal(this.router.url)

  // The photo detail route is a full-bleed page — the top bar recedes there.
  protected readonly showChrome = computed(() => !this.url().startsWith('/photo'))

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((e) => this.url.set(e.urlAfterRedirects))
  }
}
