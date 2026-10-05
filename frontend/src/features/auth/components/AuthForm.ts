import { defineComponent, type PropType } from 'vue'
import type { AuthMode } from '../types'
import { useAuthForm } from '../composables/useAuthForm'

export default defineComponent({
  props: { mode: { type: String as PropType<AuthMode>, required: true } },
  setup: (props) => useAuthForm(props.mode),
})
