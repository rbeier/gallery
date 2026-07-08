import type { Photo } from './photo'

/** A photo decorated with its display metadata line. */
export interface PhotoView extends Photo {
  meta: string
}
