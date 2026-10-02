import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { Analytics } from "@vercel/analytics/react"

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught application error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', backgroundColor: '#030914', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'sans-serif' }}>
          <div style={{ maxWidth: '500px', textAlign: 'center', background: '#0b243b', border: '1px solid #1e3a5f', padding: '30px', borderRadius: '16px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#38bdf8', marginBottom: '10px' }}>Investraders Platform</h1>
            <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '20px' }}>An unexpected error occurred while loading this view. Click below to reload.</p>
            <button
              onClick={() => { this.setState({ hasError: false }); window.location.href = '/'; }}
              style={{ backgroundColor: '#1769FF', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
      <Analytics />
    </ErrorBoundary>
  </React.StrictMode>
)
