import { Router, type Request, type Response } from 'express';
import { geminiService, type AIFeedbackRequest } from '../services/geminiService.js';
import { supabase, isSupabaseConfigured } from '../config/supabase.js';
import { z, type ZodError } from 'zod';

const router: Router = Router();

// Validation schemas
const feedbackRequestSchema = z.object({
  documentId: z.string(),
  userId: z.string().min(1), // Changed from .uuid() to .min(1) to allow non-UUID strings
  selectedText: z.string().min(1),
  context: z.string().optional(),
  feedbackType: z.enum(['grammar', 'clarity', 'style', 'rewrite', 'expand', 'evaluate']),
  fullDocument: z.string().optional(),
  customInstruction: z.string().optional(),
  userPreferences: z.object({
    tone: z.enum(['formal', 'casual']).optional(),
    style: z.enum(['professional', 'casual', 'concise']).optional(),
  }).optional(),
});

// POST /api/ai/feedback - Get AI feedback on selected text
router.post('/feedback', async (req, res) => {
  try {
    const validatedData = feedbackRequestSchema.parse(req.body);

    const aiRequest: AIFeedbackRequest = {
      selectedText: validatedData.selectedText,
      context: validatedData.context || '',
      feedbackType: validatedData.feedbackType,
      fullDocument: validatedData.fullDocument,
      customInstruction: validatedData.customInstruction,
      userPreferences: validatedData.userPreferences,
    };

    const response = await geminiService.analyzeFeedback(aiRequest);

    // Save to feedback history if Supabase is configured
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('ai_feedback_history').insert({
          document_id: validatedData.documentId,
          user_id: validatedData.userId,
          selected_text: validatedData.selectedText,
          feedback_type: validatedData.feedbackType,
          ai_response: response,
          model: response.model,
        });
      } catch (historyError) {
        console.error('Failed to save feedback history:', historyError);
        // Continue anyway - don't fail the request
      }
    }

    res.json(response);
  } catch (error: any) {
    console.error('AI feedback error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as ZodError).issues });
    }
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai/feedback/stream - Stream AI feedback (SSE)
router.post('/feedback/stream', async (req, res) => {
  try {
    const validatedData = feedbackRequestSchema.parse(req.body);

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const aiRequest: AIFeedbackRequest = {
      selectedText: validatedData.selectedText,
      context: validatedData.context || '',
      feedbackType: validatedData.feedbackType,
      fullDocument: validatedData.fullDocument,
      customInstruction: validatedData.customInstruction,
      userPreferences: validatedData.userPreferences,
    };

    let fullResponse = '';

    for await (const chunk of geminiService.streamFeedback(aiRequest)) {
      fullResponse += chunk;
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    }

    // Save complete response to history if configured
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('ai_feedback_history').insert({
          document_id: validatedData.documentId,
          user_id: validatedData.userId,
          selected_text: validatedData.selectedText,
          feedback_type: validatedData.feedbackType,
          ai_response: { text: fullResponse },
          model: 'gemini-2.5-flash',
        });
      } catch (historyError) {
        console.error('Failed to save feedback history:', historyError);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('Streaming error:', error);
    if (error instanceof z.ZodError) {
      res.write(`data: ${JSON.stringify({ error: (error as ZodError).issues })}\n\n`);
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    }
    res.end();
  }
});

// GET /api/ai/feedback/history/:documentId - Get feedback history for a document
router.get('/feedback/history/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params;
    const userId = req.query.userId as string;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    if (!isSupabaseConfigured()) {
      return res.json({ history: [] });
    }

    const { data, error } = await supabase
      .from('ai_feedback_history')
      .select('*')
      .eq('document_id', documentId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    res.json({ history: data || [] });
  } catch (error: any) {
    console.error('Error fetching feedback history:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
