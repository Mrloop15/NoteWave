import { computed, onUnmounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authService } from '../services/auth'
import { authError } from '../errors'
import { authMessages as text } from '../messages'
import { useSessionStore } from '../../../stores/session'
import type { AuthMode } from '../types'

export function useAuthForm(mode: AuthMode) {
  const route = useRoute()
  const router = useRouter()
  const session = useSessionStore()
  const form = reactive({
    name: '',
    email: typeof route.query.email === 'string' ? route.query.email : '',
    password: '',
    password_confirmation: '',
  })
  const busy = ref(false)
  const error = ref('')
  const fields = ref<Record<string, string>>({})
  const success = ref('')
  let mounted = true
  const content = computed(() => text[mode])
  const resetToken =
    typeof route.query.token === 'string' ? route.query.token : ''

  async function submit() {
    if (busy.value) return
    busy.value = true
    error.value = ''
    fields.value = {}
    success.value = ''
    try {
      if (mode === 'forgot') {
        await authService.forgot(form.email)
        if (mounted) success.value = text.recoverySent
      } else if (mode === 'reset') {
        if (!resetToken) {
          error.value = text.invalidLink
          return
        }
        await authService.reset({ ...form, token: resetToken })
        if (mounted) {
          success.value = text.resetDone
          form.password = ''
          form.password_confirmation = ''
          await router.replace({
            path: '/auth/login',
            query: { reset: 'done' },
          })
        }
      } else {
        if (mode === 'register') await authService.register({ ...form })
        else
          await authService.login({
            email: form.email,
            password: form.password,
          })
        if (!mounted) return
        form.password = ''
        form.password_confirmation = ''
        await session.refresh()
        const next =
          typeof route.query.next === 'string' &&
          route.query.next.startsWith('/auth/verify-email?')
            ? route.query.next
            : '/app'
        await router.replace(next)
      }
    } catch (cause) {
      if (mounted) {
        const parsed = authError(cause)
        error.value = parsed.message
        fields.value = parsed.fields
      }
    } finally {
      if (mounted) busy.value = false
    }
  }
  onUnmounted(() => {
    mounted = false
    form.password = ''
    form.password_confirmation = ''
  })
  return {
    form,
    busy,
    error,
    fields,
    success,
    content,
    submit,
    text,
    resetDone: route.query.reset === 'done',
  }
}
