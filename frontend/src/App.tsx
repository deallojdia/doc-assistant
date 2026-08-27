import { BookOpen, FileText, MessageSquare } from 'lucide-react'
import { useState } from 'react'
import ChatPage from './pages/ChatPage'
import DocumentsPage from './pages/DocumentsPage'

type Page = 'chat' | 'documents'

export default function App() {
  const [page, setPage] = useState<Page>('chat')

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shrink-0">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              Doc Assistant
            </span>
          </div>
          <nav className="flex gap-1">
            <button
              onClick={() => setPage('chat')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                page === 'chat'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Chat
            </button>
            <button
              onClick={() => setPage('documents')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                page === 'documents'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              Documents
            </button>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-hidden">
        {page === 'chat' ? <ChatPage /> : <DocumentsPage />}
      </main>
    </div>
  )
}
