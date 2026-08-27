import axios from 'axios'
import type { ChatResponse, Document } from '../types'

const api = axios.create({ baseURL: '/api' })

export async function uploadDocument(file: File): Promise<Document> {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post<Document>('/documents/upload', form)
  return data
}

export async function getDocuments(): Promise<Document[]> {
  const { data } = await api.get<Document[]>('/documents')
  return data
}

export async function updateDocument(
  id: number,
  update: { is_outdated: boolean }
): Promise<Document> {
  const { data } = await api.patch<Document>(`/documents/${id}`, update)
  return data
}

export async function deleteDocument(id: number): Promise<void> {
  await api.delete(`/documents/${id}`)
}

export async function askQuestion(
  question: string,
  topK: number = 5
): Promise<ChatResponse> {
  const { data } = await api.post<ChatResponse>('/chat', {
    question,
    top_k: topK,
  })
  return data
}
