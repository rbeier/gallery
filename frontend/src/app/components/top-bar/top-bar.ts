import { Component, inject } from '@angular/core'
import { RouterLink, RouterLinkActive } from '@angular/router'
import { PHOTOGRAPHER } from '../../data/seed'
import { ThemeService } from '../../services/theme.service'
import { ViewportService } from '../../services/viewport.service'

@Component({
  selector: 'app-top-bar',
  imports: [RouterLink, RouterLinkActive],
  host: {
    class:
      'sticky top-0 z-20 flex h-[58px] items-center justify-between border-b border-line bg-bg px-5 d:h-[72px] d:px-10',
  },
  templateUrl: './top-bar.html',
  styleUrl: './top-bar.css',
})
export class TopBar {
  protected readonly viewport = inject(ViewportService)
  protected readonly theme = inject(ThemeService)
  protected readonly photographer = PHOTOGRAPHER
}
