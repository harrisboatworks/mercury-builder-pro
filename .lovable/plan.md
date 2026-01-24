
# Fix Mobile Chat Viewport Issues on iPhone Chrome

## Problem Summary

When using the chat on iPhone in Chrome, the viewport shifts and requires manual adjustment. Looking at your screenshots, I can see:
1. Content is getting cut off on the right side
2. User messages overflow the visible area
3. The screen scales/zooms unexpectedly when interacting with the chat

## Root Causes

1. **Missing explicit width containment** on the chat drawer container
2. **No viewport lock** when chat is open (iOS browsers allow pinch-zoom and pan when fixed elements don't fully constrain the viewport)
3. **Message bubbles can overflow** with long content or links
4. **Keyboard interaction** causes iOS Chrome to resize the viewport unpredictably

## Solution

### File 1: `src/components/chat/InlineChatDrawer.tsx`

**Add viewport locking when chat opens:**
```typescript
// Add effect to lock body scroll and viewport when drawer is open
useEffect(() => {
  if (isOpen) {
    // Lock body scroll and prevent viewport shifts
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.top = `-${window.scrollY}px`;
  } else {
    // Restore scroll position when closing
    const scrollY = document.body.style.top;
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.top = '';
    window.scrollTo(0, parseInt(scrollY || '0') * -1);
  }
  
  return () => {
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.top = '';
  };
}, [isOpen]);
```

**Fix drawer container styling (line ~697):**
```tsx
className="fixed inset-x-0 z-[75] bg-white rounded-t-2xl border-t border-gray-200 
  w-full max-w-[100vw] overflow-hidden"
```

**Fix message bubble overflow (line ~808):**
```tsx
className={cn(
  "max-w-[85%] px-3.5 py-2.5 text-[14px] break-words overflow-hidden",
  // ... rest of styles
)}
```

**Add word-break to message text (line ~817):**
```tsx
<p className="whitespace-pre-wrap leading-relaxed font-light break-words overflow-wrap-anywhere">
```

### File 2: `src/index.css`

**Add iOS-specific chat drawer fixes:**
```css
/* iOS Chrome chat drawer fixes */
@supports (-webkit-touch-callout: none) {
  .chat-drawer-open {
    position: fixed;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
  
  /* Prevent overscroll bounce when chat is open */
  .chat-drawer-open body {
    overscroll-behavior: none;
  }
}

/* Ensure chat messages don't cause horizontal overflow */
.chat-message-content {
  word-break: break-word;
  overflow-wrap: anywhere;
  max-width: 100%;
}
```

### File 3: `index.html`

**Update viewport meta for better iOS Chrome behavior:**
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
```

This prevents pinch-zoom which is the main cause of the "adjusting screen" issue. Note: This restricts all zooming on the site, which is a trade-off for stable chat behavior.

## Changes Summary

| File | Change |
|------|--------|
| `InlineChatDrawer.tsx` | Add body scroll lock, explicit width containment, message overflow handling |
| `src/index.css` | Add iOS-specific overscroll and word-break fixes |
| `index.html` | Lock viewport scale to prevent zoom-induced layout shifts |

## Expected Result

After these changes:
- Chat drawer stays within viewport bounds
- No horizontal scrolling or panning required
- Messages wrap properly without overflow
- Keyboard interaction doesn't shift the view
- Consistent experience between Safari and Chrome on iOS
