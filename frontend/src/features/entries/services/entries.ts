import { http } from '../../../app/http'
import type { Entry, EntryDraft, EntryFilter, EntryPage } from '../types'

async function csrf() {
  await http.get('/sanctum/csrf-cookie')
}
export const entriesService = {
  async list(
    filter: EntryFilter,
    q: string,
    page: number,
    signal: AbortSignal,
  ): Promise<EntryPage> {
    const params = {
      page,
      per_page: 20,
      ...(q ? { q } : {}),
      ...(filter === 'notes'
        ? { kind: 'note' }
        : filter === 'pending' || filter === 'completed'
          ? { status: filter }
          : {}),
    }
    return (await http.get<EntryPage>('/api/v1/entries', { params, signal }))
      .data
  },
  async get(id: string, signal: AbortSignal): Promise<Entry> {
    return (
      await http.get<{ data: Entry }>(`/api/v1/entries/${id}`, { signal })
    ).data.data
  },
  async create(draft: EntryDraft, signal: AbortSignal): Promise<Entry> {
    await csrf()
    return (
      await http.post<{ data: Entry }>('/api/v1/entries', draft, { signal })
    ).data.data
  },
  async update(
    entry: Entry,
    draft: EntryDraft,
    signal: AbortSignal,
  ): Promise<Entry> {
    await csrf()
    return (
      await http.patch<{ data: Entry }>(
        `/api/v1/entries/${entry.id}`,
        {
          title: draft.title,
          description: draft.description,
          version: entry.version,
        },
        { signal },
      )
    ).data.data
  },
  async complete(
    entry: Entry,
    completed: boolean,
    signal: AbortSignal,
  ): Promise<Entry> {
    await csrf()
    return (
      await http.patch<{ data: Entry }>(
        `/api/v1/entries/${entry.id}/completion`,
        { completed, version: entry.version },
        { signal },
      )
    ).data.data
  },
  async delete(entry: Entry, signal: AbortSignal): Promise<void> {
    await csrf()
    await http.delete(`/api/v1/entries/${entry.id}`, {
      data: { version: entry.version },
      signal,
    })
  },
}
