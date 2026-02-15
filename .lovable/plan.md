
## Add "Copy Share Link" Button to Motor Cards

A small share button will be added to each motor card, right alongside the existing Compare, Voice Chat, and Ask buttons that appear on hover. Tapping it copies the shareable URL to your clipboard so you can paste it into a text or email to a customer.

### What It Looks Like

- A small circular button with a share/link icon, matching the style of the existing Compare button
- Appears in the bottom-left button row on hover (desktop) or always visible (mobile)
- On click: copies the link (e.g., `quote.harrisboatworks.ca/motors/fs-115-elpt-ct`) to clipboard and shows a toast confirmation: "Link copied!"

### Technical Details

**New file: `src/components/motors/ShareLinkButton.tsx`**
- A small button component styled identically to `CompareButton` (rounded, same size, tooltip)
- Uses the `Link` icon from lucide-react
- On click, constructs the slug from the motor's `model_key` (lowercase, dashes), builds the full URL using `window.location.origin`, copies to clipboard via `navigator.clipboard.writeText()`, and shows a `sonner` toast

**Modified file: `src/components/motors/MotorCardPreview.tsx`**
- Import and add `ShareLinkButton` to the existing bottom-left button group (after CompareButton, VoiceChatButton, AskQuestionButton)
- Pass the motor's `model_key` (or fall back to `model` field) as a prop

**Slug generation helper** (inline in the button component):
- Takes `model_key` like `FS_115_ELPT_CT`
- Converts to `fs-115-elpt-ct`
- Builds URL: `{origin}/motors/fs-115-elpt-ct`

No new dependencies, no database changes. Uses the `/motors/:slug` route already created.
