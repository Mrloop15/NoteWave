import {
  computed,
  nextTick,
  onUnmounted,
  reactive,
  ref,
  type UnwrapNestedRefs,
} from 'vue'
import { entriesService } from '../services/entries'
import { entryError } from '../errors'
import { entryMessages as text } from '../messages'
import type { Entry, EntryDraft, EntryKind } from '../types'

export function useEntryEditor(changed: (message: string) => void) {
  const contextId = ref(0),
    dictationActive = ref(false)
  const current = ref<Entry | null>(null),
    opened = ref(false),
    loading = ref(false),
    busy = ref(false)
  const error = ref(''),
    notice = ref(''),
    conflict = ref(false),
    missing = ref(false),
    fields = ref<Record<string, string>>({})
  const draft = reactive<EntryDraft>({
    kind: 'note',
    title: '',
    description: '',
  })
  const baseline = reactive({ title: '', description: '' })
  const dirty = computed(
    () =>
      opened.value &&
      (draft.title !== baseline.title ||
        draft.description !== baseline.description),
  )
  let request: AbortController | undefined
  let returnFocus: HTMLElement | null = null
  function resetMessages() {
    error.value = ''
    notice.value = ''
    fields.value = {}
    conflict.value = false
    missing.value = false
  }
  function accept(entry: Entry) {
    current.value = entry
    Object.assign(draft, {
      kind: entry.kind,
      title: entry.title,
      description: entry.description,
    })
    baseline.title = entry.title
    baseline.description = entry.description
    resetMessages()
  }
  function setField(field: 'title' | 'description', value: string) {
    draft[field] = value
    notice.value = ''
  }
  function setDictationActive(active: boolean) {
    dictationActive.value = active
  }
  function canLeave() {
    if (busy.value) {
      error.value = text.wait
      return false
    }
    return (
      !(dirty.value || dictationActive.value) ||
      window.confirm(text.confirmDiscard)
    )
  }
  function clear() {
    contextId.value++
    dictationActive.value = false
    request?.abort()
    opened.value = false
    current.value = null
    busy.value = false
    loading.value = false
    Object.assign(draft, { kind: 'note', title: '', description: '' })
    Object.assign(baseline, { title: '', description: '' })
    resetMessages()
  }
  async function focusTitle() {
    await nextTick()
    document.getElementById('entry-title')?.focus()
  }
  function rememberFocus() {
    if (!opened.value)
      returnFocus =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null
  }
  function create(kind: EntryKind) {
    if (!canLeave()) return
    rememberFocus()
    clear()
    opened.value = true
    draft.kind = kind
    void focusTitle()
  }
  function showError(cause: unknown) {
    const result = entryError(cause)
    error.value = result.message
    fields.value = result.fields
    conflict.value = result.conflict
    missing.value = result.missing
  }
  async function fetchEntry(id: string) {
    request?.abort()
    const active = new AbortController()
    request = active
    loading.value = true
    resetMessages()
    try {
      const entry = await entriesService.get(id, active.signal)
      if (!active.signal.aborted) {
        accept(entry)
        void focusTitle()
      }
    } catch (cause) {
      if (!active.signal.aborted) showError(cause)
    } finally {
      if (!active.signal.aborted) loading.value = false
    }
  }
  async function open(entry: Entry) {
    if (current.value?.id === entry.id && opened.value) return
    if (!canLeave()) return
    rememberFocus()
    clear()
    opened.value = true
    // Keep the list snapshot if the detail request fails, without losing its version.
    accept(entry)
    await fetchEntry(entry.id)
  }
  function close() {
    if (!canLeave()) return
    clear()
    void nextTick(() => {
      if (returnFocus?.isConnected) returnFocus.focus()
      else document.getElementById('new-note')?.focus()
    })
  }
  async function reload() {
    if (
      !current.value ||
      busy.value ||
      (dirty.value && !window.confirm(text.confirmReload))
    )
      return
    await fetchEntry(current.value.id)
  }
  async function save(copy = false) {
    if (busy.value || loading.value) return
    if (!draft.title.trim()) {
      fields.value = { title: text.requiredTitle }
      error.value = text.requiredTitle
      return
    }
    request?.abort()
    const active = new AbortController()
    request = active
    busy.value = true
    resetMessages()
    const payload = {
      kind: draft.kind,
      title: draft.title,
      description: draft.description,
    }
    try {
      const result =
        current.value && !copy
          ? await entriesService.update(current.value, payload, active.signal)
          : await entriesService.create(payload, active.signal)
      if (active.signal.aborted) return
      accept(result)
      notice.value = text.saved
      changed(text.saved)
    } catch (cause) {
      if (!active.signal.aborted) showError(cause)
    } finally {
      if (!active.signal.aborted) busy.value = false
    }
  }
  async function remove() {
    if (!current.value || busy.value || !window.confirm(text.confirmDelete))
      return
    request?.abort()
    const active = new AbortController()
    request = active
    busy.value = true
    resetMessages()
    try {
      await entriesService.delete(current.value, active.signal)
      if (active.signal.aborted) return
      clear()
      changed(text.deleted)
      void nextTick(() => document.getElementById('new-note')?.focus())
    } catch (cause) {
      if (!active.signal.aborted) showError(cause)
    } finally {
      if (!active.signal.aborted) busy.value = false
    }
  }
  onUnmounted(clear)
  return {
    contextId,
    dictationActive,
    setDictationActive,
    current,
    opened,
    loading,
    busy,
    draft,
    dirty,
    error,
    notice,
    conflict,
    missing,
    fields,
    create,
    open,
    close,
    reload,
    save,
    remove,
    clear,
    accept,
    canLeave,
    setField,
  }
}
export type EntryEditorState = UnwrapNestedRefs<
  ReturnType<typeof useEntryEditor>
>
