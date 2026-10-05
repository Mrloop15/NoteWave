import { defineComponent } from 'vue'
import { useVerification } from '../features/auth/composables/useVerification'

export default defineComponent({ setup: useVerification })
