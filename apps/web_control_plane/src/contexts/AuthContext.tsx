import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'
import { getLoginUrl, getLogoutUrl, refreshTokens } from '../config/cognito'
import type { User } from '../types'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: () => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Token storage keys
const TOKEN_KEYS = {
  idToken: 'fw_id_token',
  accessToken: 'fw_access_token',
  refreshToken: 'fw_refresh_token',
  expiresAt: 'fw_token_expires_at',
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Get stored tokens
  const getStoredTokens = useCallback(() => {
    return {
      idToken: localStorage.getItem(TOKEN_KEYS.idToken),
      accessToken: localStorage.getItem(TOKEN_KEYS.accessToken),
      refreshToken: localStorage.getItem(TOKEN_KEYS.refreshToken),
      expiresAt: localStorage.getItem(TOKEN_KEYS.expiresAt),
    }
  }, [])

  // Check if tokens are expired
  const isTokenExpired = useCallback((): boolean => {
    const expiresAt = localStorage.getItem(TOKEN_KEYS.expiresAt)
    if (!expiresAt) return true
    return Date.now() > parseInt(expiresAt) - 5 * 60 * 1000
  }, [])

  // Clear all stored tokens
  const clearTokens = useCallback(() => {
    Object.values(TOKEN_KEYS).forEach(key => localStorage.removeItem(key))
  }, [])

  // Try to refresh tokens
  const tryRefreshTokens = useCallback(async (): Promise<boolean> => {
    const { refreshToken } = getStoredTokens()
    if (!refreshToken) return false

    try {
      console.log('[Auth] Refreshing tokens...')
      const tokens = await refreshTokens(refreshToken)
      
      localStorage.setItem(TOKEN_KEYS.idToken, tokens.id_token)
      localStorage.setItem(TOKEN_KEYS.accessToken, tokens.access_token)
      
      const expiresAt = Date.now() + tokens.expires_in * 1000
      localStorage.setItem(TOKEN_KEYS.expiresAt, expiresAt.toString())
      
      console.log('[Auth] Tokens refreshed successfully')
      return true
    } catch (err) {
      console.error('[Auth] Token refresh failed:', err)
      return false
    }
  }, [getStoredTokens])

  // Fetch extension token from backend
  const fetchExtensionToken = useCallback(async (): Promise<string | null> => {
    try {
      const response = await api.client.post('/api/auth/extension-token')
      console.log('[Auth] Extension token fetched successfully')
      return response.data.token
    } catch (err) {
      console.error('[Auth] Extension token fetch error:', err)
      return null
    }
  }, [])

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const { idToken } = getStoredTokens()
      
      if (!idToken) {
        console.log('[Auth] No token found')
        setLoading(false)
        return
      }

      // Check if token is expired
      if (isTokenExpired()) {
        console.log('[Auth] Token expired, trying to refresh...')
        const refreshed = await tryRefreshTokens()
        if (!refreshed) {
          console.log('[Auth] Refresh failed, clearing tokens')
          clearTokens()
          setLoading(false)
          return
        }
      }

      // Verify token with backend and get user info
      try {
        const currentUser = await api.getCurrentUser()
        setUser(currentUser)
        console.log('[Auth] User authenticated:', currentUser.email)
        
        // Broadcast extension token
        const extToken = await fetchExtensionToken()
        if (extToken) {
          window.postMessage({ type: 'FW_EXTENSION_TOKEN', token: extToken }, '*')
          console.log('[Auth] Extension token broadcasted')
        }
      } catch (error) {
        console.error('[Auth] Failed to verify token:', error)
        clearTokens()
      }
      
      setLoading(false)
    }

    initAuth()
  }, [getStoredTokens, isTokenExpired, tryRefreshTokens, clearTokens, fetchExtensionToken])

  // Login - redirect to Cognito Hosted UI
  const login = useCallback(() => {
    console.log('[Auth] Redirecting to Cognito login...')
    window.location.href = getLoginUrl()
  }, [])

  // Logout - clear local tokens AND Cognito session
  const logout = useCallback(() => {
    console.log('[Auth] Logging out...')
    
    // Notify extension
    window.postMessage({ type: 'FW_EXTENSION_LOGOUT' }, '*')
    
    // Call backend logout (non-blocking)
    api.logout().catch(err => {
      console.warn('[Auth] Backend logout failed (non-blocking):', err)
    })
    
    // Clear local tokens FIRST
    clearTokens()
    setUser(null)
    
    // Then redirect to Cognito logout to clear Cognito session
    // This will redirect back to /login after Cognito clears the session
    window.location.href = getLogoutUrl()
  }, [clearTokens])

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
