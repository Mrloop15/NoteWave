import { computed, defineComponent } from 'vue'
import { useRoute } from 'vue-router'
import AuthForm from '../features/auth/components/AuthForm.vue'
import type { AuthMode } from '../features/auth/types'
import { authMessages as text } from '../features/auth/messages'

export default defineComponent({
  components: { AuthForm },
  setup() {
    const route = useRoute()
    return { text, mode: computed(() => route.meta.authMode as AuthMode) }
  },
})
