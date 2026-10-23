import { systems, assignmentKey, roomInstances } from '../services/quality'
import { useState } from 'react'
import templates from '../data/plumbing.json'
import type { Draft } from '../types'

export default function PlumbingDraft({
  draft,
  onChange,
  disabled,
  focusHouse,
  focusField,
}: {
  draft: Draft
  onChange: (draft: Draft) => void
  disabled: boolean
  focusHouse?: string
  focusField?: string
}) {
  const [selected, setSelected] = useState(focusHouse ?? draft.houses[0]?.id)
  const house = draft.houses.find((h) => h.id === selected) ?? draft.houses[0]
  if (!house) return <p>Нет домов в шахматке.</p>
  const keys = [
    ...new Set([
      ...Object.keys(house.quantities ?? {}),
      ...templates.map((t) => `Количество|${t.room === 'Подвал' ? 'Подвал (подъездов)' : t.room}`),
    ]),
  ]
  const groups = [...new Set(keys.map((k) => k.split('|')[0]))]
  const missing = keys.filter((k) => house.quantities?.[k] === undefined).length
  function patch(p: Partial<typeof house>) {
    onChange({ ...draft, houses: draft.houses.map((h) => (h.id === house.id ? { ...h, ...p } : h)) })
  }
  return (
    <section className="flow-card plumbing-draft">
      <aside className="house-list">
        <h2>Объекты управления</h2>
        <p className="muted small">{draft.houses.length} домов в документе</p>
        {draft.houses.map((h) => (
          <button key={h.id} aria-pressed={h.id === house.id} onClick={() => setSelected(h.id)}>
            {h.address}
            <span>→</span>
          </button>
        ))}
      </aside>
      <div className="house-detail">
        <label className="field">
          <span>Объект управления · название дома</span>
          <input
            id="draft-address"
            autoFocus={focusField === 'address'}
            value={house.address}
            disabled={disabled}
            onChange={(e) => patch({ address: e.target.value })}
          />
        </label>
        {missing > 0 && (
          <div className="quantity-warning" role="status">
            Не указано количеств: {missing}. Уточните их ниже. Ноль — помещение отсутствует; пустое поле — требуется
            проверка.
          </div>
        )}
        {groups.map((group) => (
          <section className="quantity-group" key={group}>
            <h3>{group === 'Количество' ? 'Помещения' : group}</h3>
            <div className="quantity-grid">
              {keys
                .filter((k) => k.startsWith(group + '|'))
                .map((key) => (
                  <label className="field" key={key}>
                    <span>{key.split('|')[1]}</span>
                    <input
                      autoFocus={focusField === key}
                      data-missing={house.quantities?.[key] === undefined}
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      placeholder="Уточните количество"
                      value={house.quantities?.[key] ?? ''}
                      disabled={disabled}
                      onChange={(e) => {
                        const q = { ...house.quantities }
                        if (e.target.value === '') delete q[key]
                        else q[key] = Number(e.target.value)
                        patch({ quantities: q })
                      }}
                    />
                  </label>
                ))}
            </div>
          </section>
        ))}
        <section className="zone-assignment">
          <h3>Привязка зон к помещениям</h3>
          <p className="muted small">
            Каждая зона должна быть назначена одному помещению. Несколько зон могут относиться к одному ИТП или
            насосной.
          </p>
          {systems.map((system) => {
            const n = house.quantities?.[system.key] ?? 0
            const count = Number.isInteger(n) && n >= 0 && n <= 100 ? n : 0
            const options = roomInstances(house, system.room)
            const assigned = Array.from({ length: count }, (_, i) =>
              options.includes(house.assignments?.[assignmentKey(system.name, i)] ?? '')
            ).filter(Boolean).length
            return (
              <div className="quantity-group" key={system.name}>
                <h4>
                  {system.name} · назначено {assigned} из {count}
                </h4>
                {count === 0 ? (
                  <p className="muted small">Нет зон. Проверьте количество выше.</p>
                ) : (
                  <div className="quantity-grid">
                    {Array.from({ length: count }, (_, index) => {
                      const key = assignmentKey(system.name, index)
                      return (
                        <label className="field" key={key}>
                          {system.name} · зона №{index + 1}
                          <select
                            autoFocus={focusField === `assignment:${key}`}
                            disabled={disabled}
                            value={options.includes(house.assignments?.[key] ?? '') ? house.assignments?.[key] : ''}
                            onChange={(e) => patch({ assignments: { ...house.assignments, [key]: e.target.value } })}
                          >
                            <option value="">Выберите помещение</option>
                            {options.map((room) => (
                              <option key={room}>{room}</option>
                            ))}
                          </select>
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </section>
        {house.sourceNotes && (
          <details className="source-notes">
            <summary>Пояснения из шахматки</summary>
            <p>{house.sourceNotes}</p>
          </details>
        )}
      </div>
    </section>
  )
}
