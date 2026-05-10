import { getImageUrl } from '../../utils/imageUrl.js'

const getExtension = (filename = '') => filename.split('.').pop()?.toLowerCase() || ''

const isImage = (attachment = {}) => {
  const mime = String(attachment.mimetype || '').toLowerCase()
  if (mime.startsWith('image/')) return true
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'jfif'].includes(getExtension(attachment.filename))
}

const isVideo = (attachment = {}) => {
  const mime = String(attachment.mimetype || '').toLowerCase()
  if (mime.startsWith('video/')) return true
  return ['mp4', 'webm', 'mov', 'm4v'].includes(getExtension(attachment.filename))
}

const isPdf = (attachment = {}) => {
  const mime = String(attachment.mimetype || '').toLowerCase()
  if (mime === 'application/pdf') return true
  return getExtension(attachment.filename) === 'pdf'
}

export default function MessageAttachments({ attachments = [], isOwnMessage = false }) {
  if (!attachments.length) return null

  return (
    <div className="mt-2 space-y-2">
      {attachments.map((attachment, idx) => {
        const fileUrl = getImageUrl(attachment.path)

        if (isImage(attachment)) {
          return (
            <a
              key={`${attachment.path || attachment.filename}-${idx}`}
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <img
                src={fileUrl}
                alt={attachment.filename || 'attachment'}
                className="max-h-56 w-full rounded-xl object-cover border border-black/10"
                loading="lazy"
              />
            </a>
          )
        }

        if (isVideo(attachment)) {
          return (
            <video
              key={`${attachment.path || attachment.filename}-${idx}`}
              src={fileUrl}
              controls
              className="max-h-64 w-full rounded-xl border border-black/10 bg-black"
            />
          )
        }

        return (
          <a
            key={`${attachment.path || attachment.filename}-${idx}`}
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-between gap-3 rounded-lg p-2 text-sm ${
              isOwnMessage
                ? 'bg-indigo-700 text-white hover:bg-indigo-800'
                : 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500'
            }`}
          >
            <span className="truncate">{attachment.filename || (isPdf(attachment) ? 'Open PDF' : 'Open attachment')}</span>
            <span className="shrink-0 text-xs opacity-80">{isPdf(attachment) ? 'PDF' : 'File'}</span>
          </a>
        )
      })}
    </div>
  )
}
