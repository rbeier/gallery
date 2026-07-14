import type { Photo } from '../models/photo'
import { shortLocation } from './short-location'

/** "28mm · Cornwall" (drops either part when unknown, no dangling separator) */
export function photoMeta(photo: Photo): string {
  const place = shortLocation(photo.location)
  return [photo.lens, place].filter(Boolean).join(' · ')
}
