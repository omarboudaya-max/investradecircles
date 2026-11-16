import React from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

/**
 * Catches render errors below it.
 *
 * Pass `resetKey` (for example the current pathname) to clear the error when the
 * user navigates, and `compact` to render inside the app layout instead of
 * taking over the whole screen.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  componentDidUpdate(prevProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    // A stale tab after a new deployment fails to fetch its old code chunks; a reload fixes it.
    const staleChunk = /dynamically imported module|Importing a module script failed|Failed to fetch/i.test(String(error?.message || ''));

    return (
      <div className={`flex flex-col items-center justify-center bg-background p-6 text-center text-foreground ${this.props.compact ? 'min-h-[50vh] rounded-2xl border' : 'min-h-screen'}`}>
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-7 w-7 text-destructive" />
        </div>
        <h2 className="mb-1 text-xl font-bold">{staleChunk ? 'A new version is available' : 'This page ran into a problem'}</h2>
        <p className="mb-6 max-w-md text-sm text-muted-foreground">
          {staleChunk
            ? 'Investraders was updated while this tab was open. Reload to get the latest version.'
            : 'Something unexpected happened while showing this page. The rest of the app is still working.'}
        </p>
        {import.meta.env.DEV && !staleChunk && (
          <pre className="mb-6 max-w-xl overflow-auto rounded-lg bg-muted p-3 text-left text-xs text-muted-foreground">{String(error?.stack || error)}</pre>
        )}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <RefreshCw className="h-4 w-4" /> Reload
          </button>
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            <Home className="h-4 w-4" /> Go to home
          </a>
        </div>
      </div>
    );
  }
}
