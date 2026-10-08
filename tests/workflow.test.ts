import { test } from 'node:test'
import assert from 'node:assert/strict'
import { checklistService } from '../src/features/checklist/services/mockService.ts'
import { loadWorkspace, storeWorkspace } from '../src/features/checklist/services/storage.ts'
import { buildChecklistWorkbook } from '../src/features/checklist/services/exportChecklist.ts'
import { validateDraft, validateChecklist, type Workspace } from '../src/features/checklist/types.ts'

const storage = new Map<string, string>()
Object.assign(globalThis, {
  window: {
    setTimeout: (callback: () => void) => {
      callback()
      return 0
    },
  },
  localStorage: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  },
})

async function createDraft() {
  const job = await checklistService.upload(null)
  return checklistService.getDraft(job.id)
}

test('draft rejects missing houses, blank/duplicate addresses and invalid zone counts', async () => {
  const draft = await createDraft()
  assert.deepEqual(validateDraft(draft), [])
  assert.ok(validateDraft({ ...draft, houses: [] }).length)
  for (const count of ['', -1, 0.5, 101, NaN] as const) {
    const copy = structuredClone(draft)
    copy.houses[0].zones.entrance = count
    assert.ok(validateDraft(copy).length)
  }
  draft.houses[1].address = ` ${draft.houses[0].address.toUpperCase()} `
  assert.ok(validateDraft(draft).some((error) => error.includes('повторяется')))
  draft.houses[0].address = ' '
  assert.ok(validateDraft(draft).some((error) => error.includes('укажите адрес')))
})

test('generation uses confirmed edited counts and snapshots the draft', async () => {
  const draft = await createDraft()
  draft.houses = [draft.houses[0]]
  draft.houses[0].zones = { entrance: 2, basement: 0, roof: 1, grounds: 0 }
  const job = await checklistService.confirmDraft(draft)
  draft.houses[0].zones.entrance = 99
  const checklist = await checklistService.getChecklist(job.id)
  assert.equal(checklist.items.length, 6)
  assert.equal(checklist.items.filter((item) => item.zone.startsWith('Подъезды')).length, 4)
  assert.ok(checklist.items.every((item) => item.houseId === draft.houses[0].id))
  assert.deepEqual(validateChecklist(checklist), [])
  checklist.items[0].task = ' '
  assert.ok(validateChecklist(checklist).length)
  await assert.rejects(checklistService.getChecklist('missing'))
  await assert.rejects(checklistService.confirmDraft({ ...draft, houses: [] }))
})

test('workspace restores edits and saved state, rejects malformed storage', async () => {
  const draft = await createDraft()
  const job = await checklistService.confirmDraft(draft)
  const checklist = await checklistService.getChecklist(job.id)
  checklist.items[0].note = 'Проверить после ремонта'
  const { savedAt } = await checklistService.saveChecklist(checklist)
  const workspace: Workspace = { version: 1, draft, checklist, step: 'checklist', dirty: false, savedAt }
  storeWorkspace(workspace)
  assert.deepEqual(loadWorkspace(), workspace)
  storage.set('inspecto:workspace:v1', '{broken')
  assert.equal(loadWorkspace(), null)
  storage.set('inspecto:workspace:v1', JSON.stringify({ ...workspace, checklist: { items: [] } }))
  assert.equal(loadWorkspace(), null)
  storeWorkspace(null)
  assert.equal(loadWorkspace(), null)
})

test('Excel round-trip includes all latest edits and treats formulas as plain text', async () => {
  const draft = await createDraft()
  const job = await checklistService.confirmDraft(draft)
  const checklist = await checklistService.getChecklist(job.id)
  checklist.title = 'Проверенный чек-лист'
  checklist.items[0].task = '=1+1'
  checklist.items[0].note = 'Последняя правка'
  const workbook = await buildChecklistWorkbook(checklist, draft)
  const bytes = await workbook.xlsx.writeBuffer()
  const { default: ExcelJS } = await import('exceljs')
  const restored = new ExcelJS.Workbook()
  await restored.xlsx.load(bytes)
  const sheet = restored.getWorksheet('Чек-лист ТО')!
  assert.equal(sheet.rowCount, checklist.items.length + 3)
  assert.equal(sheet.getCell('A1').value, 'Проверенный чек-лист')
  assert.equal(sheet.getCell('B4').value, draft.houses[0].address)
  assert.equal(sheet.getCell('D4').value, '=1+1')
  assert.equal(sheet.getCell('F4').value, 'Последняя правка')
  assert.equal(sheet.getCell('A4').value, 1)
})
