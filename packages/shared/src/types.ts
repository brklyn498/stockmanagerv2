// Shared types between frontend and backend
export interface User {
  id: string
  email: string
  name: string
  role: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}
