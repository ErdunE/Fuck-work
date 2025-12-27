import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { exchangeCodeForTokens, getLoginUrl } from '../config/cognito'

export default function Callback() {
  const [searchParams] = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const processedRef = useRef(false)

  useEffect(() => {
    if (processedRef.current) return
    
    const handleCallback = async () => {
      const code = searchParams.get('code')
      const errorParam = searchParams.get('error')
      const errorDescription = searchParams.get('error_description')

      // Check if already authenticated with valid token
      const existingToken = localStorage.getItem('fw_id_token')
      const expiresAt = localStorage.getItem('fw_token_expires_at')
      
      if (existingToken && expiresAt && Date.now() < parseInt(expiresAt)) {
        console.log('[Callback] Already have valid token, redirecting to home')
        // Use window.location for full page reload to ensure AuthContext re-initializes
        window.location.href = '/'
        return
      }

      if (errorParam) {
        console.error('[Callback] OAuth error:', errorParam, errorDescription)
        setError(errorDescription || errorParam)
        return
      }

      if (!code) {
        console.error('[Callback] No authorization code received')
        window.location.href = '/login'
        return
      }

      processedRef.current = true

      try {
        console.log('[Callback] Exchanging code for tokens...')
        const tokens = await exchangeCodeForTokens(code)
        
        // Store tokens
        localStorage.setItem('fw_id_token', tokens.id_token)
        localStorage.setItem('fw_access_token', tokens.access_token)
        localStorage.setItem('fw_refresh_token', tokens.refresh_token)
        
        const expiresAt = Date.now() + tokens.expires_in * 1000
        localStorage.setItem('fw_token_expires_at', expiresAt.toString())
        
        console.log('[Callback] Tokens stored successfully, redirecting...')
        
        // Use window.location.href for FULL PAGE RELOAD
        // This ensures AuthContext re-initializes with the new tokens
        window.location.href = '/'
      } catch (err) {
        console.error('[Callback] Token exchange failed:', err)
        
        // Clear any stale tokens
        localStorage.removeItem('fw_id_token')
        localStorage.removeItem('fw_access_token')
        localStorage.removeItem('fw_refresh_token')
        localStorage.removeItem('fw_token_expires_at')
        
        // Redirect back to Cognito login with fresh session
        console.log('[Callback] Redirecting to fresh login...')
        window.location.href = getLoginUrl()
      }
    }

    handleCallback()
  }, [searchParams])

  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center'
      }}>
        <div className="card" style={{ maxWidth: '400px', textAlign: 'center' }}>
          <h2 style={{ color: '#ef4444' }}>Login Failed</h2>
          <p>{error}</p>
          <button 
            className="btn btn-primary" 
            onClick={() => window.location.href = '/login'}
            style={{ marginTop: '20px' }}
          >
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      <div className="card" style={{ textAlign: 'center' }}>
        <h2>Completing login...</h2>
        <p>Please wait while we verify your credentials.</p>
      </div>
    </div>
  )
}
