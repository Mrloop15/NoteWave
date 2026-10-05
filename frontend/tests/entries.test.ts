import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, reactive } from 'vue'
import {
  useEntryEditor,
  type EntryEditorState,
} from '../src/features/entries/composables/useEntryEditor'
import { useEntryList } from '../src/features/entries/composables/useEntryList'
import { entriesService } from '../src/features/entries/services/entries'
import type { Entry, EntryPage } from '../src/features/entries/types'

vi.mock('../src/features/entries/services/entries', () => ({
  entriesService: {
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    list: vi.fn(),
  },
}))
const entry: Entry = {
  id: '01ABC',
  kind: 'note',
  title: 'Original',
  description: 'Texto',
  version: 1,
  completed_at: null,
  created_at: '2026-10-05T00:00:00Z',
  updated_at: '2026-10-05T00:00:00Z',
}
let wrapper: VueWrapper
let editor: EntryEditorState
function harness(initialize: () => void) {
  return mount(
    defineComponent({
      setup() {
        initialize()
        return () => null
      },
    }),
  )
}
beforeEach(() => {
  vi.resetAllMocks()
  wrapper = harness(() => {
    editor = reactive(useEntryEditor(vi.fn()))
  })
  vi.mocked(entriesService.get).mockResolvedValue(entry)
})
afterEach(() => {
  wrapper.unmount()
  vi.restoreAllMocks()
})

it('preserves a conflicting draft and requires confirmation before reloading', async () => {
  await editor.open(entry)
  editor.setField('description', 'Mi borrador')
  vi.mocked(entriesService.update).mockRejectedValue({
    isAxiosError: true,
    response: { status: 409 },
  })
  await editor.save()
  expect(editor.conflict).toBe(true)
  expect(editor.draft.description).toBe('Mi borrador')
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
  await editor.reload()
  expect(editor.dirty).toBe(true)
  confirm.mockReturnValue(true)
  await editor.reload()
  expect(editor.draft.description).toBe('Texto')
  expect(editor.dirty).toBe(false)
})

it('keeps drafts on network failure and cancels closing when discard is declined', async () => {
  editor.create('task')
  editor.setField('title', 'Pendiente')
  vi.mocked(entriesService.create).mockRejectedValue({ isAxiosError: true })
  await editor.save()
  expect(editor.error).toContain('conectar')
  expect(editor.draft.title).toBe('Pendiente')
  vi.spyOn(window, 'confirm').mockReturnValue(false)
  editor.close()
  expect(editor.opened).toBe(true)
})

it('does not restore a private draft when a save finishes after clearing the session', async () => {
  let resolve!: (entry: Entry) => void
  vi.mocked(entriesService.create).mockReturnValue(
    new Promise((done) => {
      resolve = done
    }),
  )
  editor.create('note')
  editor.setField('title', 'Privada')
  const saving = editor.save()
  editor.clear()
  resolve(entry)
  await saving
  expect(editor.current).toBeNull()
  expect(editor.draft.title).toBe('')
  expect(editor.opened).toBe(false)
})

it('can recover a deleted entry as a new copy', async () => {
  await editor.open(entry)
  editor.setField('description', 'Recuperar')
  vi.mocked(entriesService.update).mockRejectedValue({
    isAxiosError: true,
    response: { status: 404 },
  })
  await editor.save()
  expect(editor.missing).toBe(true)
  vi.mocked(entriesService.create).mockResolvedValue({
    ...entry,
    id: '02NEW',
    description: 'Recuperar',
  })
  await editor.save(true)
  expect(editor.current?.id).toBe('02NEW')
  expect(editor.dirty).toBe(false)
})

it('ignores stale list results and clears pending private requests', async () => {
  let list!: ReturnType<typeof useEntryList>
  wrapper.unmount()
  wrapper = harness(() => {
    list = useEntryList()
  })
  let resolve!: (page: EntryPage) => void
  vi.mocked(entriesService.list).mockReturnValueOnce(
    new Promise((done) => {
      resolve = done
    }),
  )
  const page = {
    data: [entry],
    meta: { current_page: 1, last_page: 1, total: 1, per_page: 20 },
  }
  const old = list.load()
  vi.mocked(entriesService.list).mockResolvedValue({
    ...page,
    data: [],
    meta: { ...page.meta, total: 0 },
  })
  await list.load()
  resolve(page)
  await old
  expect(list.rows.value).toEqual([])
  list.clear()
  expect(list.query.value).toBe('')
})
