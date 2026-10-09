import { describe, expect, it } from 'vitest'
import { photoIdFromSlug, photoSlug, slugify } from './slug'

describe('slugify', () => {
  it('converts a regular title to lowercase kebab-case', () => {
    expect(slugify('Low Tide, Cornwall')).toBe('low-tide-cornwall')
  })

  it('transliterates German umlauts and sharp s', () => {
    expect(slugify('Über den Wolken')).toBe('ueber-den-wolken')
    expect(slugify('Weißes Schloss')).toBe('weisses-schloss')
    expect(slugify('Schöne Töne')).toBe('schoene-toene')
    expect(slugify('Äpfel und Bäume')).toBe('aepfel-und-baeume')
  })

  it('strips accents and diacritics', () => {
    expect(slugify('Café au Lait')).toBe('cafe-au-lait')
    expect(slugify('Málaga, España')).toBe('malaga-espana')
  })

  it('replaces multiple punctuation characters and spaces with single dashes', () => {
    expect(slugify('Light / Shadow & Color (2024)...')).toBe('light-shadow-color-2024')
  })

  it('handles empty or whitespace-only strings', () => {
    expect(slugify('')).toBe('')
    expect(slugify('    ')).toBe('')
    expect(slugify('---')).toBe('')
    expect(slugify('!@#$%^')).toBe('')
  })
})

describe('photoSlug', () => {
  it('combines numeric ID and slugified title', () => {
    expect(photoSlug(1, 'Low Tide, Cornwall')).toBe('1-low-tide-cornwall')
    expect(photoSlug(42, 'Salt Flats')).toBe('42-salt-flats')
  })

  it('falls back to numeric ID when title is missing or empty', () => {
    expect(photoSlug(1)).toBe('1')
    expect(photoSlug(2, '')).toBe('2')
    expect(photoSlug(3, null)).toBe('3')
    expect(photoSlug(4, '   ')).toBe('4')
    expect(photoSlug(5, '???')).toBe('5')
  })
})

describe('photoIdFromSlug', () => {
  it('extracts ID from SEO-friendly slugs', () => {
    expect(photoIdFromSlug('1-low-tide-cornwall')).toBe(1)
    expect(photoIdFromSlug('42-salt-flats')).toBe(42)
    expect(photoIdFromSlug('100-long-title-with-numbers-123')).toBe(100)
  })

  it('extracts ID from plain numeric strings', () => {
    expect(photoIdFromSlug('1')).toBe(1)
    expect(photoIdFromSlug('0')).toBe(0)
    expect(photoIdFromSlug('999')).toBe(999)
  })

  it('returns null for non-numeric slugs', () => {
    expect(photoIdFromSlug('')).toBeNull()
    expect(photoIdFromSlug('low-tide-cornwall')).toBeNull()
    expect(photoIdFromSlug('abc')).toBeNull()
    expect(photoIdFromSlug('-1')).toBeNull()
  })
})
