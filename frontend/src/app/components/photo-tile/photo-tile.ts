import { Component, input, signal } from '@angular/core'
import { type Params, RouterLink } from '@angular/router'
import { InViewport } from '../../directives/in-viewport'
import type { PhotoView } from '../../models/photo-view'

@Component({
  selector: 'app-photo-tile',
  imports: [RouterLink, InViewport],
  templateUrl: './photo-tile.html',
  styleUrl: './photo-tile.css',
})
export class PhotoTile {
  readonly photo = input.required<PhotoView>()
  readonly linkParams = input<Params>({})

  /** Flips true once the full image loads, fading it in over the LQIP blur. */
  protected readonly loaded = signal(false)
}
