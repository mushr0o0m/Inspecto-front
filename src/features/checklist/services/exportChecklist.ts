import { exportHeaders, exportRows } from './exportRows.ts'
import type { Checklist, Draft } from '../types.ts'

export async function buildChecklistWorkbook(checklist: Checklist, draft: Draft) {
  const { default: ExcelJS } = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Inspecto'
  const sheet = workbook.addWorksheet('Чек-лист ТО')
  sheet.columns = [
    { key: 'number', width: 7 },
    { key: 'house', width: 32 },
    { key: 'zone', width: 30 },
    { key: 'task', width: 58 },
    { key: 'frequency', width: 22 },
    { key: 'note', width: 40 },
    ...[30, 25, 35, 65, 24, 32, 45].map((width) => ({ width })),
  ]
  sheet.mergeCells('A1:M1')
  sheet.getCell('A1').value = checklist.title
  sheet.getCell('A1').font = { size: 18, bold: true, color: { argb: 'FF0958D9' } }
  sheet.getRow(1).height = 34
  sheet.mergeCells('A2:M2')
  sheet.getCell('A2').value = draft.plumbing
    ? 'Шаблон сантехника: ТО1.1, ТО1, ТО2. Проверьте примечания о количестве и привязке зон.'
    : 'Демонстрационный чек-лист.'
  sheet.getRow(2).height = 30
  sheet.getRow(2).alignment = { wrapText: true, vertical: 'middle' }
  sheet.addRow(exportHeaders)
  sheet.getRow(3).height = 60
  sheet.getRow(3).alignment = { wrapText: true, vertical: 'middle' }
  sheet.getRow(3).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1677FF' } }
  })
  const rows = exportRows(checklist, draft)
  checklist.items.forEach((item, index) => {
    const row = sheet.addRow(rows[index])
    row.alignment = { wrapText: true, vertical: 'top' }
    row.height = Math.max(
      34,
      16 *
        Math.max(
          ...[item.zone, item.task, item.note].map((t) =>
            t.split('\n').reduce((sum, line) => sum + Math.max(1, Math.ceil(line.length / 35)), 0)
          )
        )
    )
    if (index % 2 === 0)
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F6FF' } }
      })
  })
  sheet.views = [{ state: 'frozen', ySplit: 3 }]
  sheet.autoFilter = { from: 'A3', to: `M${sheet.rowCount}` }
  return workbook
}

export async function exportChecklist(checklist: Checklist, draft: Draft) {
  const workbook = await buildChecklistWorkbook(checklist, draft)
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([new Uint8Array(buffer)], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  // Strip control characters as well as characters disallowed in file names.
  // eslint-disable-next-line no-control-regex
  link.download = `Inspecto-${checklist.title.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '').slice(0, 80) || 'чек-лист'}.xlsx`
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
