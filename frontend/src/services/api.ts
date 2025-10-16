import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use((config) => {
  console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Types
export interface Document {
  id: string;
  user_id: string;
  title: string;
  content: any;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface AIFeedbackRequest {
  documentId: string;
  userId: string;
  selectedText: string;
  context?: string;
  feedbackType: 'grammar' | 'clarity' | 'style' | 'rewrite' | 'expand' | 'evaluate';
  fullDocument?: string;
  customInstruction?: string;
  userPreferences?: {
    tone?: 'formal' | 'casual';
    style?: 'professional' | 'casual' | 'concise';
  };
}

export interface AIFeedbackResponse {
  type: string;
  suggestions?: any[];
  rewrites?: string[];
  expansions?: any[];
  errors?: any[];
  readabilityScore?: number;
  score?: number;
  summary?: string;
  feedback?: string;
  evaluation?: {
    score: number;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
  };
  model: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

// Document API
export const documentsApi = {
  list: async (userId: string) => {
    const response = await api.get<{ documents: Document[]; total: number }>(
      `/api/documents?userId=${userId}`
    );
    return response.data;
  },

  get: async (id: string) => {
    const response = await api.get<{ document: Document }>(`/api/documents/${id}`);
    return response.data.document;
  },

  create: async (data: { title?: string; content?: any; userId: string }) => {
    const response = await api.post<{ document: Document }>('/api/documents', data);
    return response.data.document;
  },

  update: async (id: string, data: { title?: string; content?: any; is_deleted?: boolean }) => {
    const response = await api.patch<{ document: Document }>(`/api/documents/${id}`, data);
    return response.data.document;
  },

  delete: async (id: string) => {
    const response = await api.delete<{ success: boolean }>(`/api/documents/${id}`);
    return response.data;
  },
};

// Agent API Types
export interface AgentEditRequest {
  documentId: string;
  userId: string;
  selectedText: string;
  instruction: string;
  context?: string;
  previousFeedback?: any[];
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
}

export interface DiffItem {
  type: 'add' | 'remove' | 'unchanged';
  text: string;
}

export interface AgentEditResponse {
  original: string;
  edited: string;
  explanation: string;
  changes: DiffItem[];
  conversationId: string;
  model: string;
}

// AI API
export const aiApi = {
  getFeedback: async (request: AIFeedbackRequest): Promise<AIFeedbackResponse> => {
    const response = await api.post<AIFeedbackResponse>('/api/ai/feedback', request);
    return response.data;
  },

  streamFeedback: async (
    request: AIFeedbackRequest,
    onChunk: (chunk: string) => void,
    onComplete: () => void
  ) => {
    const response = await fetch(`${API_URL}/api/ai/feedback/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('No reader available');
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            onComplete();
            return;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.chunk) {
              onChunk(parsed.chunk);
            }
          } catch (e) {
            // Ignore parse errors for partial chunks
          }
        }
      }
    }
  },

  getFeedbackHistory: async (documentId: string, userId: string) => {
    const response = await api.get<{ history: any[] }>(
      `/api/ai/feedback/history/${documentId}?userId=${userId}`
    );
    return response.data.history;
  },
};

// Agent API
export const agentApi = {
  processEdit: async (request: AgentEditRequest): Promise<AgentEditResponse> => {
    const response = await api.post<AgentEditResponse>('/api/agent/edit', request);
    return response.data;
  },

  streamEdit: async (
    request: AgentEditRequest,
    onChunk: (chunk: string) => void,
    onComplete: () => void
  ) => {
    const response = await fetch(`${API_URL}/api/agent/edit/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('No reader available');
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            onComplete();
            return;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.chunk) {
              onChunk(parsed.chunk);
            }
          } catch (e) {
            // Ignore parse errors for partial chunks
          }
        }
      }
    }
  },
};

// Chat API Types
export interface ChatRequest {
  documentId: string;
  userId: string;
  message: string;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  documentContext?: string;
  selectedText?: string;
}

export interface ChatResponse {
  message: string;
  model: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

// Chat API
export const chatApi = {
  sendMessage: async (request: ChatRequest): Promise<ChatResponse> => {
    const response = await api.post<ChatResponse>('/api/chat/message', request);
    return response.data;
  },

  streamMessage: async (
    request: ChatRequest,
    onChunk: (chunk: string) => void,
    onComplete: () => void
  ) => {
    const response = await fetch(`${API_URL}/api/chat/message/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('No reader available');
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            onComplete();
            return;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.chunk) {
              onChunk(parsed.chunk);
            }
          } catch (e) {
            // Ignore parse errors for partial chunks
          }
        }
      }
    }
  },
};

export default api;
