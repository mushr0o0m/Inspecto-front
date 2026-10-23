import { test } from 'node:test'
import assert from 'node:assert/strict'
import { inspectWorkspace, roomKeys, systems, assignmentKey } from '../src/features/checklist/services/quality.ts'
import { generatePlumbing } from '../src/features/checklist/services/plumbing.ts'
import { exportRows } from '../src/features/checklist/services/exportRows.ts'
import { buildChecklistWorkbook } from '../src/features/checklist/services/exportChecklist.ts'
import type { Workspace } from '../src/features/checklist/types.ts'
function fixture(): Workspace {
  const q = Object.fromEntries(roomKeys().map((k) => [k, 0]))
  q['Количество|ИТП'] = 2
  q['Количество|Насосная'] = 1
  systems.forEach((s) => (q[s.key] = 2))
  const assignments = Object.fromEntries(
    systems.flatMap((s) => [0, 1].map((i) => [assignmentKey(s.name, i), `${s.room} №1`]))
  )
  return {
    version: 1,
    draft: {
      id: 'd',
      fileName: 'test.xlsx',
      plumbing: true,
      houses: [
        {
          id: 'h',
          address: 'Тестовый дом',
          zones: { entrance: 0, basement: 0, roof: 0, grounds: 0 },
          quantities: q,
          assignments,
        },
      ],
    },
    checklist: null,
    step: 'draft',
    savedAt: null,
    dirty: false,
  }
}
test('missing, stale and excess zone assignments; missing quantity differs from zero', () => {
  const w = fixture()
  assert.equal(inspectWorkspace(w).length, 0)
  delete w.draft.houses[0].assignments!['ГВС:2']
  assert.ok(inspectWorkspace(w).some((i) => i.field === 'assignment:ГВС:2'))
  w.draft.houses[0].assignments!['ГВС:2'] = 'ИТП №2'
  w.draft.houses[0].quantities!['Количество|ИТП'] = 1
  assert.ok(inspectWorkspace(w).some((i) => i.field === 'assignment:ГВС:2'))
  w.draft.houses[0].assignments!['ГВС:2'] = 'ИТП №1'
  w.draft.houses[0].assignments!['ГВС:3'] = 'ИТП №1'
  assert.equal(inspectWorkspace(w).filter((i) => i.level === 'error').length, 0)
  assert.ok(inspectWorkspace(w).some((i) => i.level === 'warning'))
  delete w.draft.houses[0].quantities!['Количество|МОП']
  assert.ok(inspectWorkspace(w).some((i) => i.field === 'Количество|МОП'))
})
test('assignment reaches generated work, preview and XLSX; validation finds duplicate and blank work', async () => {
  const w = fixture()
  const items = generatePlumbing(w.draft)
  w.checklist = { id: 'c', title: 'Проверка', items }
  w.step = 'checklist'
  assert.ok(items.some((i) => i.zone === 'ИТП №1 · ГВС · зона №2'))
  assert.equal(inspectWorkspace(w).filter((i) => i.level === 'error').length, 0)
  const rows = exportRows(w.checklist, w.draft)
  const book = await buildChecklistWorkbook(w.checklist, w.draft)
  assert.deepEqual(book.worksheets[0].getRow(4).values.slice(1), rows[0])
  items.push({ ...items[0], id: 'duplicate' })
  assert.ok(inspectWorkspace(w).some((i) => i.level === 'warning' && i.itemId === 'duplicate'))
  items[0].task = ''
  assert.ok(inspectWorkspace(w).some((i) => i.level === 'error' && i.field === 'task' && i.itemId === items[0].id))
})
