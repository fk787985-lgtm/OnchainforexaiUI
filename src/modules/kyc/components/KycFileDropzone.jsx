import { useCallback, useRef, useState } from 'react'
import { isAllowedFile } from '../validation/kycValidation'
import { compressImageFile } from '../utils/compressImage'
import toast from 'react-hot-toast'

const MAX_BYTES = 10 * 1024 * 1024

export default function KycFileDropzone({
  label,
  hint,
  accept = 'image/*,application/pdf',
  imagesOnly = false,
  file,
  previewUrl,
  existingUrl,
  onFile,
  onClear,
  error,
  capture = undefined,
  required
}) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [compressing, setCompressing] = useState(false)

  const processFile = useCallback(
    async (raw) => {
      if (!raw) return
      if (!isAllowedFile(raw, { imagesOnly })) {
        toast.error(imagesOnly ? 'Only images are allowed' : 'Use JPEG, PNG, or PDF (max 10MB)')
        return
      }
      if (raw.size > MAX_BYTES) {
        toast.error('File must be under 10MB')
        return
      }
      setCompressing(true)
      try {
        const compressed = await compressImageFile(raw)
        onFile?.(compressed)
      } finally {
        setCompressing(false)
      }
    },
    [imagesOnly, onFile]
  )

  const onDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    processFile(f)
  }

  const hasFile = Boolean(file || previewUrl || existingUrl)
  const displayPreview =
    previewUrl ||
    (file?.type?.startsWith('image/') ? URL.createObjectURL(file) : null) ||
    (existingUrl && !String(existingUrl).endsWith('.pdf') ? existingUrl : null)

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {label}
          {required ? <span className="text-teal-500 ml-0.5">*</span> : null}
        </p>
        {hasFile && onClear ? (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-medium text-slate-500 hover:text-red-500"
          >
            Replace
          </button>
        ) : null}
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`relative rounded-2xl border-2 border-dashed transition-all overflow-hidden ${
          error
            ? 'border-red-400 bg-red-50/50 dark:bg-red-950/20'
            : dragOver
              ? 'border-teal-500 bg-teal-50/60 dark:bg-teal-950/30'
              : 'border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/50'
        }`}
      >
        {displayPreview ? (
          <div className="relative aspect-[16/10] bg-slate-100 dark:bg-slate-800">
            <img src={displayPreview} alt="" className="w-full h-full object-contain" />
            {file?.name ? (
              <p className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[11px] px-2 py-1 truncate">
                {file.name}
              </p>
            ) : null}
          </div>
        ) : file || existingUrl ? (
          <div className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
              <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate px-4">
              {file?.name || 'Document uploaded'}
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full p-6 sm:p-8 text-center"
            disabled={compressing}
          >
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-teal-500/15 to-cyan-500/15 flex items-center justify-center">
              <svg className="w-6 h-6 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.75}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {compressing ? 'Optimizing…' : 'Drag & drop or browse'}
            </p>
            <p className="text-xs text-slate-500 mt-1">{hint || 'JPEG, PNG or PDF · max 10MB'}</p>
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          capture={capture}
          className="hidden"
          onChange={(e) => {
            processFile(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-teal-400 transition-colors"
        >
          Browse files
        </button>
        {capture !== undefined || imagesOnly ? (
          <button
            type="button"
            onClick={() => {
              if (inputRef.current) {
                inputRef.current.setAttribute('capture', capture || 'environment')
                inputRef.current.click()
                inputRef.current.removeAttribute('capture')
              }
            }}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-teal-400 transition-colors"
          >
            Use camera
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="mt-1.5 text-xs text-red-500" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
