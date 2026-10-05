export interface DictationOptions {
  enabled: boolean
  simulated: boolean
  max_seconds: number
  max_bytes: number
  languages: string[]
}
export interface Transcription {
  id: string
  status: 'queued' | 'processing' | 'ready' | 'failed' | 'cancelled' | 'expired'
  transcript: string | null
  error_code: string | null
  simulated: boolean
}
export type DictationState =
  | 'idle'
  | 'permission'
  | 'recording'
  | 'stopping'
  | 'recorded'
  | 'uploading'
  | 'queued'
  | 'processing'
  | 'ready'
  | 'failed'
