import { Component, input, signal } from '@angular/core'
import { RouterLink } from '@angular/router'
import { InViewport } from '../../directives/in-viewport'
import type { AlbumView } from '../../models/album-view'

@Component({
  selector: 'app-album-card',
  imports: [RouterLink, InViewport],
  templateUrl: './album-card.html',
  styleUrl: './album-card.css',
})
export class AlbumCard {
  readonly album = input.required<AlbumView>()

  /** Flips true once the cover loads, fading it in over the LQIP blur. */
  protected readonly loaded = signal(false)
}
