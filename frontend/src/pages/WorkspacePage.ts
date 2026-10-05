import { defineComponent, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionStore } from '../stores/session'
import { authMessages as text } from '../features/auth/messages'
import { authError } from '../features/auth/errors'

export default defineComponent({
  setup() {
    const session = useSessionStore(),
      router = useRouter()
    const busy = ref(false),
      error = ref('')
    async function logout() {
      busy.value = true
      error.value = ''
      try {
        await session.logout()
        await router.replace('/auth/login')
      } catch (cause) {
        error.value = authError(cause).message
      } finally {
        busy.value = false
      }
    }
    return { session, text, busy, error, logout }
  },
})
