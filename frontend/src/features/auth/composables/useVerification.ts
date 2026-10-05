import { onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSessionStore } from '../../../stores/session'
import { authService } from '../services/auth'
import { authError } from '../errors'
import { authMessages as text } from '../messages'

export function useVerification() {
  const route = useRoute()
  const router = useRouter()
  const session = useSessionStore()
  const busy = ref(false),
    error = ref(''),
    message = ref(''),
    cooldown = ref(0)
  let timer: ReturnType<typeof setInterval> | undefined
  let mounted = true
  async function run(action: () => Promise<void>) {
    if (busy.value) return
    busy.value = true
    error.value = ''
    message.value = ''
    try {
      await action()
    } catch (cause) {
      if (mounted) error.value = authError(cause).message
    } finally {
      if (mounted) busy.value = false
    }
  }
  async function check() {
    await run(async () => {
      await session.refresh()
      if (!mounted) return
      if (session.user?.email_verified_at) await router.replace('/app')
      else message.value = text.notVerified
    })
  }
  async function resend() {
    if (cooldown.value > 0) return
    await run(async () => {
      await authService.resend()
      if (!mounted) return
      message.value = text.sent
      cooldown.value = 60
      timer = setInterval(() => {
        if (--cooldown.value <= 0) clearInterval(timer)
      }, 1000)
    })
  }
  const logout = () =>
    run(async () => {
      await session.logout()
      await router.replace('/auth/login')
    })
  onMounted(async () => {
    const link = route.query.verification
    if (typeof link !== 'string') return
    busy.value = true
    try {
      await authService.verify(link)
      await session.refresh()
      if (mounted) await router.replace('/app')
    } catch {
      if (mounted) error.value = text.wrongVerification
    } finally {
      if (mounted) busy.value = false
    }
  })
  onUnmounted(() => {
    mounted = false
    clearInterval(timer)
  })
  return {
    session,
    busy,
    error,
    message,
    cooldown,
    check,
    resend,
    logout,
    text,
  }
}
