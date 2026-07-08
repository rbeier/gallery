import type { Album } from './album'
import type { Photo } from './photo'
import type { Profile } from './profile'

/** The full dataset the app renders, transferred from server to client. */
export interface GalleryData {
  photos: Photo[]
  albums: Album[]
  profile: Profile
}
