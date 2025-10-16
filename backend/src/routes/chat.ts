import { Router, type Request, type Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

const router: Router = Router();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Helper function to extract text from TipTap JSON
function extractTextFromTipTap(node: any): string {
  if (!node) return '';

  if (typeof node === 'string') return node;

  let text = '';

  // If node has text property
  if (node.text) {
    text += node.text;
  }

  // Recursively process content
  if (node.content && Array.isArray(node.content)) {
    for (const child of node.content) {
      text += extractTextFromTipTap(child);
      // Add space or newline for block elements
      if (child.type === 'paragraph' || child.type === 'heading') {
        text += '\n';
      }
    }
  }

  return text;
}

// Validation schema
const chatMessageSchema = z.object({
  documentId: z.string(),
  userId: z.string(),
  message: z.string().min(1),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional(),
  documentContext: z.string().optional(),
  selectedText: z.string().optional(),
});

// POST /api/chat/message - Send a chat message
router.post('/message', async (req: Request, res: Response) => {
  try {
    const validatedData = chatMessageSchema.parse(req.body);

    console.log('Chat request received:');
    console.log('- Has documentContext:', !!validatedData.documentContext);
    console.log('- Has selectedText:', !!validatedData.selectedText);
    console.log('- Message:', validatedData.message);

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // Build context
    let systemPrompt = `You are a helpful writing assistant for a document editing platform. You help users with their documents by answering questions, providing suggestions, and offering guidance.`;

    // Extract text content from document context if it's JSON
    let documentText = '';
    if (validatedData.documentContext) {
      try {
        const parsed = JSON.parse(validatedData.documentContext);
        // Extract text from TipTap JSON structure
        documentText = extractTextFromTipTap(parsed);
        console.log('Extracted document text length:', documentText.length);
        console.log('Document preview:', documentText.substring(0, 100));
      } catch (err) {
        console.log('Failed to parse document context as JSON, using as-is');
        // If not JSON, use as-is
        documentText = validatedData.documentContext;
      }
    }

    if (documentText && documentText.trim()) {
      systemPrompt += `\n\nCurrent document content:\n${documentText}`;
    } else {
      console.log('Warning: No document text extracted');
    }

    if (validatedData.selectedText) {
      systemPrompt += `\n\nUser has highlighted this text:\n${validatedData.selectedText}`;
      systemPrompt += `\n\nWhen the user highlights text, they're usually asking about that specific part. Give priority to discussing the highlighted text if relevant to their question.`;
    }

    console.log('System prompt preview:', systemPrompt.substring(0, 200));

    // Build conversation history
    const chatHistory = validatedData.conversationHistory || [];
    const messages = chatHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    // Start chat
    const chat = model.startChat({
      history: messages,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    });

    // Send message with system context
    const fullMessage = chatHistory.length === 0
      ? `${systemPrompt}\n\nUser: ${validatedData.message}`
      : validatedData.message;

    const result = await chat.sendMessage(fullMessage);
    const response = result.response;
    const text = response.text();

    res.json({
      message: text,
      model: 'gemini-2.0-flash-exp',
      usage: {
        inputTokens: 0, // Gemini doesn't provide this easily
        outputTokens: 0,
      },
    });
  } catch (error: any) {
    console.error('Chat error:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.issues });
    }

    res.status(500).json({ error: error.message || 'Failed to process chat message' });
  }
});

// POST /api/chat/message/stream - Stream a chat message
router.post('/message/stream', async (req: Request, res: Response) => {
  try {
    const validatedData = chatMessageSchema.parse(req.body);

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // Build context
    let systemPrompt = `You are a helpful writing assistant for a document editing platform. You help users with their documents by answering questions, providing suggestions, and offering guidance.`;

    // Extract text content from document context if it's JSON
    let documentText = '';
    if (validatedData.documentContext) {
      try {
        const parsed = JSON.parse(validatedData.documentContext);
        // Extract text from TipTap JSON structure
        documentText = extractTextFromTipTap(parsed);
      } catch {
        // If not JSON, use as-is
        documentText = validatedData.documentContext;
      }
    }

    if (documentText) {
      systemPrompt += `\n\nCurrent document content:\n${documentText}`;
    }

    if (validatedData.selectedText) {
      systemPrompt += `\n\nUser has highlighted this text:\n${validatedData.selectedText}`;
      systemPrompt += `\n\nWhen the user highlights text, they're usually asking about that specific part. Give priority to discussing the highlighted text if relevant to their question.`;
    }

    // Build conversation history
    const chatHistory = validatedData.conversationHistory || [];
    const messages = chatHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    // Start chat
    const chat = model.startChat({
      history: messages,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    });

    // Send message with system context
    const fullMessage = chatHistory.length === 0
      ? `${systemPrompt}\n\nUser: ${validatedData.message}`
      : validatedData.message;

    const result = await chat.sendMessageStream(fullMessage);

    // Stream the response
    for await (const chunk of result.stream) {
      const text = chunk.text();
      res.write(`data: ${JSON.stringify({ chunk: text })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('Chat stream error:', error);

    if (!res.headersSent) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid request data', details: error.issues });
      } else {
        res.status(500).json({ error: error.message || 'Failed to process chat message' });
      }
    }
  }
});

export default router;
