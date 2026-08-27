import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import type { ConflictInfo } from '../types'

export default function ConflictBanner({ conflict }: { conflict: ConflictInfo }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/30 rounded-lg p-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-left"
      >
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
        <span className="font-medium text-amber-800 dark:text-amber-200 flex-1">
          Potential conflict detected between sources
        </span>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-amber-600" />
        ) : (
          <ChevronDown className="w-4 h-4 text-amber-600" />
        )}
      </button>

      {expanded && (
        <div className="mt-3 space-y-2">
          <p className="text-sm text-amber-700 dark:text-amber-300">
            {conflict.explanation}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {conflict.conflicting_sources.map((source, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-700 rounded p-3"
              >
                <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                  {source.document_name} (v{source.version})
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-4">
                  {source.chunk_text}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
