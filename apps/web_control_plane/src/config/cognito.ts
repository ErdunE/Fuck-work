// Cognito Configuration
export const cognitoConfig = {
  region: 'us-east-1',
  userPoolId: 'us-east-1_WYlLzbaux',
  clientId: '3cafqu6vn90p9s0qnqn7i1puf0',
  domain: 'fuckwork-dev.auth.us-east-1.amazoncognito.com',
  
  // Dynamic redirect URLs based on current origin
  get redirectSignIn() {
    return typeof window !== 'undefined' 
      ? `${window.location.origin}/callback`
      : 'http://localhost:3000/callback'
  },
  get redirectSignOut() {
    return typeof window !== 'undefined'
      ? `${window.location.origin}/login`
      : 'http://localhost:3000/login'
  },
  
  responseType: 'code',
  scope: ['email', 'openid', 'profile'],
}

// Build Cognito Hosted UI URLs
export function getLoginUrl(): string {
  const params = new URLSearchParams({
    client_id: cognitoConfig.clientId,
    response_type: cognitoConfig.responseType,
    scope: cognitoConfig.scope.join(' '),
    redirect_uri: cognitoConfig.redirectSignIn,
  })
  return `https://${cognitoConfig.domain}/login?${params.toString()}`
}

export function getSignupUrl(): string {
  const params = new URLSearchParams({
    client_id: cognitoConfig.clientId,
    response_type: cognitoConfig.responseType,
    scope: cognitoConfig.scope.join(' '),
    redirect_uri: cognitoConfig.redirectSignIn,
  })
  return `https://${cognitoConfig.domain}/signup?${params.toString()}`
}

export function getLogoutUrl(): string {
  const params = new URLSearchParams({
    client_id: cognitoConfig.clientId,
    logout_uri: cognitoConfig.redirectSignOut,
  })
  return `https://${cognitoConfig.domain}/logout?${params.toString()}`
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(code: string): Promise<{
  id_token: string
  access_token: string
  refresh_token: string
  expires_in: number
}> {
  const tokenEndpoint = `https://${cognitoConfig.domain}/oauth2/token`
  
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: cognitoConfig.clientId,
    code: code,
    redirect_uri: cognitoConfig.redirectSignIn,
  })

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('[Cognito] Token exchange failed:', error)
    throw new Error(`Token exchange failed: ${error}`)
  }

  return response.json()
}

// Refresh tokens
export async function refreshTokens(refreshToken: string): Promise<{
  id_token: string
  access_token: string
  expires_in: number
}> {
  const tokenEndpoint = `https://${cognitoConfig.domain}/oauth2/token`
  
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: cognitoConfig.clientId,
    refresh_token: refreshToken,
  })

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  if (!response.ok) {
    throw new Error('Token refresh failed')
  }

  return response.json()
}

// Parse JWT token (for extracting user info)
export function parseJwt(token: string): Record<string, unknown> {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch {
    return {}
  }
}
