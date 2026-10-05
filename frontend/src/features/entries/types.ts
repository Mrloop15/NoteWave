export type EntryKind = 'note' | 'task'
export type EntryFilter = 'all' | 'notes' | 'pending' | 'completed'
export interface Entry {
  id: string
  kind: EntryKind
  title: string
  description: string
  completed_at: string | null
  version: number
  created_at: string
  updated_at: string
}
export interface EntryDraft {
  kind: EntryKind
  title: string
  description: string
}
export interface EntryPage {
  data: Entry[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}
