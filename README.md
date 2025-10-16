# UltraWrite ✨🚀

> A futuristic, AI-powered writing platform that makes writing effortless and enjoyable.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

## 🌟 Features

### ✨ Futuristic UI/UX
- **Cyberpunk-inspired design** with neon gradients and glassmorphism effects
- **Smooth animations** powered by Framer Motion
- **Responsive layout** that works on all devices
- **Dark mode** optimized for extended writing sessions
- **Real-time visual feedback** for all actions

### 📝 Advanced Editor
- **Rich text editing** powered by TipTap
- **Markdown shortcuts** for fast formatting
- **Floating toolbar** with all essential formatting options
- **Auto-save** with visual indicators
- **Word/character/reading time** counters
- **Keyboard shortcuts** for power users

### 🤖 AI Writing Assistant (Powered by Google Gemini)
- **Grammar & Spelling Check**: Catch errors instantly
- **Clarity Analysis**: Get readability scores and improvement suggestions
- **Style Suggestions**: Enhance your writing tone and voice
- **Smart Rewrite**: Generate multiple versions in different styles
- **Idea Expansion**: Elaborate on your ideas with AI-generated content
- **Real-time Streaming**: See AI responses as they're generated

### 💾 Document Management
- **Create, edit, delete** documents with ease
- **Auto-save** with conflict resolution
- **Document history** with version control (coming soon)
- **Search and filter** capabilities
- **Offline support** with local storage fallback

### 🔐 Secure & Scalable
- **Supabase backend** with Row Level Security (RLS)
- **RESTful API** with comprehensive error handling
- **Real-time collaboration** ready (Yjs integration)
- **TypeScript** for type safety throughout
- **Environment-based configuration** for easy deployment

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- pnpm (recommended) or npm
- A Supabase account (free tier works!)
- A Google Gemini API key (free tier available)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/ultrawrite.git
cd ultrawrite

# Install dependencies
pnpm install

# Set up environment variables (see SETUP.md for details)
cp backend/.env.example backend/.env
# Edit backend/.env with your API keys

# Start the backend
cd backend
pnpm dev

# In a new terminal, start the frontend
cd frontend
pnpm dev
```

Visit http://localhost:5173 to start writing!

📖 **For detailed setup instructions, see [SETUP.md](./SETUP.md)**

## 🏗️ Project Structure

```
ultrawrite/
├── frontend/                # React + Vite frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── Editor/     # Editor-related components
│   │   │   ├── Sidebar/    # Document navigation
│   │   │   └── AIFeedback/ # AI feedback panel
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API client
│   │   ├── store/          # Zustand state management
│   │   └── lib/            # Utilities
│   └── package.json
│
├── backend/                # Express.js backend
│   ├── src/
│   │   ├── config/         # Configuration (Supabase, etc.)
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic (AI, etc.)
│   │   └── server.ts       # Main server file
│   ├── supabase-schema.sql # Database schema
│   └── package.json
│
├── SETUP.md                # Detailed setup guide
├── README.md               # This file
└── package.json            # Root package.json
```

## 🎨 Tech Stack

### Frontend
- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool (using Rolldown)
- **TailwindCSS** - Styling
- **Framer Motion** - Animations
- **TipTap** - Rich text editor
- **Zustand** - State management
- **React Query** - Server state management
- **Axios** - HTTP client

### Backend
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Supabase** - Database & Auth
- **Google Gemini** - AI capabilities
- **Zod** - Schema validation
- **Yjs** - Real-time collaboration (ready)

## 📚 API Documentation

### Documents API

```typescript
// List documents
GET /api/documents?userId={uuid}

// Get single document
GET /api/documents/:id

// Create document
POST /api/documents
Body: { title, content, userId }

// Update document
PATCH /api/documents/:id
Body: { title?, content?, is_deleted? }

// Delete document
DELETE /api/documents/:id
```

### AI API

```typescript
// Get AI feedback
POST /api/ai/feedback
Body: {
  documentId: string
  userId: string
  selectedText: string
  feedbackType: 'grammar' | 'clarity' | 'style' | 'rewrite' | 'expand'
  context?: string
  fullDocument?: string
  userPreferences?: {
    tone?: 'formal' | 'casual'
    style?: 'professional' | 'casual' | 'concise'
  }
}

// Stream AI feedback (SSE)
POST /api/ai/feedback/stream
Body: (same as above)

// Get feedback history
GET /api/ai/feedback/history/:documentId?userId={uuid}
```

## 🎯 Roadmap

### ✅ Completed (Phase 1-3)
- [x] Futuristic UI with glassmorphism and animations
- [x] Rich text editor with TipTap
- [x] Document CRUD operations
- [x] Supabase integration
- [x] Google Gemini AI integration
- [x] Grammar, clarity, and style analysis
- [x] Rewrite and expand features
- [x] Streaming AI responses
- [x] Auto-save functionality

### 🔜 Coming Soon (Phase 4-10)
- [ ] Authentication (Supabase Auth)
- [ ] Real-time collaboration with Yjs
- [ ] Document templates
- [ ] Version history & document diff
- [ ] Export to PDF/Markdown/DOCX
- [ ] Advanced AI features (summarization, tone adjustment)
- [ ] Team workspaces
- [ ] Mobile apps
- [ ] Browser extension
- [ ] Public publishing

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + B` | Bold |
| `Ctrl/Cmd + I` | Italic |
| `Ctrl/Cmd + E` | Inline code |
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` | Redo |
| `Ctrl/Cmd + S` | Save (auto-saves anyway) |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini** for the amazing AI capabilities
- **Supabase** for the excellent backend infrastructure
- **TipTap** for the powerful editor framework
- **Framer Motion** for the smooth animations
- **The open-source community** for all the amazing tools

## 💬 Support

- **Documentation**: Check [SETUP.md](./SETUP.md) for detailed setup instructions
- **Issues**: [GitHub Issues](https://github.com/your-username/ultrawrite/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/ultrawrite/discussions)

---

<div align="center">

**Made with ❤️ and AI**

⭐ Star this repo if you find it helpful!

[Report Bug](https://github.com/your-username/ultrawrite/issues) · [Request Feature](https://github.com/your-username/ultrawrite/issues) · [Documentation](./SETUP.md)

</div>
