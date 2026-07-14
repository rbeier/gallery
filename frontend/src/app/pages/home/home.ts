import { Component, inject, signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import { AlbumGrid } from '../../components/album-grid/album-grid'
import { ContentShell } from '../../components/content-shell/content-shell'
import { PhotoGrid } from '../../components/photo-grid/photo-grid'
import { GalleryService } from '../../services/gallery.service'
import { SeoService } from '../../services/seo.service'

type Tab = 'photos' | 'albums'

const toTab = (value: string | null): Tab => (value === 'albums' ? 'albums' : 'photos')

@Component({
  selector: 'app-home',
  imports: [RouterLink, ContentShell, AlbumGrid, PhotoGrid],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  protected readonly gallery = inject(GalleryService)
  protected readonly profile = this.gallery.profile()

  /** Active tab is mirrored in the `tab` query param so it survives back/forward. */
  protected readonly tab = signal<Tab>(toTab(this.route.snapshot.queryParamMap.get('tab')))

  // A tab's grid is created on first visit and then kept alive (see [hidden] in
  // the template). Latching creation means a tab that starts hidden doesn't build
  // its grid — and doesn't request images — until the user actually opens it. It
  // also lets each tile's IntersectionObserver start while the grid is visible.
  protected readonly photosSeen = signal(false)
  protected readonly albumsSeen = signal(false)

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((m) => {
      const tab = toTab(m.get('tab'))
      this.tab.set(tab)
      if (tab === 'photos') this.photosSeen.set(true)
      else this.albumsSeen.set(true)
    })

    inject(SeoService).set({
      title: `${this.gallery.photographer} — Photography`,
      description:
        this.profile.bio || `A minimalist photography portfolio. ${this.gallery.stat()}.`,
    })
  }

  protected select(tab: Tab): void {
    // Navigate only; the queryParamMap subscription is the single source that
    // updates the signal, so the tab and the URL never disagree. Default
    // 'photos' clears the param to keep the home URL clean.
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tab === 'photos' ? null : tab },
      queryParamsHandling: 'merge',
    })
  }
}
