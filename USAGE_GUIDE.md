# UltraWrite Usage Guide

## Getting Started

### Starting the Application

```bash
# Terminal 1: Start Backend
cd backend
pnpm dev

# Terminal 2: Start Frontend
cd frontend
pnpm dev
```

Then open **http://localhost:5173**

---

## Interface Overview

```
┌─────────────────────────────────────────────────────────┐
│  [Sidebar]  │  [Editor Toolbar - Word Count]            │
│  ────────   │  ────────────────────────────────         │
│  Documents  │                                            │
│  • Doc 1    │   Your writing appears here...            │
│  • Doc 2    │                                            │
│  • Doc 3    │                                            │
│             │                                            │
│             │                                            │
└─────────────┴────────────────────────────────────────────┘
                           ▲
                           │
    ┌──────────────────────┴─────────────────────┐
    │  [AI Toolbar - Bottom]                     │
    │  [Mode ▼] Grammar | 142 chars | [Cmd+K]   │
    └────────────────────────────────────────────┘
                           ▲
                           │ Cmd+K
                           │
          ┌────────────────┴───────────────┐
          │  [Diff View - Floats Above]    │
          │  ─────────────────────────────  │
          │  [This is wrong text]  ← Red   │
          │  [This is correct text] ← Green│
          │  [Accept All] [Reject All]     │
          └────────────────────────────────┘
```

---

## Using AI Modes

### 1. Fix Grammar

**Use case:** Fix spelling, grammar, and punctuation errors

**How to use:**
1. Select text with errors
2. Press `Cmd+K` (or click bottom toolbar)
3. Choose "Fix Grammar" mode
4. Review red (removed) and green (added) changes
5. Click "Accept All" or reject

**Example:**
```
Before: "I seen three cats yesterday their cute"
After:  "I saw three cats yesterday. They're cute."
        ↑   ↑                        ↑    ↑
        Grammar errors fixed
```

---

### 2. Rewrite

**Use case:** Generate alternative versions of your text

**How to use:**
1. Select text you want rewritten
2. Choose "Rewrite" mode
3. AI generates a new version
4. Review the diff
5. Accept or try again

**Example:**
```
Before: "The product is good and works well"
After:  "The product delivers excellent performance"
        ↑
        More professional tone
```

---

### 3. Expand

**Use case:** Add more detail and elaboration

**How to use:**
1. Select brief text
2. Choose "Expand" mode
3. AI adds details, examples, context
4. Original text stays (green additions only)
5. Accept to insert

**Example:**
```
Before: "AI is transforming industries."

After:  "AI is transforming industries across healthcare,
         finance, and transportation. Machine learning models
         are now diagnosing diseases earlier than human doctors,
         while autonomous vehicles are reducing accidents by 40%."
         ↑ ────────────────────────────────────────────────
         All green (additions)
```

---

### 4. Agent Mode (The Game Changer!)

**Use case:** Custom instructions for any edit

**How to use:**
1. Select text
2. Choose "Agent Mode"
3. Modal opens with instruction box
4. Type what you want: "Make this more formal"
5. AI applies your specific instruction
6. Review and accept

**Example Instructions:**
- "Make this more concise"
- "Add statistics to support the claims"
- "Change tone to be more empathetic"
- "Simplify for a 5th grade reading level"
- "Add a metaphor to explain this concept"
- "Make this sound more confident"

**Example:**
```
You: "AI will change everything in the future."

Instruction: "Make this more specific and add concrete examples"

AI: "AI will revolutionize healthcare diagnostics, autonomous
     transportation, and personalized education within the next
     5-10 years. For instance, IBM Watson is already analyzing
     medical images with 90% accuracy, while Tesla's FSD is
     processing 4D spatial data in real-time."

You: [Accept!]
```

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Cmd/Ctrl + K` | Open AI toolbar / Agent Mode |
| `Cmd/Ctrl + Enter` | Send Agent instruction |
| `Escape` | Close modals |
| `Cmd/Ctrl + B` | Bold |
| `Cmd/Ctrl + I` | Italic |
| `Cmd/Ctrl + Z` | Undo |

---

## Understanding the Diff View

### Color Coding

**🔴 Red Background + Strikethrough**
- Text being removed/replaced
- `This is wrong` ← Will be deleted

**🟢 Green Background**
- Text being added/inserted
- `This is correct` ← Will be added

**⚪ White (Unchanged)**
- Text staying the same
- Context around changes

### Actions

**Accept All**
- Applies all changes at once
- Original text → New text

**Reject All**
- Discards all suggestions
- Keeps original text

**Individual Accept/Reject** (hover over change)
- Accept specific parts
- Reject others
- Mix and match!

---

## Tips & Best Practices

### 1. Start Small
- Select 1-2 sentences for best results
- AI works better with focused context

### 2. Use Agent Mode for Complex Edits
- Don't settle for basic "rewrite"
- Tell the AI exactly what you want
- Be specific: "Add 3 concrete examples"

### 3. Iterate
- Accept partial suggestions
- Then run Agent Mode again
- Build up complex edits step-by-step

### 4. Review Diffs Carefully
- Red/green makes it obvious
- Check that changes preserve meaning
- Reject if AI misunderstood

### 5. Keyboard Shortcuts Save Time
- `Cmd+K` → Select mode → Enter
- 3 seconds to get AI suggestions

---

## Common Workflows

### Workflow 1: Quick Grammar Check
```
1. Finish writing paragraph
2. Select all text
3. Cmd+K → Grammar
4. Accept all fixes
5. Keep writing
```

### Workflow 2: Improve Tone
```
1. Write rough draft
2. Select section
3. Agent Mode: "Make this more professional"
4. Review → Accept
5. Repeat for each section
```

### Workflow 3: Add Evidence
```
1. Write claim
2. Select claim
3. Agent Mode: "Add 2-3 statistics to support this"
4. AI adds data with sources
5. Accept
```

### Workflow 4: Iterative Refinement
```
1. Write: "The product is good"
2. Agent: "Make it more specific"
   → "The product has excellent build quality"
3. Agent: "Add a concrete example"
   → "The product has excellent build quality, with
      aerospace-grade aluminum that's 40% lighter than steel"
4. Perfect!
```

---

## Troubleshooting

### "No text selected"
- Make sure you've highlighted text before pressing Cmd+K
- Toolbar shows character count when text is selected

### "Changes not applying"
- Check that you clicked "Accept All"
- Try selecting text again and reapply
- Refresh page if editor gets stuck

### "AI not responding"
- Check backend is running (http://localhost:3000/health)
- Verify Gemini API key in backend/.env
- Check browser console for errors

### "Diff looks wrong"
- Sometimes AI misunderstands context
- Click "Reject All" and try different instruction
- Or select less text for more focused edits

---

## Advanced: Agent Mode Patterns

### Pattern: Progressive Enhancement
```
Draft → Agent("expand") → Agent("add examples") →
Agent("improve flow") → Agent("make concise")
```

### Pattern: Multi-Pass Editing
```
1. Write everything fast (don't worry about quality)
2. Select paragraph 1 → Agent("improve")
3. Select paragraph 2 → Agent("improve")
4. Select intro → Agent("make hook stronger")
5. Select conclusion → Agent("tie everything together")
```

### Pattern: Style Transfer
```
Casual tone → Agent("make formal") → Academic paper
Blog post → Agent("make conversational") → Twitter thread
Technical → Agent("explain like I'm 5") → Tutorial
```

---

## What Makes This Better Than Google Docs?

| Feature | Google Docs | UltraWrite |
|---------|-------------|------------|
| Grammar Check | Basic (red underlines) | AI with explanations |
| Rewrite | Manual only | Multiple AI-generated options |
| Expand Ideas | Manual only | AI adds detail automatically |
| Custom Instructions | ❌ | ✅ Agent Mode |
| Visual Diff | ❌ | ✅ Red/green like code editors |
| Keyboard-First | ❌ | ✅ Cmd+K for everything |
| Inline Suggestions | ❌ | ✅ Preview before accepting |
| Context-Aware AI | ❌ | ✅ Remembers conversation |

---

## Next Steps

1. **Try all 4 modes** - See what each does
2. **Experiment with Agent Mode** - This is where the magic happens
3. **Use keyboard shortcuts** - Get fast at Cmd+K workflow
4. **Iterate on your writing** - Don't settle for first draft
5. **Share feedback** - Help us make this even better!

---

**Welcome to the future of writing!** 🚀

The AI doesn't replace you - it amplifies you. Use it to write faster, clearer, and better than ever before.

Questions? Issues? Feature requests?
Open an issue on GitHub or reach out!
