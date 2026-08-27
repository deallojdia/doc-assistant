import { ChevronDown, ChevronUp, FileText } from 'lucide-react'
import { useState } from 'react'
import type { SourceChunk } from '../types'

export default function SourceCard({ source }: { source: SourceChunk }) {
  const [expanded, setExpanded] = useState(false)

  const relevanceColor =
    source.relevance_score > 0.8
      ? 'bg-green-500'
      : source.relevance_score > 0.6
        ? 'bg-yellow-500'
        : 'bg-red-500'

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
            {source.document_name}
          </span>
          <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full shrink-0">
            v{source.version}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`w-2 h-2 rounded-full ${relevanceColor}`} />
          <span className="text-xs text-gray-500">
            {Math.round(source.relevance_score * 100)}%
          </span>
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-1">
        Uploaded: {new Date(source.upload_date).toLocaleDateString()} · Chunk #{source.chunk_index}
      </p>

      <div className="mt-2">
        <p
          className={`text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap ${
            !expanded ? 'line-clamp-3' : ''
          }`}
        >
          {source.chunk_text}
        </p>
        {source.chunk_text.length > 200 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 mt-1 hover:underline"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3 h-3" /> Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" /> Show more
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
