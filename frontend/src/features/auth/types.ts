export interface SessionUser {
  id: number
  name: string
  email: string
  email_verified_at: string | null
}

export type AuthMode = 'login' | 'register' | 'forgot' | 'reset'
export interface Credentials {
  email: string
  password: string
}
export interface Registration extends Credentials {
  name: string
  password_confirmation: string
}
export interface PasswordReset extends Credentials {
  token: string
  password_confirmation: string
}
