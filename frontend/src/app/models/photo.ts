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
  /** Resolved image URL from the CMS media, if any. */
  src?: string
}
