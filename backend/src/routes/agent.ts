import { Router, type Request, type Response } from 'express';
import { agentService, type AgentEditRequest, type AgentMessage } from '../services/agentService.js';
import { z, type ZodError } from 'zod';

const router: Router = Router();

// Validation schemas
const agentEditSchema = z.object({
  documentId: z.string(),
  userId: z.string().min(1), // Changed from .uuid() to .min(1) to allow non-UUID strings
  selectedText: z.string().min(1),
  instruction: z.string().min(1),
  context: z.string().optional(),
  previousFeedback: z.array(z.any()).optional(),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
    timestamp: z.string().transform((str) => new Date(str)),
  })).optional(),
});

// POST /api/agent/edit - Get AI agent edit
router.post('/edit', async (req, res) => {
  try {
    const validatedData = agentEditSchema.parse(req.body);

    const request: AgentEditRequest = {
      selectedText: validatedData.selectedText,
      instruction: validatedData.instruction,
      context: validatedData.context,
      previousFeedback: validatedData.previousFeedback,
      conversationHistory: validatedData.conversationHistory,
    };

    const response = await agentService.processEdit(request);

    res.json(response);
  } catch (error: any) {
    console.error('Agent edit error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as ZodError).issues });
    }
    res.status(500).json({ error: error.message });
  }
});

// POST /api/agent/edit/stream - Stream AI agent edit (SSE)
router.post('/edit/stream', async (req, res) => {
  try {
    const validatedData = agentEditSchema.parse(req.body);

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const request: AgentEditRequest = {
      selectedText: validatedData.selectedText,
      instruction: validatedData.instruction,
      context: validatedData.context,
      previousFeedback: validatedData.previousFeedback,
      conversationHistory: validatedData.conversationHistory,
    };

    let fullResponse = '';

    for await (const chunk of agentService.streamEdit(request)) {
      fullResponse += chunk;
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('Agent streaming error:', error);
    if (error instanceof z.ZodError) {
      res.write(`data: ${JSON.stringify({ error: (error as ZodError).issues })}\n\n`);
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    }
    res.end();
  }
});

export default router;
