import { inspectWorkspace } from './quality.ts'
import { parseChessboard, generatePlumbing } from './plumbing.ts'
import { type ChecklistService, type Draft, type Checklist, zoneTypes, validateDraft } from '../types.ts'

const wait = () => new Promise<void>((resolve) => window.setTimeout(resolve, 650))
const uploads = new Map<string, string>()
const parsed = new Map<string, Draft>()
const generations = new Map<string, Draft>()
const demoTemplate = {
  entrance: ['Осмотреть входную группу', 'Проверить освещение мест общего пользования'],
  basement: ['Проверить состояние помещений', 'Осмотреть инженерные коммуникации'],
  roof: ['Осмотреть кровельное покрытие', 'Проверить водоотвод'],
  grounds: ['Осмотреть состояние покрытия', 'Проверить освещение территории'],
}

/** Demo adapter only. Uploaded bytes are deliberately not parsed or sent anywhere. */
export const checklistService: ChecklistService = {
  async upload(file) {
    await wait()
    const id = crypto.randomUUID()
    if (file) parsed.set(id, await parseChessboard(file))
    uploads.set(id, file?.name ?? 'Шахматка · демонстрационный пример.xlsx')
    return { id }
  },
  async getDraft(jobId) {
    await wait()
    const fileName = uploads.get(jobId)
    if (!fileName) throw new Error('Не удалось найти загрузку. Выберите файл повторно.')
    uploads.delete(jobId)
    const real = parsed.get(jobId)
    if (real) {
      parsed.delete(jobId)
      return real
    }
    return {
      id: crypto.randomUUID(),
      fileName,
      houses: [
        {
          id: crypto.randomUUID(),
          address: 'ул. Садовая, 12',
          zones: { entrance: 4, basement: 1, roof: 1, grounds: 1 },
        },
        {
          id: crypto.randomUUID(),
          address: 'ул. Садовая, 14',
          zones: { entrance: 3, basement: 1, roof: 1, grounds: 1 },
        },
        {
          id: crypto.randomUUID(),
          address: 'ул. Парковая, 8',
          zones: { entrance: 2, basement: 1, roof: 1, grounds: 1 },
        },
      ],
    }
  },
  async confirmDraft(draft) {
    const errors = draft.plumbing
      ? inspectWorkspace({ version: 1, draft, checklist: null, step: 'draft', savedAt: null, dirty: false })
          .filter((i) => i.level === 'error')
          .map((i) => i.message)
      : validateDraft(draft)
    if (errors.length) throw new Error(errors[0])
    await wait()
    const id = crypto.randomUUID()
    generations.set(id, structuredClone(draft))
    return { id }
  },
  async getChecklist(jobId): Promise<Checklist> {
    await wait()
    const draft = generations.get(jobId)
    if (!draft) throw new Error('Не удалось получить чек-лист. Повторите создание.')
    generations.delete(jobId)
    return {
      id: crypto.randomUUID(),
      title: 'Чек-лист технического обслуживания',
      items: draft.plumbing
        ? generatePlumbing(draft)
        : draft.houses.flatMap((house) =>
            zoneTypes.flatMap((zone) =>
              Array.from({ length: Number(house.zones[zone.id]) }, (_, i) =>
                demoTemplate[zone.id].map((task) => ({
                  id: crypto.randomUUID(),
                  houseId: house.id,
                  zone: `${zone.label} · ${i + 1}`,
                  task,
                  frequency: 'Ежемесячно',
                  note: '',
                }))
              ).flat()
            )
          ),
    }
  },
  async saveChecklist(checklist) {
    await wait()
    const savedAt = new Date().toISOString()
    localStorage.setItem('inspecto:last-saved-checklist', JSON.stringify({ checklist, savedAt }))
    return { savedAt }
  },
}
