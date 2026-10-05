import { http } from '../../../app/http'
import type {
  Credentials,
  Registration,
  PasswordReset,
  SessionUser,
} from '../types'

async function csrf() {
  await http.get('/sanctum/csrf-cookie')
}
async function post(path: string, data?: unknown) {
  await csrf()
  await http.post(path, data)
}

export const authService = {
  async me(): Promise<SessionUser> {
    return (await http.get<{ data: SessionUser }>('/api/v1/me')).data.data
  },
  login: (data: Credentials) => post('/login', data),
  register: (data: Registration) => post('/register', data),
  logout: () => post('/logout'),
  forgot: (email: string) => post('/forgot-password', { email }),
  reset: (data: PasswordReset) => post('/reset-password', data),
  resend: () => post('/email/verification-notification'),
  async verify(path: string) {
    if (
      !/^\/email\/verify\/\d+\/[a-f0-9]{40}\?expires=\d+&signature=[a-f0-9]{64}$/.test(
        path,
      )
    ) {
      throw new Error('invalid-verification-link')
    }
    await http.get(path)
  },
}
