import { http } from '../../../app/http'
import type { DictationOptions, Transcription } from '../types'

export const transcriptionService = {
  async options(signal: AbortSignal): Promise<DictationOptions> {
    return (
      await http.get<{ data: DictationOptions }>(
        '/api/v1/transcriptions/options',
        { signal },
      )
    ).data.data
  },
  async upload(
    audio: Blob,
    key: string,
    language: string,
  ): Promise<Transcription> {
    await http.get('/sanctum/csrf-cookie')
    const form = new FormData()
    form.append('audio', audio, 'dictation.audio')
    form.append('idempotency_key', key)
    form.append('language', language)
    return (
      await http.post<{ data: Transcription }>('/api/v1/transcriptions', form, {
        timeout: 35_000,
      })
    ).data.data
  },
  async get(id: string, signal: AbortSignal): Promise<Transcription> {
    return (
      await http.get<{ data: Transcription }>(`/api/v1/transcriptions/${id}`, {
        signal,
      })
    ).data.data
  },
  async discard(id: string): Promise<void> {
    await http.get('/sanctum/csrf-cookie')
    await http.delete(`/api/v1/transcriptions/${id}`)
  },
}
