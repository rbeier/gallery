import type { Album } from './album'

/** Album enriched with derived cover + count, computed by GalleryService. */
export interface AlbumView extends Album {
  count: number
  /** Cover image URL: the editor's choice, else the first photo's image. */
  cover?: string
  /** Gradient placeholder shown behind the cover while it loads / when absent. */
  grad?: string
}
