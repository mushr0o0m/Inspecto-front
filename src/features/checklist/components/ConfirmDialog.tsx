import { useEffect, useRef } from 'react'
import Button from '@/shared/Buttons/Button'

export default function ConfirmDialog({
  title,
  children,
  onConfirm,
  onCancel,
}: {
  title: string
  children: string
  onConfirm: () => void
  onCancel: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const element = dialog.current
    element?.showModal()
    return () => element?.close()
  }, [])
  return (
    <dialog ref={dialog} className="flow-dialog" aria-labelledby="confirm-title" onCancel={onCancel}>
      <h2 id="confirm-title">{title}</h2>
      <p>{children}</p>
      <div className="dialog-actions">
        <Button type="default" size="large" text="Отмена" onClick={onCancel} />
        <Button type="primary" size="large" text="Продолжить" onClick={onConfirm} />
      </div>
    </dialog>
  )
}
