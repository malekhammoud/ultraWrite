import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export interface AgentMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface AgentEditRequest {
  selectedText: string;
  instruction: string;
  context?: string;
  previousFeedback?: any[];
  conversationHistory?: AgentMessage[];
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

class AgentService {
  private model: any;

  constructor() {
    if (genAI) {
      // Use Gemini 2.5 Pro for better reasoning in agent mode
      this.model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
    }
  }

  private buildAgentPrompt(request: AgentEditRequest): string {
    let prompt = `You are an expert writing assistant in "Agent Mode" - similar to how Cursor AI assists with code.

Your task is to edit the user's text based on their instruction while maintaining their voice and intent.

Selected Text:
"""
${request.selectedText}
"""
`;

    if (request.context) {
      prompt += `
Context (surrounding text):
"""
${request.context}
"""
`;
    }

    if (request.conversationHistory && request.conversationHistory.length > 0) {
      prompt += `
Previous conversation:
`;
      request.conversationHistory.forEach((msg) => {
        prompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
      });
    }

    prompt += `
User Instruction: "${request.instruction}"

Please provide:
1. The edited version of the selected text
2. A brief explanation of what you changed and why

Return your response in this JSON format (no markdown code blocks):
{
  "edited": "the edited text here",
  "explanation": "brief explanation of changes made"
}

Important:
- Only edit the selected text, don't add content before or after it
- Preserve the user's writing style and tone unless asked to change it
- Be concise but complete
- If the instruction is unclear, make your best interpretation
- If no changes are needed, return the original text unchanged
`;

    return prompt;
  }

  async processEdit(request: AgentEditRequest): Promise<AgentEditResponse> {
    if (!this.model) {
      // Mock response when API not configured
      return {
        original: request.selectedText,
        edited: request.selectedText + ' [edited by AI]',
        explanation: 'Mock edit - Gemini API not configured',
        changes: [
          { type: 'unchanged', text: request.selectedText },
          { type: 'add', text: ' [edited by AI]' },
        ],
        conversationId: `conv_${Date.now()}`,
        model: 'mock',
      };
    }

    try {
      const prompt = this.buildAgentPrompt(request);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();

      // Clean up response
      text = text.trim();
      if (text.startsWith('```json')) {
        text = text.replace(/^```json\s*/, '').replace(/```\s*$/, '');
      } else if (text.startsWith('```')) {
        text = text.replace(/^```\s*/, '').replace(/```\s*$/, '');
      }

      let parsed: { edited: string; explanation: string };
      try {
        parsed = JSON.parse(text);
      } catch (parseError) {
        // If JSON parsing fails, try to extract from text
        parsed = {
          edited: request.selectedText,
          explanation: text,
        };
      }

      // Generate diff
      const changes = this.generateDiff(request.selectedText, parsed.edited);

      return {
        original: request.selectedText,
        edited: parsed.edited,
        explanation: parsed.explanation,
        changes,
        conversationId: `conv_${Date.now()}`,
        model: 'gemini-2.5-pro',
      };
    } catch (error) {
      console.error('Agent service error:', error);
      throw new Error('Failed to process agent edit');
    }
  }

  async* streamEdit(request: AgentEditRequest): AsyncGenerator<string, void, unknown> {
    if (!this.model) {
      yield JSON.stringify({
        original: request.selectedText,
        edited: request.selectedText,
        explanation: 'Mock streaming response',
        conversationId: `conv_${Date.now()}`,
        model: 'mock',
      });
      return;
    }

    try {
      const prompt = this.buildAgentPrompt(request);
      const result = await this.model.generateContentStream(prompt);

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        yield chunkText;
      }
    } catch (error) {
      console.error('Agent streaming error:', error);
      yield JSON.stringify({
        error: 'Failed to stream agent response',
      });
    }
  }

  private generateDiff(original: string, edited: string): DiffItem[] {
    // Simple word-level diff
    const originalWords = original.split(/(\s+)/);
    const editedWords = edited.split(/(\s+)/);

    const changes: DiffItem[] = [];
    const maxLen = Math.max(originalWords.length, editedWords.length);

    for (let i = 0; i < maxLen; i++) {
      const origWord = originalWords[i];
      const editWord = editedWords[i];

      if (origWord === editWord) {
        changes.push({ type: 'unchanged', text: origWord || '' });
      } else {
        if (origWord) {
          changes.push({ type: 'remove', text: origWord });
        }
        if (editWord) {
          changes.push({ type: 'add', text: editWord });
        }
      }
    }

    return changes;
  }
}

export const agentService = new AgentService();
