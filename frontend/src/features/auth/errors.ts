import { isAxiosError } from 'axios'
import { authMessages as text } from './messages'

export function authError(error: unknown): {
  message: string
  fields: Record<string, string>
} {
  if (!isAxiosError(error)) return { message: text.genericError, fields: {} }
  if (!error.response) return { message: text.offline, fields: {} }
  const status = error.response.status
  if (status === 429) return { message: text.limited, fields: {} }
  if (status === 419 || status === 401)
    return { message: text.expired, fields: {} }
  const fields: Record<string, string> = {}
  if (status === 422) {
    const data = error.response.data as { errors?: Record<string, unknown> }
    for (const [key, value] of Object.entries(data.errors ?? {})) {
      if (Array.isArray(value) && typeof value[0] === 'string')
        fields[key] = value[0]
    }
  }
  return { message: Object.values(fields)[0] ?? text.genericError, fields }
}
