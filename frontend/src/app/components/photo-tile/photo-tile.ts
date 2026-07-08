import { Component, input } from '@angular/core'
import { type Params, RouterLink } from '@angular/router'
import type { PhotoView } from '../../models/photo-view'

@Component({
  selector: 'app-photo-tile',
  imports: [RouterLink],
  templateUrl: './photo-tile.html',
  styleUrl: './photo-tile.css',
})
export class PhotoTile {
  readonly photo = input.required<PhotoView>()
  readonly linkParams = input<Params>({})
}
