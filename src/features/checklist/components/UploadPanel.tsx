import { useRef, useState } from 'react'
import Button from '@/shared/Buttons/Button'

export default function UploadPanel({ onUpload, busy }: { onUpload: (file: File | null) => void; busy: boolean }) {
  const input = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  function selectFile(files: File[]) {
    setError('')
    setFile(null)
    if (files.length !== 1) {
      setError('Выберите один Excel-файл.')
      return
    }
    const candidate = files[0]
    if (!/\.xlsx?$/i.test(candidate.name)) {
      setError('Поддерживаются только файлы .xlsx и .xls.')
      return
    }
    if (!candidate.size) {
      setError('Файл пуст. Выберите другой документ.')
      return
    }
    if (candidate.size > 20 * 1024 * 1024) {
      setError('Размер файла не должен превышать 20 МБ.')
      return
    }
    setFile(candidate)
  }
  return (
    <div className="upload-layout">
      <section className="flow-card upload-card">
        <div className="section-heading">
          <span className="eyebrow">ИСХОДНЫЕ ДАННЫЕ</span>
          <h2>Загрузите шахматку</h2>
          <p>Начните с Excel-документа с домами и зонами обслуживания.</p>
        </div>
        <div
          className="dropzone"
          data-dragging={dragging}
          onDragOver={(event) => {
            event.preventDefault()
            if (!busy) setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault()
            setDragging(false)
            if (!busy) selectFile(Array.from(event.dataTransfer.files))
          }}
        >
          <div className="file-symbol" aria-hidden="true">
            <svg viewBox="0 0 32 32" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M19 3H7v26h18V9zM19 3v7h6M11 16h10M11 21h10M16 14v10" />
            </svg>
          </div>
          <h3>{file ? file.name : 'Перетащите файл сюда'}</h3>
          <p>
            {file
              ? `${(file.size / 1024).toLocaleString('ru-RU', { maximumFractionDigits: 1 })} КБ · готов к загрузке`
              : 'или выберите его на компьютере'}
          </p>
          <Button
            size="large"
            type="default"
            text={file ? 'Выбрать другой файл' : 'Выбрать файл'}
            disabled={busy}
            onClick={() => input.current?.click()}
          />
          <input
            ref={input}
            type="file"
            accept=".xlsx,.xls"
            hidden
            aria-label="Excel-документ шахматки"
            onChange={(event) => {
              selectFile(Array.from(event.target.files ?? []))
              event.target.value = ''
            }}
          />
          <span className="muted small">XLSX или XLS · до 20 МБ · один файл</span>
        </div>
        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}
        <div className="upload-actions">
          <Button
            size="large"
            type="primary"
            text="Загрузить и продолжить →"
            disabled={!file || busy}
            onClick={() => onUpload(file)}
          />
          <Button size="large" type="tetriary" text="Открыть пример" disabled={busy} onClick={() => onUpload(null)} />
        </div>
        <p className="small muted">
          В деморежиме любой файл открывает один тестовый пример. Содержимое Excel пока не читается и никуда не
          отправляется.
        </p>
      </section>
      <aside className="flow-card guide-card">
        <span className="eyebrow">КАК ЭТО РАБОТАЕТ</span>
        <h2>От таблицы к плану работ</h2>
        <div className="guide-item">
          <span>1</span>
          <div>
            <h3>Проверьте дома и зоны</h3>
            <p>Исправьте адреса и количество зон в редактируемом черновике.</p>
          </div>
        </div>
        <div className="guide-item">
          <span>2</span>
          <div>
            <h3>Подтвердите данные</h3>
            <p>На основе шахматки и шаблона ТО будет сформирован список работ.</p>
          </div>
        </div>
        <div className="guide-item">
          <span>3</span>
          <div>
            <h3>Доработайте чек-лист</h3>
            <p>Измените работы, добавьте примечания и сохраните или скачайте результат.</p>
          </div>
        </div>
        <div className="guide-note">Вы контролируете результат на каждом этапе.</div>
      </aside>
    </div>
  )
}
