import { useEffect, useState } from 'react'
import { readHistory, type Revision } from '../services/history'
import Button from '@/shared/Buttons/Button'
export default function HistoryPanel({ onRestore, busy }: { onRestore: (revision: Revision) => void; busy: boolean }) {
  const [revisions, setRevisions] = useState<Revision[]>([]),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(true),
    [query, setQuery] = useState(''),
    [retry, setRetry] = useState(0)
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    readHistory()
      .then((data) => {
        if (!cancelled) {
          setRevisions(data)
          setError('')
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [retry])
  return (
    <section className="flow-card history-panel">
      <h2>История документов</h2>
      <p className="muted">
        Версии шахматок и чек-листов хранятся в этом браузере. Перед восстановлением текущая работа автоматически
        сохраняется в историю.
      </p>
      <label className="field">
        Найти документ
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Название файла или чек-листа" />
      </label>
      {loading && <p role="status">Загружаем версии…</p>}
      {error && (
        <div role="alert">
          {error}
          <button onClick={() => setRetry(retry + 1)}>Повторить</button>
        </div>
      )}
      {!loading && !error && !revisions.length && (
        <p className="table-empty">История пока пуста. Сохраните первую версию во вкладке «Редактор».</p>
      )}
      {revisions
        .filter((r) =>
          [r.workspace.draft.fileName, r.workspace.checklist?.title]
            .join(' ')
            .toLowerCase()
            .includes(query.toLowerCase())
        )
        .map((r) => (
          <article key={r.id} className="revision-row">
            <div>
              <h3>{r.workspace.checklist?.title ?? r.workspace.draft.fileName}</h3>
              <p>{r.workspace.draft.fileName}</p>
              <span className="muted small">
                {new Date(r.createdAt).toLocaleString('ru-RU')} · {r.reason} · {r.workspace.draft.houses.length} домов ·{' '}
                {r.workspace.checklist?.items.length ?? 0} работ
              </span>
            </div>
            <Button
              type="default"
              size="default"
              text="Восстановить версию"
              disabled={busy}
              onClick={() => onRestore(r)}
            />
          </article>
        ))}
    </section>
  )
}
