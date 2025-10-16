# UltraWrite - Quick Start Guide

## 🚀 Phase 0 & Phase 1 - COMPLETED ✅

### What Has Been Implemented

#### ✅ Phase 0: Project Setup
- Frontend: React + TypeScript + Vite with Tailwind CSS
- Backend: Express + TypeScript + WebSocket server
- Development environment fully configured
- Path aliases configured (@/* imports)
- ESLint and TypeScript strict mode enabled

#### ✅ Phase 1: Core Editor
- **Rich Text Editor** with TipTap
  - Bold, Italic formatting
  - Headings (H1, H2, H3)
  - Bullet and Ordered Lists
  - Undo/Redo functionality
  - Placeholder text
- **Editor Toolbar** with formatting controls
- **Word & Character Counter** in footer
- **Autosave** functionality (localStorage-based)
- **Document Sidebar** for navigation
- **AI Feedback Panel** (UI ready for Phase 2)
- **State Management** with Zustand
- **Real-time Collaboration** infrastructure (Y.js + WebSocket)

---

## 📋 Prerequisites

- Node.js 18 or higher
- pnpm (recommended) or npm

---

## 🔧 Installation

### 1. Install Frontend Dependencies
```bash
cd frontend
pnpm install
```

### 2. Install Backend Dependencies
```bash
cd backend
pnpm install
```

---

## 🏃 Running the Application

### Option 1: Start Both Servers Separately

**Terminal 1 - Backend:**
```bash
cd backend
pnpm dev
```
- REST API runs on: `http://localhost:3000`
- WebSocket runs on: `ws://localhost:1234`

**Terminal 2 - Frontend:**
```bash
cd frontend
pnpm dev
```
- Frontend runs on: `http://localhost:5173`

### Option 2: Check Server Status
The servers should now be running. Open your browser to:
- **Frontend:** http://localhost:5173

---

## 🎯 Testing the Application

1. **Open the app** at http://localhost:5173
2. **Start writing** in the editor - you'll see:
   - Rich text formatting toolbar
   - Real-time word/character count
   - Autosave indicator (saves to localStorage)
   - Document sidebar on the left
   - AI feedback panel on the right

3. **Try the formatting tools:**
   - Select text and click Bold/Italic
   - Use keyboard shortcuts (Ctrl+B for bold, Ctrl+I for italic)
   - Create headings and lists
   - Undo/Redo your changes

4. **Check autosave:**
   - Type something
   - Wait 1 second
   - See "Saved" indicator in the footer
   - Refresh the page - your content persists!

---

## 📁 Project Structure

```
ultraWrite/
├── frontend/                    # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Editor/
│   │   │   │   ├── TiptapEditor.tsx      # Main editor component
│   │   │   │   ├── EditorPane.tsx        # Editor container
│   │   │   │   ├── EditorToolbar.tsx     # Formatting toolbar
│   │   │   │   └── EditorFooter.tsx      # Word count & save status
│   │   │   ├── Sidebar/
│   │   │   │   └── Sidebar.tsx           # Document navigation
│   │   │   └── AIFeedback/
│   │   │       └── AIFeedbackPanel.tsx   # AI feedback UI
│   │   ├── store/
│   │   │   └── editorStore.ts            # Zustand state
│   │   ├── hooks/
│   │   │   └── useAutosave.ts            # Autosave logic
│   │   ├── lib/
│   │   │   └── utils.ts                  # Utility functions
│   │   ├── App.tsx                       # Main app component
│   │   └── main.tsx                      # Entry point
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── package.json
│
└── backend/                     # Express Backend
    ├── src/
    │   ├── server.ts            # REST API server
    │   ├── websocket.ts         # Y.js WebSocket server
    │   └── index.ts             # Entry point
    ├── tsconfig.json
    └── package.json
```

---

## 🔑 Key Features Implemented

### Editor Features
- ✅ Rich text editing with prose styling
- ✅ Formatting toolbar (bold, italic, headings, lists)
- ✅ Keyboard shortcuts
- ✅ Word and character counting
- ✅ Autosave every 1 second
- ✅ Persistent storage (localStorage)
- ✅ Clean, modern UI with Tailwind CSS

### Architecture
- ✅ Component-based React architecture
- ✅ TypeScript for type safety
- ✅ Zustand for state management
- ✅ Custom hooks for reusable logic
- ✅ Path aliases for clean imports
- ✅ WebSocket server ready for real-time collaboration

---

## 🛠 API Endpoints

### Health Check
```
GET http://localhost:3000/health
```

### Documents API (Ready for Phase 2)
- `GET /api/documents` - List all documents
- `GET /api/documents/:id` - Get single document
- `POST /api/documents` - Create new document
- `PUT /api/documents/:id` - Update document
- `DELETE /api/documents/:id` - Delete document

---

## 🎨 Customization

### Changing the Theme
Edit `frontend/src/index.css` to modify CSS variables for colors.

### Modifying Editor Behavior
Edit `frontend/src/components/Editor/TiptapEditor.tsx` to add more TipTap extensions.

### Adjusting Autosave Delay
Edit `frontend/src/hooks/useAutosave.ts` - change `AUTOSAVE_DELAY` constant.

---

## 🐛 Troubleshooting

### Frontend won't start
```bash
cd frontend
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm dev
```

### Backend won't start
```bash
cd backend
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm dev
```

### Port already in use
Change ports in:
- Backend: `backend/.env` (PORT and WS_PORT)
- Frontend: `frontend/.env` (VITE_API_URL and VITE_WS_URL)

---

## 📦 Building for Production

### Frontend
```bash
cd frontend
pnpm build
# Output in: frontend/dist/
```

### Backend
```bash
cd backend
pnpm build
pnpm start
# Output in: backend/dist/
```

---

## 🚀 Next Steps (Future Phases)

### Phase 2: AI Integration (Upcoming)
- Connect to OpenAI/Anthropic APIs
- Real-time grammar checking
- Style suggestions
- Content improvement recommendations

### Phase 3: Document Management (Upcoming)
- Database integration (PostgreSQL + Prisma)
- Document CRUD operations
- Search functionality
- Document templates

### Phase 4: Real-time Collaboration (Upcoming)
- Multi-user editing
- Cursor presence
- Change tracking
- Conflict resolution

---

## 💡 Tips

1. **Save your work**: While autosave is enabled, it currently saves to localStorage. In future phases, this will sync to a database.

2. **Keyboard shortcuts**: 
   - Bold: `Ctrl+B` (Mac: `Cmd+B`)
   - Italic: `Ctrl+I` (Mac: `Cmd+I`)
   - Undo: `Ctrl+Z`
   - Redo: `Ctrl+Shift+Z`

3. **Performance**: The editor is optimized for documents up to 50,000 words.

---

## ✅ Phase 0 & 1 Checklist

- [x] Project initialization
- [x] Frontend setup (React + TypeScript + Vite)
- [x] Backend setup (Express + TypeScript)
- [x] Tailwind CSS configuration
- [x] TipTap editor integration
- [x] Rich text formatting
- [x] Editor toolbar
- [x] Word/character counter
- [x] Autosave functionality
- [x] Document sidebar UI
- [x] AI feedback panel UI
- [x] State management (Zustand)
- [x] WebSocket server for collaboration
- [x] TypeScript configuration
- [x] Path aliases
- [x] Development environment ready

**Status: Phase 0 & Phase 1 are 100% complete! 🎉**

---

## 📞 Support

For issues or questions, check the README.md in the root directory.

---

**Enjoy writing with UltraWrite! ✍️**

