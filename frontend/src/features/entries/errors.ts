import { isAxiosError } from 'axios'
import { entryMessages as text } from './messages'

export function entryError(cause: unknown) {
  const status = isAxiosError(cause) ? cause.response?.status : undefined
  const fields: Record<string, string> = {}
  if (isAxiosError(cause) && status === 422) {
    const data = cause.response?.data as { errors?: Record<string, unknown> }
    for (const [key, value] of Object.entries(data.errors ?? {})) {
      if (Array.isArray(value) && typeof value[0] === 'string')
        fields[key] = value[0]
    }
  }
  const message =
    status === 409
      ? text.conflict
      : status === 404
        ? text.missing
        : status === 401 || status === 419
          ? text.expired
          : status === 403
            ? text.forbidden
            : status === 429
              ? text.limited
              : isAxiosError(cause) && !cause.response
                ? text.offline
                : (Object.values(fields)[0] ?? text.genericError)
  return { message, fields, conflict: status === 409, missing: status === 404 }
}
