import { Component, input } from '@angular/core'
import { type Params, RouterLink } from '@angular/router'
import type { PhotoView } from '../models/gallery.models'

@Component({
  selector: 'app-photo-tile',
  imports: [RouterLink],
  template: `
    <a
      [routerLink]="['/photo', photo().id]"
      [queryParams]="linkParams()"
      [attr.aria-label]="photo().title + ' — ' + photo().meta"
      class="group relative block overflow-hidden rounded-tile animate-rise focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
    >
      <div
        class="w-full"
        [style.aspect-ratio]="photo().ratio"
        [style.background]="photo().grad"
      ></div>
      <div
        class="pointer-events-none absolute inset-x-0 bottom-0 px-[15px] pt-[34px] pb-[13px] opacity-0 transition-opacity duration-[250ms] ease-out group-hover:opacity-100 group-focus-visible:opacity-100 bg-[linear-gradient(to_top,rgba(18,14,9,.74),rgba(18,14,9,0))]"
      >
        <div class="font-serif font-medium text-[14px] leading-[1.2] text-white">
          {{ photo().title }}
        </div>
        <div class="mt-[3px] text-meta text-white/70">{{ photo().meta }}</div>
      </div>
    </a>
  `,
})
export class PhotoTile {
  readonly photo = input.required<PhotoView>()
  readonly linkParams = input<Params>({})
}
