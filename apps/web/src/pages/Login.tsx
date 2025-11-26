import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import Button from '../components/Button'
import Input from '../components/Input'
import Card from '../components/Card'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login, isLoading } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      await login(email, password)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen bg-yellow-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-2 inline-block border-4 border-black bg-yellow-400 px-6 py-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            📦 Stock Manager
          </h1>
          <p className="mt-6 text-xl font-bold">Welcome back!</p>
        </div>

        <Card>
          <h2 className="text-2xl font-bold mb-6">Login</h2>

          {error && (
            <div className="mb-4 p-4 bg-red-400 border-4 border-black font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@stockmanager.com"
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Button type="submit" disabled={isLoading} className="w-full mt-6">
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="font-medium">
              Don't have an account?{' '}
              <Link to="/register" className="font-bold underline">
                Register here
              </Link>
            </p>
          </div>
        </Card>

        <div className="mt-6 p-4 bg-cyan-400 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="font-bold text-sm">Test Account:</p>
          <p className="text-sm">Email: admin@stockmanager.com</p>
          <p className="text-sm">Password: admin123</p>
        </div>
      </div>
    </div>
  )
}
