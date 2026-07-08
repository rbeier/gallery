import type { Album } from './album'

/** Album enriched with derived cover + count, computed by GalleryService. */
export interface AlbumView extends Album {
  count: number
  cover?: string
}
