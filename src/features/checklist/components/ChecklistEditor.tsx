import { useState } from 'react'
import Button from '@/shared/Buttons/Button'
import type { Checklist, ChecklistItem, Draft } from '../types'

export default function ChecklistEditor({
  checklist,
  draft,
  onChange,
  disabled,
}: {
  checklist: Checklist
  draft: Draft
  onChange: (value: Checklist) => void
  disabled: boolean
}) {
  const [houseId, setHouseId] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const houses = new Map(draft.houses.map((house) => [house.id, house.address]))
  const filtered = checklist.items.filter(
    (item) =>
      (!houseId || item.houseId === houseId) &&
      [houses.get(item.houseId), item.zone, item.task, item.note]
        .join(' ')
        .toLocaleLowerCase()
        .includes(query.toLocaleLowerCase())
  )
  const pageCount = Math.max(1, Math.ceil(filtered.length / 20))
  const currentPage = Math.min(page, pageCount - 1)
  const visible = filtered.slice(currentPage * 20, (currentPage + 1) * 20)
  function update(id: string, patch: Partial<ChecklistItem>) {
    onChange({ ...checklist, items: checklist.items.map((item) => (item.id === id ? { ...item, ...patch } : item)) })
  }
  return (
    <section className="flow-card editor-card">
      <div className="card-toolbar">
        <div>
          <h2>Работы по техническому обслуживанию</h2>
          <p>Отредактируйте работы и периодичность, добавьте свои пункты.</p>
        </div>
        <Button
          size="default"
          type="default"
          text="+ Добавить работу"
          disabled={disabled}
          onClick={() => {
            const item: ChecklistItem = {
              id: crypto.randomUUID(),
              houseId: houseId || draft.houses[0].id,
              zone: '',
              task: '',
              frequency: 'Ежемесячно',
              note: '',
            }
            onChange({ ...checklist, items: [item, ...checklist.items] })
            setQuery('')
            setPage(0)
          }}
        />
      </div>
      <div className="checklist-filters">
        <label className="field">
          <span>Дом</span>
          <select
            value={houseId}
            onChange={(event) => {
              setHouseId(event.target.value)
              setPage(0)
            }}
          >
            <option value="">Все дома</option>
            {draft.houses.map((house) => (
              <option key={house.id} value={house.id}>
                {house.address}
              </option>
            ))}
          </select>
        </label>
        <label className="field search-field">
          <span>Поиск по чек-листу</span>
          <input
            type="search"
            placeholder="Зона, работа или примечание"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setPage(0)
            }}
          />
        </label>
        <span className="muted small">
          Показано {filtered.length} из {checklist.items.length}
        </span>
      </div>
      <div className="table-scroll">
        <table className="flow-table checklist-table">
          <caption className="sr-only">Редактируемый чек-лист технического обслуживания</caption>
          <thead>
            <tr>
              <th scope="col">Дом</th>
              <th scope="col">Зона</th>
              <th scope="col">Работа</th>
              <th scope="col">Периодичность</th>
              <th scope="col">Примечание</th>
              <th scope="col">
                <span className="sr-only">Действия</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((item, index) => (
              <tr key={item.id}>
                <td>
                  <select
                    className="table-input"
                    aria-label={`Дом работы ${index + 1}`}
                    disabled={disabled}
                    value={item.houseId}
                    onChange={(event) => update(item.id, { houseId: event.target.value })}
                  >
                    {draft.houses.map((house) => (
                      <option key={house.id} value={house.id}>
                        {house.address}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    className="table-input"
                    aria-label={`Зона работы ${index + 1}`}
                    disabled={disabled}
                    value={item.zone}
                    placeholder="Укажите зону"
                    onChange={(event) => update(item.id, { zone: event.target.value })}
                  />
                </td>
                <td>
                  <textarea
                    className="table-input"
                    aria-label={`Работа ${index + 1}`}
                    disabled={disabled}
                    value={item.task}
                    placeholder="Что нужно сделать"
                    rows={2}
                    onChange={(event) => update(item.id, { task: event.target.value })}
                  />
                </td>
                <td>
                  <input
                    className="table-input"
                    aria-label={`Периодичность работы ${index + 1}`}
                    disabled={disabled}
                    value={item.frequency}
                    onChange={(event) => update(item.id, { frequency: event.target.value })}
                  />
                </td>
                <td>
                  <textarea
                    className="table-input"
                    aria-label={`Примечание к работе ${index + 1}`}
                    disabled={disabled}
                    value={item.note}
                    placeholder="Добавить примечание"
                    rows={2}
                    onChange={(event) => update(item.id, { note: event.target.value })}
                  />
                </td>
                <td>
                  <Button
                    size="small"
                    type="tetriary"
                    danger
                    title={`Удалить работу ${index + 1}`}
                    text="×"
                    disabled={disabled}
                    onClick={() =>
                      onChange({ ...checklist, items: checklist.items.filter((row) => row.id !== item.id) })
                    }
                  />
                </td>
              </tr>
            ))}
            {!visible.length && (
              <tr>
                <td colSpan={6} className="table-empty">
                  {checklist.items.length
                    ? 'Ничего не найдено. Измените поиск или выберите другой дом.'
                    : 'Работ пока нет. Добавьте первый пункт.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="table-pagination">
        <span className="small muted">
          Страница {currentPage + 1} из {pageCount} · по 20 работ
        </span>
        <div className="inline-flex-gap gap8">
          <Button
            type="default"
            size="small"
            text="Назад"
            disabled={currentPage === 0}
            onClick={() => setPage(currentPage - 1)}
          />
          <Button
            type="default"
            size="small"
            text="Далее"
            disabled={currentPage >= pageCount - 1}
            onClick={() => setPage(currentPage + 1)}
          />
        </div>
      </div>
    </section>
  )
}
