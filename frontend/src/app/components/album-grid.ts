import { Component, input } from '@angular/core'
import type { AlbumView } from '../models/gallery.models'
import { AlbumCard } from './album-card'

@Component({
  selector: 'app-album-grid',
  imports: [AlbumCard],
  template: `
    <div class="grid grid-cols-2 gap-4 d:grid-cols-3 d:gap-7">
      @for (album of albums(); track album.id) {
        <app-album-card [album]="album" />
      }
    </div>
  `,
})
export class AlbumGrid {
  readonly albums = input.required<AlbumView[]>()
}
