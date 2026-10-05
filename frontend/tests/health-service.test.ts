import { afterEach, expect, it, vi } from 'vitest'
import { http } from '../src/app/http'
import { checkHealth } from '../src/features/operations/services/health'

afterEach(() => vi.restoreAllMocks())

it('rejects an HTML fallback instead of showing a healthy service', async () => {
  vi.spyOn(http, 'get').mockResolvedValue({ data: '<html>SPA fallback</html>' })
  await expect(checkHealth(new AbortController().signal)).rejects.toThrow(
    'Unexpected health response',
  )
})

it('accepts the documented health response', async () => {
  vi.spyOn(http, 'get').mockResolvedValue({
    data: { status: 'ok', service: 'notewave' },
  })
  await expect(
    checkHealth(new AbortController().signal),
  ).resolves.toBeUndefined()
})
