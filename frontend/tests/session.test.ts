import { beforeEach, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { authService } from '../src/features/auth/services/auth'
import { useSessionStore } from '../src/stores/session'
import type { SessionUser } from '../src/features/auth/types'

vi.mock('../src/features/auth/services/auth', () => ({
  authService: { me: vi.fn(), logout: vi.fn() },
}))
const user: SessionUser = {
  id: 1,
  name: 'Ana',
  email: 'ana@example.test',
  email_verified_at: null,
}
beforeEach(() => {
  setActivePinia(createPinia())
  vi.resetAllMocks()
})

it('does not restore private state from a request that finishes after logout', async () => {
  let resolve!: (user: SessionUser) => void
  vi.mocked(authService.me).mockReturnValue(
    new Promise((done) => {
      resolve = done
    }),
  )
  const session = useSessionStore()
  const pending = session.refresh()
  session.clear()
  resolve(user)
  await pending
  expect(session.user).toBeNull()
})

it('keeps the session visible if logout fails so the user can retry', async () => {
  const session = useSessionStore()
  session.user = user
  vi.mocked(authService.logout).mockRejectedValue(new Error('Offline'))
  await expect(session.logout()).rejects.toThrow('Offline')
  expect(session.user?.id).toBe(user.id)
})

it('clears account state once logout succeeds', async () => {
  const session = useSessionStore()
  session.user = user
  vi.mocked(authService.logout).mockResolvedValue()
  await session.logout()
  expect(session.user).toBeNull()
})
