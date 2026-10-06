import { defineComponent } from 'vue'
import { ArrowLeft, UserRound, ShieldCheck, Save, Check } from '@lucide/vue'
import AppDropdown from '../../../components/ui/AppDropdown.vue'
import { useAccount } from '../composables/useAccount'

export default defineComponent({
  components: { ArrowLeft, UserRound, ShieldCheck, Save, Check, AppDropdown },
  setup: useAccount,
})
