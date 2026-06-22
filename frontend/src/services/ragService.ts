/**
 * RAG Service — Document upload and question-answering.
 *
 * Talks to the backend RagModule endpoints:
 *   POST /rag/upload   → Upload PDF document
 *   POST /rag/ask      → Ask a question (RAG pipeline)
 */

import { api } from './apiClient';
import type { AskResponse, UploadResponse, DocumentMeta } from '@/types';

// ─── Endpoints ───────────────────────────────────────────────
const RAG_ENDPOINTS = {
  UPLOAD: '/rag/upload',
  ASK: '/rag/ask',
  DOCUMENTS: '/rag/documents',
  HISTORY: '/rag/history',
} as const;

// ─── Service ─────────────────────────────────────────────────
export const ragService = {
  /**
   * Upload a PDF file for indexing into the vector database.
   */
  async uploadDocument(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return api.upload<UploadResponse>(RAG_ENDPOINTS.UPLOAD, formData);
  },

  /**
   * Ask a question — triggers RAG pipeline (retrieval + generation).
   */
  async askQuestion(question: string): Promise<AskResponse> {
    return api.post<AskResponse>(RAG_ENDPOINTS.ASK, { question });
  },

  /**
   * List all uploaded documents.
   */
  async getDocuments(): Promise<DocumentMeta[]> {
    return api.get<DocumentMeta[]>(RAG_ENDPOINTS.DOCUMENTS);
  },

  /**
   * Delete an uploaded document.
   */
  async deleteDocument(id: string): Promise<{ success: boolean; message: string }> {
    return api.delete<{ success: boolean; message: string }>(`${RAG_ENDPOINTS.DOCUMENTS}/${id}`);
  },

  /**
   * Get question history.
   */
  async getHistory(): Promise<{ question: string; answer: string; createdAt: string }[]> {
    return api.get(RAG_ENDPOINTS.HISTORY);
  },

  /**
   * Summarize a document by its ID.
   */
  async summarizeDocument(id: string): Promise<{ summary: string }> {
    return api.post<{ summary: string }>(`/rag/documents/${id}/summarize`, {});
  },

  /**
   * Generate a draft for a legal document template.
   */
  async generateDraft(templateType: string, variables: any): Promise<{ draft: string }> {
    return api.post<{ draft: string }>('/rag/generate-draft', { templateType, variables });
  },
};
