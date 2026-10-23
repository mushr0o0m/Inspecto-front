import { useMemo, useState } from 'react'
import type { Workspace } from '../types'
import { exportRows, exportHeaders } from '../services/exportRows'
import { generatePlumbing } from '../services/plumbing'
import templates from '../data/plumbing.json'
export default function ExportPreview({ workspace }: { workspace: Workspace }) {
  const [page, setPage] = useState(0)
  const rows = useMemo(() => (workspace.checklist ? exportRows(workspace.checklist, workspace.draft) : []), [workspace])
  const omissions = useMemo(() => {
    if (!workspace.draft.plumbing || !workspace.checklist) return []
    const expected = generatePlumbing(workspace.draft)
    const counts = new Map<string, number>()
    workspace.checklist.items.forEach((i) => {
      const key = i.houseId + '|' + i.source
      counts.set(key, (counts.get(key) ?? 0) + 1)
    })
    const missing = new Map<string, { house: string; task: string; reason: string; count: number }>()
    expected.forEach((i) => {
      const key = i.houseId + '|' + i.source
      const count = counts.get(key) ?? 0
      if (count > 0) {
        counts.set(key, count - 1)
        return
      }
      const record = missing.get(key)
      missing.set(key, {
        house: workspace.draft.houses.find((h) => h.id === i.houseId)?.address ?? '',
        task: i.task,
        reason: 'Пункт удалён из чек-листа или его объект изменён',
        count: (record?.count ?? 0) + 1,
      })
    })
    workspace.draft.houses.forEach((h) =>
      templates.forEach((t) => {
        const zoned = /зон[аы]\s*№/i.test(t.unit + t.task)
        const key = zoned
          ? `Количество зон|Система ${t.system === 'Теплоснабжение' ? 'теплоснабжения' : t.system}`
          : `Количество|${t.room === 'Подвал' ? 'Подвал (подъездов)' : t.room}`
        if (h.quantities?.[key] === 0)
          missing.set(h.id + '|' + t.source, {
            house: h.address,
            task: t.task,
            reason: 'Количество помещений или зон равно нулю',
            count: 0,
          })
      })
    )
    return [...missing.values()]
  }, [workspace])
  if (!workspace.checklist)
    return (
      <section className="flow-card quality-panel">
        <h2>Предпросмотр Excel</h2>
        <p>Сначала сформируйте чек-лист во вкладке «Редактор».</p>
      </section>
    )
  const pages = Math.max(1, Math.ceil(rows.length / 30)),
    current = Math.min(page, pages - 1)
  return (
    <section className="flow-card export-preview">
      <div className="card-toolbar">
        <div>
          <h2>{workspace.checklist.title}</h2>
          <p>
            {workspace.draft.houses.length} домов · {rows.length} работ ·{' '}
            {new Set(workspace.checklist.items.map((i) => i.houseId + '|' + i.zone)).size} экземпляров помещений / зон
          </p>
          <p>Все строки и колонки Excel. Фильтры редактора не влияют на выгрузку.</p>
        </div>
      </div>
      <div className="table-scroll">
        <table className="flow-table preview-table">
          <thead>
            <tr>
              {exportHeaders.map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(current * 30, current * 30 + 30).map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="table-pagination">
        <button disabled={current === 0} onClick={() => setPage(current - 1)}>
          Назад
        </button>
        <span>
          {current + 1} / {pages} · по 30 строк
        </span>
        <button disabled={current === pages - 1} onClick={() => setPage(current + 1)}>
          Далее
        </button>
      </div>
      <details className="omissions">
        <summary>Исключённые пункты ({omissions.length}) и правила отбора</summary>
        <p>
          Годовое и полугодовое ТО исключены. Сезонность сохранена в примечаниях, фильтрация по месяцу не применяется.
        </p>
        <ul>
          {omissions.map((item, i) => (
            <li key={i}>
              <strong>{item.house}</strong> · {item.task}
              <p>
                {item.reason}
                {item.count ? ` (${item.count})` : ''}
              </p>
            </li>
          ))}
        </ul>
      </details>
    </section>
  )
}
