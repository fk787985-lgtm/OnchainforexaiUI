import ModalShell from '../common/ModalShell'
import Button from './Button'
import Alert from './Alert'

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'warning'
}) {
  if (!isOpen) return null

  return (
    <ModalShell
      title={title}
      onClose={onCancel}
      maxWidthClassName="max-w-lg"
      minHeightClassName=""
      icon={
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01m-6.9 2h13.8c1.5 0 2.5-1.6 1.7-3L13.7 4c-.8-1.3-2.6-1.3-3.4 0L3.4 16c-.8 1.4.2 3 1.7 3z" />
        </svg>
      }
      bodyClassName="p-6"
    >
      <div className="space-y-4">
        <Alert variant={variant} message={description} />
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={onCancel}>{cancelText}</Button>
          <Button variant={variant === 'error' ? 'danger' : 'primary'} onClick={onConfirm}>{confirmText}</Button>
        </div>
      </div>
    </ModalShell>
  )
}
