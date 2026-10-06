import { defineComponent, reactive, ref } from 'vue'
import { Mic, Square, X, Send, Plus } from '@lucide/vue'
import { useDictation } from '../composables/useDictation'
import { dictationMessages as text } from '../messages'
import AppDropdown from '../../../components/ui/AppDropdown.vue'
import AudioPreview from '../../../components/ui/AudioPreview.vue'
import { useSessionStore } from '../../../stores/session'

export default defineComponent({
  components: { Mic, Square, X, Send, Plus, AppDropdown, AudioPreview },
  props: { description: { type: String, required: true }, disabled: Boolean },
  emits: {
    insert: (value: string) => typeof value === 'string',
    active: (value: boolean) => typeof value === 'boolean',
  },
  setup(props, { emit }) {
    const voice = reactive(useDictation((active) => emit('active', active)))
    voice.language = useSessionStore().user?.dictation_language ?? 'es'
    const notice = ref('')
    function insert() {
      if (props.disabled || voice.state !== 'ready' || !voice.transcript.trim())
        return
      const combined =
        props.description +
        (props.description ? '\n' : '') +
        voice.transcript.trim()
      if ([...combined].length > 20000) {
        voice.error = text.full
        return
      }
      emit('insert', combined)
      notice.value = text.inserted
      void voice.discard()
    }
    function start() {
      notice.value = ''
      void voice.start()
    }
    return { voice, text, notice, insert, start }
  },
})
