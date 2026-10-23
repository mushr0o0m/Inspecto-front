import templates from '../data/plumbing.json' with { type: 'json' }
import { validateDraft, validateChecklist, type Workspace, type House } from '../types.ts'
export const systems = [
  { name: 'Теплоснабжение', key: 'Количество зон|Система теплоснабжения', room: 'ИТП' },
  { name: 'ГВС', key: 'Количество зон|Система ГВС', room: 'ИТП' },
  { name: 'ХВС', key: 'Количество зон|Система ХВС', room: 'Насосная' },
]
export const assignmentKey = (system: string, index: number) => `${system}:${index + 1}`
export function roomInstances(house: House, room: string) {
  const count = house.quantities?.[`Количество|${room}`] ?? 0
  return Array.from(
    { length: Number.isInteger(count) && count > 0 && count <= 100 ? count : 0 },
    (_, i) => `${room} №${i + 1}`
  )
}
export function roomKeys() {
  return [...new Set(templates.map((t) => `Количество|${t.room === 'Подвал' ? 'Подвал (подъездов)' : t.room}`))]
}
export interface Issue {
  id: string
  level: 'error' | 'warning'
  message: string
  houseId?: string
  itemId?: string
  field?: string
  stage: 'draft' | 'checklist'
}
export function inspectWorkspace(w: Workspace): Issue[] {
  const issues: Issue[] = []
  const add = (issue: Omit<Issue, 'id'>) => issues.push({ ...issue, id: `issue-${issues.length}` })
  validateDraft(w.draft).forEach((message) => add({ level: 'error', message, stage: 'draft' }))
  if (w.draft.plumbing)
    w.draft.houses.forEach((h) => {
      roomKeys().forEach((key) => {
        if (h.quantities?.[key] === undefined)
          add({
            level: 'error',
            message: `${h.address}: не указано количество «${key.split('|')[1]}».`,
            houseId: h.id,
            field: key,
            stage: 'draft',
          })
      })
      systems.forEach((s) => {
        const count = h.quantities?.[s.key]
        if (count === undefined) {
          add({
            level: 'error',
            message: `${h.address}: неизвестно количество зон ${s.name}.`,
            houseId: h.id,
            field: s.key,
            stage: 'draft',
          })
          return
        }
        const options = roomInstances(h, s.room)
        if (Number.isInteger(count) && count >= 0 && count <= 100)
          for (let i = 0; i < count; i++) {
            const key = assignmentKey(s.name, i)
            if (!options.includes(h.assignments?.[key] ?? ''))
              add({
                level: 'error',
                message: `${h.address}: ${s.name}, зона ${i + 1} — выберите существующее помещение.`,
                houseId: h.id,
                field: `assignment:${key}`,
                stage: 'draft',
              })
          }
        Object.keys(h.assignments ?? {})
          .filter((k) => k.startsWith(s.name + ':'))
          .forEach((key) => {
            if (Number(key.split(':')[1]) > count)
              add({
                level: 'warning',
                message: `${h.address}: сохранена лишняя привязка ${key}, она не используется.`,
                houseId: h.id,
                field: s.key,
                stage: 'draft',
              })
          })
      })
    })
  if (w.checklist) {
    validateChecklist(w.checklist).forEach((message) =>
      add({ level: 'error', message, stage: 'checklist', field: 'title' })
    )
    const seen = new Set<string>()
    w.checklist.items.forEach((item) => {
      const required = w.draft.plumbing
        ? ['task', 'zone', 'frequency', 'room', 'system', 'unit', 'tolerance']
        : ['task', 'zone', 'frequency']
      required.forEach((field) => {
        if (!String(item[field as keyof typeof item] ?? '').trim())
          add({
            level: 'error',
            message: `Работа «${item.task || 'Без названия'}»: заполните ${fieldNames[field]}.`,
            itemId: item.id,
            field,
            stage: 'checklist',
          })
      })
      if (!w.draft.houses.some((h) => h.id === item.houseId))
        add({
          level: 'error',
          message: 'Для работы не найден дом.',
          itemId: item.id,
          field: 'houseId',
          stage: 'checklist',
        })
      if (w.draft.plumbing)
        for (const field of ['photo', 'attributes'] as const)
          if (!['Да', 'Нет'].includes(item[field] ?? ''))
            add({
              level: 'error',
              message: `Укажите «Да» или «Нет»: ${fieldNames[field]}.`,
              itemId: item.id,
              field,
              stage: 'checklist',
            })
      const key = [item.houseId, item.zone, item.task, item.frequency, item.system, item.unit]
        .map((v) => v?.trim().toLowerCase())
        .join('|')
      if (seen.has(key))
        add({
          level: 'warning',
          message: `Возможный дубль: ${item.task}`,
          itemId: item.id,
          field: 'task',
          stage: 'checklist',
        })
      seen.add(key)
    })
  }
  return issues
}
const fieldNames: Record<string, string> = {
  task: 'состав работ',
  zone: 'экземпляр помещения / зону',
  frequency: 'периодичность',
  room: 'помещение',
  system: 'систему',
  unit: 'узел',
  tolerance: 'погрешность',
  photo: 'фотоотчёт',
  attributes: 'атрибуты',
}
