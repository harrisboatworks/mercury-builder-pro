import React from 'react';

interface State {
  error: Error | null;
}

/**
 * Error boundary specifically for lazy-loaded routes. If a dynamic import
 * fails AND lazyWithRetry has exhausted its recovery (e.g. already reloaded
 * once this session), this boundary renders a recovery card instead of letting
 * the error bubble up to React Router's catch-all and showing a confusing 404.
 */
export class LazyRouteBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[LazyRouteBoundary] caught route load error:', error, info);
  }

  handleReload = () => {
    // Clear all chunkReload flags so the next attempt is treated as fresh.
    try {
      Object.keys(sessionStorage)
        .filter((k) => k.startsWith('chunkReload:'))
        .forEach((k) => sessionStorage.removeItem(k));
    } catch {}
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
          <div className="max-w-md w-full rounded-lg border border-border bg-card p-8 text-center space-y-4 shadow-sm">
            <h1 className="text-2xl font-light text-foreground">
              Couldn't load this page
            </h1>
            <p className="text-sm text-muted-foreground font-light">
              Something interrupted loading. This usually clears with a reload.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
