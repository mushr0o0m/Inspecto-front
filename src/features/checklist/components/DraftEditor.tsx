import Button from '@/shared/Buttons/Button'
import { type Draft, type House, zoneTypes, zoneCount } from '../types'

export default function DraftEditor({
  draft,
  onChange,
  disabled,
}: {
  draft: Draft
  onChange: (draft: Draft) => void
  disabled: boolean
}) {
  function updateHouse(id: string, patch: Partial<House>) {
    onChange({ ...draft, houses: draft.houses.map((house) => (house.id === id ? { ...house, ...patch } : house)) })
  }
  return (
    <section className="flow-card editor-card">
      <div className="card-toolbar">
        <div>
          <h2>Шахматка по домам</h2>
          <p>Измените ячейки, если заметили неточности. Ноль означает отсутствие зоны.</p>
        </div>
        <Button
          size="default"
          type="default"
          text="+ Добавить дом"
          disabled={disabled}
          onClick={() =>
            onChange({
              ...draft,
              houses: [
                ...draft.houses,
                { id: crypto.randomUUID(), address: '', zones: { entrance: 0, basement: 0, roof: 0, grounds: 0 } },
              ],
            })
          }
        />
      </div>
      <div className="table-scroll">
        <table className="flow-table matrix-table">
          <caption className="sr-only">Дома и количество зон обслуживания</caption>
          <thead>
            <tr>
              <th scope="col">Дом / адрес</th>
              {zoneTypes.map((zone) => (
                <th scope="col" key={zone.id}>
                  {zone.label}
                </th>
              ))}
              <th scope="col">Всего зон</th>
              <th scope="col">
                <span className="sr-only">Действия</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {draft.houses.map((house, index) => (
              <tr key={house.id}>
                <td>
                  <input
                    className="table-input address-input"
                    aria-label={`Адрес дома ${index + 1}`}
                    value={house.address}
                    placeholder="Укажите адрес"
                    disabled={disabled}
                    onChange={(event) => updateHouse(house.id, { address: event.target.value })}
                  />
                </td>
                {zoneTypes.map((zone) => (
                  <td key={zone.id}>
                    <input
                      className="table-input count-input"
                      aria-label={`${zone.label}, дом ${index + 1}`}
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      value={house.zones[zone.id]}
                      disabled={disabled}
                      onChange={(event) =>
                        updateHouse(house.id, {
                          zones: {
                            ...house.zones,
                            [zone.id]: event.target.value === '' ? '' : Number(event.target.value),
                          },
                        })
                      }
                    />
                  </td>
                ))}
                <td className="total-cell">{zoneCount(house)}</td>
                <td>
                  <Button
                    size="small"
                    type="tetriary"
                    danger
                    title={`Удалить дом ${index + 1}`}
                    text="×"
                    disabled={disabled}
                    onClick={() => onChange({ ...draft, houses: draft.houses.filter((h) => h.id !== house.id) })}
                  />
                </td>
              </tr>
            ))}
            {!draft.houses.length && (
              <tr>
                <td colSpan={7} className="table-empty">
                  Нет домов. Добавьте первый дом, чтобы продолжить.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td>Итого: {draft.houses.length} домов</td>
              {zoneTypes.map((zone) => (
                <td key={zone.id}>{draft.houses.reduce((sum, house) => sum + Number(house.zones[zone.id]), 0)}</td>
              ))}
              <td>{draft.houses.reduce((sum, house) => sum + zoneCount(house), 0)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="table-footnote">
        Демонстрационная структура зон. Точный состав колонок будет задан вашим Excel-шаблоном.
      </div>
    </section>
  )
}
