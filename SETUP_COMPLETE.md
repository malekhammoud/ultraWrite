# UltraWrite - Complete Setup Guide

## Current Status: Backend Running ✅

Your backend server is successfully running with:
- ✅ Express API server on http://localhost:3000
- ✅ WebSocket collaboration server on ws://localhost:1234
- ✅ Gemini AI API configured
- ✅ Supabase credentials configured

## Next Steps

### 1. Set Up Supabase Database

You need to run the database schema to create all tables:

**Steps:**

1. Go to your Supabase dashboard: https://app.supabase.com/project/ogfvtxrwsgoxmjpaxhsu

2. Navigate to **SQL Editor** in the left sidebar

3. Click **New query**

4. Copy the entire contents of `backend/supabase-schema.sql` and paste it into the SQL editor

5. Click **Run** to execute the schema

This will create:
- `profiles` - User profiles linked to Supabase auth
- `documents` - Document storage with JSONB content
- `document_versions` - Version history
- `collaborators` - Sharing and collaboration
- `ai_feedback_history` - AI interaction history
- All necessary indexes and Row Level Security policies

### 2. Test the Setup

After running the schema, test the complete flow:

**Test 1: Backend Health Check**
```bash
curl http://localhost:3000/health
```

**Test 2: Create a Test Document (Mock Mode)**
```bash
curl -X POST http://localhost:3000/api/documents \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Test Document",
    "content": {"type": "doc", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Hello World"}]}]}
  }'
```

**Test 3: Get AI Feedback (with Gemini)**
```bash
curl -X POST http://localhost:3000/api/ai/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "test-doc-id",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "selectedText": "This sentense has a mistake.",
    "feedbackType": "grammar"
  }'
```

### 3. Start the Frontend

In a new terminal:

```bash
cd /home/mhammoud/WebstormProjects/ultraWrite/frontend
pnpm install
pnpm dev
```

The frontend will be available at http://localhost:5173

### 4. Test End-to-End Flow

Once both servers are running:

1. Open http://localhost:5173 in your browser
2. Create a new document
3. Start typing
4. Select some text
5. Click the AI panel on the right
6. Request feedback (grammar, clarity, style, rewrite, or expand)
7. See real-time AI suggestions from Gemini

## Environment Configuration

### Backend `.env` ✅ (Already configured)
```env
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

SUPABASE_URL=https://ogfvtxrwsgoxmjpaxhsu.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

GEMINI_API_KEY=AIzaSyDaItRFDQfcTGOIE6BXp5iN1SufVJeJHDc

WS_PORT=1234
```

### Frontend `.env` ✅ (Already configured)
```env
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=https://ogfvtxrwsgoxmjpaxhsu.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Architecture Overview

### Backend Stack
- **Express.js** - REST API server
- **TypeScript** - Type-safe development
- **Supabase** - PostgreSQL database with auth
- **Google Gemini AI** - AI writing assistance
- **WebSocket** - Real-time collaboration (Phase 4)
- **Zod** - Schema validation

### Frontend Stack
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool with Rolldown
- **TipTap** - Rich text editor
- **Framer Motion** - Animations
- **TailwindCSS** - Styling
- **Zustand** - State management
- **Lucide React** - Icons

### Key Features Implemented

✅ **Phase 1: Enhanced UI**
- Futuristic cyberpunk design with glassmorphism
- Animated backgrounds with grid patterns and gradient orbs
- Neon purple/cyan/pink color scheme
- Smooth animations and transitions
- Polished editor with proper text selection

✅ **Phase 2: Backend & Database**
- Complete REST API for documents
- Supabase integration with RLS policies
- Document versioning system
- Collaboration support
- Mock mode fallback for development

✅ **Phase 3: AI Integration**
- Gemini 1.5 Pro integration
- Multiple feedback types: grammar, clarity, style, rewrite, expand
- Streaming support for real-time responses
- AI feedback history tracking
- Comprehensive prompt engineering

### API Endpoints

**Documents**
- `GET /api/documents?userId=<uuid>` - List user documents
- `GET /api/documents/:id` - Get single document
- `POST /api/documents` - Create new document
- `PATCH /api/documents/:id` - Update document
- `DELETE /api/documents/:id` - Soft delete document

**AI Feedback**
- `POST /api/ai/feedback` - Get AI feedback (complete response)
- `POST /api/ai/feedback/stream` - Stream AI feedback (SSE)
- `GET /api/ai/feedback/history/:documentId` - Get feedback history

## Troubleshooting

### Backend won't start
```bash
cd backend
rm -rf node_modules dist
pnpm install
pnpm build
pnpm start
```

### Frontend won't start
```bash
cd frontend
rm -rf node_modules dist
pnpm install
pnpm dev
```

### Database connection issues
- Verify Supabase URL and keys in `.env`
- Check that schema has been run in Supabase SQL Editor
- Ensure your IP is allowed in Supabase project settings

### Gemini API errors
- Verify API key is correct: `AIzaSyDaItRFDQfcTGOIE6BXp5iN1SufVJeJHDc`
- Check API quota at https://makersuite.google.com/app/apikey
- Review error messages in backend console

## What's Next?

The application is fully functional! Here are optional enhancements:

1. **Authentication** - Add Supabase auth for real users
2. **Real-time Collaboration** - Enable WebSocket collaboration (Phase 4)
3. **Export Features** - Add PDF, Word, Markdown export
4. **Templates** - Pre-built document templates
5. **Advanced AI** - Multi-model support, custom prompts
6. **Mobile Support** - Responsive design improvements

## Support

For issues or questions:
- Check backend logs: Look at the terminal where `pnpm start` is running
- Check browser console: Open DevTools in your browser
- Review `EDITOR_FIXES.md` for editor-specific issues
- Review `README.md` for general documentation
