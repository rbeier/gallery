import type { MasonryColumn, Photo, PhotoView } from '../models/gallery.models'

const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

/** "Cornwall, UK" -> "Cornwall" */
export function shortLocation(location: string): string {
  return location.split(',')[0].trim()
}

/** "2024-09" -> "Sep 2024" */
export function formatMonth(ym: string): string {
  const [year, month] = ym.split('-')
  return `${MONTHS_SHORT[Number(month) - 1]} ${year}`
}

/** "Leica Q2 · Cornwall" */
export function photoMeta(photo: Photo): string {
  return `${photo.camera} · ${shortLocation(photo.location)}`
}

export function toView(photo: Photo): PhotoView {
  return { ...photo, meta: photoMeta(photo) }
}

/**
 * Balanced-column masonry. Each next item lands in the currently-shortest
 * column, weighted by 1/ratio (taller images add more height). Pure and
 * deterministic so server and client hydrate to the same DOM.
 */
export function distribute(list: PhotoView[], columns: number): MasonryColumn[] {
  const cols: { items: PhotoView[]; weight: number }[] = Array.from({ length: columns }, () => ({
    items: [],
    weight: 0,
  }))
  for (const photo of list) {
    let shortest = 0
    for (let j = 1; j < columns; j++) {
      if (cols[j].weight < cols[shortest].weight) shortest = j
    }
    cols[shortest].items.push(photo)
    cols[shortest].weight += 1 / (photo.ratio || 1)
  }
  return cols.map((c) => ({ items: c.items }))
}
