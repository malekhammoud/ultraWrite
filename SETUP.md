# UltraWrite - Setup Guide 🚀

Welcome to UltraWrite! This guide will help you set up your futuristic AI-powered writing platform.

## 🎯 Prerequisites

- Node.js 20+ installed
- pnpm package manager (`npm install -g pnpm`)
- A Supabase account (free tier works great!)
- A Google Gemini API key (free tier available)

## 📦 Quick Start (Development Mode)

The application works out of the box with mock data! You can skip the configuration steps below and start developing immediately:

```bash
# Install dependencies
pnpm install

# Start backend (in one terminal)
cd backend
pnpm dev

# Start frontend (in another terminal)
cd frontend
pnpm dev
```

Visit `http://localhost:5173` and start writing! The UI is fully functional with mock AI responses.

## 🔧 Full Setup (Production-Ready)

### Step 1: Supabase Setup

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Choose a name, database password, and region

2. **Run the Database Schema**
   - In your Supabase dashboard, go to the SQL Editor
   - Copy the contents of `backend/supabase-schema.sql`
   - Paste and run the SQL in the editor
   - This creates all necessary tables and security policies

3. **Get Your API Keys**
   - Go to Project Settings > API
   - Copy the `Project URL` and `anon public` key
   - Copy the `service_role` key (keep this secret!)

### Step 2: Gemini AI Setup

1. **Get a Gemini API Key**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Sign in with your Google account
   - Click "Create API Key"
   - Copy the API key

### Step 3: Environment Configuration

1. **Backend Configuration**
   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Edit `backend/.env`** with your actual values:
   ```env
   PORT=3000
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:5173

   # Supabase - Replace with your actual values
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

   # Google Gemini AI - Replace with your API key
   GEMINI_API_KEY=your_gemini_api_key_here

   # WebSocket
   WS_PORT=1234
   ```

3. **Frontend Configuration** (if needed)
   ```bash
   cd frontend
   cp .env.example .env
   ```

   Edit `frontend/.env`:
   ```env
   VITE_API_URL=http://localhost:3000
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

### Step 4: Install Dependencies

```bash
# From the root directory
pnpm install

# Or install separately
cd backend && pnpm install
cd ../frontend && pnpm install
```

### Step 5: Start the Application

```bash
# Terminal 1: Start backend
cd backend
pnpm dev

# Terminal 2: Start frontend
cd frontend
pnpm dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- API Health Check: http://localhost:3000/health

## 🎨 Features Overview

### ✨ Current Features (Phase 1-3 Complete!)

1. **Futuristic UI**
   - Cyberpunk-inspired design with neon gradients
   - Glassmorphism effects
   - Smooth animations with Framer Motion
   - Responsive and mobile-friendly

2. **Rich Text Editor**
   - Powered by TipTap
   - Markdown shortcuts
   - Formatting toolbar (bold, italic, headings, lists, etc.)
   - Real-time word/character count
   - Auto-save functionality

3. **AI Writing Assistant** (Powered by Gemini)
   - **Grammar Check**: Identifies and fixes grammar, spelling, and punctuation errors
   - **Clarity Analysis**: Provides readability scores and suggestions for improvement
   - **Rewrite Options**: Generates multiple versions in different styles (professional, casual, concise)
   - **Idea Expansion**: Helps elaborate on your ideas with examples and analysis
   - **Streaming Responses**: See AI feedback in real-time

4. **Document Management**
   - Create, edit, and delete documents
   - Document list with search and filters
   - Autosave with visual indicators
   - Local storage fallback (works offline!)

## 🚀 Usage Guide

### Writing with AI Assistance

1. **Select Text** in the editor
2. **Click "AI Feedback"** button in the toolbar
3. **Choose Analysis Type**:
   - **Feedback Tab**: Get grammar, clarity, and style suggestions
   - **Rewrite Tab**: See different writing style options
   - **Expand Tab**: Generate elaborations and examples
4. **Apply Suggestions** with one click

### Keyboard Shortcuts

- `Ctrl/Cmd + B` - Bold
- `Ctrl/Cmd + I` - Italic
- `Ctrl/Cmd + E` - Inline code
- `Ctrl/Cmd + Z` - Undo
- `Ctrl/Cmd + Shift + Z` - Redo

## 🔒 Security Notes

- **Never commit `.env` files** to version control
- The `service_role` key has admin access - keep it server-side only
- Use the `anon` key for client-side operations
- Supabase Row Level Security (RLS) protects your data

## 🐛 Troubleshooting

### Backend won't start
- Check that ports 3000 and 1234 are available
- Verify your `.env` file exists and has correct values
- Run `pnpm install` in the backend directory

### Frontend won't connect to API
- Ensure backend is running on port 3000
- Check CORS settings in `backend/src/server.ts`
- Verify VITE_API_URL in frontend `.env`

### AI features not working
- Verify your `GEMINI_API_KEY` is correct
- Check API quota/limits in Google AI Studio
- The app works with mock responses if no API key is provided

### Supabase connection issues
- Double-check your Supabase URL and keys
- Ensure the SQL schema was run successfully
- Verify RLS policies are enabled

## 📚 API Documentation

### Documents API

```bash
# List documents
GET /api/documents?userId={uuid}

# Get single document
GET /api/documents/:id

# Create document
POST /api/documents
Body: { title, content, userId }

# Update document
PATCH /api/documents/:id
Body: { title?, content?, is_deleted? }

# Delete document (soft delete)
DELETE /api/documents/:id
```

### AI API

```bash
# Get AI feedback
POST /api/ai/feedback
Body: {
  documentId, userId, selectedText,
  feedbackType: 'grammar' | 'clarity' | 'style' | 'rewrite' | 'expand',
  context?, fullDocument?, userPreferences?
}

# Stream AI feedback (Server-Sent Events)
POST /api/ai/feedback/stream
Body: (same as above)

# Get feedback history
GET /api/ai/feedback/history/:documentId?userId={uuid}
```

## 🎯 Next Steps

- Set up authentication (Supabase Auth is ready!)
- Enable real-time collaboration with Yjs
- Add document templates
- Implement version history
- Create mobile apps
- Add more AI features (summarization, tone adjustment, etc.)

## 💡 Tips for Best Results

1. **AI Feedback**: Provide context for better suggestions
2. **Performance**: The app caches API responses for faster repeated queries
3. **Offline**: Documents are saved locally and sync when online
4. **Keyboard Shortcuts**: Use them for faster editing

## 🤝 Support

- **Issues**: https://github.com/your-repo/ultrawrite/issues
- **Docs**: Check the README.md for more details
- **AI Credits**: Make sure to monitor your Gemini API usage

---

**Enjoy your futuristic writing experience! ✨🚀**
