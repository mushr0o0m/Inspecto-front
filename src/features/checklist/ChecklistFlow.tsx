import { useEffect, useRef, useState } from 'react'
import Button from '@/shared/Buttons/Button'
import FlowSteps from './components/FlowSteps'
import UploadPanel from './components/UploadPanel'
import DraftEditor from './components/DraftEditor'
import ChecklistEditor from './components/ChecklistEditor'
import ConfirmDialog from './components/ConfirmDialog'
import { checklistService } from './services/mockService'
import { loadWorkspace, storeWorkspace } from './services/storage'
import { exportChecklist } from './services/exportChecklist'
import { type Workspace, validateDraft, validateChecklist, zoneCount } from './types'
import './checklist.css'

export default function ChecklistFlow() {
  const [workspace, setWorkspace] = useState<Workspace | null>(loadWorkspace)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [storageError, setStorageError] = useState('')
  const [notice, setNotice] = useState(() => (workspace ? 'Восстановлена последняя сессия на этом устройстве.' : ''))
  const [confirmed, setConfirmed] = useState(false)
  const [dialog, setDialog] = useState<'reset' | 'back' | null>(null)
  const running = useRef(false)
  const retry = useRef<(() => Promise<void>) | null>(null)
  const step = workspace?.step === 'checklist' ? 2 : workspace ? 1 : 0
  const draftErrors = workspace ? validateDraft(workspace.draft) : []
  const checklistErrors = workspace?.checklist ? validateChecklist(workspace.checklist) : []
  useEffect(() => {
    try {
      storeWorkspace(workspace)
      setStorageError('')
    } catch {
      setStorageError('Не удалось сохранить сессию в браузере. Не закрывайте страницу до скачивания результата.')
    }
  }, [workspace])

  async function run(action: () => Promise<void>) {
    if (running.current) return
    running.current = true
    retry.current = action
    setError('')
    setNotice('')
    try {
      await action()
      retry.current = null
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось выполнить действие. Попробуйте ещё раз.')
    } finally {
      setBusy('')
      running.current = false
    }
  }
  function upload(file: File | null) {
    void run(async () => {
      setBusy('Подготавливаем документ…')
      const job = await checklistService.upload(file)
      setBusy('Получаем демонстрационный черновик…')
      const draft = await checklistService.getDraft(job.id)
      setWorkspace({ version: 1, draft, checklist: null, step: 'draft', savedAt: null, dirty: false })
      setConfirmed(false)
      setNotice('Черновик готов. Проверьте адреса и количество зон в каждом доме.')
    })
  }
  function generate() {
    if (!workspace || !confirmed || draftErrors.length) return
    const draft = structuredClone(workspace.draft)
    void run(async () => {
      setBusy('Сопоставляем зоны с демонстрационным шаблоном ТО…')
      const job = await checklistService.confirmDraft(draft)
      setBusy('Получаем чек-лист…')
      const checklist = await checklistService.getChecklist(job.id)
      setWorkspace({ ...workspace, draft, checklist, step: 'checklist', savedAt: null, dirty: true })
      setNotice('Чек-лист готов. Его можно отредактировать, сохранить или сразу скачать.')
    })
  }
  function save() {
    if (!workspace?.checklist || checklistErrors.length) return
    void run(async () => {
      setBusy('Сохраняем на этом устройстве…')
      const result = await checklistService.saveChecklist(workspace.checklist!)
      setWorkspace({ ...workspace, savedAt: result.savedAt, dirty: false })
      setNotice('Чек-лист сохранён на этом устройстве. Серверное сохранение пока недоступно.')
    })
  }
  function download() {
    if (!workspace?.checklist || checklistErrors.length) return
    void run(async () => {
      setBusy('Готовим Excel-файл…')
      await exportChecklist(workspace.checklist!, workspace.draft)
      setNotice('Excel-файл подготовлен. Скачивание включает все работы и последние правки, независимо от фильтров.')
    })
  }
  function confirmDialog() {
    if (dialog === 'reset') setWorkspace(null)
    else if (workspace) setWorkspace({ ...workspace, step: 'draft', checklist: null, savedAt: null, dirty: false })
    setConfirmed(false)
    setNotice('')
    setError('')
    retry.current = null
    setDialog(null)
  }
  return (
    <div className="checklist-page">
      <div className="page-topline">
        <span>
          Рабочее пространство <span className="breadcrumb-divider">/</span> Чек-листы ТО
        </span>
        <span className="demo-badge">
          <i />
          Деморежим
        </span>
      </div>
      <div className="flow-heading">
        <div>
          <span className="eyebrow">ТЕХНИЧЕСКОЕ ОБСЛУЖИВАНИЕ</span>
          <h1>Подготовка чек-листа</h1>
          <p>Загрузите шахматку, проверьте данные и сформируйте список работ.</p>
        </div>
        {workspace && (
          <Button
            size="default"
            type="default"
            text="Новая шахматка"
            disabled={Boolean(busy)}
            onClick={() => setDialog('reset')}
          />
        )}
      </div>
      <FlowSteps step={step} />
      <div className="demo-notice">
        <span className="info-icon" aria-hidden="true">
          i
        </span>
        <p>
          <strong>Работаем с примером.</strong> API ещё не подключён: дома, зоны и шаблон ТО демонстрационные. Правки
          хранятся только в этом браузере.
        </p>
      </div>
      {storageError && (
        <div className="flow-alert error-alert" role="alert">
          {storageError}
        </div>
      )}
      {error && (
        <div className="flow-alert error-alert" role="alert">
          <span>{error}</span>
          <Button
            size="small"
            type="default"
            text="Повторить"
            disabled={Boolean(busy)}
            onClick={() => {
              if (retry.current) void run(retry.current)
            }}
          />
        </div>
      )}
      {busy && (
        <div className="flow-alert busy-alert" role="status">
          <span className="spinner" />
          {busy}
        </div>
      )}
      {notice && !busy && (
        <div className="flow-alert notice-alert" role="status">
          {notice}
        </div>
      )}
      {!workspace ? (
        <UploadPanel onUpload={upload} busy={Boolean(busy)} />
      ) : (
        <>
          <div className="document-summary">
            <div className="document-name">
              <span className="excel-badge">XLS</span>
              <div>
                <strong>{workspace.draft.fileName}</strong>
                <span className="small muted">
                  {step === 1 ? 'Черновик · ожидает проверки' : 'Шахматка подтверждена'}
                </span>
              </div>
            </div>
            <div className="document-stats">
              <span>
                <strong>{workspace.draft.houses.length}</strong> домов
              </span>
              <span>
                <strong>{workspace.draft.houses.reduce((sum, house) => sum + zoneCount(house), 0)}</strong> зон
              </span>
              {workspace.checklist && (
                <span>
                  <strong>{workspace.checklist.items.length}</strong> работ
                </span>
              )}
            </div>
          </div>
          {workspace.step === 'draft' ? (
            <>
              <DraftEditor
                draft={workspace.draft}
                disabled={Boolean(busy)}
                onChange={(draft) => {
                  setWorkspace({ ...workspace, draft })
                  setConfirmed(false)
                  setNotice('')
                  setError('')
                  retry.current = null
                }}
              />
              {draftErrors.length > 0 && (
                <div className="validation-summary" role="alert">
                  <strong>Проверьте данные перед подтверждением</strong>
                  <ul>
                    {draftErrors.map((message, index) => (
                      <li key={index}>{message}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flow-card quality-card">
                <div>
                  <h3>Всё верно?</h3>
                  <p>После подтверждения для каждой зоны появятся работы из шаблона ТО.</p>
                  <label className="quality-checkbox">
                    <input
                      type="checkbox"
                      checked={confirmed}
                      disabled={Boolean(busy) || Boolean(draftErrors.length)}
                      onChange={(event) => setConfirmed(event.target.checked)}
                    />
                    <span>Я проверил адреса и количество зон. Данные корректны.</span>
                  </label>
                </div>
                <Button
                  size="large"
                  type="primary"
                  text="Создать чек-лист →"
                  disabled={!confirmed || Boolean(draftErrors.length) || Boolean(busy)}
                  onClick={generate}
                />
              </div>
            </>
          ) : (
            workspace.checklist && (
              <>
                <div className="checklist-title-row">
                  <label className="field">
                    <span>Название чек-листа</span>
                    <input
                      value={workspace.checklist.title}
                      disabled={Boolean(busy)}
                      onChange={(event) => {
                        setWorkspace({
                          ...workspace,
                          checklist: { ...workspace.checklist!, title: event.target.value },
                          dirty: true,
                        })
                        setNotice('')
                        setError('')
                        retry.current = null
                      }}
                    />
                  </label>
                  <span className="template-badge">Шаблон ТО · демонстрационный</span>
                </div>
                <ChecklistEditor
                  checklist={workspace.checklist}
                  draft={workspace.draft}
                  disabled={Boolean(busy)}
                  onChange={(checklist) => {
                    setWorkspace({ ...workspace, checklist, dirty: true })
                    setNotice('')
                    setError('')
                    retry.current = null
                  }}
                />
                {checklistErrors.length > 0 && (
                  <div className="validation-summary" role="alert">
                    {checklistErrors.join(' ')}
                  </div>
                )}
                <footer className="flow-card result-actions">
                  <div>
                    <strong>{workspace.dirty ? 'Есть несохранённые изменения' : 'Сохранено на этом устройстве'}</strong>
                    <p>
                      {workspace.savedAt
                        ? `Последнее сохранение: ${new Date(workspace.savedAt).toLocaleString('ru-RU')}`
                        : 'Скачивание доступно без предварительного сохранения.'}
                    </p>
                    <button className="text-action" disabled={Boolean(busy)} onClick={() => setDialog('back')}>
                      ← Вернуться к шахматке
                    </button>
                  </div>
                  <div className="result-buttons">
                    <Button
                      size="large"
                      type="default"
                      text="Сохранить"
                      disabled={Boolean(busy) || Boolean(checklistErrors.length) || !workspace.dirty}
                      onClick={save}
                    />
                    <Button
                      size="large"
                      type="primary"
                      text="Скачать Excel ↓"
                      disabled={Boolean(busy) || Boolean(checklistErrors.length)}
                      onClick={download}
                    />
                  </div>
                </footer>
              </>
            )
          )}
        </>
      )}
      <div className="flow-bottom-note">
        Inspecto <span>·</span> Подготовка технического обслуживания
      </div>
      {dialog && (
        <ConfirmDialog
          title={dialog === 'reset' ? 'Начать новую шахматку?' : 'Вернуться к проверке данных?'}
          onCancel={() => setDialog(null)}
          onConfirm={confirmDialog}
        >
          {dialog === 'reset'
            ? 'Текущая рабочая сессия будет заменена. Скачайте чек-лист перед началом нового документа, если хотите сохранить его отдельно.'
            : 'Текущий чек-лист и правки в нём будут сброшены. После изменения шахматки нужно будет подтвердить данные и сформировать чек-лист заново.'}
        </ConfirmDialog>
      )}
    </div>
  )
}
