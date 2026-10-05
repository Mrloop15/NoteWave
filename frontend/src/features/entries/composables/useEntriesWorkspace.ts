import { onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import { useSessionStore } from '../../../stores/session'
import { useEntryList } from './useEntryList'
import { useEntryEditor } from './useEntryEditor'
import { entriesService } from '../services/entries'
import { entryError } from '../errors'
import { entryMessages as text } from '../messages'
import type { Entry, EntryFilter } from '../types'

export function useEntriesWorkspace() {
  const session = useSessionStore(),
    router = useRouter()
  const list = reactive(useEntryList()),
    notice = ref(''),
    actionError = ref(''),
    loggingOut = ref(false)
  const editor = reactive(
    useEntryEditor((message) => {
      notice.value = message
      void list.load()
    }),
  )
  const completing = ref<string | null>(null)
  let completionRequest: AbortController | undefined
  const filters: EntryFilter[] = ['all', 'notes', 'pending', 'completed']
  function canComplete(entry: Entry) {
    return (
      !completing.value &&
      !editor.busy &&
      !(editor.current?.id === entry.id && editor.dirty)
    )
  }
  async function complete(entry: Entry) {
    if (!canComplete(entry)) return
    const request = new AbortController()
    completionRequest = request
    completing.value = entry.id
    actionError.value = ''
    notice.value = ''
    try {
      const result = await entriesService.complete(
        entry,
        !entry.completed_at,
        request.signal,
      )
      if (request.signal.aborted) return
      if (editor.current?.id === result.id && !editor.dirty)
        editor.accept(result)
      notice.value = result.completed_at
        ? text.completedNotice
        : text.reopenedNotice
      await list.load()
    } catch (cause) {
      if (!request.signal.aborted) {
        actionError.value = entryError(cause).message
        void list.load()
      }
    } finally {
      if (!request.signal.aborted) completing.value = null
    }
  }
  async function logout() {
    if (!editor.canLeave()) return
    loggingOut.value = true
    actionError.value = ''
    try {
      await session.logout()
      await router.replace('/auth/login')
    } catch (cause) {
      actionError.value = entryError(cause).message
    } finally {
      loggingOut.value = false
    }
  }
  function leave(event: BeforeUnloadEvent) {
    if (editor.dirty || editor.busy || editor.dictationActive) {
      event.preventDefault()
      event.returnValue = ''
    }
  }
  onBeforeRouteLeave(() => !session.user || editor.canLeave())
  watch(
    () => session.user?.id,
    () => {
      completionRequest?.abort()
      completing.value = null
      list.clear()
      editor.clear()
      notice.value = ''
      actionError.value = ''
    },
    { flush: 'sync' },
  )
  onMounted(() => {
    void list.load()
    window.addEventListener('beforeunload', leave)
  })
  onUnmounted(() => {
    completionRequest?.abort()
    window.removeEventListener('beforeunload', leave)
  })
  function date(value: string) {
    return new Intl.DateTimeFormat('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value))
  }
  return {
    session,
    list,
    editor,
    filters,
    text,
    notice,
    actionError,
    loggingOut,
    completing,
    complete,
    canComplete,
    logout,
    date,
  }
}
