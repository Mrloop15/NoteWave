import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { isAxiosError } from 'axios'
import { transcriptionService as api } from '../services/transcriptions'
import { dictationMessages as text } from '../messages'
import type { DictationOptions, DictationState, Transcription } from '../types'

export function useDictation(activeChanged: (active: boolean) => void) {
  const options = ref<DictationOptions | null>(null)
  const state = ref<DictationState>('idle'),
    error = ref(''),
    transcript = ref(''),
    language = ref('es')
  const seconds = ref(0),
    playback = ref(''),
    jobId = ref('')
  const supported = ref(false)
  const active = computed(() => state.value !== 'idle')
  let generation = 0,
    recorder: MediaRecorder | undefined,
    stream: MediaStream | undefined
  let chunks: Blob[] = [],
    audio: Blob | undefined,
    key = '',
    bytes = 0
  let clock: ReturnType<typeof setInterval> | undefined,
    pollTimer: ReturnType<typeof setTimeout> | undefined
  let request: AbortController | undefined
  const initial = new AbortController()
  watch(active, activeChanged, { flush: 'sync' })

  function release() {
    if (clock) clearInterval(clock)
    clock = undefined
    stream?.getTracks().forEach((track) => track.stop())
    stream = undefined
  }
  function clearLocal() {
    generation++
    request?.abort()
    if (pollTimer) clearTimeout(pollTimer)
    if (recorder) {
      recorder.onstop = null
      recorder.ondataavailable = null
      recorder.onerror = null
      if (recorder.state !== 'inactive') recorder.stop()
    }
    recorder = undefined
    release()
    chunks = []
    audio = undefined
    bytes = 0
    key = ''
    if (playback.value) URL.revokeObjectURL(playback.value)
    playback.value = ''
    transcript.value = ''
    seconds.value = 0
    state.value = 'idle'
    error.value = ''
  }
  async function discard() {
    const id = jobId.value
    clearLocal()
    jobId.value = ''
    const own = generation
    if (id) {
      try {
        await api.discard(id)
      } catch {
        if (own === generation) {
          jobId.value = id
          error.value = text.cleanup
        }
      }
    }
  }
  function stop() {
    if (recorder?.state === 'recording') {
      state.value = 'stopping'
      recorder.stop()
      release()
    }
  }
  async function start() {
    if (
      !options.value?.enabled ||
      !supported.value ||
      active.value ||
      jobId.value
    )
      return
    error.value = ''
    state.value = 'permission'
    const own = ++generation
    try {
      const acquired = await navigator.mediaDevices.getUserMedia({
        audio: true,
      })
      if (own !== generation) {
        acquired.getTracks().forEach((track) => track.stop())
        return
      }
      stream = acquired
      const mime = [
        'audio/webm;codecs=opus',
        'audio/mp4',
        'audio/ogg;codecs=opus',
      ].find((type) => MediaRecorder.isTypeSupported(type))
      recorder = new MediaRecorder(stream, {
        ...(mime ? { mimeType: mime } : {}),
        audioBitsPerSecond: 64000,
      })
      const instance = recorder
      const started = performance.now()
      instance.ondataavailable = (event) => {
        if (own !== generation) return
        bytes += event.data.size
        if (bytes > (options.value?.max_bytes ?? 0)) {
          clearLocal()
          error.value = text.tooLarge
          return
        }
        if (event.data.size) chunks.push(event.data)
      }
      instance.onerror = () => {
        if (own === generation) {
          clearLocal()
          error.value = text.failed
        }
      }
      instance.onstop = () => {
        if (own !== generation) return
        release()
        audio = new Blob(chunks, { type: instance.mimeType })
        chunks = []
        recorder = undefined
        if (!audio.size) {
          clearLocal()
          error.value = text.empty
          return
        }
        key = crypto.randomUUID()
        playback.value = URL.createObjectURL(audio)
        state.value = 'recorded'
      }
      instance.start(250)
      state.value = 'recording'
      clock = setInterval(() => {
        seconds.value = Math.floor((performance.now() - started) / 1000)
        if (seconds.value >= (options.value?.max_seconds ?? 120)) stop()
      }, 250)
    } catch {
      if (own === generation) {
        clearLocal()
        error.value = text.permissionError
      }
    }
  }
  function failed(cause: unknown) {
    if (isAxiosError(cause)) {
      const data = cause.response?.data as
        { message?: string; errors?: { audio?: string[] } } | undefined
      if (
        cause.response &&
        [409, 413, 422, 429, 503].includes(cause.response.status)
      ) {
        error.value = data?.errors?.audio?.[0] ?? data?.message ?? text.failed
        return
      }
    }
    error.value = text.network
  }
  function consume(result: Transcription, own: number, attempt: number) {
    if (own !== generation) return
    jobId.value = result.id
    if (result.status === 'ready') {
      state.value = 'ready'
      transcript.value = result.transcript ?? ''
      audio = undefined
      if (playback.value) URL.revokeObjectURL(playback.value)
      playback.value = ''
    } else if (result.status === 'queued' || result.status === 'processing') {
      state.value = result.status
      if (attempt >= 30) {
        state.value = 'failed'
        error.value = text.timeout
        return
      }
      pollTimer = setTimeout(
        () => void poll(own, attempt + 1),
        Math.min(1000 + attempt * 250, 4000),
      )
    } else {
      state.value = 'failed'
      error.value =
        result.error_code === 'no_speech' ? text.noSpeech : text.failed
    }
  }
  async function poll(own = generation, attempt = 0) {
    if (!jobId.value || own !== generation) return
    error.value = ''
    request?.abort()
    const current = new AbortController()
    request = current
    try {
      consume(await api.get(jobId.value, current.signal), own, attempt)
    } catch (cause) {
      if (own === generation && !current.signal.aborted) {
        state.value = 'failed'
        failed(cause)
      }
    }
  }
  async function send() {
    if (!audio || state.value !== 'recorded') return
    const own = generation
    state.value = 'uploading'
    error.value = ''
    try {
      // Do not abort an upload on navigation: consume its ID and immediately discard its result.
      const result = await api.upload(audio, key, language.value)
      if (own !== generation) {
        void api.discard(result.id).catch(() => undefined)
        return
      }
      consume(result, own, 0)
    } catch (cause) {
      if (own === generation) {
        state.value = 'recorded'
        failed(cause)
      }
    }
  }
  function visibility() {
    if (document.hidden) stop()
  }
  onMounted(async () => {
    supported.value =
      !!navigator.mediaDevices?.getUserMedia &&
      typeof MediaRecorder !== 'undefined' &&
      window.isSecureContext
    document.addEventListener('visibilitychange', visibility)
    try {
      const result = await api.options(initial.signal)
      if (!initial.signal.aborted) options.value = result
    } catch {
      if (!initial.signal.aborted) error.value = text.unavailable
    }
  })
  onUnmounted(() => {
    initial.abort()
    document.removeEventListener('visibilitychange', visibility)
    void discard()
    activeChanged(false)
  })
  return {
    options,
    state,
    error,
    transcript,
    language,
    seconds,
    playback,
    jobId,
    supported,
    active,
    start,
    stop,
    send,
    discard,
    poll,
  }
}
