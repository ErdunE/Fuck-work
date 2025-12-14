import axios, { AxiosInstance } from 'axios'
import type { 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  User,
  Profile,
  AutomationPreferences,
  ApplyTask,
  AutomationEvent
} from '../types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

class APIService {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Add auth token to requests
    this.client.interceptors.request.use((config) => {
      const token = this.getToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })

    // Handle auth errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.clearAuth()
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  // Auth methods
  getToken(): string | null {
    return localStorage.getItem('fw_jwt_token')
  }

  setToken(token: string): void {
    localStorage.setItem('fw_jwt_token', token)
  }

  clearAuth(): void {
    localStorage.removeItem('fw_jwt_token')
  }

  async register(data: RegisterRequest): Promise<{ user_id: number; email: string; message: string }> {
    const response = await this.client.post('/api/auth/register', data)
    return response.data
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.client.post('/api/auth/login', data)
    const authData = response.data
    this.setToken(authData.access_token)
    return authData
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.client.get('/api/auth/me')
    return response.data
  }

  // Profile methods
  async getProfile(): Promise<Profile> {
    const response = await this.client.get('/api/users/me/profile')
    return response.data
  }

  async updateProfile(data: Partial<Profile>): Promise<{ id: number; updated_at: string; message: string }> {
    const response = await this.client.put('/api/users/me/profile', data)
    return response.data
  }

  // Automation Preferences methods
  async getAutomationPreferences(): Promise<AutomationPreferences> {
    const response = await this.client.get('/api/users/me/automation-preferences')
    return response.data
  }

  async updateAutomationPreferences(data: Partial<AutomationPreferences>): Promise<{ id: number; updated_at: string; message: string }> {
    const response = await this.client.put('/api/users/me/automation-preferences', data)
    return response.data
  }

  // Apply Tasks methods
  async getApplyTasks(status?: string, limit = 50, offset = 0): Promise<{ tasks: ApplyTask[]; total: number; limit: number; offset: number }> {
    const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() })
    if (status) params.append('status', status)
    const response = await this.client.get(`/api/users/me/apply-tasks?${params}`)
    return response.data
  }

  // Automation Events methods
  async getAutomationEvents(filters?: { task_id?: number; session_id?: string; event_type?: string }, limit = 100, offset = 0): Promise<{ events: AutomationEvent[]; total: number; limit: number; offset: number }> {
    const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() })
    if (filters?.task_id) params.append('task_id', filters.task_id.toString())
    if (filters?.session_id) params.append('session_id', filters.session_id)
    if (filters?.event_type) params.append('event_type', filters.event_type)
    const response = await this.client.get(`/api/users/me/automation-events?${params}`)
    return response.data
  }
}

export default new APIService()

