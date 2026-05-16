import { Component, StrictMode, type ErrorInfo, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/main.scss'
import App from './App.tsx'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('CrisisIQ render error:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <main
          style={{
            minHeight: '100vh',
            padding: '2rem',
            fontFamily: 'system-ui, sans-serif',
            background: '#fef2f2',
            color: '#991b1b',
          }}
        >
          <h1 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>
            Something went wrong loading CrisisIQ
          </h1>
          <p style={{ marginBottom: '1rem' }}>{this.state.error.message}</p>
          <p style={{ fontSize: '0.875rem', color: '#7f1d1d' }}>
            Check the browser console, confirm <code>.env.local</code> has valid
            Supabase keys, and restart <code>npm run dev</code>.
          </p>
        </main>
      )
    }

    return this.props.children
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
