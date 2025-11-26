import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import Button from './Button'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const navigation = [
    { name: 'Dashboard', path: '/' },
    { name: 'Products', path: '/products' },
    { name: 'Categories', path: '/categories' },
    { name: 'Suppliers', path: '/suppliers' },
    { name: 'Stock Movements', path: '/stock-movements' },
    { name: 'Orders', path: '/orders' },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen flex bg-yellow-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r-4 border-black p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold border-4 border-black bg-yellow-400 p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            📦 Stock Manager
          </h1>
        </div>

        <nav className="space-y-2">
          {navigation.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`block px-4 py-3 font-bold border-4 border-black transition-all
                ${
                  isActive(item.path)
                    ? 'bg-yellow-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                    : 'bg-white hover:bg-yellow-100 hover:translate-x-1'
                }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-8 border-t-4 border-black mt-8">
          <div className="mb-4 p-3 border-2 border-black bg-white">
            <p className="font-bold text-sm">Logged in as:</p>
            <p className="text-sm">{user?.name}</p>
            <p className="text-xs text-gray-600">{user?.role}</p>
          </div>
          <Button variant="danger" onClick={logout} className="w-full">
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  )
}
