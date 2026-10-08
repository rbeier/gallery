import { TestBed } from '@angular/core/testing'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthService } from './auth.service'

describe('AuthService', () => {
  let service: AuthService

  beforeEach(() => {
    localStorage.clear()
    TestBed.configureTestingModule({})
    service = TestBed.inject(AuthService)
  })

  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  describe('in development mode (isDev === true)', () => {
    beforeEach(() => {
      vi.spyOn(service, 'isDev').mockReturnValue(true)
      service.check()
    })

    it('always shows admin link even when localStorage is empty', () => {
      expect(service.isLoggedIn()).toBe(true)
    })

    it('always shows admin link even when localStorage has isLoggedIn = "false"', () => {
      localStorage.setItem('isLoggedIn', 'false')
      service.check()
      expect(service.isLoggedIn()).toBe(true)
    })

    it('points to localhost:1337 in dev mode', () => {
      expect(service.adminUrl()).toBe('http://localhost:1337/admin')
      expect(service.adminUrl('doc-123')).toBe(
        'http://localhost:1337/admin/content-manager/collection-types/api::photo.photo/doc-123',
      )
    })
  })

  describe('in production mode (isDev === false)', () => {
    beforeEach(() => {
      vi.spyOn(service, 'isDev').mockReturnValue(false)
      service.check()
    })

    it('defaults to isLoggedIn = false when localStorage is empty', () => {
      expect(service.isLoggedIn()).toBe(false)
    })

    it('sets isLoggedIn = true when localStorage has isLoggedIn = "true"', () => {
      localStorage.setItem('isLoggedIn', 'true')
      service.check()
      expect(service.isLoggedIn()).toBe(true)
    })

    it('sets isLoggedIn = false when localStorage has isLoggedIn = "false"', () => {
      localStorage.setItem('isLoggedIn', 'false')
      service.check()
      expect(service.isLoggedIn()).toBe(false)
    })

    it('builds general admin URL when no documentId is provided', () => {
      const url = service.adminUrl()
      expect(url).toContain('/admin')
      expect(url).not.toContain('collection-types')
    })

    it('builds specific edit URL when documentId is provided', () => {
      const url = service.adminUrl('doc-12345')
      expect(url).toContain('/admin/content-manager/collection-types/api::photo.photo/doc-12345')
    })
  })
})
