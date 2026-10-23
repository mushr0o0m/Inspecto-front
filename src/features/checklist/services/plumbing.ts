import { assignmentKey } from './quality.ts'
import templates from '../data/plumbing.json' with { type: 'json' }
import type { Draft, ChecklistItem } from '../types.ts'
export function deviation(value: string) {
  return value.trim()
    ? `Больше или меньше значения ТГС с погрешностью ${value.trim()} - это отклонение`
    : 'Больше или меньше этого значения - это отклонение'
}
export async function parseChessboard(file: File): Promise<Draft> {
  if (!file.name.toLowerCase().endsWith('.xlsx'))
    throw new Error('Для шахматки используйте предоставленный шаблон XLSX.')
  const { default: ExcelJS } = await import('exceljs')
  const book = new ExcelJS.Workbook()
  await book.xlsx.load(await file.arrayBuffer())
  const sheet = book.worksheets.find((s) => s.getCell('A2').text.trim() === 'Наименование помещений')
  if (!sheet) throw new Error('Не найден лист шахматки с заголовком «Наименование помещений» в A2.')
  const houses: Draft['houses'] = []
  for (let col = 2; col <= sheet.columnCount; col++) {
    const address = sheet.getCell(1, col).text.trim()
    if (!address) continue
    const quantities: Record<string, number> = {}
    const notes: string[] = []
    let section = ''
    for (let row = 2; row <= sheet.rowCount; row++) {
      const label = sheet.getCell(row, 1).text.trim()
      if (/^Наименование/.test(label)) {
        section = sheet.getCell(row, col).text.trim()
        continue
      }
      if (!label) continue
      const raw = sheet.getCell(row, col).text.trim()
      const match = raw.match(/^\d+(?=\s|$)/)
      if (!match && raw) throw new Error(`${address}: не удалось прочитать количество «${raw}» (${label}).`)
      const count = match ? Number(match[0]) : 0
      if (count > 100) throw new Error(`${address}: количество превышает 100 (${label}).`)
      quantities[`${section}|${label}`] = count
      if (raw.includes('(')) notes.push(`${label}: ${raw}`)
    }
    houses.push({
      id: crypto.randomUUID(),
      address,
      zones: { entrance: 0, basement: quantities['Количество|Подвал (подъездов)'] ?? 0, roof: 0, grounds: 0 },
      quantities,
      sourceNotes: notes.join('; '),
    })
  }
  if (!houses.length) throw new Error('Шахматка не содержит домов.')
  return { id: crypto.randomUUID(), fileName: file.name, houses, plumbing: true }
}
export function generatePlumbing(draft: Draft): ChecklistItem[] {
  return draft.houses.flatMap((house) =>
    templates.flatMap((template) => {
      const q = house.quantities ?? {}
      const room = template.room === 'Подвал' ? 'Подвал (подъездов)' : template.room
      const zoned = /зон[аы]\s*№/i.test(template.unit + template.task)
      const system = template.system === 'Теплоснабжение' ? 'теплоснабжения' : template.system
      const key = zoned ? `Количество зон|Система ${system}` : `Количество|${room}`
      const count = q[key]
      // Unknown rooms are retained once and explicitly flagged, never silently dropped.
      return Array.from({ length: count ?? 1 }, (_, index) => ({
        id: crypto.randomUUID(),
        houseId: house.id,
        task: template.task,
        zone: zoned
          ? `${house.assignments?.[assignmentKey(template.system, index)] ?? 'Помещение не назначено'} · ${template.system} · зона №${index + 1}`
          : `${template.room} №${index + 1}`,
        room: template.room,
        system: template.system,
        unit: template.unit,
        tolerance: deviation(template.tolerance),
        photo: template.photo,
        attributes: template.attributes,
        frequency: template.frequency,
        source: template.source,
        note: [
          count === undefined ? 'ТРЕБУЕТ ПРОВЕРКИ: количество помещения/зон отсутствует в шахматке.' : '',
          zoned && !house.assignments?.[assignmentKey(template.system, index)]
            ? 'ТРЕБУЕТ ПРОВЕРКИ: помещение зоны не назначено.'
            : '',
          template.season ? `Месяцы из шаблона: ${template.season}` : '',
          house.sourceNotes,
        ]
          .filter(Boolean)
          .join(' '),
      }))
    })
  )
}
