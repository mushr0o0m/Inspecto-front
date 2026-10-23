import { useState } from 'react'
import Button from '@/shared/Buttons/Button'
import type { Checklist, ChecklistItem, Draft } from '../types'
const fields = [
  ['room', 'Помещение'],
  ['system', 'Система'],
  ['unit', 'Узел'],
  ['zone', 'Экземпляр помещения / зона'],
  ['frequency', 'Периодичность'],
  ['tolerance', 'Диапазон погрешности'],
  ['note', 'Примечание'],
] as const
export default function PlumbingChecklist({
  checklist,
  draft,
  onChange,
  disabled,
  focusItem,
  focusField,
}: {
  checklist: Checklist
  draft: Draft
  onChange: (value: Checklist) => void
  disabled: boolean
  focusItem?: string
  focusField?: string
}) {
  const [house, setHouse] = useState(''),
    [system, setSystem] = useState(''),
    [frequency, setFrequency] = useState(''),
    [query, setQuery] = useState(''),
    [review, setReview] = useState(false),
    [page, setPage] = useState(0),
    [selected, setSelected] = useState<string | null>(focusItem ?? null)
  const houses = new Map(draft.houses.map((h) => [h.id, h.address]))
  const filtered = checklist.items.filter(
    (i) =>
      (!house || i.houseId === house) &&
      (!system || i.system === system) &&
      (!frequency || i.frequency === frequency) &&
      (!review || i.note.includes('ПРОВЕРКИ')) &&
      [houses.get(i.houseId), i.task, i.room, i.system, i.unit, i.note]
        .join(' ')
        .toLowerCase()
        .includes(query.toLowerCase())
  )
  const pages = Math.max(1, Math.ceil(filtered.length / 15)),
    current = Math.min(page, pages - 1)
  const active = checklist.items.find((i) => i.id === selected)
  function update(id: string, patch: Partial<ChecklistItem>) {
    onChange({ ...checklist, items: checklist.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) })
  }
  return (
    <section className="flow-card">
      <div className="card-toolbar">
        <div>
          <h2>Чек-лист сантехника</h2>
          <p>Выберите работу, чтобы изменить параметры и требования.</p>
        </div>
        <Button
          type="default"
          size="default"
          text="+ Работа"
          disabled={disabled}
          onClick={() => {
            const item: ChecklistItem = {
              id: crypto.randomUUID(),
              houseId: house || draft.houses[0].id,
              task: '',
              zone: '',
              frequency: '1 раз в месяц',
              note: '',
              photo: 'Нет',
              attributes: 'Нет',
            }
            onChange({ ...checklist, items: [item, ...checklist.items] })
            setSelected(item.id)
          }}
        />
      </div>
      <div className="plumbing-filters">
        {[
          ['Объект управления', house, setHouse, draft.houses.map((h) => [h.id, h.address])],
          [
            'Система',
            system,
            setSystem,
            [...new Set(checklist.items.map((i) => i.system).filter(Boolean))].map((s) => [s, s]),
          ],
          [
            'Периодичность',
            frequency,
            setFrequency,
            [...new Set(checklist.items.map((i) => i.frequency))].map((s) => [s, s]),
          ],
        ].map(([label, value, set, options]) => (
          <label className="field" key={String(label)}>
            {String(label)}
            <select
              value={String(value)}
              onChange={(e) => {
                ;(set as (v: string) => void)(e.target.value)
                setPage(0)
              }}
            >
              <option value="">Все</option>
              {(options as string[][]).map(([v, t]) => (
                <option key={v} value={v}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        ))}
        <label className="field">
          Поиск
          <input
            value={query}
            placeholder="Работа, помещение, узел"
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(0)
            }}
          />
        </label>
      </div>
      <div className="review-filter">
        <label>
          <input
            type="checkbox"
            checked={review}
            onChange={(e) => {
              setReview(e.target.checked)
              setPage(0)
            }}
          />{' '}
          Только требуют проверки
        </label>
        <span>
          {filtered.length} из {checklist.items.length} работ
        </span>
      </div>
      <div className="work-layout">
        <div className="work-list">
          {filtered.slice(current * 15, current * 15 + 15).map((i) => (
            <button key={i.id} className="work-row" aria-pressed={i.id === selected} onClick={() => setSelected(i.id)}>
              <span className="work-meta">
                {houses.get(i.houseId)} · {i.room} · {i.system}
              </span>
              <strong>{i.task || 'Новая работа'}</strong>
              <span>
                {i.zone} · {i.frequency}
              </span>
              <span className="requirement-tags">
                <span>Фото: {i.photo ?? 'Нет'}</span>
                <span>Атрибуты: {i.attributes ?? 'Нет'}</span>
                {i.note.includes('ПРОВЕРКИ') && <em>Требует проверки</em>}
              </span>
            </button>
          ))}
          {!filtered.length && <p className="table-empty">Нет работ по выбранным условиям.</p>}
        </div>
        <aside className="work-detail">
          {active ? (
            <>
              <div className="card-toolbar">
                <h3>Параметры работы</h3>
                <button className="text-action" onClick={() => setSelected(null)}>
                  Закрыть
                </button>
              </div>
              <label className="field">
                Объект управления
                <select
                  disabled={disabled}
                  autoFocus={focusField === 'houseId'}
                  value={active.houseId}
                  onChange={(e) => update(active.id, { houseId: e.target.value })}
                >
                  {draft.houses.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.address}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Состав работ
                <textarea
                  rows={4}
                  disabled={disabled}
                  autoFocus={focusField === 'task'}
                  value={active.task}
                  onChange={(e) => update(active.id, { task: e.target.value })}
                />
              </label>
              {fields.map(([key, label]) => (
                <label className="field" key={key}>
                  {label}
                  <textarea
                    rows={key === 'note' || key === 'tolerance' ? 3 : 1}
                    disabled={disabled}
                    autoFocus={focusField === key}
                    value={active[key] ?? ''}
                    onChange={(e) => update(active.id, { [key]: e.target.value })}
                  />
                </label>
              ))}
              {(['photo', 'attributes'] as const).map((key) => (
                <label className="field" key={key}>
                  {key === 'photo' ? 'Необходимость фотоотчета' : 'Необходимость занесения данных в атрибуты'}
                  <select
                    disabled={disabled}
                    autoFocus={focusField === key}
                    value={active[key] ?? 'Нет'}
                    onChange={(e) => update(active.id, { [key]: e.target.value })}
                  >
                    <option>Да</option>
                    <option>Нет</option>
                  </select>
                </label>
              ))}
              <p className="muted small">Источник: {active.source ?? 'Добавлено вручную'}</p>
              <Button
                type="default"
                size="default"
                danger
                text="Удалить работу"
                disabled={disabled}
                onClick={() => {
                  onChange({ ...checklist, items: checklist.items.filter((i) => i.id !== active.id) })
                  setSelected(null)
                }}
              />
            </>
          ) : (
            <div className="detail-placeholder">
              <h3>Выберите работу</h3>
              <p>Здесь появятся помещение, система, узел, погрешность и требования к отчётности.</p>
            </div>
          )}
        </aside>
      </div>
      <div className="table-pagination">
        <span>
          {current + 1} / {pages}
        </span>
        <Button
          type="default"
          size="small"
          text="Назад"
          disabled={current === 0}
          onClick={() => setPage(current - 1)}
        />
        <Button
          type="default"
          size="small"
          text="Далее"
          disabled={current === pages - 1}
          onClick={() => setPage(current + 1)}
        />
      </div>
    </section>
  )
}
