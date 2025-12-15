import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'
import type { User } from '../types'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    const initAuth = async () => {
      const token = api.getToken()
      if (token) {
        try {
          const currentUser = await api.getCurrentUser()
          setUser(currentUser)
        } catch (error) {
          console.error('Failed to get current user:', error)
          api.clearAuth()
        }
      }
      setLoading(false)
    }
    
    initAuth()
  }, [])

  // Phase 5.3.2: Broadcast auth events to extension
  const broadcastAuthBootstrap = (token: string, expiresAt: string, userId: number) => {
    console.log('[FW Web Auth] Broadcasting auth bootstrap to extension', { userId })
    
    window.postMessage({
      type: 'FW_AUTH_BOOTSTRAP',
      token,
      expires_at: expiresAt,
      user_id: userId,
      mode: 'replace'  // Always replace (clears any existing token)
    }, '*')
  }

  const broadcastAuthClear = (reason: string) => {
    console.log('[FW Web Auth] Broadcasting auth clear to extension', { reason })
    
    window.postMessage({
      type: 'FW_AUTH_CLEAR',
      reason
    }, '*')
  }

  // Phase A: Notify extension background script of auth state changes
  const notifyExtensionAuthChanged = (isAuthenticated: boolean) => {
    // Check if Chrome extension APIs are available
    if (typeof window !== 'undefined' && window.chrome?.runtime?.sendMessage) {
      console.log('[FW Web] Auth state changed →', isAuthenticated ? 'authenticated' : 'logged out')
      
      try {
        window.chrome.runtime.sendMessage({
          type: 'FW_AUTH_CHANGED',
          isAuthenticated
        })
      } catch (err) {
        // Extension might not be installed or listening - this is non-blocking
        console.warn('[FW Web] Failed to notify extension:', err)
      }
    }
  }

  const login = async (email: string, password: string) => {
    const authData = await api.login({ email, password })
    const currentUser = await api.getCurrentUser()
    setUser(currentUser)
    
    // Phase 5.3.2: Broadcast to extension (legacy token-based)
    broadcastAuthBootstrap(
      authData.access_token,
      authData.expires_at,
      authData.user_id
    )
    
    // Phase A: Notify extension background of auth change
    notifyExtensionAuthChanged(true)
  }

  const register = async (email: string, password: string) => {
    await api.register({ email, password })
    // Auto-login after registration
    await login(email, password)
  }

  const logout = () => {
    // Phase 5.3.2: Broadcast clear BEFORE calling backend
    broadcastAuthClear('logout')
    
    // Phase A: Notify extension background of auth change
    notifyExtensionAuthChanged(false)
    
    // Call backend logout to increment token_version
    api.logout().catch(err => {
      console.warn('Backend logout failed (non-blocking):', err)
    })
    
    // Clear frontend state
    api.clearAuth()
    setUser(null)
    
    console.log('[FW Web Auth] Logout complete')
    window.location.href = '/login'
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user
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

