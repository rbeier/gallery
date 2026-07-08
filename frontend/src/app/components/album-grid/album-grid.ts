import { Component, input } from '@angular/core'
import type { AlbumView } from '../../models/gallery.models'
import { AlbumCard } from '../album-card/album-card'

@Component({
  selector: 'app-album-grid',
  imports: [AlbumCard],
  templateUrl: './album-grid.html',
  styleUrl: './album-grid.css',
})
export class AlbumGrid {
  readonly albums = input.required<AlbumView[]>()
}
