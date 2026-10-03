import React from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#071025] text-white flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-rose-400" />
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-2">Something went wrong</h2>
          <p className="text-sm text-slate-400 max-w-md mb-6">
            An unexpected error occurred while loading this page. Click below to reload.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-xl bg-[#38bdf8] hover:bg-[#7dd3fc] text-[#030914] font-bold text-sm flex items-center gap-2 transition-all shadow-lg"
          >
            <RefreshCw className="w-4 h-4" /> Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
