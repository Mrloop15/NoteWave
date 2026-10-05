import { computed, defineComponent } from 'vue'
import { useRoute } from 'vue-router'
import {
  AudioLines,
  CheckCheck,
  LockKeyhole,
  Mic,
  NotebookPen,
  Sprout,
} from '@lucide/vue'
import { messages } from '../app/messages'
import { useServiceHealth } from '../features/operations/composables/useServiceHealth'

export default defineComponent({
  components: { AudioLines, LockKeyhole, Sprout },
  setup() {
    const route = useRoute()
    return {
      connectionFailed: computed(() => route.query.connection === 'failed'),
      messages,
      featureIcons: [NotebookPen, CheckCheck, Mic],
      ...useServiceHealth(),
    }
  },
})
