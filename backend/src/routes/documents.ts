import { Router, type Request, type Response } from 'express';
import { supabase, isSupabaseConfigured } from '../config/supabase.js';
import { z, type ZodError } from 'zod';

const router: Router = Router();

// Validation schemas
const createDocumentSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  content: z.any().optional(),
  userId: z.string().min(1), // Changed from .uuid() to .min(1) to allow non-UUID strings
});

const updateDocumentSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  content: z.any().optional(),
  is_deleted: z.boolean().optional(),
});

// In-memory mock storage for when Supabase is not configured
let mockDocuments: any[] = [];

// GET /api/documents - List user's documents
router.get('/', async (req, res) => {
  try {
    const userId = req.query.userId as string;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    if (!isSupabaseConfigured()) {
      // Return mock data
      const userDocs = mockDocuments.filter(doc => doc.user_id === userId && !doc.is_deleted);
      return res.json({ documents: userDocs, total: userDocs.length });
    }

    const { data, error, count } = await supabase
      .from('documents')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    res.json({ documents: data || [], total: count || 0 });
  } catch (error: any) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/documents/:id - Get single document
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isSupabaseConfigured()) {
      const doc = mockDocuments.find(d => d.id === id);
      return res.json({ document: doc || null });
    }

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    res.json({ document: data });
  } catch (error: any) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/documents - Create new document
router.post('/', async (req, res) => {
  try {
    const validatedData = createDocumentSchema.parse(req.body);

    if (!isSupabaseConfigured()) {
      const newDoc = {
        id: `doc_${Date.now()}`,
        user_id: validatedData.userId,
        title: validatedData.title || 'Untitled',
        content: validatedData.content || {},
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockDocuments.push(newDoc);
      return res.json({ document: newDoc });
    }

    const { data, error } = await supabase
      .from('documents')
      .insert({
        user_id: validatedData.userId,
        title: validatedData.title || 'Untitled',
        content: validatedData.content || {},
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ document: data });
  } catch (error: any) {
    console.error('Error creating document:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as ZodError).issues });
    }
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/documents/:id - Update document
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateDocumentSchema.parse(req.body);

    if (!isSupabaseConfigured()) {
      const index = mockDocuments.findIndex(d => d.id === id);
      if (index !== -1) {
        mockDocuments[index] = {
          ...mockDocuments[index],
          ...validatedData,
          updated_at: new Date().toISOString(),
        };
        return res.json({ document: mockDocuments[index] });
      }
      return res.status(404).json({ error: 'Document not found' });
    }

    const { data, error } = await supabase
      .from('documents')
      .update(validatedData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ document: data });
  } catch (error: any) {
    console.error('Error updating document:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as ZodError).issues });
    }
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/documents/:id - Soft delete document
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isSupabaseConfigured()) {
      const index = mockDocuments.findIndex(d => d.id === id);
      if (index !== -1) {
        mockDocuments[index].is_deleted = true;
        mockDocuments[index].updated_at = new Date().toISOString();
        return res.json({ success: true });
      }
      return res.status(404).json({ error: 'Document not found' });
    }

    const { error } = await supabase
      .from('documents')
      .update({ is_deleted: true })
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
