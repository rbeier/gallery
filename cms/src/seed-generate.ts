/**
 * Deterministic caption + metadata generator for seeded photos. Seeded by the
 * image index so repeated seeds produce identical, stable content.
 */

/** mulberry32 — tiny deterministic PRNG. */
function rng(seed: number) {
  let a = seed + 0x6d2b79f5;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NOUNS = [
  'Light', 'Shadow', 'Horizon', 'Silence', 'Drift', 'Stone', 'Water', 'Fog',
  'Ridge', 'Field', 'Passage', 'Threshold', 'Interval', 'Current', 'Haze', 'Verge',
  'Hollow', 'Expanse', 'Fragment', 'Remnant',
];

const MODS = [
  'Quiet', 'Distant', 'Pale', 'Fading', 'First', 'Last', 'Low', 'Still',
  'Broken', 'Soft', 'Cold', 'Golden', 'Hidden', 'Open', 'Slow', 'Grey',
];

const PLACES = [
  'Andalusia, ES', 'Ronda, ES', 'Seville, ES', 'Grazalema, ES', 'Cádiz, ES',
  'Tarifa, ES', 'Málaga, ES', 'Sierra Nevada, ES', 'Córdoba, ES', 'Setenil, ES',
];

const PLACE_COORDS: Record<string, { lat: number; lng: number }> = {
  'Andalusia, ES': { lat: 37.5443, lng: -4.7278 },
  'Ronda, ES': { lat: 36.746, lng: -5.1611 },
  'Seville, ES': { lat: 37.3891, lng: -5.9845 },
  'Grazalema, ES': { lat: 36.7597, lng: -5.3656 },
  'Cádiz, ES': { lat: 36.5271, lng: -6.2886 },
  'Tarifa, ES': { lat: 36.0143, lng: -5.6044 },
  'Málaga, ES': { lat: 36.7213, lng: -4.4213 },
  'Sierra Nevada, ES': { lat: 37.0954, lng: -3.3986 },
  'Córdoba, ES': { lat: 37.8882, lng: -4.7794 },
  'Setenil, ES': { lat: 36.8641, lng: -5.1806 },
};

/** Build the JSON value the google-maps location-picker custom field stores. */
export function locationValue(address: string) {
  return {
    address,
    coordinates: PLACE_COORDS[address] ?? { lat: 0, lng: 0 },
  };
}

const LENSES = ['24mm', '28mm', '35mm', '50mm', '18mm'];

const TAGS = [
  'travel', 'landscape', 'summer', 'stone', 'street', 'architecture', 'light',
  'shadow', 'minimal', 'sky', 'heat', 'town', 'coast', 'hills', 'golden-hour',
];

const SENTENCES = [
  'Shot mid-morning while the streets were still empty and the heat had not yet settled in.',
  'A quiet moment held just long enough to press the shutter.',
  'The light did most of the work here; the frame only had to stay out of its way.',
  'One of those scenes that looked ordinary until it did not.',
  'White walls, hard sun, and a shadow line worth waiting for.',
  'Somewhere between two towns, with nowhere in particular to be.',
  'The kind of view that flattens into colour when the day gets bright enough.',
  'Caught on the way down the hill, half by accident.',
  'A slow afternoon that gave up this one clean composition.',
  'Dust, distance, and a horizon that would not hold still.',
];

function pick<T>(arr: T[], r: () => number): T {
  return arr[Math.floor(r() * arr.length)];
}

function pickN<T>(arr: T[], n: number, r: () => number): T[] {
  const out = new Set<T>();
  while (out.size < n) out.add(pick(arr, r));
  return [...out];
}

export interface GeneratedMeta {
  title: string;
  lens: string;
  location: string;
  date: string;
  tags: string[];
  description: string;
}

/** Build caption + metadata for the photo at `index`. */
export function generateMeta(index: number): GeneratedMeta {
  const r = rng(index * 2654435761);
  const title = `${pick(MODS, r)} ${pick(NOUNS, r)}`;
  const year = 2023;
  const month = String(7 + Math.floor(r() * 2)).padStart(2, '0'); // Jul/Aug 2023
  const day = String(1 + Math.floor(r() * 28)).padStart(2, '0');
  return {
    title,
    lens: pick(LENSES, r),
    location: pick(PLACES, r),
    date: `${year}-${month}-${day}`,
    tags: pickN(TAGS, 2 + Math.floor(r() * 2), r),
    description: pick(SENTENCES, r),
  };
}
