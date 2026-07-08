import type { Photo } from '../models/photo'
import { shortLocation } from './short-location'

/** "28mm · Cornwall" (drops the lens prefix when unknown) */
export function photoMeta(photo: Photo): string {
  const place = shortLocation(photo.location)
  return photo.lens ? `${photo.lens} · ${place}` : place
}
