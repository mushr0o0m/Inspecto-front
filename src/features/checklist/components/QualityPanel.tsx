import { useState } from 'react'
import type { Issue } from '../services/quality'
export default function QualityPanel({ issues, onSelect }: { issues: Issue[]; onSelect: (issue: Issue) => void }) {
  const [onlyErrors, setOnlyErrors] = useState(false),
    [limit, setLimit] = useState(30)
  const errors = issues.filter((i) => i.level === 'error').length
  const visible = issues.filter((i) => !onlyErrors || i.level === 'error')
  return (
    <section className="flow-card quality-panel">
      <h2>Центр проверки</h2>
      <p>
        {errors} ошибок · {issues.length - errors} предупреждений
      </p>
      <p className="muted small">
        Ошибки блокируют формирование и выгрузку. Предупреждения требуют внимания, но не блокируют результат.
      </p>
      <label>
        <input type="checkbox" checked={onlyErrors} onChange={(e) => setOnlyErrors(e.target.checked)} /> Только ошибки
      </label>
      {!issues.length && <p className="notice-alert flow-alert">Ошибок не найдено.</p>}
      <ul className="issue-list">
        {visible.slice(0, limit).map((issue) => (
          <li key={issue.id}>
            <span data-level={issue.level}>{issue.level === 'error' ? 'Ошибка' : 'Предупреждение'}</span>
            <button onClick={() => onSelect(issue)}>{issue.message} →</button>
          </li>
        ))}
      </ul>
      {visible.length > limit && (
        <button className="text-action" onClick={() => setLimit(limit + 50)}>
          Показать ещё ({visible.length - limit})
        </button>
      )}
    </section>
  )
}
