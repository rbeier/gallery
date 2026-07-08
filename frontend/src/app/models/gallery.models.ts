export type AlbumId = 'coast' | 'city' | 'still' | 'mount'

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

export interface Album {
  id: AlbumId
  name: string
  description: string
}

/** Album enriched with derived cover + count, computed by GalleryService. */
export interface AlbumView extends Album {
  count: number
  cover?: string
}

/** A photo decorated with its position inside an ordered viewing list. */
export interface PhotoView extends Photo {
  meta: string
}

export type FacetKind = 'tag' | 'camera' | 'place' | 'year'

export interface FacetGroup {
  kind: FacetKind
  label: string
  options: string[]
}

export interface MasonryColumn {
  items: PhotoView[]
}
