import { Component, input } from '@angular/core'
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
}
