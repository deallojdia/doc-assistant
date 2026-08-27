import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import ChatInterface from '../components/ChatInterface'
import ConflictBanner from '../components/ConflictBanner'
import SourceCard from '../components/SourceCard'
import { askQuestion } from '../services/api'
import type { ChatMessage } from '../types'

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [expandedSources, setExpandedSources] = useState<Set<number>>(new Set())

  const toggleSources = (index: number) => {
    setExpandedSources((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const handleSend = async (question: string) => {
    const userMsg: ChatMessage = { role: 'user', content: question }
    setMessages((prev) => [...prev, userMsg])
    setIsLoading(true)

    try {
      const response = await askQuestion(question)
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: response.answer,
        sources: response.sources,
        has_conflict: response.has_conflict,
        conflict: response.conflict,
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch {
      const errorMsg: ChatMessage = {
        role: 'assistant',
        content:
          'Sorry, something went wrong. Please make sure the backend and Ollama are running.',
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4">
            <BookOpen className="w-16 h-16 opacity-30" />
            <div className="text-center">
              <h2 className="text-xl font-medium text-gray-600 dark:text-gray-300">
                Document Assistant
              </h2>
              <p className="text-sm mt-1">
                Ask questions about your uploaded documents
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
            {messages.map((msg, i) => (
              <div key={i}>
                {msg.role === 'user' ? (
                  <div className="flex justify-end">
                    <div className="bg-blue-600 text-white rounded-2xl rounded-br-md px-4 py-3 max-w-[80%]">
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {msg.has_conflict && msg.conflict && (
                      <ConflictBanner conflict={msg.conflict} />
                    )}
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3 max-w-[90%]">
                      <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                        {msg.content}
                      </p>
                    </div>
                    {msg.sources && msg.sources.length > 0 && (
                      <div>
                        <button
                          onClick={() => toggleSources(i)}
                          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                          {expandedSources.has(i) ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                          {msg.sources.length} source{msg.sources.length !== 1 ? 's' : ''}
                        </button>
                        {expandedSources.has(i) && (
                          <div className="mt-2 space-y-2">
                            {msg.sources.map((source, j) => (
                              <SourceCard key={j} source={source} />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-1 px-4 py-3">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input area */}
      <ChatInterface onSend={handleSend} isLoading={isLoading} />
    </div>
  )
}
