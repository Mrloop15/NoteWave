import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { defineComponent, reactive } from 'vue'
import { useAccount } from '../src/features/account/composables/useAccount'
import { accountService } from '../src/features/account/services/account'
import { useSessionStore } from '../src/stores/session'
import { formatEntryDate } from '../src/features/entries/formatEntryDate'
import type { SessionUser } from '../src/features/auth/types'

vi.mock('vue-router', () => ({ onBeforeRouteLeave: vi.fn() }))
vi.mock('../src/features/account/services/account', () => ({
  accountService: {
    get: vi.fn(),
    options: vi.fn(),
    profile: vi.fn(),
    password: vi.fn(),
  },
}))
const user: SessionUser = {
  id: 1,
  name: 'Ana',
  email: 'ana@example.test',
  email_verified_at: '2026-10-05T00:00:00Z',
  dictation_language: 'es',
  timezone: null,
  profile_version: 1,
}
let wrapper: VueWrapper, account: ReturnType<typeof makeAccount>
function makeAccount() {
  return reactive(useAccount())
}
beforeEach(async () => {
  vi.resetAllMocks()
  setActivePinia(createPinia())
  useSessionStore().user = { ...user }
  vi.mocked(accountService.options).mockResolvedValue(['UTC', 'Asia/Tokyo'])
  wrapper = mount(
    defineComponent({
      setup() {
        account = makeAccount()
        return () => null
      },
    }),
  )
  await flushPromises()
})
afterEach(() => {
  wrapper.unmount()
  vi.restoreAllMocks()
})

it('keeps a conflicting profile draft without overwriting the session', async () => {
  account.form.name = 'Mi edición'
  vi.mocked(accountService.profile).mockRejectedValue({
    isAxiosError: true,
    response: { status: 409 },
  })
  await account.save()
  expect(account.conflict).toBe(true)
  expect(account.form.name).toBe('Mi edición')
  expect(useSessionStore().user?.name).toBe('Ana')
  expect(account.dirty).toBe(true)
})
it('applies saved preferences and sends automatic timezone as null', async () => {
  account.form.name = 'Actualizado'
  vi.mocked(accountService.profile).mockResolvedValue({
    ...user,
    name: 'Actualizado',
    profile_version: 2,
  })
  await account.save()
  expect(accountService.profile).toHaveBeenCalledWith(
    expect.objectContaining({ timezone: null, profile_version: 1 }),
    expect.any(AbortSignal),
  )
  expect(useSessionStore().user?.name).toBe('Actualizado')
  expect(account.form.profile_version).toBe(2)
  expect(account.dirty).toBe(false)
})
it('does not restore account information after the session clears during a save', async () => {
  let resolve!: (user: SessionUser) => void
  vi.mocked(accountService.profile).mockReturnValue(
    new Promise((done) => {
      resolve = done
    }),
  )
  account.form.name = 'Late'
  const saving = account.save()
  useSessionStore().clear()
  resolve({ ...user, name: 'Late' })
  await saving
  expect(useSessionStore().user).toBeNull()
  expect(account.form.name).toBe('')
})
it('clears all password inputs after a failed submission', async () => {
  Object.assign(account.password, {
    current_password: 'old private phrase',
    password: 'new private phrase',
    password_confirmation: 'new private phrase',
  })
  vi.mocked(accountService.password).mockRejectedValue({
    isAxiosError: true,
    response: {
      status: 422,
      data: { errors: { current_password: ['Contraseña incorrecta'] } },
    },
  })
  await account.changePassword()
  expect(Object.values(account.password)).toEqual(['', '', ''])
  expect(account.passwordFields.current_password).toBe('Contraseña incorrecta')
})
it('uses the selected timezone at a day boundary and falls back for unsupported zones', () => {
  const instant = '2026-10-05T01:00:00Z'
  expect(formatEntryDate(instant, 'Asia/Tokyo')).toContain('5 oct')
  expect(formatEntryDate(instant, 'America/Los_Angeles')).toContain('4 oct')
  expect(formatEntryDate(instant, 'Unavailable/Zone')).toBe(
    formatEntryDate(instant),
  )
})
it('retains the draft and session if reloading the profile fails offline', async () => {
  account.form.name = 'Borrador local'
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  vi.mocked(accountService.get).mockRejectedValue({ isAxiosError: true })
  await account.reload()
  expect(account.form.name).toBe('Borrador local')
  expect(useSessionStore().user?.id).toBe(user.id)
  expect(account.error).not.toBe('')
})
