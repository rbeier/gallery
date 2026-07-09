import type { AlbumId } from './album-id'

export interface Photo {
  id: number
  title: string
  album: AlbumId
  lens: string
  location: string
  /** "YYYY-MM" */
  date: string
  tags: string[]
  /** width / height — drives masonry balance + detail aspect */
  ratio: number
  description: string
  /** Derived CSS gradient placeholder shown behind the image (see util/gradient). */
  grad: string
  /** Resolved image URL at a display-sized format (grid/cover), if any. */
  src?: string
  /** Responsive `srcset` of smaller grid formats (thumbnail…large) with widths. */
  srcset?: string
  /** Higher-res URL (capped at 2000px, not the original) for the full-screen viewer. */
  srcFull?: string
}
