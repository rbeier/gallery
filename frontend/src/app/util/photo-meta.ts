import type { Photo } from '../models/photo'
import { shortLocation } from './short-location'

/** "Leica Q2 · Cornwall" */
export function photoMeta(photo: Photo): string {
  return `${photo.camera} · ${shortLocation(photo.location)}`
}
