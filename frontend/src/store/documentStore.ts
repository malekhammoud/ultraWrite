import { create } from 'zustand';
import { documentsApi } from '@/services/api';

export interface DocumentListItem {
  id: string;
  user_id: string;
  title: string;
  content: any;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  is_starred?: boolean;
}

interface DocumentState {
  documents: DocumentListItem[];
  filteredDocuments: DocumentListItem[];
  isLoading: boolean;
  error: string | null;
  currentFilter: 'all' | 'recent' | 'starred' | 'trash';
  userId: string;

  // Actions
  setUserId: (userId: string) => void;
  fetchDocuments: () => Promise<void>;
  createDocument: (title?: string, content?: any) => Promise<DocumentListItem>;
  updateDocument: (id: string, updates: Partial<DocumentListItem>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  toggleStar: (id: string) => void;
  setFilter: (filter: 'all' | 'recent' | 'starred' | 'trash') => void;
  applyFilter: () => void;
}

const MOCK_USER_ID = 'mock-user-123';

export const useDocumentStore = create<DocumentState>((set, get) => ({
  documents: [],
  filteredDocuments: [],
  isLoading: false,
  error: null,
  currentFilter: 'all',
  userId: MOCK_USER_ID,

  setUserId: (userId) => set({ userId }),

  fetchDocuments: async () => {
    set({ isLoading: true, error: null });
    try {
      const { documents } = await documentsApi.list(get().userId);
      set({ documents: documents as DocumentListItem[], isLoading: false });
      get().applyFilter();
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  createDocument: async (title = 'Untitled Document', content = {}) => {
    set({ isLoading: true, error: null });
    try {
      const newDoc = await documentsApi.create({
        title,
        content,
        userId: get().userId,
      });

      const documentItem = newDoc as unknown as DocumentListItem;

      set((state) => ({
        documents: [documentItem, ...state.documents],
        isLoading: false,
      }));

      get().applyFilter();
      return documentItem;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateDocument: async (id, updates) => {
    try {
      await documentsApi.update(id, updates);

      set((state) => ({
        documents: state.documents.map((doc) =>
          doc.id === id ? { ...doc, ...updates, updated_at: new Date().toISOString() } : doc
        ),
      }));

      get().applyFilter();
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  deleteDocument: async (id) => {
    try {
      await documentsApi.delete(id);

      set((state) => ({
        documents: state.documents.map((doc) =>
          doc.id === id ? { ...doc, is_deleted: true, updated_at: new Date().toISOString() } : doc
        ),
      }));

      get().applyFilter();
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  toggleStar: (id) => {
    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === id ? { ...doc, is_starred: !doc.is_starred } : doc
      ),
    }));
    get().applyFilter();
  },

  setFilter: (filter) => {
    set({ currentFilter: filter });
    get().applyFilter();
  },

  applyFilter: () => {
    const { documents, currentFilter } = get();
    let filtered = [...documents];

    switch (currentFilter) {
      case 'all':
        filtered = documents.filter((doc) => !doc.is_deleted);
        break;
      case 'recent':
        filtered = documents
          .filter((doc) => !doc.is_deleted)
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
          .slice(0, 10);
        break;
      case 'starred':
        filtered = documents.filter((doc) => !doc.is_deleted && doc.is_starred);
        break;
      case 'trash':
        filtered = documents.filter((doc) => doc.is_deleted);
        break;
    }

    set({ filteredDocuments: filtered });
  },
}));
