import { Component, computed, inject, input } from '@angular/core'
import type { Params } from '@angular/router'
import type { PhotoView } from '../../models/photo-view'
import { ViewportService } from '../../services/viewport.service'
import { distribute } from '../../util/distribute'
import { PhotoTile } from '../photo-tile/photo-tile'

@Component({
  selector: 'app-photo-grid',
  imports: [PhotoTile],
  templateUrl: './photo-grid.html',
  styleUrl: './photo-grid.css',
})
export class PhotoGrid {
  private readonly viewport = inject(ViewportService)

  readonly photos = input.required<PhotoView[]>()
  readonly linkParams = input<Params>({})

  protected readonly columns = computed(() => distribute(this.photos(), this.viewport.columns()))
}
