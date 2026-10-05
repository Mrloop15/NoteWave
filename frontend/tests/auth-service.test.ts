import { afterEach, expect, it, vi } from 'vitest'
import { authService } from '../src/features/auth/services/auth'
import { http } from '../src/app/http'

afterEach(() => vi.restoreAllMocks())

it('never follows arbitrary verification URLs from the query string', async () => {
  const get = vi.spyOn(http, 'get')
  for (const url of [
    'https://example.com/steal',
    '//example.com/steal',
    '/api/v1/me',
    '/email/verify/1/invalid',
  ]) {
    await expect(authService.verify(url)).rejects.toThrow(
      'invalid-verification-link',
    )
  }
  expect(get).not.toHaveBeenCalled()
})

it('initializes CSRF before an authentication mutation', async () => {
  const calls: string[] = []
  vi.spyOn(http, 'get').mockImplementation(async (path) => {
    calls.push(path)
    return { data: null }
  })
  vi.spyOn(http, 'post').mockImplementation(async (path) => {
    calls.push(path)
    return { data: null }
  })
  await authService.login({
    email: 'ana@example.test',
    password: 'a long private phrase',
  })
  expect(calls).toEqual(['/sanctum/csrf-cookie', '/login'])
})
