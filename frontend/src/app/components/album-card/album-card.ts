import { Component, input } from '@angular/core'
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
}
