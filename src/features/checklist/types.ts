export const zoneTypes = [
  { id: 'entrance', label: 'Подъезды' },
  { id: 'basement', label: 'Подвалы' },
  { id: 'roof', label: 'Кровли' },
  { id: 'grounds', label: 'Придомовые территории' },
] as const

export type ZoneType = (typeof zoneTypes)[number]['id']
export interface House {
  assignments?: Record<string, string>
  quantities?: Record<string, number>
  sourceNotes?: string
  id: string
  address: string
  zones: Record<ZoneType, number | ''>
}
export interface Draft {
  plumbing?: boolean
  id: string
  fileName: string
  houses: House[]
}
export interface ChecklistItem {
  room?: string
  system?: string
  unit?: string
  tolerance?: string
  photo?: string
  attributes?: string
  source?: string
  id: string
  houseId: string
  zone: string
  task: string
  frequency: string
  note: string
}
export interface Checklist {
  id: string
  title: string
  items: ChecklistItem[]
}
export interface Workspace {
  version: 1
  draft: Draft
  checklist: Checklist | null
  step: 'draft' | 'checklist'
  savedAt: string | null
  dirty: boolean
}
export type Job = { id: string }
export interface ChecklistService {
  upload(file: File | null): Promise<Job>
  getDraft(jobId: string): Promise<Draft>
  confirmDraft(draft: Draft): Promise<Job>
  getChecklist(jobId: string): Promise<Checklist>
  saveChecklist(checklist: Checklist): Promise<{ savedAt: string }>
}

export function zoneCount(house: House) {
  if (house.quantities)
    return Object.entries(house.quantities)
      .filter(([key]) => key.startsWith('Количество зон|'))
      .reduce((sum, [, count]) => sum + count, 0)
  return Object.values(house.zones).reduce<number>((sum, count) => sum + (Number(count) || 0), 0)
}
export function validateDraft(draft: Draft): string[] {
  const errors: string[] = []
  if (!draft.houses.length) errors.push('Добавьте хотя бы один дом.')
  const addresses = new Set<string>()
  draft.houses.forEach((house, index) => {
    if (house.quantities && Object.values(house.quantities).some((n) => !Number.isInteger(n) || n < 0 || n > 100))
      errors.push('Количество помещений и зон должно быть целым числом от 0 до 100.')
    const address = house.address.trim().toLocaleLowerCase()
    if (!address) errors.push(`Дом ${index + 1}: укажите адрес.`)
    else if (addresses.has(address)) errors.push(`Адрес «${house.address.trim()}» повторяется.`)
    addresses.add(address)
    if (Object.values(house.zones).some((n) => n === '' || !Number.isInteger(n) || n < 0 || n > 100)) {
      errors.push(`Дом ${index + 1}: количество зон должно быть целым числом от 0 до 100.`)
    }
    if (!draft.plumbing && zoneCount(house) === 0) errors.push(`Дом ${index + 1}: укажите хотя бы одну зону.`)
  })
  if (draft.houses.reduce((sum, house) => sum + zoneCount(house), 0) > 500) {
    errors.push('В демоверсии можно обработать не более 500 зон за один раз.')
  }
  return errors
}
export function validateChecklist(checklist: Checklist): string[] {
  if (!checklist.title.trim()) return ['Укажите название чек-листа.']
  if (!checklist.items.length) return ['Добавьте хотя бы один пункт чек-листа.']
  if (
    checklist.items.some((item) => !item.houseId || !item.zone.trim() || !item.task.trim() || !item.frequency.trim())
  ) {
    return ['Заполните дом, зону, работу и периодичность во всех пунктах.']
  }
  return []
}
