import { Component, inject } from '@angular/core'
import { RouterLink, RouterLinkActive } from '@angular/router'
import { GalleryService } from '../../services/gallery.service'
import { ThemeService } from '../../services/theme.service'

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  host: {
    class:
      'sticky top-0 z-30 flex h-[58px] items-center border-b border-line bg-bg ' +
      'd:h-[64px]',
  },
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  protected readonly theme = inject(ThemeService)
  protected readonly gallery = inject(GalleryService)
}
