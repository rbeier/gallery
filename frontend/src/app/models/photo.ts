import type { AlbumId } from './album-id'

export interface Photo {
  id: number
  title: string
  album: AlbumId
  camera: string
  lens: string
  location: string
  /** "YYYY-MM" */
  date: string
  tags: string[]
  /** width / height — drives masonry balance + detail aspect */
  ratio: number
  description: string
  /** CSS gradient placeholder in the prototype; real image URL in production */
  grad: string
  src?: string
  blurhash?: string
}
