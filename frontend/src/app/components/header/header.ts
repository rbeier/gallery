import { Component, inject } from '@angular/core'
import { RouterLink } from '@angular/router'
import { Brand } from '../brand/brand'
import { ThemeService } from '../../services/theme.service'

@Component({
  selector: 'app-header',
  imports: [RouterLink, Brand],
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
}
