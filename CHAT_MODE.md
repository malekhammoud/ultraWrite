# Chat Mode Documentation

## Overview
Chat Mode allows you to have a conversation with your document, ask questions, get feedback, and discuss ideas in a natural conversational interface.

## Features

### 🎯 Core Functionality
- **Conversational Interface**: Natural back-and-forth chat with AI about your document
- **Context-Aware**: Includes full document and/or selected text as context
- **Persistent History**: Maintains conversation history within the session
- **Streaming Responses**: Real-time streaming of AI responses (when backend supports it)

### 🛠️ Settings
- **Include Full Document**: Toggle to include entire document content in context
- **Include Selection**: Toggle to include currently selected text in context
- **Clear Chat**: Remove all messages and start fresh
- **Settings Panel**: Expandable panel to control context options

### 💬 UI Components
- **Chat Button**: Added to editor toolbar (MessageSquare icon)
- **Slide-out Sidebar**: Appears from the right when opened
- **Message Bubbles**: Distinct styling for user and assistant messages
- **Auto-scroll**: Automatically scrolls to latest message
- **Textarea**: Auto-resizing input with keyboard shortcuts

## Usage

### Opening Chat
1. Click the chat icon (💬) in the editor toolbar
2. Chat sidebar slides in from the right
3. Start typing your message

### Sending Messages
- Type your question or prompt in the textarea
- Press `Enter` to send
- Press `Shift + Enter` for a new line

### Context Options
1. Click the settings icon (⚙️) in chat header
2. Toggle "Full document" to include entire document
3. Toggle "Selected text" to include highlighted text
4. Both can be enabled simultaneously

### Example Prompts
```
"Summarize this document in 3 bullet points"
"What's the main argument in this section?"
"Is this paragraph clear? Any suggestions?"
"Help me improve the flow of this text"
"What questions might a reader have?"
```

## Architecture

### State Management (`chatStore.ts`)
```typescript
interface ChatState {
  isOpen: boolean;                    // Sidebar visibility
  messages: ChatMessage[];            // Conversation history
  currentInput: string;               // Current textarea value
  isProcessing: boolean;              // Loading state
  error: string | null;               // Error messages
  includeFullDocument: boolean;       // Context setting
  includeSelection: boolean;          // Context setting
}
```

### API Integration (`api.ts`)
```typescript
// Send message
chatApi.sendMessage(request): Promise<ChatResponse>

// Stream message (real-time)
chatApi.streamMessage(request, onChunk, onComplete)
```

### Components
1. **ChatSidebar.tsx** - Main chat interface
   - Message list with auto-scroll
   - Input textarea with auto-resize
   - Settings panel
   - Loading states and error handling

2. **EditorToolbar.tsx** - Chat button integration
   - Toggle button with active state
   - Icon badge when chat is open

3. **EditorPane.tsx** - Layout integration
   - Renders ChatSidebar alongside AISidebar
   - Both can be open simultaneously

## Backend Requirements

### API Endpoint: `/api/chat/message`
**Method:** POST

**Request:**
```json
{
  "documentId": "string",
  "userId": "string",
  "message": "string",
  "conversationHistory": [
    {
      "role": "user | assistant",
      "content": "string"
    }
  ],
  "documentContext": "string (optional)",
  "selectedText": "string (optional)"
}
```

**Response:**
```json
{
  "message": "string",
  "model": "string",
  "usage": {
    "inputTokens": number,
    "outputTokens": number
  }
}
```

### Streaming Endpoint: `/api/chat/message/stream`
**Method:** POST
**Content-Type:** text/event-stream

**SSE Format:**
```
data: {"chunk": "Hello"}
data: {"chunk": " world"}
data: [DONE]
```

## Implementation Details

### Context Building
```typescript
// Full document context
const docText = editor.getText();

// Selected text context
const selectedText = editor.state.doc.textBetween(from, to);

// Combined in request
{
  documentContext: includeFullDocument ? docText : undefined,
  selectedText: includeSelection ? selectedText : undefined
}
```

### Conversation History
- Messages stored in Zustand store
- Persisted within session (cleared on page reload)
- Sent with each request for context continuity
- Includes role (user/assistant), content, and timestamp

### Error Handling
- Network errors caught and displayed
- User-friendly error messages
- Error state in UI (red banner)
- Graceful degradation (adds error message to chat)

## Styling

### Colors
- **User messages**: Purple/pink gradient (`from-purple-600/20 to-pink-600/20`)
- **Assistant messages**: White/transparent (`bg-white/5`)
- **Header**: Blue/cyan gradient (`from-blue-500 to-cyan-500`)
- **Chat button**: Cyan when active (`text-cyan-400`)

### Animations
- Slide in/out: Framer Motion spring animation
- Message appear: Fade up animation
- Typing indicator: Bouncing dots
- Smooth scrolling to new messages

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Send message |
| `Shift + Enter` | New line in textarea |
| Click chat icon | Toggle chat sidebar |

## Future Enhancements

### Planned Features
- [ ] Message editing and regeneration
- [ ] Copy message to clipboard
- [ ] Export conversation as markdown
- [ ] Suggested follow-up questions
- [ ] Inline code highlighting in responses
- [ ] Image/attachment support
- [ ] Voice input
- [ ] Conversation templates

### Backend TODO
- [ ] Implement `/api/chat/message` endpoint
- [ ] Implement `/api/chat/message/stream` for streaming
- [ ] Add rate limiting
- [ ] Store conversation history (optional)
- [ ] Add authentication/user context
- [ ] Implement token usage tracking
- [ ] Add conversation memory across sessions

## Testing

### Manual Testing Checklist
- [ ] Chat button toggles sidebar
- [ ] Can send messages
- [ ] Messages appear in conversation
- [ ] Auto-scroll works
- [ ] Context options work (full doc / selection)
- [ ] Clear chat works
- [ ] Error handling displays properly
- [ ] Textarea auto-resizes
- [ ] Shift+Enter adds new line
- [ ] Loading state shows during processing
- [ ] Messages have proper timestamps
- [ ] Settings panel toggles correctly

### Integration Testing
1. Open editor with document
2. Select some text
3. Open chat
4. Enable "Selected text" in settings
5. Send message asking about selection
6. Verify context is included in request
7. Verify response appears
8. Send follow-up message
9. Verify conversation history is maintained

## Troubleshooting

### Chat not opening
- Check if `useChatStore` is properly initialized
- Verify ChatSidebar is rendered in EditorPane
- Check console for errors

### Messages not sending
- Verify backend endpoint is running
- Check network tab for request/response
- Verify API_URL is correct
- Check for CORS issues

### Context not included
- Verify editor is available
- Check that `editor.getText()` returns content
- Verify toggles are enabled in settings
- Check request payload in network tab

### Streaming not working
- Verify backend supports SSE
- Check Content-Type header
- Verify SSE parsing in frontend
- Fallback to non-streaming should work

## File Structure

```
frontend/src/
├── store/
│   └── chatStore.ts              # Chat state management
├── components/
│   ├── Chat/
│   │   └── ChatSidebar.tsx       # Main chat UI
│   └── Editor/
│       ├── EditorPane.tsx        # Chat integration
│       └── EditorToolbar.tsx     # Chat button
└── services/
    └── api.ts                     # Chat API client

backend/src/
└── routes/
    └── chat.ts                    # Chat endpoints (TODO)
```

## Conclusion

Chat Mode provides a natural, conversational way to interact with your document. It's context-aware, maintains conversation history, and integrates seamlessly with the editor. The frontend is fully implemented and ready - just needs backend API endpoints to be functional!
