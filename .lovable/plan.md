

# Restore Old Chat Bubble + Improve Voice Visibility Inside Chat

## Overview

Revert to the original floating "Ask Mercury Expert" chat bubble on desktop, and make the voice feature **clearly visible and inviting** inside the chat widget once it's opened.

## Changes

### 1. Revert GlobalAIChat to Use Original Chat Bubble

**File: `src/components/chat/GlobalAIChat.tsx`**

Replace `DesktopCommandBar` with the original `AIChatButton`:

```tsx
// Before
import { DesktopCommandBar } from './DesktopCommandBar';
...
{!isMobileOrTablet && (
  <DesktopCommandBar onOpenChat={() => openChat()} isChatOpen={isOpen} />
)}

// After
import { AIChatButton } from './AIChatButton';
...
{!isMobileOrTablet && (
  <AIChatButton onOpenChat={() => openChat()} isOpen={isOpen} />
)}
```

---

### 2. Add Prominent Voice Option in Chat Header

**File: `src/components/chat/EnhancedChatWidget.tsx`**

Add a clear "Start Voice Chat" button in the chat header, right next to the close button. This makes voice immediately discoverable when the chat opens.

```tsx
// In the header section (around line 750-770)
<div className="flex items-center gap-3">
  {/* Existing Mercury Expert title */}
</div>

<div className="flex items-center gap-2">
  {/* NEW: Voice chat button in header */}
  <VoiceHeaderButton 
    isConnected={voice.isConnected}
    isConnecting={voice.isConnecting}
    isSpeaking={voice.isSpeaking}
    isListening={voice.isListening}
    onStart={voice.startVoiceChat}
    onEnd={voice.endVoiceChat}
  />
  <Button variant="ghost" onClick={onClose}>
    <X className="w-5 h-5" />
  </Button>
</div>
```

The `VoiceHeaderButton` will be a new sub-component:
- Green gradient styling (matching the mobile look)
- Clear label: "Voice" when idle, "LIVE" when active
- Microphone icon with subtle animations
- Tooltip on hover: "Talk to Harris"

---

### 3. Improve Existing Voice Button in Input Area

**File: `src/components/chat/VoiceButton.tsx`**

Update the default styling of `VoiceButton` when used in the chat input:
- Use green background instead of gray when idle
- Add a tooltip: "Start voice chat"
- Make it slightly larger and more prominent

```tsx
// Update getStateColor() for idle state:
return 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200';
// Instead of: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
```

---

## Visual Result

### Before (Current)
```
┌──────────────────────────────────────┐
│  [Mercury Expert]              [X]   │  ← Header, just close button
├──────────────────────────────────────┤
│                                      │
│  Messages...                         │
│                                      │
├──────────────────────────────────────┤
│  [🎤] [Type message...        ] [→]  │  ← Small gray mic looks like dictate
└──────────────────────────────────────┘
```

### After (Proposed)
```
┌──────────────────────────────────────┐
│  [Mercury Expert]     [🎤 Voice] [X] │  ← GREEN voice button in header!
├──────────────────────────────────────┤
│                                      │
│  Messages...                         │
│                                      │
├──────────────────────────────────────┤
│  [🎤] [Type message...        ] [→]  │  ← Green mic (still there as backup)
└──────────────────────────────────────┘
```

When voice is active:
```
┌──────────────────────────────────────┐
│  [Mercury Expert]  [🔊 LIVE 🔴] [X]  │  ← Shows live status
├──────────────────────────────────────┤
│  ...                                 │
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/chat/GlobalAIChat.tsx` | Replace `DesktopCommandBar` with `AIChatButton` |
| `src/components/chat/EnhancedChatWidget.tsx` | Add `VoiceHeaderButton` to header area |
| `src/components/chat/VoiceButton.tsx` | Change idle color from gray to green |

## Optional Cleanup

- `src/components/chat/DesktopCommandBar.tsx` can be deleted or kept for potential future use

---

## Benefits

1. **Familiar bubble experience** - Users get the same floating chat button they're used to
2. **Voice is immediately visible** - Green "Voice" button right in the header when chat opens
3. **Not confusing** - Clear "Voice" label with conversational styling makes it obvious this is for talking
4. **Two access points** - Header button for discovery, input button for quick access during typing
5. **Consistent styling** - Green = voice (matches mobile voice buttons)

