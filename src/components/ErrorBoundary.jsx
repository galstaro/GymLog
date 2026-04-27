import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('=== GymLog Error ===')
    console.error('Message:', error.message)
    console.error('Stack:', error.stack)
    console.error('Component stack:', info?.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          height: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: '#0a0a0a', padding: 24,
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
          <p style={{ color: '#ef4444', fontWeight: 600, margin: '0 0 8px', fontSize: 16 }}>
            Something went wrong
          </p>
          <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 20px', textAlign: 'center', maxWidth: 280 }}>
            {this.state.error.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: '12px 24px', background: '#22c55e', color: '#000', borderRadius: 12, fontWeight: 600, border: 'none', cursor: 'pointer' }}
          >
            Reload app
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
