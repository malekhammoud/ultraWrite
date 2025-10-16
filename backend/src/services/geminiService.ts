import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || '';

if (!apiKey) {
  console.warn('⚠️  Gemini API key not found. AI features will use mock responses.');
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export interface AIFeedbackRequest {
  selectedText: string;
  context: string;
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
  currentStyle?: string;
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
  [key: string]: any; // Allow additional properties
}

class GeminiService {
  private model: any;

  constructor() {
    if (genAI) {
      // Using gemini-2.5-flash - latest stable model
      this.model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    }
  }

  private buildPrompt(request: AIFeedbackRequest): string {
    const templates = {
      grammar: `You are an expert writing assistant. Analyze the following text for grammar, spelling, and punctuation errors.

Text: "${request.selectedText}"
${request.context ? `Context: "${request.context}"` : ''}

Return ONLY a valid JSON object (no markdown, no code blocks) with this exact structure:
{
  "errors": [
    {
      "type": "grammar|spelling|punctuation",
      "originalText": "the exact error",
      "suggestion": "corrected version",
      "explanation": "why this is an error"
    }
  ],
  "overallSeverity": "low|medium|high",
  "summary": "brief summary of issues found"
}`,

      clarity: `You are an expert writing coach. Evaluate this text for clarity and readability.

Text: "${request.selectedText}"

Analyze:
1. Sentence structure (too complex? too simple?)
2. Word choice (jargon? vague terms?)
3. Flow and coherence
4. Conciseness (unnecessary words?)

Return ONLY a valid JSON object (no markdown, no code blocks) with this structure:
{
  "readabilityScore": 75,
  "suggestions": [
    {
      "type": "sentence|word|flow|conciseness",
      "issue": "description of the problem",
      "suggestion": "how to improve",
      "before": "original text",
      "after": "improved version"
    }
  ],
  "summary": "overall assessment"
}`,

      style: `Analyze the writing style of this text and provide suggestions for improvement.

Text: "${request.selectedText}"

Return ONLY a valid JSON object (no markdown, no code blocks):
{
  "currentStyle": "description of current writing style",
  "suggestions": [
    {
      "aspect": "tone|voice|vocabulary|structure",
      "current": "what it is now",
      "suggestion": "how to improve"
    }
  ],
  "score": 80
}`,

      rewrite: `Rewrite the following text ${request.customInstruction ? `following this instruction: "${request.customInstruction}"` : `to be more ${request.userPreferences?.style || 'professional'}`} while maintaining the core meaning.

Original: "${request.selectedText}"
${request.context ? `Context: "${request.context}"` : ''}

Provide 3 different rewrite options:
1. Most faithful to original (minor tweaks)
2. Moderate changes (better flow/clarity)
3. Creative rewrite (fresh perspective)

Return ONLY a valid JSON object (no markdown, no code blocks):
{
  "rewrites": [
    {
      "version": "faithful|moderate|creative",
      "text": "rewritten text",
      "changes": "what was changed and why"
    }
  ]
}`,

      expand: `The user wants to expand on this idea:

Text: "${request.selectedText}"
${request.context ? `Surrounding context: "${request.context}"` : ''}
${request.customInstruction ? `Instructions: "${request.customInstruction}"` : ''}

Generate 2-3 ways to elaborate:
- Add supporting details or examples
- Introduce related perspectives
- Deepen the analysis

Return ONLY a valid JSON object (no markdown, no code blocks):
{
  "expansions": [
    {
      "approach": "examples|analysis|perspective",
      "text": "expanded content (2-3 sentences)",
      "reasoning": "why this expansion works"
    }
  ]
}`,

      evaluate: `You are an expert evaluator. Evaluate the following text based on the provided criteria.

Text: "${request.selectedText}"
${request.context ? `Context: "${request.context}"` : ''}

Evaluation Criteria:
${request.customInstruction || 'Evaluate for overall quality, clarity, and effectiveness'}

Provide a thorough evaluation based on the criteria. Return ONLY a valid JSON object (no markdown, no code blocks):
{
  "evaluation": {
    "score": 85,
    "strengths": [
      "List of strengths identified in the text"
    ],
    "weaknesses": [
      "List of areas that need improvement"
    ],
    "suggestions": [
      "Specific actionable suggestions for improvement"
    ]
  },
  "feedback": "Detailed written feedback summarizing the evaluation"
}`
    };

    return templates[request.feedbackType];
  }

  async analyzeFeedback(request: AIFeedbackRequest): Promise<AIFeedbackResponse> {
    // Mock response if API key not configured
    if (!this.model) {
      return this.getMockResponse(request.feedbackType);
    }

    try {
      const prompt = this.buildPrompt(request);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Clean up the response - remove markdown code blocks if present
      let cleanText = text.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/^```json\s*/, '').replace(/```\s*$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```\s*/, '').replace(/```\s*$/, '');
      }

      try {
        const parsed = JSON.parse(cleanText);
        return {
          type: request.feedbackType,
          ...parsed,
          model: 'gemini-2.5-flash',
        };
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        return {
          type: request.feedbackType,
          summary: cleanText,
          model: 'gemini-2.5-flash',
        };
      }
    } catch (error) {
      console.error('Gemini API error:', error);
      return this.getMockResponse(request.feedbackType);
    }
  }

  async* streamFeedback(request: AIFeedbackRequest): AsyncGenerator<string, void, unknown> {
    if (!this.model) {
      yield JSON.stringify(this.getMockResponse(request.feedbackType));
      return;
    }

    try {
      const prompt = this.buildPrompt(request);
      const result = await this.model.generateContentStream(prompt);

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        yield chunkText;
      }
    } catch (error) {
      console.error('Streaming error:', error);
      yield JSON.stringify(this.getMockResponse(request.feedbackType));
    }
  }

  private getMockResponse(feedbackType: string): AIFeedbackResponse {
    const mockResponses: Record<string, AIFeedbackResponse> = {
      grammar: {
        type: 'grammar',
        errors: [
          {
            type: 'grammar',
            originalText: 'they was going',
            suggestion: 'they were going',
            explanation: 'Subject-verb agreement error',
          },
        ],
        overallSeverity: 'low',
        summary: 'Found 1 minor grammar issue',
        model: 'mock',
      },
      clarity: {
        type: 'clarity',
        readabilityScore: 78,
        suggestions: [
          {
            type: 'conciseness',
            issue: 'Sentence could be more concise',
            suggestion: 'Remove redundant words',
            before: 'In my personal opinion, I think that...',
            after: 'I think...',
          },
        ],
        summary: 'Good clarity with room for minor improvements',
        model: 'mock',
      },
      style: {
        type: 'style',
        currentStyle: 'Conversational and informal',
        suggestions: [
          {
            aspect: 'tone',
            current: 'Casual tone',
            suggestion: 'Consider a more formal tone for professional writing',
          },
        ],
        score: 75,
        model: 'mock',
      },
      rewrite: {
        type: 'rewrite',
        rewrites: [
          'This is a faithful rewrite with minor improvements.',
          'This represents a moderate restructuring for better clarity.',
          'A completely fresh take on the original idea.',
        ],
        model: 'mock',
      },
      expand: {
        type: 'expand',
        expansions: [
          {
            approach: 'examples',
            text: 'For example, consider how this applies in real-world scenarios...',
            reasoning: 'Concrete examples make abstract concepts more relatable',
          },
        ],
        model: 'mock',
      },
      evaluate: {
        type: 'evaluate',
        evaluation: {
          score: 82,
          strengths: [
            'Clear and concise writing',
            'Well-structured argument',
            'Good use of examples'
          ],
          weaknesses: [
            'Could use more supporting evidence',
            'Some transitions could be smoother'
          ],
          suggestions: [
            'Add statistical data to support claims',
            'Improve paragraph transitions with linking phrases',
            'Consider adding a counterargument section'
          ]
        },
        feedback: 'Overall, this is a well-written piece with clear arguments. The main areas for improvement are adding more evidence and enhancing flow between sections.',
        model: 'mock',
      },
    };

    return mockResponses[feedbackType] || mockResponses.clarity;
  }
}

export const geminiService = new GeminiService();
