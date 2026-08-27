import { RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import DocumentList from '../components/DocumentList'
import DocumentUpload from '../components/DocumentUpload'
import { getDocuments } from '../services/api'
import type { Document } from '../types'

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDocuments = useCallback(async () => {
    try {
      const docs = await getDocuments()
      setDocuments(docs)
    } catch {
      // Backend might not be running
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  // Poll for processing status updates
  useEffect(() => {
    const hasProcessing = documents.some(
      (d) => d.processing_status === 'pending' || d.processing_status === 'processing'
    )
    if (!hasProcessing) return

    const interval = setInterval(fetchDocuments, 3000)
    return () => clearInterval(interval)
  }, [documents, fetchDocuments])

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Documents
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Upload and manage your internal documents
          </p>
        </div>
        <button
          onClick={fetchDocuments}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <DocumentUpload
        onUploaded={(doc) => {
          setDocuments((prev) => [doc, ...prev])
        }}
      />

      {loading ? (
        <div className="text-center py-8 text-gray-400">Loading documents...</div>
      ) : (
        <DocumentList documents={documents} onUpdate={fetchDocuments} />
      )}
    </div>
  )
}
