

## Add Share Link Buttons to Motor Cards (MotorCardPremium)

### What Happened
The share link buttons were only added to the **preview/test** motor card design (`MotorCardPreview.tsx`), not to the **production** card (`MotorCardPremium.tsx`) that you actually see on the Engines page. They likely appeared to work before because the preview design was being viewed during testing.

### Fix
Add the `ShareLinkButton` (and the existing `AskQuestionButton` + `VoiceChatButton` for consistency) to `MotorCardPremium.tsx`, positioned in the image area similar to how the preview card does it.

### Technical Details

**File: `src/components/motors/MotorCardPremium.tsx`**

1. Import `ShareLinkButton`, `AskQuestionButton`, and `VoiceChatButton` components
2. Add a small button group in the bottom-left of the image area (around line 260, near the Mercury logo) with the share link button and other action buttons
3. Style them to match the premium card's clean aesthetic -- small, subtle icons that appear on hover

### Layout
The buttons will sit in the bottom-left corner of the image section, appearing on hover (desktop) or always visible (mobile), matching the existing premium card style:

```
 [Popularity Badge]          [HP Badge]
                              
        (motor image)
                              
 [Share] [Ask] [Voice]    [Mercury Logo]
```

### Files Changed
1. **`src/components/motors/MotorCardPremium.tsx`** -- Import and add `ShareLinkButton` (+ action buttons) to the image overlay area

