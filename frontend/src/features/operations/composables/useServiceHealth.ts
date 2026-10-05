import { onMounted, onUnmounted, ref } from 'vue'
import { checkHealth } from '../services/health'

export function useServiceHealth() {
  const status = ref<'checking' | 'available' | 'unavailable'>('checking')
  let activeRequest: AbortController | undefined

  async function refresh() {
    activeRequest?.abort()
    const request = new AbortController()
    activeRequest = request
    status.value = 'checking'
    try {
      await checkHealth(request.signal)
      if (!request.signal.aborted) status.value = 'available'
    } catch {
      if (!request.signal.aborted) status.value = 'unavailable'
    }
  }

  onMounted(refresh)
  onUnmounted(() => activeRequest?.abort())
  return { status, refresh }
}
