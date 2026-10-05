import { defineStore } from 'pinia'
import { ref } from 'vue'
import { isAxiosError } from 'axios'
import { authService } from '../features/auth/services/auth'
import type { SessionUser } from '../features/auth/types'

export const sessionChannel =
  typeof window !== 'undefined' && 'BroadcastChannel' in window
    ? new BroadcastChannel('notewave-session')
    : null

export const useSessionStore = defineStore('session', () => {
  const user = ref<SessionUser | null>(null)
  let generation = 0
  function clear() {
    generation++
    user.value = null
  }
  async function refresh() {
    const requestGeneration = ++generation
    try {
      const result = await authService.me()
      if (generation === requestGeneration) user.value = result
    } catch (error) {
      if (generation === requestGeneration) user.value = null
      if (!isAxiosError(error) || error.response?.status !== 401) throw error
    }
  }
  async function logout() {
    try {
      await authService.logout()
    } catch (error) {
      if (!isAxiosError(error) || error.response?.status !== 401) throw error
    }
    clear()
    sessionChannel?.postMessage('logout')
  }
  return { user, refresh, clear, logout }
})
