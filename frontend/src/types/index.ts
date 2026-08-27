export interface Document {
  id: number
  filename: string
  file_type: string
  upload_date: string
  version: number
  is_outdated: boolean
  chunk_count: number
  processing_status: string
}

export interface SourceChunk {
  document_name: string
  chunk_text: string
  chunk_index: number
  upload_date: string
  version: number
  relevance_score: number
}

export interface ConflictInfo {
  conflicting_sources: SourceChunk[]
  explanation: string
}

export interface ChatResponse {
  answer: string
  sources: SourceChunk[]
  has_conflict: boolean
  conflict?: ConflictInfo
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  sources?: SourceChunk[]
  has_conflict?: boolean
  conflict?: ConflictInfo
}
