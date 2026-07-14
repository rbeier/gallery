import { describe, expect, it } from 'vitest'
import type { Photo } from '../models/photo'
import { photoMeta } from './photo-meta'

const photo = (over: Partial<Photo>): Photo => ({
  id: 1,
  title: '',
  album: '' as Photo['album'],
  lens: '',
  location: '',
  date: '',
  tags: [],
  ratio: 1,
  description: '',
  grad: '',
  ...over,
})

describe('photoMeta', () => {
  it('joins lens and location with a separator', () => {
    expect(photoMeta(photo({ lens: '28mm', location: 'Cornwall, UK' }))).toBe('28mm · Cornwall')
  })

  it('drops the trailing separator when location is missing', () => {
    expect(photoMeta(photo({ lens: '28mm', location: '' }))).toBe('28mm')
  })

  it('omits the lens prefix when lens is missing', () => {
    expect(photoMeta(photo({ lens: '', location: 'Cornwall, UK' }))).toBe('Cornwall')
  })

  it('returns an empty string when both are missing', () => {
    expect(photoMeta(photo({ lens: '', location: '' }))).toBe('')
  })
})
