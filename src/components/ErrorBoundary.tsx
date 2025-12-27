import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Copy, Check } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, copied: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined, copied: false });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleCopyError = async () => {
    const { error, errorInfo } = this.state;
    const errorDetails = [
      `Error: ${error?.message || 'Unknown error'}`,
      `Stack: ${error?.stack || 'No stack trace'}`,
      `Component Stack: ${errorInfo?.componentStack || 'No component stack'}`,
      `URL: ${window.location.href}`,
      `User Agent: ${navigator.userAgent}`,
      `Time: ${new Date().toISOString()}`,
    ].join('\n\n');

    try {
      await navigator.clipboard.writeText(errorDetails);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch (e) {
      console.error('Failed to copy error:', e);
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-xl">Something went wrong</CardTitle>
              <CardDescription>
                The application encountered an unexpected error.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {this.state.error?.message && (
                <div className="p-3 bg-muted rounded-md text-sm font-mono text-muted-foreground break-all max-h-24 overflow-auto">
                  {this.state.error.message}
                </div>
              )}
              <Button 
                onClick={this.handleRetry} 
                className="w-full"
                variant="default"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button 
                onClick={this.handleReload}
                variant="outline"
                className="w-full"
              >
                Reload Page
              </Button>
              <Button 
                onClick={this.handleCopyError}
                variant="ghost"
                className="w-full"
                size="sm"
              >
                {this.state.copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Error Details
                  </>
                )}
              </Button>
              <Button 
                onClick={() => window.location.href = '/'}
                variant="link"
                className="w-full"
                size="sm"
              >
                Go Home
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
