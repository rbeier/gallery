import { Component, computed, inject, signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router'
import { filter } from 'rxjs'
import type { AlbumId } from '../../models/album-id'
import { GalleryService } from '../../services/gallery.service'
import { ThemeService } from '../../services/theme.service'
import { ViewportService } from '../../services/viewport.service'

interface Crumb {
  label: string
  link?: string
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  host: {
    class:
      'sticky top-0 z-30 flex h-[58px] items-center justify-between gap-4 border-b border-line bg-bg px-5 ' +
      'd:h-screen d:flex-col d:items-stretch d:justify-start d:gap-0 d:border-b-0 d:border-r d:w-[320px] d:flex-none d:px-7 d:py-9',
  },
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  protected readonly viewport = inject(ViewportService)
  protected readonly theme = inject(ThemeService)
  protected readonly gallery = inject(GalleryService)
  private readonly router = inject(Router)
  private readonly url = signal(this.router.url)

  /** Subtle breadcrumb trail — only sub-pages (album detail) get one. */
  protected readonly crumbs = computed<Crumb[]>(() => {
    const seg = this.url().split('?')[0].split('/').filter(Boolean)
    if (seg[0] === 'albums' && seg[1]) {
      return [
        { label: 'Portfolios', link: '/albums' },
        { label: this.gallery.albumName(decodeURIComponent(seg[1]) as AlbumId) },
      ]
    }
    return []
  })

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((e) => this.url.set(e.urlAfterRedirects))
  }
}
