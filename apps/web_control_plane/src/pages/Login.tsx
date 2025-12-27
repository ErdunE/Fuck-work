import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getLoginUrl, getSignupUrl } from '../config/cognito'

export default function Login() {
  const { isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // If already authenticated, redirect to home
    if (!loading && isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, loading, navigate])

  const handleLogin = () => {
    window.location.href = getLoginUrl()
  }

  const handleSignup = () => {
    window.location.href = getSignupUrl()
  }

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div className="card" style={{ 
        maxWidth: '400px', 
        width: '100%',
        textAlign: 'center',
        padding: '40px'
      }}>
        <h1 style={{ marginBottom: '10px', fontSize: '2rem' }}>🚀 FuckWork</h1>
        <p style={{ marginBottom: '30px', color: '#666' }}>
          Automate your job applications
        </p>
        
        <button 
          onClick={handleLogin}
          className="btn btn-primary" 
          style={{ 
            width: '100%', 
            marginBottom: '15px',
            padding: '12px',
            fontSize: '1rem'
          }}
        >
          Log In
        </button>
        
        <button 
          onClick={handleSignup}
          className="btn" 
          style={{ 
            width: '100%',
            padding: '12px',
            fontSize: '1rem',
            background: '#f3f4f6',
            border: '1px solid #d1d5db',
            color: '#374151'
          }}
        >
          Create Account
        </button>
        
        <p style={{ 
          marginTop: '30px', 
          fontSize: '0.85rem', 
          color: '#999' 
        }}>
          Secure authentication powered by AWS Cognito
        </p>
      </div>
    </div>
  )
}
