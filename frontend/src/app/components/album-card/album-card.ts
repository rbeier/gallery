import { Component, input } from '@angular/core'
import { RouterLink } from '@angular/router'
import type { AlbumView } from '../../models/gallery.models'

@Component({
  selector: 'app-album-card',
  imports: [RouterLink],
  templateUrl: './album-card.html',
  styleUrl: './album-card.css',
})
export class AlbumCard {
  readonly album = input.required<AlbumView>()
}
