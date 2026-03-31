import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AtmosTrack UI Crash:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cream-50 to-orange-50 px-6">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-orange-100 p-8 text-center space-y-6 animate-fade-in">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center mx-auto shadow-lg shadow-orange-200/50">
              <AlertTriangle className="w-10 h-10 text-white" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Signal Interrupted</h2>
              <p className="text-sm text-gray-500 leading-relaxed px-2">
                A component in the AtmosTrack console encountered an unexpected condition. Don't worry, your session data is likely safe.
              </p>
            </div>

            {import.meta.env.DEV && (
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-left overflow-auto max-h-32">
                <p className="text-[10px] font-mono text-rose-600 break-words line-clamp-4">
                  {this.state.error?.message}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-bold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Console
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-all"
              >
                <Home className="w-4 h-4" />
                Return Home
              </button>
            </div>
            
            <p className="text-[10px] text-gray-400">
              Error code: UI_COMPONENT_CRASH
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
