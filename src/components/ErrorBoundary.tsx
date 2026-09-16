import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      this.setState({ hasError: false, error: null });
      window.location.reload();
    } catch {
      window.location.href = '/';
    }
  };

  private handleClearDataAndReset = () => {
    try {
      localStorage.removeItem('ig_feed_posts');
      localStorage.removeItem('ig_reels');
      localStorage.removeItem('ig_current_user');
      localStorage.removeItem('ig_stories');
      localStorage.removeItem('ig_conversations');
      this.setState({ hasError: false, error: null });
      window.location.reload();
    } catch {
      window.location.href = '/';
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
          <p className="text-sm text-neutral-400 max-w-sm mb-6 leading-relaxed">
            An unexpected error occurred while loading this view. You can reload or reset app data.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={this.handleReset}
              className="px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-sm font-semibold flex items-center justify-center gap-2 transition"
            >
              <RefreshCw className="w-4 h-4" /> Reload
            </button>
            <button
              onClick={this.handleClearDataAndReset}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:opacity-90 text-sm font-semibold text-white flex items-center justify-center gap-2 transition shadow-lg"
            >
              <Home className="w-4 h-4" /> Reset App Data
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
