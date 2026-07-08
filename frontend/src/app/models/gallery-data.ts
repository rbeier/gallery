import type { Album } from './album'
import type { Photo } from './photo'

/** The full dataset the app renders, transferred from server to client. */
export interface GalleryData {
  photos: Photo[]
  albums: Album[]
  photographer: string
}
