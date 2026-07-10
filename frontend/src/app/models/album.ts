import type { AlbumId } from './album-id'

export interface Album {
  id: AlbumId
  name: string
  description: string
  /** Editor-chosen cover image URL from the CMS, if set. */
  cover?: string
  /** Tiny blurred placeholder for the editor-chosen cover (LQIP blur-up). */
  coverLqip?: string
  /** Responsive `srcset` for the editor-chosen cover (smaller grid formats). */
  coverSrcset?: string
}
