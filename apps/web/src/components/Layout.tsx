import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import SearchModal from './SearchModal'
import { useKeyboardShortcuts, getDefaultShortcuts } from '../hooks/useKeyboardShortcuts'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const navigation = [
    { name: 'Dashboard', path: '/' },
    { name: 'Products', path: '/products' },
    { name: 'Categories', path: '/categories' },
    { name: 'Suppliers', path: '/suppliers' },
    { name: 'Clients', path: '/clients' },
    { name: 'Stock Movements', path: '/stock-movements' },
    { name: 'Orders', path: '/orders' },
    { name: 'Reports', path: '/reports' },
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

      {/* Hamburger Menu Button (Mobile/Toggle) */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed top-4 left-4 z-50 p-3 bg-yellow-400 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 transition-all lg:hidden"
        aria-label="Toggle menu"
      >
        {isSidebarOpen ? <X size={24} strokeWidth={3} /> : <Menu size={24} strokeWidth={3} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 h-screen
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isSidebarOpen ? 'w-64' : 'w-64 lg:w-20'}
          bg-white border-r-4 border-black p-6
          transition-all duration-300 ease-in-out
          z-40 overflow-y-auto
        `}
      >
        <div className="mb-8">
          <div className="flex items-center gap-3 border-4 border-black bg-yellow-400 p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <img
              src="/pixel_logo.svg"
              alt="Stock Manager Logo"
              className={`${isSidebarOpen ? 'h-8 w-8' : 'h-8 w-8 lg:h-6 lg:w-6'} border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all`}
            />
            <h1
              className={`${isSidebarOpen ? 'block' : 'block lg:hidden'
                } text-xl font-bold transition-all`}
            >
              Stock Manager
            </h1>
          </div>
        </div>

        {/* Search Button */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className={`w-full mb-4 px-4 py-3 font-bold border-4 border-black bg-white hover:bg-yellow-100 transition-all text-left flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-between lg:justify-center'
            }`}
        >
          <span className={isSidebarOpen ? 'block' : 'block lg:hidden'}>🔍 Search</span>
          <span className={isSidebarOpen ? 'hidden' : 'hidden lg:block text-2xl'}>🔍</span>
          <span className={`${isSidebarOpen ? 'block' : 'hidden'} text-xs bg-gray-200 px-2 py-1 border-2 border-black`}>
            ⌘K
          </span>
        </button>

        {/* Dashboard Switcher */}
        <button
          onClick={() => {
            const isDashboard2 = location.pathname === '/dashboard2'
            navigate(isDashboard2 ? '/' : '/dashboard2')
          }}
          className={`w-full mb-6 px-4 py-3 font-bold border-4 border-black bg-cyan-300 hover:bg-cyan-400 transition-all text-left shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${isSidebarOpen ? 'block' : 'block lg:hidden'
            }`}
        >
          {location.pathname === '/dashboard2' ? '📊 Classic Dashboard' : '🎨 Alternative Dashboard'}
        </button>

        <nav className="space-y-2">
          {navigation.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`block px-4 py-3 font-bold border-4 border-black transition-all
                ${isActive(item.path)
                  ? 'bg-yellow-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                  : 'bg-white hover:bg-yellow-100 hover:translate-x-1'
                }
                ${isSidebarOpen ? 'text-left' : 'text-left lg:text-center'}
              `}
              title={!isSidebarOpen ? item.name : ''}
            >
              <span className={isSidebarOpen ? 'block' : 'block lg:hidden'}>{item.name}</span>
              <span className={isSidebarOpen ? 'hidden' : 'hidden lg:block'}>{item.name.charAt(0)}</span>
            </Link>
          ))}
        </nav>

        <div className={`mt-auto pt-8 border-t-4 border-black mt-8 ${isSidebarOpen ? 'block' : 'block lg:hidden'}`}>
          <div className="p-3 border-2 border-black bg-green-200">
            <p className="font-bold text-sm">Stock Manager v2</p>
            <p className="text-xs text-gray-700">No login required</p>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile when sidebar is open */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className={`flex-1 p-8 ${!isSidebarOpen ? 'lg:ml-0' : ''} transition-all`}>
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  )
}
