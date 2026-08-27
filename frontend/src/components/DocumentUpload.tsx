import { FileUp, Loader2, X } from 'lucide-react'
import { useCallback, useState } from 'react'
import { uploadDocument } from '../services/api'
import type { Document } from '../types'

interface Props {
  onUploaded: (doc: Document) => void
}

export default function DocumentUpload({ onUploaded }: Props) {
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return
      const file = files[0]

      const ext = file.name.split('.').pop()?.toLowerCase()
      if (ext !== 'pdf' && ext !== 'md') {
        setError('Only PDF and Markdown (.md) files are supported.')
        return
      }

      setError(null)
      setUploading(true)
      try {
        const doc = await uploadDocument(file)
        onUploaded(doc)
      } catch (err: unknown) {
        if (
          typeof err === 'object' &&
          err !== null &&
          'response' in err &&
          typeof (err as Record<string, unknown>).response === 'object'
        ) {
          const resp = (err as { response: { data?: { detail?: string } } }).response
          setError(resp.data?.detail || 'Upload failed.')
        } else {
          setError('Upload failed. Is the backend running?')
        }
      } finally {
        setUploading(false)
      }
    },
    [onUploaded]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles]
  )

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer
          ${
            dragOver
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }`}
        onClick={() => {
          const input = document.createElement('input')
          input.type = 'file'
          input.accept = '.pdf,.md'
          input.onchange = (e) =>
            handleFiles((e.target as HTMLInputElement).files)
          input.click()
        }}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-sm text-gray-500">Processing document...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <FileUp className="w-8 h-8 text-gray-400" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Drag & drop a PDF or Markdown file, or click to browse
            </p>
            <p className="text-xs text-gray-400">Supported: .pdf, .md</p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2">
          <p className="text-sm text-red-700 dark:text-red-300 flex-1">{error}</p>
          <button onClick={() => setError(null)}>
            <X className="w-4 h-4 text-red-400" />
          </button>
        </div>
      )}
    </div>
  )
}
