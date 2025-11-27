import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import SearchModal from './SearchModal'
import { useKeyboardShortcuts, getDefaultShortcuts } from '../hooks/useKeyboardShortcuts'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const navigation = [
    { name: 'Dashboard', path: '/' },
    { name: 'Products', path: '/products' },
    { name: 'Categories', path: '/categories' },
    { name: 'Suppliers', path: '/suppliers' },
    { name: 'Clients', path: '/clients' },
    { name: 'Stock Movements', path: '/stock-movements' },
    { name: 'Orders', path: '/orders' },
  ]

  // Setup keyboard shortcuts
  const shortcuts = getDefaultShortcuts({
    onSearch: () => setIsSearchOpen(true),
    onNavigate: (path) => navigate(path),
  })

  useKeyboardShortcuts(shortcuts, true)

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen flex bg-yellow-100">
      {/* Global Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Sidebar */}
      <aside className="w-64 bg-white border-r-4 border-black p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold border-4 border-black bg-yellow-400 p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            📦 Stock Manager
          </h1>
        </div>

        {/* Search Button */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="w-full mb-4 px-4 py-3 font-bold border-4 border-black bg-white hover:bg-yellow-100 transition-all text-left flex items-center justify-between"
        >
          <span>🔍 Search</span>
          <span className="text-xs bg-gray-200 px-2 py-1 border-2 border-black">⌘K</span>
        </button>

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
          <div className="p-3 border-2 border-black bg-green-200">
            <p className="font-bold text-sm">Stock Manager v2</p>
            <p className="text-xs text-gray-700">No login required</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  )
}
