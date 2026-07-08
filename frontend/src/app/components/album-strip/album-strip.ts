import { Component, input } from '@angular/core'
import { RouterLink } from '@angular/router'
import type { AlbumView } from '../../models/album-view'

@Component({
  selector: 'app-album-strip',
  imports: [RouterLink],
  templateUrl: './album-strip.html',
  styleUrl: './album-strip.css',
})
export class AlbumStrip {
  readonly albums = input.required<AlbumView[]>()
}
