import QualityPanel from './components/QualityPanel'
import HistoryPanel from './components/HistoryPanel'
import ExportPreview from './components/ExportPreview'
import { inspectWorkspace, type Issue } from './services/quality'
import { archiveWorkspace, type Revision } from './services/history'
import PlumbingChecklist from './components/PlumbingChecklist'
import { useEffect, useRef, useState, useMemo } from 'react'
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
  const [workspace, setWorkspaceState] = useState<Workspace | null>(loadWorkspace)
  const [tab, setTab] = useState<'editor' | 'quality' | 'preview' | 'history'>('editor')
  const [undoStack, setUndoStack] = useState<Array<Workspace | null>>([])
  const [redoStack, setRedoStack] = useState<Array<Workspace | null>>([])
  const [focus, setFocus] = useState<Issue | null>(null)
  const [restore, setRestore] = useState<Revision | null>(null)
  const [historyTick, setHistoryTick] = useState(0)
  function setWorkspace(next: Workspace | null) {
    setUndoStack((prev) => [...prev.slice(-19), workspace])
    setRedoStack([])
    retry.current = null
    setError('')
    setWorkspaceState(next)
  }
  function undo() {
    if (!undoStack.length) return
    setRedoStack((prev) => [...prev, workspace])
    setWorkspaceState(undoStack[undoStack.length - 1])
    setUndoStack((prev) => prev.slice(0, -1))
    setConfirmed(false)
    setFocus(null)
    setError('')
    retry.current = null
    setNotice('Изменение отменено.')
    setTab('editor')
  }
  function redo() {
    if (!redoStack.length) return
    setUndoStack((prev) => [...prev, workspace])
    setWorkspaceState(redoStack[redoStack.length - 1])
    setRedoStack((prev) => prev.slice(0, -1))
    setConfirmed(false)
    setFocus(null)
    setError('')
    retry.current = null
    setNotice('Изменение повторено.')
    setTab('editor')
  }
  const issues = useMemo(() => (workspace ? inspectWorkspace(workspace) : []), [workspace])
  const blocking = issues.some((i) => i.level === 'error')
  const draftBlocking = issues.some((i) => i.stage === 'draft' && i.level === 'error')
  async function archive(value: Workspace, reason: string) {
    await archiveWorkspace(value, reason)
    setHistoryTick((t) => t + 1)
  }
  function selectIssue(issue: Issue) {
    if (issue.stage === 'draft' && workspace?.step === 'checklist') {
      setFocus(issue)
      setDialog('back')
      return
    }
    setFocus({ ...issue, id: issue.id + Date.now() })
    setTab('editor')
  }
  function restoreRevision() {
    if (!restore) return
    const target = restore
    void run(async () => {
      setBusy('Восстанавливаем версию…')
      if (workspace) await archive(workspace, 'Перед восстановлением другой версии')
      setWorkspace(structuredClone(target.workspace))
      setConfirmed(false)
      setFocus(null)
      setRestore(null)
      setTab('editor')
      setNotice('Версия восстановлена. Предыдущая работа сохранена в истории.')
    })
  }
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [storageError, setStorageError] = useState('')
  const [notice, setNotice] = useState(() => (workspace ? 'Восстановлена последняя сессия на этом устройстве.' : ''))
  const [confirmed, setConfirmed] = useState(false)
  const [dialog, setDialog] = useState<'reset' | 'back' | null>(null)
  const running = useRef(false)
  const retry = useRef<(() => Promise<void>) | null>(null)
  const ActiveEditor = workspace?.draft.plumbing ? PlumbingChecklist : ChecklistEditor
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
      let selectedFile = file
      if (!selectedFile) {
        const response = await fetch('/examples/plumbing.xlsx')
        if (!response.ok) throw new Error('Не удалось открыть пример шахматки.')
        selectedFile = new File([await response.arrayBuffer()], 'Шахматка Крауля 105–107.xlsx')
      }
      const job = await checklistService.upload(selectedFile)
      setBusy('Читаем шахматку…')
      const draft = await checklistService.getDraft(job.id)
      setWorkspace({ version: 1, draft, checklist: null, step: 'draft', savedAt: null, dirty: false })
      setConfirmed(false)
      setNotice('Черновик готов. Проверьте адреса и количество зон в каждом доме.')
    })
  }
  function generate() {
    if (!workspace || !confirmed || draftErrors.length || draftBlocking) return
    const draft = structuredClone(workspace.draft)
    void run(async () => {
      setBusy('Сопоставляем помещения и зоны с шаблоном ТО…')
      await archive(workspace, 'Перед формированием чек-листа')
      const job = await checklistService.confirmDraft(draft)
      setBusy('Получаем чек-лист…')
      const checklist = await checklistService.getChecklist(job.id)
      const generated: Workspace = { ...workspace, draft, checklist, step: 'checklist', savedAt: null, dirty: true }
      await archive(generated, 'Чек-лист сформирован')
      setWorkspace(generated)
      setNotice('Чек-лист готов. Его можно отредактировать, сохранить или сразу скачать.')
    })
  }
  function save() {
    if (!workspace) return
    void run(async () => {
      setBusy('Сохраняем версию…')
      const saved: Workspace = { ...workspace, savedAt: new Date().toISOString(), dirty: false }
      await archive(saved, 'Сохранено пользователем')
      setWorkspace(saved)
      setNotice('Версия шахматки и чек-листа сохранена во вкладке «История».')
    })
  }
  function download() {
    if (!workspace?.checklist || checklistErrors.length || blocking) return
    void run(async () => {
      setBusy('Готовим Excel-файл…')
      await archive(workspace, 'Перед выгрузкой Excel')
      await exportChecklist(workspace.checklist!, workspace.draft)
      setNotice('Excel-файл подготовлен. Скачивание включает все работы и последние правки, независимо от фильтров.')
    })
  }
  function confirmDialog() {
    void run(async () => {
      setBusy('Сохраняем текущую версию…')
      if (workspace)
        await archive(workspace, dialog === 'reset' ? 'Перед новым документом' : 'Перед изменением шахматки')
      if (dialog === 'reset') {
        setWorkspace(null)
        setFocus(null)
      } else if (workspace) setWorkspace({ ...workspace, step: 'draft', checklist: null, savedAt: null, dirty: false })
      setConfirmed(false)
      setNotice('Предыдущая версия сохранена в истории.')
      setError('')
      setDialog(null)
      setTab('editor')
    })
  }
  return (
    <div className="checklist-page">
      <div className="page-topline">
        <span>
          Рабочее пространство <span className="breadcrumb-divider">/</span> Чек-листы ТО
        </span>
        <span className="demo-badge">
          <i />
          Сантехника · ТО
        </span>
      </div>
      <div className="flow-heading">
        <div>
          <span className="eyebrow">ТЕХНИЧЕСКОЕ ОБСЛУЖИВАНИЕ</span>
          <h1>Чек-лист сантехника</h1>
          <p>Дома и зоны → работы по ТО → проверка требований и выгрузка.</p>
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
      <nav className="workspace-tabs" aria-label="Разделы документа">
        {(
          [
            ['editor', 'Редактор'],
            ['quality', `Проверка (${issues.length})`],
            ['preview', 'Предпросмотр Excel'],
            ['history', 'История'],
          ] as const
        ).map(([value, label]) => (
          <button key={value} aria-current={tab === value ? 'page' : undefined} onClick={() => setTab(value)}>
            {label}
          </button>
        ))}
      </nav>
      <div className="workspace-actions">
        <Button
          type="default"
          size="small"
          text="Отменить изменение"
          disabled={!undoStack.length || Boolean(busy)}
          onClick={undo}
        />
        <Button
          type="default"
          size="small"
          text="Повторить"
          disabled={!redoStack.length || Boolean(busy)}
          onClick={redo}
        />
        {workspace && (
          <Button type="default" size="small" text="Сохранить версию" disabled={Boolean(busy)} onClick={save} />
        )}
      </div>
      {tab === 'editor' && <FlowSteps step={step} />}
      {tab === 'quality' && <QualityPanel issues={issues} onSelect={selectIssue} />}
      {tab === 'history' && <HistoryPanel key={historyTick} busy={Boolean(busy)} onRestore={setRestore} />}
      {tab === 'preview' &&
        (workspace ? (
          <>
            <ExportPreview workspace={workspace} />
            <div className="preview-download">
              <p>
                {blocking
                  ? 'Скачивание заблокировано: исправьте ошибки во вкладке «Проверка».'
                  : `Предупреждений: ${issues.filter((i) => i.level === 'warning').length}. Проверьте результат перед скачиванием.`}
              </p>
              <Button
                type="primary"
                size="large"
                text="Скачать Excel"
                disabled={!workspace.checklist || blocking || Boolean(busy)}
                onClick={download}
              />
              <button className="text-action" onClick={() => setTab('quality')}>
                Открыть проверку
              </button>
            </div>
          </>
        ) : (
          <p>Загрузите документ во вкладке «Редактор».</p>
        ))}
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
      {tab === 'editor' &&
        (!workspace ? (
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
                  key={focus?.id}
                  focusHouse={focus?.houseId}
                  focusField={focus?.field}
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
                {draftBlocking && (
                  <div className="quantity-warning">
                    Есть незаполненные количества или нераспределённые зоны.{' '}
                    <button className="text-action" onClick={() => setTab('quality')}>
                      Перейти к ошибкам →
                    </button>
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
                        disabled={Boolean(busy) || Boolean(draftErrors.length) || draftBlocking}
                        onChange={(event) => setConfirmed(event.target.checked)}
                      />
                      <span>Я проверил адреса и количество зон. Данные корректны.</span>
                    </label>
                  </div>
                  <Button
                    size="large"
                    type="primary"
                    text="Создать чек-лист →"
                    disabled={!confirmed || Boolean(draftErrors.length) || Boolean(busy) || draftBlocking}
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
                        autoFocus={focus?.field === 'title'}
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
                    <span className="template-badge">ТО1.1 · ТО1 · ТО2</span>
                  </div>
                  <ActiveEditor
                    key={focus?.id}
                    focusItem={focus?.itemId}
                    focusField={focus?.field}
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
                      <strong>
                        {workspace.dirty ? 'Есть несохранённые изменения' : 'Сохранено на этом устройстве'}
                      </strong>
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
                        text="Проверить и скачать →"
                        disabled={Boolean(busy)}
                        onClick={() => setTab('preview')}
                      />
                    </div>
                  </footer>
                </>
              )
            )}
          </>
        ))}
      <div className="flow-bottom-note">
        Inspecto <span>·</span> Подготовка технического обслуживания
      </div>
      {restore && (
        <ConfirmDialog title="Восстановить эту версию?" onCancel={() => setRestore(null)} onConfirm={restoreRevision}>
          Текущая работа будет сохранена в истории, затем редактор откроет выбранную версию.
        </ConfirmDialog>
      )}
      {dialog && (
        <ConfirmDialog
          title={dialog === 'reset' ? 'Начать новую шахматку?' : 'Вернуться к проверке данных?'}
          onCancel={() => setDialog(null)}
          onConfirm={confirmDialog}
        >
          {dialog === 'reset'
            ? 'Текущая шахматка и чек-лист сохранятся в истории. Затем можно загрузить новый документ.'
            : 'Текущий чек-лист сохранится в истории. После изменения шахматки нужно будет подтвердить данные и сформировать новый чек-лист.'}
        </ConfirmDialog>
      )}
    </div>
  )
}
