import type { Photo } from '../models/photo'
import type { PhotoView } from '../models/photo-view'
import { photoMeta } from './photo-meta'

export function toView(photo: Photo): PhotoView {
  return { ...photo, meta: photoMeta(photo) }
}
