import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  compact?: boolean;
  onReset?: () => void;
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
    console.warn('ErrorBoundary caught an error gracefully:', error, errorInfo);
  }

  private handleTryAgain = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      try {
        this.props.onReset();
      } catch {}
    }
  };

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
      localStorage.removeItem('jhalak_reels_likes');
      localStorage.removeItem('jhalak_reels_saved');
      localStorage.removeItem('jhalak_reels_comments');
      this.setState({ hasError: false, error: null });
      window.location.reload();
    } catch {
      window.location.href = '/';
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.compact) {
        return (
          <div className="w-full py-12 px-4 flex flex-col items-center justify-center text-center bg-neutral-900/50 rounded-2xl border border-neutral-800 m-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">
              {this.props.fallbackTitle || 'Section temporarily unavailable'}
            </h3>
            <p className="text-xs text-neutral-400 max-w-xs mb-4">
              A temporary display error was recovered safely.
            </p>
            <button
              onClick={this.handleTryAgain}
              className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        );
      }

      return (
        <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mb-4 shadow-lg shadow-rose-500/5">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold mb-2">
            {this.props.fallbackTitle || 'Something went wrong'}
          </h1>
          <p className="text-sm text-neutral-400 max-w-sm mb-6 leading-relaxed">
            An unexpected error occurred. Jhalak Reels has preserved your account and session safely.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={this.handleTryAgain}
              className="px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> Try Again
            </button>
            <button
              onClick={this.handleReset}
              className="px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" /> Reload
            </button>
            <button
              onClick={this.handleClearDataAndReset}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:opacity-90 text-sm font-semibold text-white flex items-center justify-center gap-2 transition shadow-lg cursor-pointer"
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
