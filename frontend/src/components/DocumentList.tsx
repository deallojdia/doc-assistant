import { Archive, ArchiveRestore, FileText, Loader2, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { deleteDocument, updateDocument } from '../services/api'
import type { Document } from '../types'

interface Props {
  documents: Document[]
  onUpdate: () => void
}

export default function DocumentList({ documents, onUpdate }: Props) {
  const [actionId, setActionId] = useState<number | null>(null)

  const handleToggleOutdated = async (doc: Document) => {
    setActionId(doc.id)
    try {
      await updateDocument(doc.id, { is_outdated: !doc.is_outdated })
      onUpdate()
    } finally {
      setActionId(null)
    }
  }

  const handleDelete = async (doc: Document) => {
    if (!confirm(`Delete "${doc.filename}"? This cannot be undone.`)) return
    setActionId(doc.id)
    try {
      await deleteDocument(doc.id)
      onUpdate()
    } finally {
      setActionId(null)
    }
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No documents uploaded yet.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase border-b border-gray-200 dark:border-gray-700">
          <tr>
            <th className="px-4 py-3">Document</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Version</th>
            <th className="px-4 py-3">Chunks</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Uploaded</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr
              key={doc.id}
              className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                doc.is_outdated ? 'opacity-60' : ''
              }`}
            >
              <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className={doc.is_outdated ? 'line-through' : ''}>
                    {doc.filename}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3">
                <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded uppercase">
                  {doc.file_type}
                </span>
              </td>
              <td className="px-4 py-3">v{doc.version}</td>
              <td className="px-4 py-3">{doc.chunk_count}</td>
              <td className="px-4 py-3">
                {doc.processing_status === 'completed' ? (
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      doc.is_outdated
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    }`}
                  >
                    {doc.is_outdated ? 'Outdated' : 'Active'}
                  </span>
                ) : doc.processing_status === 'failed' ? (
                  <span className="text-xs px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                    Failed
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-blue-600">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Processing
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-gray-500">
                {new Date(doc.upload_date).toLocaleDateString()}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  {actionId === doc.id ? (
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  ) : (
                    <>
                      <button
                        onClick={() => handleToggleOutdated(doc)}
                        title={doc.is_outdated ? 'Mark as active' : 'Mark as outdated'}
                        className="p-2 text-gray-400 hover:text-amber-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        {doc.is_outdated ? (
                          <ArchiveRestore className="w-4 h-4" />
                        ) : (
                          <Archive className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(doc)}
                        title="Delete document"
                        className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
