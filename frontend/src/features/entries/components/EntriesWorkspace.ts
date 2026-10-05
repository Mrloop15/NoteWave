import { defineComponent } from 'vue'
import {
  AudioLines,
  FileText,
  Check,
  CircleCheck,
  Layers,
  Plus,
  Search as SearchIcon,
  LogOut,
  RefreshCw,
  NotebookPen,
} from '@lucide/vue'
import { useEntriesWorkspace } from '../composables/useEntriesWorkspace'
import EntryEditor from './EntryEditor.vue'

export default defineComponent({
  components: {
    AudioLines,
    FileText,
    Check,
    CircleCheck,
    Layers,
    Plus,
    SearchIcon,
    LogOut,
    RefreshCw,
    NotebookPen,
    EntryEditor,
  },
  setup: useEntriesWorkspace,
})
