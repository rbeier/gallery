import type { MasonryColumn } from '../models/masonry-column'
import type { PhotoView } from '../models/photo-view'

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
