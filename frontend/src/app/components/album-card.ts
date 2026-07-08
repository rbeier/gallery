import { Component, input } from '@angular/core'
import { RouterLink } from '@angular/router'
import type { AlbumView } from '../models/gallery.models'

@Component({
  selector: 'app-album-card',
  imports: [RouterLink],
  template: `
    <a
      [routerLink]="['/albums', album().id]"
      class="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
    >
      <div
        class="w-full rounded-card"
        style="aspect-ratio: 4/3"
        [style.background]="album().cover"
      ></div>
      <div class="mt-3 flex items-baseline justify-between gap-3">
        <div class="font-serif font-medium text-[clamp(17px,2.2vw,20px)]">{{ album().name }}</div>
        <div class="whitespace-nowrap font-mono text-[11px] text-muted">{{ album().count }}</div>
      </div>
      <div class="mt-1 text-[13px] leading-[1.5] text-muted">{{ album().description }}</div>
    </a>
  `,
})
export class AlbumCard {
  readonly album = input.required<AlbumView>()
}
