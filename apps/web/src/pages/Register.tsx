import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import Button from '../components/Button'
import Input from '../components/Input'
import Card from '../components/Card'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { register, isLoading } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    try {
      await register(email, password, name)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed')
    }
  }

  return (
    <div className="min-h-screen bg-yellow-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-2 inline-block border-4 border-black bg-yellow-400 px-6 py-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            📦 Stock Manager
          </h1>
          <p className="mt-6 text-xl font-bold">Create your account</p>
        </div>

        <Card>
          <h2 className="text-2xl font-bold mb-6">Register</h2>

          {error && (
            <div className="mb-4 p-4 bg-red-400 border-4 border-black font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="John Doe"
              required
            />

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="john@example.com"
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
              {isLoading ? 'Creating account...' : 'Register'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="font-medium">
              Already have an account?{' '}
              <Link to="/login" className="font-bold underline">
                Login here
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
