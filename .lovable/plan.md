

## Fix: Restore Input Focus After AI Chat Response

### Problem
After the AI finishes responding to a message, the text input loses focus. The user has to manually click back into the input field to type the next question. This breaks the conversational flow.

### Root Cause
Both chat components (`EnhancedChatWidget.tsx` for desktop and `InlineChatDrawer.tsx` for mobile) only focus the input when the chat **first opens**. After a message is sent and the AI responds, `isLoading` goes from `true` back to `false`, but nothing re-focuses the input.

### Fix
Add a `useEffect` in both components that re-focuses the input whenever `isLoading` transitions to `false` (i.e., when the AI finishes responding).

### Technical Details

**File 1: `src/components/chat/EnhancedChatWidget.tsx`**
- Add a `useEffect` (after the existing open-focus effect around line 161) that watches `isLoading` and calls `inputRef.current?.focus()` when loading ends:
```typescript
useEffect(() => {
  if (!isLoading && isOpen && !isMinimized && inputRef.current) {
    inputRef.current.focus();
  }
}, [isLoading, isOpen, isMinimized]);
```

**File 2: `src/components/chat/InlineChatDrawer.tsx`**
- Add a similar `useEffect` (after the existing open-focus effect around line 232):
```typescript
useEffect(() => {
  if (!isLoading && isOpen && inputRef.current) {
    // Small delay to ensure DOM is settled after streaming completes
    setTimeout(() => inputRef.current?.focus(), 100);
  }
}, [isLoading, isOpen]);
```

The mobile version uses a small timeout (consistent with its existing pattern) to account for drawer animations and virtual keyboard behavior.

### Files Changed
1. `src/components/chat/EnhancedChatWidget.tsx` -- Add focus-on-response-complete effect
2. `src/components/chat/InlineChatDrawer.tsx` -- Add focus-on-response-complete effect

