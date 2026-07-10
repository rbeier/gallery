import type { AlbumId } from './album-id'

export interface Album {
  id: AlbumId
  name: string
  description: string
  /** Editor-chosen cover image URL from the CMS, if set. */
  cover?: string
  /** Inline WebP data-URI blur placeholder for the editor-chosen cover. */
  coverLqip?: string
  /** Responsive `srcset` for the editor-chosen cover (smaller grid formats). */
  coverSrcset?: string
}
