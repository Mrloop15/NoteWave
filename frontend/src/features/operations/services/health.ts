import { http } from '../../../app/http'

export async function checkHealth(signal: AbortSignal): Promise<void> {
  const { data } = await http.get<unknown>('/health/live', { signal })
  if (
    typeof data !== 'object' ||
    data === null ||
    !('status' in data) ||
    data.status !== 'ok' ||
    !('service' in data) ||
    data.service !== 'notewave'
  ) {
    throw new Error('Unexpected health response')
  }
}
