'use client';

/**
 * useChat — Chat state management hook.
 *
 * Manages message list, loading state, and interacts with ragService.
 */

import { useState, useCallback } from 'react';
import { ragService } from '@/services/ragService';
import { generateId } from '@/lib/utils';
import type { ChatMessage } from '@/types';

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (question: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: question,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await ragService.askQuestion(question);

      // Add assistant message
      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: response.answer as string,
        citations: response.citations,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (typeof window !== 'undefined') {
        const currentQ = parseInt(localStorage.getItem('hukuk_ai_q_count') || '0', 10);
        const currentA = parseInt(localStorage.getItem('hukuk_ai_a_count') || '0', 10);
        localStorage.setItem('hukuk_ai_q_count', (currentQ + 1).toString());
        localStorage.setItem('hukuk_ai_a_count', (currentA + 1).toString());
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Cevap alınamadı. Lütfen tekrar deneyin.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    clearError,
  };
}
