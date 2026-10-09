/**
 * Converts a text string into an SEO-friendly URL slug:
 * - Replaces German umlauts (ä->ae, ö->oe, ü->ue, ß->ss)
 * - Strips accents/diacritics
 * - Converts to lowercase
 * - Strips punctuation and symbols, replacing them with single hyphens
 * - Trims hyphens from edges
 */
export function slugify(text: string): string {
  return text
    .replace(/[äÄ]/g, 'ae')
    .replace(/[öÖ]/g, 'oe')
    .replace(/[üÜ]/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Builds the URL route slug for a photo: `${id}-${slugifiedTitle}`.
 * If the title yields an empty slug (e.g. only symbols or empty), returns `${id}`.
 */
export function photoSlug(id: number | string, title?: string | null): string {
  const slug = title ? slugify(title) : ''
  return slug ? `${id}-${slug}` : `${id}`
}
