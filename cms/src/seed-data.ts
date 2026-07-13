/**
 * Static seed content loaded once on bootstrap when the database is empty.
 * Photos are generated from the example images in `database/seeders/` — see
 * `seed-generate.ts` and `index.ts`.
 */

export const PHOTOGRAPHER = 'Robin Beier';

export interface SeedAlbum {
  slug: string;
  name: string;
  description: string;
  order: number;
}

export const ALBUMS: SeedAlbum[] = [
  { slug: 'coast', name: 'Coastlines', description: 'Water, salt, and the shifting edges of land.', order: 0 },
  { slug: 'city', name: 'Cities', description: 'Concrete, glass, and the small hours.', order: 1 },
  { slug: 'still', name: 'Still Life', description: 'Objects, arranged and left alone.', order: 2 },
  { slug: 'mount', name: 'Mountains', description: 'Altitude, weather, and a lot of quiet.', order: 3 },
];
