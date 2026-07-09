import { Component, input } from '@angular/core'
import type { Params } from '@angular/router'
import type { PhotoView } from '../../models/photo-view'
import { PhotoTile } from '../photo-tile/photo-tile'

@Component({
  selector: 'app-photo-grid',
  imports: [PhotoTile],
  templateUrl: './photo-grid.html',
  styleUrl: './photo-grid.css',
})
export class PhotoGrid {
  readonly photos = input.required<PhotoView[]>()
  readonly linkParams = input<Params>({})
}
