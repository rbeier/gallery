import type { AlbumId } from './album-id'

export interface Album {
  id: AlbumId
  name: string
  description: string
  /** Editor-chosen cover image URL from the CMS, if set. */
  cover?: string
}
