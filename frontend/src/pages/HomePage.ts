import { defineComponent } from 'vue'
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
    return {
      messages,
      featureIcons: [NotebookPen, CheckCheck, Mic],
      ...useServiceHealth(),
    }
  },
})
