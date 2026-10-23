import type { Workspace } from '../types.ts'
import { zoneTypes } from '../types.ts'
const key = 'inspecto:workspace:v1'

export function loadWorkspace(): Workspace | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const value = JSON.parse(raw)
    if (
      value.version !== 1 ||
      !['draft', 'checklist'].includes(value.step) ||
      typeof value.draft?.id !== 'string' ||
      typeof value.draft?.fileName !== 'string' ||
      !Array.isArray(value.draft?.houses) ||
      !value.draft.houses.every(
        (h: Workspace['draft']['houses'][number]) =>
          typeof h?.id === 'string' &&
          typeof h.address === 'string' &&
          (!h.quantities || Object.values(h.quantities).every((n) => typeof n === 'number' && Number.isFinite(n))) &&
          (!h.assignments || Object.values(h.assignments).every((v) => typeof v === 'string')) &&
          zoneTypes.every((z) => h.zones && (h.zones[z.id] === '' || typeof h.zones[z.id] === 'number'))
      )
    )
      return null
    if (
      value.checklist !== null &&
      (typeof value.checklist?.id !== 'string' ||
        typeof value.checklist?.title !== 'string' ||
        !Array.isArray(value.checklist?.items) ||
        !value.checklist.items.every(
          (item: Record<string, unknown>) =>
            ['id', 'houseId', 'zone', 'task', 'frequency', 'note'].every((k) => typeof item?.[k] === 'string') &&
            value.draft.houses.some((h: { id: string }) => h.id === item.houseId)
        ))
    )
      return null
    if (value.step === 'checklist' && !value.checklist) return null
    if (
      typeof value.dirty !== 'boolean' ||
      (value.savedAt !== null && (typeof value.savedAt !== 'string' || !Number.isFinite(Date.parse(value.savedAt))))
    )
      return null
    return value as Workspace
  } catch {
    return null
  }
}
export function storeWorkspace(workspace: Workspace | null) {
  if (workspace) localStorage.setItem(key, JSON.stringify(workspace))
  else localStorage.removeItem(key)
}
