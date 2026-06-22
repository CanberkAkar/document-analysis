// ==========================================
// AI Hukuk Asistanı - TypeScript Tip Tanımları
// ==========================================

// --- Auth ---
export interface User {
  userId: string;
  email: string;
  fullName?: string;
  birthDate?: string;
  barAssociation?: string;
  role: 'admin' | 'user';
  isActive?: boolean;
  createdAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

// --- Documents ---
export interface DocumentMeta {
  id: string;
  filename: string;
  uploadedAt: string;
  chunksProcessed: number;
  status: 'processing' | 'ready' | 'error';
}

export interface UploadResponse {
  message: string;
  filename: string;
  chunksProcessed?: number;
}

// --- RAG / Chat ---
export interface Citation {
  source: string;
  page: string | number;
  preview: string;
}

export interface AskRequest {
  question: string;
}

export interface AskResponse {
  answer: string;
  citations: Citation[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
}

// --- API ---
export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}
