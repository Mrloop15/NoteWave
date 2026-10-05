import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { defineComponent, reactive } from 'vue'
import { useDictation } from '../src/features/transcription/composables/useDictation'
import { transcriptionService as api } from '../src/features/transcription/services/transcriptions'
import type { Transcription } from '../src/features/transcription/types'

vi.mock('../src/features/transcription/services/transcriptions', () => ({
  transcriptionService: {
    options: vi.fn(),
    upload: vi.fn(),
    get: vi.fn(),
    discard: vi.fn(),
  },
}))
let wrapper: VueWrapper, voice: ReturnType<typeof makeVoice>
const recorders: FakeRecorder[] = []
const stopTrack = vi.fn(),
  getUserMedia = vi.fn()
const stream = {
  getTracks: () => [{ stop: stopTrack }],
} as unknown as MediaStream
const ready: Transcription = {
  id: '01JOB',
  status: 'ready',
  transcript: 'Ejemplo',
  simulated: true,
  error_code: null,
}
class FakeRecorder {
  static isTypeSupported = () => true
  state = 'inactive'
  mimeType = 'audio/webm'
  ondataavailable: ((event: { data: Blob }) => void) | null = null
  onstop: (() => void) | null = null
  onerror: (() => void) | null = null
  constructor() {
    recorders.push(this)
  }
  start() {
    this.state = 'recording'
  }
  stop() {
    this.state = 'inactive'
    this.ondataavailable?.({ data: new Blob(['audio']) })
    this.onstop?.()
  }
}
function makeVoice() {
  return reactive(useDictation(vi.fn()))
}
beforeEach(async () => {
  vi.resetAllMocks()
  vi.stubGlobal('MediaRecorder', FakeRecorder)
  vi.stubGlobal('isSecureContext', true)
  vi.stubGlobal('URL', {
    createObjectURL: vi.fn(() => 'blob:audio'),
    revokeObjectURL: vi.fn(),
  })
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia },
  })
  getUserMedia.mockResolvedValue(stream)
  vi.mocked(api.options).mockResolvedValue({
    enabled: true,
    simulated: true,
    max_bytes: 1024,
    max_seconds: 120,
    languages: ['es', 'en'],
  })
  vi.mocked(api.discard).mockResolvedValue()
  wrapper = mount(
    defineComponent({
      setup() {
        voice = makeVoice()
        return () => null
      },
    }),
  )
  await flushPromises()
})
afterEach(() => {
  wrapper.unmount()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

it('only requests permission on explicit start and releases a late permission after cancellation', async () => {
  expect(getUserMedia).not.toHaveBeenCalled()
  let resolve!: (stream: MediaStream) => void
  getUserMedia.mockReturnValue(
    new Promise((done) => {
      resolve = done
    }),
  )
  const pending = voice.start()
  await voice.discard()
  resolve(stream)
  await pending
  expect(stopTrack).toHaveBeenCalledOnce()
  expect(voice.state).toBe('idle')
})

it('releases tracks on stop and cleans playback and buffers on discard', async () => {
  await voice.start()
  voice.stop()
  expect(stopTrack).toHaveBeenCalled()
  expect(voice.state).toBe('recorded')
  expect(voice.playback).toBe('blob:audio')
  await voice.discard()
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:audio')
  expect(voice.playback).toBe('')
  await voice.send()
  expect(api.upload).not.toHaveBeenCalled()
})

it('retries the same recording with the same key after a network error', async () => {
  await voice.start()
  voice.stop()
  vi.mocked(api.upload)
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce(ready)
  await voice.send()
  expect(voice.state).toBe('recorded')
  expect(voice.error).toContain('conectar')
  await voice.send()
  expect(vi.mocked(api.upload).mock.calls[0]?.[1]).toBe(
    vi.mocked(api.upload).mock.calls[1]?.[1],
  )
  expect(voice.transcript).toBe('Ejemplo')
  expect(voice.state).toBe('ready')
})

it('discards a late upload instead of restoring it after leaving the editor', async () => {
  let resolve!: (job: Transcription) => void
  vi.mocked(api.upload).mockReturnValue(
    new Promise((done) => {
      resolve = done
    }),
  )
  await voice.start()
  voice.stop()
  const sending = voice.send()
  wrapper.unmount()
  resolve(ready)
  await sending
  expect(api.discard).toHaveBeenCalledWith(ready.id)
  expect(voice.transcript).toBe('')
})

it('handles recorder errors and cancels polling on discard', async () => {
  await voice.start()
  recorders.at(-1)?.onerror?.()
  expect(stopTrack).toHaveBeenCalled()
  expect(voice.state).toBe('idle')
  await voice.start()
  voice.stop()
  vi.useFakeTimers()
  vi.mocked(api.upload).mockResolvedValue({
    ...ready,
    status: 'queued',
    transcript: null,
  })
  await voice.send()
  await voice.discard()
  await vi.advanceTimersByTimeAsync(10_000)
  expect(api.get).not.toHaveBeenCalled()
})
