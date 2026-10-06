import { http } from '../../../app/http'
import type { SessionUser } from '../../auth/types'

export interface ProfileInput {
  name: string
  dictation_language: 'es' | 'en'
  timezone: string | null
  profile_version: number
}
export interface PasswordInput {
  current_password: string
  password: string
  password_confirmation: string
}
export const accountService = {
  async get(signal: AbortSignal): Promise<SessionUser> {
    return (await http.get<{ data: SessionUser }>('/api/v1/me', { signal }))
      .data.data
  },
  async options(signal: AbortSignal): Promise<string[]> {
    return (
      await http.get<{ data: { timezones: string[] } }>(
        '/api/v1/account/options',
        { signal },
      )
    ).data.data.timezones
  },
  async profile(
    input: ProfileInput,
    signal: AbortSignal,
  ): Promise<SessionUser> {
    await http.get('/sanctum/csrf-cookie', { signal })
    return (
      await http.patch<{ data: SessionUser }>(
        '/api/v1/account/profile',
        input,
        { signal },
      )
    ).data.data
  },
  async password(input: PasswordInput, signal: AbortSignal): Promise<void> {
    await http.get('/sanctum/csrf-cookie', { signal })
    await http.put('/api/v1/account/password', input, { signal })
  },
}
