
# Replace Lovable Favicon with Harris Boat Works Branding

## Problem

The browser tab on the public site (quote.harrisboatworks.ca) shows the Lovable default icon instead of the Harris Boat Works branding. This happens because:

1. The `index.html` correctly references `/favicon.ico` (line 20)
2. A `favicon.ico` file exists in `public/`
3. **But the file content is still the default Lovable icon, not your brand**

## Solution

You need to provide a custom favicon image, and I'll replace the existing `public/favicon.ico` with your branded version.

### What I Need From You

Please upload one of the following:
- **A `.ico` file** (ideal - traditional favicon format)
- **A `.png` file** (I can reference it directly)
- **Any square image** of your Harris Boat Works logo (minimum 32x32px, ideally 256x256px for high-DPI displays)

### What I'll Do

Once you provide the image:

1. **Copy the uploaded file** to `public/favicon.ico` (or `public/favicon.png`)
2. **Update `index.html`** if using PNG format:
   ```html
   <link rel="icon" href="/favicon.png" type="image/png" />
   ```
3. **Add multiple favicon sizes** for better device support (optional but recommended):
   ```html
   <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
   <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
   ```

### Quick Option

If you'd like to use the existing Harris logo that's already in the project (`/assets/harris-logo-black.png`), I can reference that instead. However, standard logos often don't work well at tiny favicon sizes (16x16px) - a simplified icon version works better.

---

## Next Step

**Please upload your favicon image** (or confirm you want me to use the existing Harris logo), and I'll implement the fix immediately.
