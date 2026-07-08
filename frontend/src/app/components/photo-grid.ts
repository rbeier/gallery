import { Component, computed, inject, input } from '@angular/core'
import type { Params } from '@angular/router'
import type { PhotoView } from '../models/gallery.models'
import { ViewportService } from '../services/viewport.service'
import { distribute } from '../util/gallery.util'
import { PhotoTile } from './photo-tile'

@Component({
  selector: 'app-photo-grid',
  imports: [PhotoTile],
  template: `
    <div class="flex items-start gap-[14px]">
      @for (col of columns(); track $index) {
        <div class="flex min-w-0 flex-1 flex-col gap-[14px]">
          @for (photo of col.items; track photo.id) {
            <app-photo-tile [photo]="photo" [linkParams]="linkParams()" />
          }
        </div>
      }
    </div>
  `,
})
export class PhotoGrid {
  private readonly viewport = inject(ViewportService)

  readonly photos = input.required<PhotoView[]>()
  readonly linkParams = input<Params>({})

  protected readonly columns = computed(() => distribute(this.photos(), this.viewport.columns()))
}
