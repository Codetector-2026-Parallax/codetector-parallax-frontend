import React, { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  panelName: string;
  children: ReactNode;
  fallback?: ReactNode;
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
    console.error(`[ErrorBoundary] Render failure in ${this.props.panelName}:`, error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          className="cp-error-ribbon"
          role="alert"
          style={{
            margin: '12px',
            flex: 1,
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--badge-error-border, #E57368)',
            padding: '12px',
          }}
        >
          <div
            className="cp-error-ribbon-title"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontFamily: 'var(--font-ui)',
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--badge-error-text, #E57368)',
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: '8px',
              marginBottom: '8px',
            }}
          >
            <span>⚠ PANEL RENDER ERROR ({this.props.panelName.toUpperCase()})</span>
            <button
              type="button"
              className="cp-mini-tag-btn"
              onClick={this.handleReset}
              style={{ cursor: 'pointer' }}
            >
              RETRY PANEL
            </button>
          </div>
          <div
            className="cp-error-ribbon-body"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '13px',
              color: 'var(--color-ink)',
            }}
          >
            <div>An unexpected render error occurred in this workspace component.</div>
            <pre
              className="cp-error-pre"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                marginTop: '8px',
                padding: '6px 8px',
                backgroundColor: 'var(--surface-sunken)',
                color: 'var(--badge-error-text, #E57368)',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
              {this.state.error?.message || 'Unknown render exception'}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
