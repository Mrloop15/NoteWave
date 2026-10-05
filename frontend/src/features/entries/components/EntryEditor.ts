import { defineComponent, type PropType } from 'vue'
import { X, Trash2, Save, FileText, CircleCheck } from '@lucide/vue'
import type { EntryEditorState } from '../composables/useEntryEditor'
import { entryMessages as text } from '../messages'
import DictationPanel from '../../transcription/components/DictationPanel.vue'

export default defineComponent({
  components: { X, Trash2, Save, FileText, CircleCheck, DictationPanel },
  props: {
    editor: { type: Object as PropType<EntryEditorState>, required: true },
  },
  setup: (props) => ({
    text,
    dictationActive(active: boolean) {
      props.editor.setDictationActive(active)
    },
    insertDictation(value: string) {
      props.editor.setField('description', value)
    },
    input(field: 'title' | 'description', event: Event) {
      props.editor.setField(field, (event.target as HTMLInputElement).value)
    },
  }),
})
