import type { Photo } from '../models/photo'

/** "28mm · Cornwall" */
export function photoMeta(photo: Photo): string {
  const place = photo.location
  return photo.lens ? `${photo.lens} · ${place}` : place
}
