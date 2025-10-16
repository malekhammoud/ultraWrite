# AI-Powered Writing Platform - Technical Implementation Plan

## 1. GOAL DEFINITION

**Problem Statement:**
Current writing tools separate AI assistance from document creation. Users toggle between ChatGPT, Grammarly, Google Docs, creating friction in the creative process.

**Solution:**
Unified platform where AI is a native collaborator, not an addon. One-click feedback, inline suggestions, real-time collaboration.

**Target Users:**
- Content creators, technical writers, students
- Teams needing collaborative + AI-enhanced writing
- Anyone frustrated by context-switching between tools

---

## 2. IMPLEMENTATION PLAN

```yaml
# PHASE 0: Project Setup (Week 1)
phase_0_foundation:
  initialize:
    - pnpm create vite@latest ai-writing-platform --template react-ts
    - cd ai-writing-platform && pnpm install
    - pnpm add -D tailwindcss postcss autoprefixer
    - npx tailwindcss init -p

  install_core_dependencies:
    frontend:
      - pnpm add @tiptap/react @tiptap/starter-kit @tiptap/extension-collaboration
      - pnpm add @tiptap/extension-collaboration-cursor @tiptap/extension-placeholder
      - pnpm add yjs y-websocket y-indexeddb
      - pnpm add @tanstack/react-query axios zustand
      - pnpm add @radix-ui/react-dropdown-menu @radix-ui/react-dialog
      - pnpm add lucide-react class-variance-authority clsx tailwind-merge
      - pnpm add framer-motion

    backend:
      - mkdir server && cd server
      - pnpm init && pnpm add express cors dotenv
      - pnpm add @anthropic-ai/sdk openai
      - pnpm add @supabase/supabase-js
      - pnpm add ws y-websocket
      - pnpm add -D tsx @types/node @types/express

  configure_project:
    - setup tailwind.config.js with design tokens
    - create tsconfig paths for @/components, @/lib, @/hooks
    - setup ESLint + Prettier
    - create .env.example with API keys template

# PHASE 1: Core Editor (Week 2-3)
phase_1_editor:
  create_editor_component:
    file: src/components/Editor/TiptapEditor.tsx
    features:
      - initialize TipTap with StarterKit
      - add placeholder extension
      - implement markdown shortcuts
      - add floating toolbar (bold, italic, headings)
      - character/word count footer
      - autosave to localStorage (temp)

  editor_state_management:
    file: src/store/editorStore.ts
    using: zustand
    state:
      - currentDocument: Document | null
      - isLoading: boolean
      - isSaving: boolean
      - lastSaved: Date | null
      - setDocument: (doc) => void
      - updateContent: (content) => void

  basic_ui_layout:
    file: src/App.tsx
    structure: |
      <div className="flex h-screen">
        <Sidebar /> {/* Document list */}
        <EditorPane>
          <EditorToolbar />
          <TiptapEditor />
          <EditorFooter /> {/* word count, save status */}
        </EditorPane>
        <AIFeedbackPanel /> {/* collapsed by default */}
      </div>

# PHASE 2: Backend + Database (Week 3-4)
phase_2_backend:
  setup_supabase:
    tables:
      - documents:
          id: uuid (primary key)
          user_id: uuid (foreign key)
          title: text
          content: jsonb (TipTap JSON format)
          created_at: timestamp
          updated_at: timestamp
          is_deleted: boolean

      - ai_feedback_history:
          id: uuid
          document_id: uuid (foreign key)
          user_id: uuid
          selected_text: text
          feedback_type: enum (grammar, clarity, rewrite, expand)
          ai_response: jsonb
          created_at: timestamp

      - collaborators:
          document_id: uuid
          user_id: uuid
          role: enum (owner, editor, viewer)

    rls_policies:
      - documents: users can only access their own or shared docs
      - ai_feedback_history: users can only see their own feedback

  create_express_api:
    file: server/src/index.ts
    endpoints:
      - GET /api/documents - list user's documents
      - POST /api/documents - create new document
      - GET /api/documents/:id - get document by ID
      - PATCH /api/documents/:id - update document
      - DELETE /api/documents/:id - soft delete
      - POST /api/ai/feedback - get AI feedback
      - POST /api/ai/rewrite - rewrite selection
      - POST /api/ai/expand - expand selection

    middleware:
      - cors configuration
      - Supabase JWT verification
      - rate limiting (express-rate-limit)
      - error handling wrapper

# PHASE 3: AI Integration Layer (Week 4-5)
phase_3_ai_feedback:
  ai_service_architecture:
    file: server/src/services/aiService.ts
    class: AIFeedbackService
    methods:
      - analyzeFeedback(text, context, feedbackType)
      - rewriteText(text, style, tone)
      - expandIdeas(text, direction)
      - suggestImprovements(fullDocument)

  prompt_templates:
    file: server/src/prompts/feedbackPrompts.ts
    templates:
      grammar_check: |
        You are a writing assistant. Analyze this text for grammar,
        spelling, and punctuation errors. Return structured JSON:
        {
          "errors": [{"type", "text", "suggestion", "explanation"}],
          "severity": "low|medium|high"
        }

      clarity_feedback: |
        Evaluate this text for clarity and readability. Suggest improvements
        for: sentence structure, word choice, flow, conciseness.
        Return: {"suggestions": [...], "readabilityScore": 0-100}

      rewrite_prompt: |
        Rewrite this text to be more {style} while maintaining the core meaning.
        Styles: professional, casual, concise, detailed, persuasive

      expand_ideas: |
        The user wrote: "{text}"
        Context: "{surroundingText}"
        Generate 2-3 ways to expand this idea with additional details,
        examples, or perspectives.

  ai_provider_abstraction:
    file: server/src/services/aiProviders/
    interface: AIProvider
    implementations:
      - AnthropicProvider (Claude Sonnet)
      - OpenAIProvider (GPT-4)
    feature: hot-swap providers via env variable

  feedback_button_implementation:
    frontend_file: src/components/Editor/AIFeedbackButton.tsx
    logic:
      - detect selected text in editor
      - show floating button on selection
      - on click, open feedback panel
      - send selection + context to API
      - stream response back to UI
      - display in structured format

    api_flow:
      request: |
        POST /api/ai/feedback
        {
          "documentId": "uuid",
          "selectedText": "user's selection",
          "context": "surrounding paragraphs",
          "feedbackType": "clarity",
          "fullDocument": "entire doc for context"
        }

      response: |
        {
          "feedback": {
            "type": "clarity",
            "suggestions": [...],
            "rewriteOptions": [...],
            "score": 75
          },
          "timestamp": "ISO string",
          "model": "claude-sonnet-4"
        }

# PHASE 4: Real-time Collaboration (Week 5-6)
phase_4_collaboration:
  setup_yjs_provider:
    file: server/src/collaboration/yjsServer.ts
    using: y-websocket server
    features:
      - WebSocket server on port 1234
      - document room management
      - presence (cursor positions, user colors)
      - persistence to Supabase (Y.Doc snapshots)

  frontend_collaboration:
    file: src/components/Editor/CollaborativeEditor.tsx
    integration:
      - connect to y-websocket provider
      - sync TipTap editor with Yjs document
      - show collaborator cursors
      - display active users in header
      - handle reconnection logic

  presence_system:
    file: src/hooks/usePresence.ts
    track:
      - active users in document
      - cursor positions
      - current selection ranges
      - user metadata (name, avatar, color)

# PHASE 5: Authentication & User Management (Week 6)
phase_5_auth:
  auth_provider: Clerk or Supabase Auth

  implementation_with_clerk:
    - pnpm add @clerk/clerk-react
    - wrap app in <ClerkProvider>
    - protect routes with <SignedIn> / <SignedOut>
    - add <UserButton /> to header

  implementation_with_supabase_auth:
    - use @supabase/auth-ui-react
    - setup magic link + OAuth providers
    - create AuthContext for user state

  user_profile:
    file: src/pages/Profile.tsx
    fields:
      - display name
      - email
      - avatar upload
      - AI preferences (tone, feedback frequency)

# PHASE 6: Document Management (Week 7)
phase_6_documents:
  document_list_view:
    file: src/components/Documents/DocumentList.tsx
    features:
      - grid/list view toggle
      - sort by: updated, created, title
      - search/filter documents
      - create new document button
      - document preview cards

  document_actions:
    - duplicate document
    - export to markdown/PDF
    - share document (generate link)
    - move to trash (soft delete)
    - restore from trash

  sidebar_navigation:
    file: src/components/Sidebar/Sidebar.tsx
    sections:
      - All Documents
      - Recent
      - Starred
      - Shared with me
      - Trash

  workspace_organization:
    future_feature:
      - folders/tags system
      - team workspaces
      - templates library

# PHASE 7: AI Feedback Panel UI (Week 7-8)
phase_7_feedback_ui:
  panel_component:
    file: src/components/AIPanel/FeedbackPanel.tsx
    layout: |
      <div className="w-96 border-l">
        <PanelHeader>
          <TabList>Feedback | Rewrite | Expand</TabList>
        </PanelHeader>

        <FeedbackContent>
          {feedbackType === 'analysis' && <AnalysisView />}
          {feedbackType === 'rewrite' && <RewriteOptions />}
          {feedbackType === 'expand' && <IdeaSuggestions />}
        </FeedbackContent>

        <ActionButtons>
          <Button>Apply Suggestion</Button>
          <Button>Regenerate</Button>
        </ActionButtons>
      </div>

  feedback_types:
    grammar_checker:
      - highlight errors in original text
      - show corrections inline
      - explain each fix
      - "Fix all" button

    clarity_analyzer:
      - readability score
      - sentence complexity metrics
      - word choice suggestions
      - alternative phrasings

    rewrite_engine:
      - show 3 rewrite options
      - style selectors (formal/casual/concise)
      - side-by-side comparison
      - apply with one click

    idea_expander:
      - generate elaborations
      - suggest examples
      - add counterpoints
      - insert at cursor position

  streaming_feedback:
    file: src/hooks/useStreamingFeedback.ts
    implementation:
      - use Server-Sent Events or WebSocket
      - show typing indicator
      - stream tokens as they arrive
      - format markdown in real-time

# PHASE 8: Advanced Features (Week 9-10)
phase_8_advanced:
  autosave_system:
    file: src/hooks/useAutosave.ts
    logic:
      - debounce editor changes (1 second)
      - detect changes via editor.getJSON()
      - save to Supabase via API
      - show "Saving..." / "Saved" indicator
      - handle offline (queue saves)

  version_history:
    table: document_versions
    fields:
      - document_id, version_number, content, created_at
    ui:
      - timeline view of versions
      - diff viewer (compare versions)
      - restore to previous version

  keyboard_shortcuts:
    file: src/hooks/useKeyboardShortcuts.ts
    shortcuts:
      - Cmd+K: AI feedback on selection
      - Cmd+Shift+R: Rewrite selection
      - Cmd+/: Toggle AI panel
      - Cmd+S: Manual save (already autosaved)

  export_functionality:
    file: src/services/exportService.ts
    formats:
      - markdown: TipTap JSON → markdown string
      - PDF: use jsPDF or Puppeteer
      - HTML: styled export with CSS
      - TXT: plain text only

  document_templates:
    table: templates
    types:
      - Blog post
      - Technical doc
      - Meeting notes
      - Research paper
    feature: AI pre-fills sections based on template

# PHASE 9: Polish & Optimization (Week 11)
phase_9_polish:
  performance:
    - code splitting (lazy load routes)
    - virtualize document list (react-window)
    - optimize TipTap extensions (only load what's needed)
    - cache AI responses (React Query)
    - compress websocket messages

  error_handling:
    - API error boundaries
    - toast notifications for errors
    - retry logic for failed saves
    - offline mode detection

  analytics:
    - track document creation
    - monitor AI feedback usage
    - measure response times
    - user engagement metrics

  accessibility:
    - keyboard navigation
    - ARIA labels
    - screen reader support
    - high contrast mode

# PHASE 10: Testing & Deployment (Week 12)
phase_10_deployment:
  testing:
    - unit tests: Vitest for utilities
    - component tests: React Testing Library
    - e2e tests: Playwright for critical flows
    - load testing: k6 for API endpoints

  deployment_setup:
    frontend:
      - host on Vercel or Netlify
      - setup custom domain
      - configure environment variables
      - enable preview deployments

    backend:
      - deploy to Railway or Fly.io
      - setup WebSocket server separately
      - configure CORS for production
      - setup monitoring (Sentry, LogRocket)

    database:
      - Supabase hosted (free tier initially)
      - setup automated backups
      - configure RLS policies
      - add database indexes for performance

  ci_cd:
    file: .github/workflows/deploy.yml
    pipeline:
      - run tests on PR
      - lint and type-check
      - build frontend
      - deploy to staging
      - manual approval for production
```

---

## 3. TECH STACK DETAILS

```yaml
tech_stack:
  frontend:
    framework: React 18 with TypeScript
    build_tool: Vite (faster than CRA)
    styling: Tailwind CSS + shadcn/ui components
    editor: TipTap (ProseMirror-based, extensible)
    state: Zustand (lightweight) + React Query (server state)
    collaboration: Yjs + y-websocket
    icons: Lucide React
    animations: Framer Motion (subtle, performant)

  backend:
    runtime: Node.js 20+ with TypeScript
    framework: Express.js (simple, flexible)
    database: Supabase (Postgres + real-time + storage + auth)
    ai_providers:
      - Anthropic Claude (primary - best for writing)
      - OpenAI GPT-4 (fallback)
    websocket: ws library for collaboration
    validation: Zod for request validation

  infrastructure:
    hosting_frontend: Vercel (zero-config, edge functions)
    hosting_backend: Railway or Fly.io
    database: Supabase Cloud
    file_storage: Supabase Storage (for exports, avatars)
    cdn: Cloudflare (optional, for assets)

  dev_tools:
    package_manager: pnpm (fast, efficient)
    linting: ESLint + Prettier
    testing: Vitest + React Testing Library + Playwright
    type_checking: TypeScript strict mode
    git_hooks: Husky + lint-staged
```

---

## 4. SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                     │
├─────────────────────────────────────────────────────────────┤
│  React App (Vite)                                           │
│  ├─ TipTap Editor (ProseMirror)                            │
│  ├─ Yjs Document (CRDT for collaboration)                  │
│  ├─ React Query (API state management)                     │
│  ├─ Zustand (local UI state)                               │
│  └─ WebSocket Client (real-time sync)                      │
└─────────────────┬───────────────────┬───────────────────────┘
                  │                   │
                  │ HTTP/REST         │ WebSocket
                  │                   │
┌─────────────────▼───────────────────▼───────────────────────┐
│                      APPLICATION LAYER                       │
├─────────────────────────────────────────────────────────────┤
│  Express.js API Server          Yjs WebSocket Server       │
│  ├─ /api/documents              ├─ Room management         │
│  ├─ /api/ai/feedback            ├─ Presence broadcast      │
│  ├─ /api/ai/rewrite             └─ Document sync           │
│  └─ /api/auth (middleware)                                  │
└─────────────────┬───────────────────┬───────────────────────┘
                  │                   │
                  │                   │
┌─────────────────▼───────────────────▼───────────────────────┐
│                      SERVICE LAYER                           │
├─────────────────────────────────────────────────────────────┤
│  AIService              DocumentService    CollabService    │
│  ├─ Claude API          ├─ CRUD ops       ├─ Y.Doc persist │
│  ├─ OpenAI API          ├─ Versioning     └─ User presence  │
│  ├─ Prompt templates    └─ Export logic                     │
│  └─ Response parsing                                         │
└─────────────────┬──────────────────────────────────────────┘
                  │
┌─────────────────▼──────────────────────────────────────────┐
│                   DATA LAYER (Supabase)                     │
├────────────────────────────────────────────────────────────┤
│  PostgreSQL Database                                        │
│  ├─ documents table                                         │
│  ├─ users table                                             │
│  ├─ ai_feedback_history table                              │
│  ├─ collaborators table                                     │
│  └─ document_versions table                                │
│                                                              │
│  Supabase Auth (JWT-based)                                 │
│  Supabase Storage (file uploads)                           │
│  Supabase Realtime (optional, for presence)                │
└────────────────────────────────────────────────────────────┘

External Services:
┌──────────────┐     ┌──────────────┐
│ Anthropic AI │     │  OpenAI API  │
│  (Claude)    │     │   (GPT-4)    │
└──────────────┘     └──────────────┘
```

---

## 5. DATA FLOW DIAGRAMS

### Flow 1: Document Creation & Editing
```
User creates document
  → POST /api/documents {title, content}
  → Supabase inserts row
  → Returns document ID
  → Frontend initializes TipTap editor
  → User types content
  → Debounced autosave (1s)
  → PATCH /api/documents/:id {content}
  → Supabase updates row
  → UI shows "Saved" indicator
```

### Flow 2: AI Feedback Request
```
User selects text in editor
  → Floating "AI Feedback" button appears
  → User clicks button
  → Frontend extracts:
      - selected text
      - surrounding context (2 paragraphs)
      - full document (for context)
  → POST /api/ai/feedback {text, context, type}
  → Backend receives request
  → AIService.analyzeFeedback(text, context, "clarity")
  → Constructs prompt from template
  → Calls Claude API (streaming)
  → Streams response back to client (SSE)
  → Frontend renders feedback in panel
  → User clicks "Apply Suggestion"
  → Editor replaces selected text
  → Autosave triggers
  → Feedback saved to ai_feedback_history
```

### Flow 3: Real-time Collaboration
```
User A opens document
  → Frontend connects to WebSocket server
  → Joins room: "document-{id}"
  → Yjs syncs local state with server

User B opens same document
  → Connects to same room
  → Receives current Y.Doc state
  → Sees User A's cursor position

User A types "Hello"
  → Yjs encodes change as update
  → Broadcasts via WebSocket
  → User B's Yjs applies update
  → User B sees "Hello" appear
  → TipTap re-renders

Every 30 seconds:
  → Server persists Y.Doc snapshot to Supabase
  → Enables recovery on server restart
```

---

## 6. API SPECIFICATION

```typescript
// REST API Endpoints

// Documents
GET    /api/documents
  Query: ?limit=20&offset=0&sort=updated_desc
  Response: { documents: Document[], total: number }

POST   /api/documents
  Body: { title: string, content?: JSONContent }
  Response: { document: Document }

GET    /api/documents/:id
  Response: { document: Document }

PATCH  /api/documents/:id
  Body: { title?, content?, is_deleted? }
  Response: { document: Document }

DELETE /api/documents/:id
  Response: { success: boolean }

// AI Endpoints
POST   /api/ai/feedback
  Body: {
    documentId: string,
    selectedText: string,
    context: string,
    feedbackType: 'grammar' | 'clarity' | 'style',
    fullDocument?: string
  }
  Response: {
    feedback: {
      type: string,
      suggestions: Suggestion[],
      score?: number
    },
    model: string,
    usage: { tokens: number }
  }

POST   /api/ai/rewrite
  Body: {
    text: string,
    style: 'professional' | 'casual' | 'concise',
    tone?: 'formal' | 'friendly'
  }
  Response: {
    rewrites: string[],
    model: string
  }

POST   /api/ai/expand
  Body: {
    text: string,
    context: string,
    direction: 'elaborate' | 'examples' | 'counterpoint'
  }
  Response: {
    expansions: string[],
    model: string
  }

// Collaboration
GET    /api/documents/:id/collaborators
  Response: { collaborators: User[] }

POST   /api/documents/:id/share
  Body: { email: string, role: 'editor' | 'viewer' }
  Response: { collaborator: Collaborator }
```

---

## 7. COMPONENT HIERARCHY

```
App.tsx
├─ AuthProvider
│  └─ ClerkProvider or SupabaseAuthContext
│
├─ QueryClientProvider (React Query)
│
├─ Layout
│  ├─ Header
│  │  ├─ Logo
│  │  ├─ DocumentTitle (editable)
│  │  ├─ CollaboratorAvatars
│  │  └─ UserMenu
│  │
│  ├─ Sidebar (collapsible)
│  │  ├─ NewDocumentButton
│  │  ├─ DocumentList
│  │  │  └─ DocumentCard[] (virtualized)
│  │  ├─ FilterButtons (All, Recent, Starred, Trash)
│  │  └─ SearchBar
│  │
│  ├─ EditorPane
│  │  ├─ EditorToolbar
│  │  │  ├─ FormattingButtons (bold, italic, etc.)
│  │  │  ├─ AIFeedbackButton
│  │  │  └─ ExportButton
│  │  │
│  │  ├─ CollaborativeEditor (TipTap + Yjs)
│  │  │  ├─ FloatingMenu (on selection)
│  │  │  ├─ BubbleMenu (formatting)
│  │  │  └─ CollaboratorCursors
│  │  │
│  │  └─ EditorFooter
│  │     ├─ WordCount
│  │     ├─ SaveStatus
│  │     └─ LastEdited
│  │
│  └─ AIFeedbackPanel (slide-in)
│     ├─ PanelHeader
│     │  ├─ TabList (Feedback, Rewrite, Expand)
│     │  └─ CloseButton
│     │
│     ├─ FeedbackContent
│     │  ├─ LoadingState (streaming indicator)
│     │  ├─ FeedbackDisplay
│     │  │  ├─ SuggestionList
│     │  │  ├─ RewriteOptions
│     │  │  └─ IdeaExpansions
│     │  └─ ErrorState
│     │
│     └─ ActionButtons
│        ├─ ApplyButton
│        ├─ RegenerateButton
│        └─ DismissButton
```

---

## 8. DATABASE SCHEMA

```sql
-- Supabase PostgreSQL Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users (handled by Supabase Auth, but extend with profile)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  ai_preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled',
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  yjs_state BYTEA, -- Persisted Yjs document state
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_updated_at ON documents(updated_at DESC);

-- Document Versions (for history)
CREATE TABLE document_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

CREATE INDEX idx_versions_document_id ON document_versions(document_id);

-- Collaborators
CREATE TABLE collaborators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('owner', 'editor', 'viewer')),
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(document_id, user_id)
);

CREATE INDEX idx_collaborators_user_id ON collaborators(user_id);

-- AI Feedback History
CREATE TABLE ai_feedback_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  selected_text TEXT NOT NULL,
  feedback_type TEXT NOT NULL,
  ai_response JSONB NOT NULL,
  model TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_feedback_document_id ON ai_feedback_history(document_id);

-- Row Level Security Policies

-- Documents: users can only access their own or shared docs
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own documents"
  ON documents FOR SELECT
  USING (
    user_id = auth.uid() OR
    id IN (
      SELECT document_id FROM collaborators
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own documents"
  ON documents FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own documents"
  ON documents FOR UPDATE
  USING (
    user_id = auth.uid() OR
    id IN (
      SELECT document_id FROM collaborators
      WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
    )
  );

-- Similar policies for other tables...
```

---

## 9. AI EVALUATION LAYER DESIGN

```typescript
// server/src/services/aiService.ts

interface AIFeedbackRequest {
  selectedText: string;
  context: string;
  feedbackType: FeedbackType;
  fullDocument?: string;
  userPreferences?: {
    tone?: 'formal' | 'casual';
    verbosity?: 'concise' | 'detailed';
  };
}

type FeedbackType = 'grammar' | 'clarity' | 'style' | 'rewrite' | 'expand';

class AIFeedbackService {
  private anthropic: Anthropic;

  async analyzeFeedback(request: AIFeedbackRequest): Promise<AIFeedback> {
    const prompt = this.buildPrompt(request);

    // Stream response for better UX
    const stream = await this.anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      temperature: 0.7,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    return this.parseStreamedResponse(stream);
  }

  private buildPrompt(request: AIFeedbackRequest): string {
    const templates = {
      grammar: `Analyze the following text for grammar, spelling, and punctuation errors.

Text: "${request.selectedText}"
Context: "${request.context}"

Return a JSON object with this structure:
{
  "errors": [
    {
      "type": "grammar" | "spelling" | "punctuation",
      "originalText": "the exact error",
      "suggestion": "corrected version",
      "explanation": "why this is an error",
      "position": { "start": number, "end": number }
    }
  ],
  "overallSeverity": "low" | "medium" | "high",
  "summary": "brief summary of issues found"
}`,

      clarity: `Evaluate this text for clarity and readability.

Text: "${request.selectedText}"

Analyze:
1. Sentence structure (too complex? too simple?)
2. Word choice (jargon? vague terms?)
3. Flow and coherence
4. Conciseness (unnecessary words?)

Return JSON:
{
  "readabilityScore": 0-100,
  "suggestions": [
    {
      "type": "sentence" | "word" | "flow" | "conciseness",
      "issue": "description of the problem",
      "suggestion": "how to improve",
      "before": "original text",
      "after": "improved version"
    }
  ],
  "summary": "overall assessment"
}`,

      rewrite: `Rewrite the following text to be more ${request.userPreferences?.tone || 'professional'}.

Original: "${request.selectedText}"
Context: "${request.context}"

Provide 3 different rewrite options:
1. Most faithful to original (minor tweaks)
2. Moderate changes (better flow/clarity)
3. Creative rewrite (fresh perspective)

Return JSON:
{
  "rewrites": [
    {
      "version": "faithful" | "moderate" | "creative",
      "text": "rewritten text",
      "changes": "what was changed and why"
    }
  ]
}`,

      expand: `The user wants to expand on this idea:

Text: "${request.selectedText}"
Surrounding context: "${request.context}"

Generate 2-3 ways to elaborate:
- Add supporting details or examples
- Introduce related perspectives
- Deepen the analysis

Return JSON:
{
  "expansions": [
    {
      "approach": "examples" | "analysis" | "perspective",
      "text": "expanded content (1-3 sentences)",
      "reasoning": "why this expansion works"
    }
  ]
}`
    };

    return templates[request.feedbackType];
  }

  private async parseStreamedResponse(stream): Promise<AIFeedback> {
    let fullText = '';

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta') {
        fullText += chunk.delta.text;
        // Emit to frontend via SSE for real-time display
        this.emit('feedback_chunk', chunk.delta.text);
      }
    }

    // Parse final JSON response
    try {
      return JSON.parse(fullText);
    } catch (e) {
      // Fallback if AI didn't return valid JSON
      return {
        suggestions: [{ text: fullText }],
        summary: 'Raw AI response (parsing failed)'
      };
    }
  }
}

// Response caching for common requests
class FeedbackCache {
  private redis: Redis; // Optional Redis cache

  async get(key: string): Promise<AIFeedback | null> {
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async set(key: string, feedback: AIFeedback, ttl = 3600) {
    await this.redis.setex(key, ttl, JSON.stringify(feedback));
  }

  generateKey(request: AIFeedbackRequest): string {
    return `feedback:${request.feedbackType}:${hash(request.selectedText)}`;
  }
}
```

---

## 10. USER FLOW WALKTHROUGH

```
1. FIRST-TIME USER
   → Lands on homepage
   → Sees "Start Writing" CTA
   → Clicks → Auth modal appears (Sign up with Google/Email)
   → After auth → Redirected to dashboard
   → Sees empty state: "Create your first document"
   → Clicks "New Document" button
   → Editor opens with placeholder text
   → Types first paragraph
   → Sees autosave indicator: "Saving..." → "Saved"
   → Selects a sentence → Floating AI button appears
   → Clicks button → AI panel slides in from right
   → AI analyzes text → Streams feedback in real-time
   → User reads suggestions → Clicks "Apply"
   → Text updates in editor
   → User continues writing with AI assistance

2. RETURNING USER (COLLABORATION)
   → Logs in → Sees dashboard with documents
   → Clicks on existing document
   → Editor loads with content
   → Clicks "Share" button in header
   → Enters collaborator's email
   → Collaborator receives email notification
   → Collaborator clicks link → Opens document
   → Both users see each other's cursors
   → User A types → User B sees changes instantly
   → User B selects text → Requests AI feedback
   → AI panel shows feedback (only visible to User B)
   → User B applies suggestion
   → User A sees the updated text immediately
   → Users continue collaborating seamlessly

3. AI FEEDBACK SCENARIOS

   a) Grammar Check:
      → User selects paragraph
      → Clicks "AI Feedback" → Selects "Grammar"
      → AI identifies 3 errors
      → Displays each with explanation
      → User clicks "Fix All"
      → All corrections applied at once

   b) Rewrite Request:
      → User selects verbose sentence
      → Clicks "Rewrite" → Chooses "Make it concise"
      → AI shows 3 options: subtle, moderate, aggressive
      → User picks moderate version
      → Clicks "Replace"
      → Sentence updated, undo available

   c) Idea Expansion:
      → User writes "This is an important issue."
      → Selects it → Clicks "Expand"
      → AI suggests 3 elaborations with examples
      → User picks one → Clicks "Insert After"
      → Expanded text appears below original
```

---

## 11. DEVELOPER NOTES & PRINCIPLES

### What to Prioritize (MVP)
1. **Editor quality**: Smooth typing, no lag, good keyboard shortcuts
2. **AI feedback speed**: <3s response time, streaming for long responses
3. **Autosave reliability**: Never lose user data
4. **Collaboration basics**: Real-time sync, cursor presence
5. **Simple auth**: Just email/Google login, no complex roles yet

### What NOT to Overbuild
- ❌ Advanced formatting (tables, images) – use markdown only initially
- ❌ Complex permission system – owner/editor/viewer is enough
- ❌ Mobile apps – focus on web, ensure responsive design
- ❌ AI model fine-tuning – use Claude/GPT-4 out of the box
- ❌ Team workspaces – focus on personal use + simple sharing

### Design Principles
1. **AI is a tool, not the focus**: Editor comes first, AI enhances
2. **No modal dialogs for AI**: Use slide-in panel for non-blocking UX
3. **Instant feedback**: Show loading states, stream responses
4. **Offline-first autosave**: Queue saves if network fails
5. **Keyboard-driven**: Power users should rarely touch mouse
6. **Minimal UI**: Clean, distraction-free writing environment
7. **Respect user intent**: AI suggests, never auto-applies (except grammar)

### Performance Targets
- Editor initial load: <2s
- Typing lag: <16ms (60fps)
- AI feedback response: <3s for first token
- Collaboration sync: <100ms latency
- Autosave debounce: 1s after last keystroke
- Document list render: <500ms for 1000 docs (virtualized)

### Code Organization
```
project/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Editor/        # TipTap, toolbar, etc.
│   │   │   ├── Documents/     # List, cards, sidebar
│   │   │   ├── AIPanel/       # Feedback UI
│   │   │   └── Common/        # Buttons, modals, etc.
│   │   ├── hooks/             # useAutosave, useCollaboration
│   │   ├── store/             # Zustand stores
│   │   ├── services/          # API client, export logic
│   │   ├── lib/               # Utils, constants
│   │   └── pages/             # Routes (Dashboard, Editor)
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── routes/            # Express route handlers
│   │   ├── services/          # Business logic (AI, documents)
│   │   ├── middleware/        # Auth, error handling
│   │   ├── prompts/           # AI prompt templates
│   │   ├── collaboration/     # Yjs WebSocket server
│   │   └── index.ts           # Server entry point
│   └── package.json
│
├── shared/                    # Types shared between FE/BE
│   └── types.ts
│
└── docs/                      # Architecture, API docs
```

### Error Handling Strategy
```typescript
// Graceful degradation for AI features
try {
  const feedback = await getFeedback(text);
  displayFeedback(feedback);
} catch (error) {
  if (error.status === 429) {
    // Rate limited
    showToast('Too many requests, please wait');
  } else if (error.status === 500) {
    // AI service down
    showToast('AI temporarily unavailable');
    // Fallback: show basic grammar check from browser API
    fallbackToBasicGrammarCheck(text);
  } else {
    // Log to monitoring service
    logError(error);
    showToast('Something went wrong, please try again');
  }
}
```

### Testing Strategy
```yaml
testing:
  unit:
    - AI prompt builders
    - Text parsing utils
    - Zustand stores

  integration:
    - API endpoints (supertest)
    - Database queries
    - AI service calls (mocked)

  e2e:
    - Create document → Write → Get feedback → Apply
    - Collaboration flow (two users, one doc)
    - Autosave + offline recovery

  performance:
    - Editor typing lag (Lighthouse, Chrome DevTools)
    - Large document rendering (>10k words)
    - API response times under load
```

---

## 12. FUTURE ROADMAP (POST-MVP)

```yaml
phase_11_enhancements:
  - AI writing assistant (continuous suggestions as you type)
  - Voice-to-text integration
  - Multi-language support
  - Advanced formatting (tables, images, code blocks)
  - Document templates marketplace
  - Team workspaces with folders
  - Analytics dashboard (writing habits, AI usage)
  - Browser extension (capture web content to docs)
  - Mobile apps (React Native)
  - Integrations (Notion, Google Drive, Dropbox)
  - Public publishing (share docs as web pages)
  - API for third-party integrations
```

---

## 13. QUICK START GUIDE

### For Developers

```bash
# Clone and setup
git clone <repo-url> ai-writing-platform
cd ai-writing-platform

# Setup frontend
cd frontend
pnpm install
cp .env.example .env
# Add your API keys to .env
pnpm dev

# Setup backend (in new terminal)
cd ../server
pnpm install
cp .env.example .env
# Add Anthropic/OpenAI keys, Supabase credentials
pnpm dev

# Setup Supabase
# 1. Create project at supabase.com
# 2. Run SQL from section 8 (Database Schema)
# 3. Add credentials to .env files

# Open browser
# Frontend: http://localhost:5173
# Backend: http://localhost:3000
```

---

**This plan is ready for AI-assisted implementation. Each phase is modular and can be tackled incrementally.**
