import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="font-display font-extrabold text-2xl text-white mb-2">
            Oups, une erreur est survenue
          </h1>
          <p className="text-zinc-400 text-sm max-w-md mb-6">
            Quelque chose s'est mal passé. Essayez de recharger la page.
            Si le problème persiste, contactez le support.
          </p>
          <div className="flex gap-3">
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neon-violet text-white text-sm font-bold tracking-wide hover:opacity-90 glow-violet cursor-pointer"
            >
              <RefreshCcw className="w-4 h-4" />
              Réessayer
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 text-sm font-semibold hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Recharger la page
            </button>
          </div>
          {this.state.error && (
            <details className="mt-6 text-left max-w-lg">
              <summary className="text-xs text-zinc-600 cursor-pointer hover:text-zinc-400">
                Détails techniques
              </summary>
              <pre className="mt-2 p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-500 overflow-auto">
                {this.state.error.message}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
