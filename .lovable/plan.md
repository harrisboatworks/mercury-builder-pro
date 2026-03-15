

# Auto-Retry for Dynamic Import Failures in ErrorBoundary

## Why

Vite's code-splitting means route components are loaded via dynamic `import()`. During HMR or deployment, the old chunk URL can 404, causing a "Failed to fetch dynamically imported module" error. Currently this shows the full error screen — but a simple page reload fetches the new chunks and resolves it instantly.

## Plan

### `src/components/ErrorBoundary.tsx`

In `componentDidCatch`, detect chunk load failures and auto-reload once:

1. Check if the error message contains `"dynamically imported module"` or `"Loading chunk"` or `"Failed to fetch"`
2. Check `sessionStorage` for a `chunk-reload-attempted` flag to prevent infinite reload loops
3. If it's a chunk error and no reload has been attempted yet:
   - Set the flag in `sessionStorage`
   - Call `window.location.reload()`
4. If the flag already exists (reload already tried), fall through to the normal error UI
5. Clear the flag on successful render (in `componentDidMount` or when `hasError` is false)

This is ~15 lines of logic added to the existing ErrorBoundary. No new files needed.

