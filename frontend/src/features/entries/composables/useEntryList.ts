import { onUnmounted, ref } from 'vue'
import { entriesService } from '../services/entries'
import { entryError } from '../errors'
import type { Entry, EntryFilter } from '../types'

export function useEntryList() {
  const rows = ref<Entry[]>([]),
    filter = ref<EntryFilter>('all'),
    search = ref(''),
    query = ref('')
  const page = ref(1),
    lastPage = ref(1),
    total = ref(0),
    loading = ref(false),
    error = ref('')
  let active: AbortController | undefined
  function clear() {
    active?.abort()
    rows.value = []
    search.value = ''
    query.value = ''
    total.value = 0
    loading.value = false
    error.value = ''
  }
  async function load() {
    active?.abort()
    const request = new AbortController()
    active = request
    loading.value = true
    error.value = ''
    rows.value = []
    try {
      const result = await entriesService.list(
        filter.value,
        query.value,
        page.value,
        request.signal,
      )
      if (request.signal.aborted) return
      if (page.value > result.meta.last_page) {
        page.value = Math.max(1, result.meta.last_page)
        await load()
        return
      }
      rows.value = result.data
      total.value = result.meta.total
      lastPage.value = result.meta.last_page
    } catch (cause) {
      if (!request.signal.aborted) error.value = entryError(cause).message
    } finally {
      if (!request.signal.aborted) loading.value = false
    }
  }
  function choose(next: EntryFilter) {
    filter.value = next
    page.value = 1
    void load()
  }
  function find() {
    query.value = search.value.trim()
    page.value = 1
    void load()
  }
  function resetSearch() {
    search.value = ''
    find()
  }
  function go(next: number) {
    if (loading.value || next < 1 || next > lastPage.value) return
    page.value = next
    void load()
  }
  onUnmounted(clear)
  return {
    rows,
    filter,
    search,
    query,
    page,
    lastPage,
    total,
    loading,
    error,
    load,
    choose,
    find,
    resetSearch,
    go,
    clear,
  }
}
