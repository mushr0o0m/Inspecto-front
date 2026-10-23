import { test } from 'node:test'
import assert from 'node:assert/strict'
import { deviation, generatePlumbing } from '../src/features/checklist/services/plumbing.ts'
import { buildChecklistWorkbook } from '../src/features/checklist/services/exportChecklist.ts'
import type { Draft } from '../src/features/checklist/types.ts'
test('plumbing tolerance, frequency, repetition and export fields', async () => {
  assert.equal(deviation(''), 'Больше или меньше этого значения - это отклонение')
  assert.equal(deviation('+-5%'), 'Больше или меньше значения ТГС с погрешностью +-5% - это отклонение')
  const draft: Draft = {
    id: 'd',
    fileName: 'x.xlsx',
    plumbing: true,
    houses: [
      {
        id: 'h',
        address: 'Дом 1',
        zones: { entrance: 0, basement: 1, roof: 0, grounds: 0 },
        quantities: { 'Количество|ИТП': 2, 'Количество зон|Система теплоснабжения': 3 },
      },
    ],
  }
  const items = generatePlumbing(draft)
  assert.equal(items.filter((i) => i.source === 'ЧЛ Сантехника ТО1.1, строка 5').length, 2)
  assert.equal(items.filter((i) => i.source === 'ЧЛ Сантехника ТО1.1, строка 11').length, 3)
  assert.deepEqual(
    new Set(items.map((i) => i.frequency)),
    new Set(['8 раз в месяц', '1 раз в месяц', '1 раз в три месяца'])
  )
  assert.ok(items.every((i) => ['Да', 'Нет'].includes(i.photo!) && ['Да', 'Нет'].includes(i.attributes!)))
  assert.ok(items.some((i) => i.tolerance?.includes('5%')))
  const w = await buildChecklistWorkbook({ id: 'c', title: 'ТО', items }, draft)
  const s = w.worksheets[0]
  assert.equal(s.getCell('B4').value, 'Дом 1')
  assert.equal(s.getCell('G4').value, 'ИТП')
  assert.equal(s.getCell('J4').value, deviation(''))
  assert.equal(s.getCell('K4').value, 'Нет')
  assert.equal(s.getCell('L4').value, 'Да')
})
