import React, { ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[300px] w-full flex items-center justify-center p-6 bg-rose-50/50 dark:bg-slate-900/50 rounded-2xl border border-rose-200 dark:border-slate-800 my-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 rounded-2xl p-6 shadow-xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-2xs">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                {this.props.fallbackTitle || '视图加载遇到异常'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                系统已自动拦截异常，避免影响您的全局咨询档案数据。点击下方按钮即可一键恢复视图。
              </p>
            </div>

            {this.state.error && (
              <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-left text-[11px] font-mono text-rose-700 dark:text-rose-300 overflow-x-auto max-h-24">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5 animate-spin-hover" />
                <span>恢复视图</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
