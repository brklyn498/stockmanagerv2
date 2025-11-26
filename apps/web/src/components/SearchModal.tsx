import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../services/api'
import Badge from './Badge'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

interface SearchResult {
  type: 'product' | 'order' | 'supplier' | 'category'
  id: string
  title: string
  subtitle: string
  badge?: string
  path: string
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  // Search across all entities
  const { data: results = [], isLoading } = useQuery({
    queryKey: ['global-search', query],
    queryFn: async () => {
      if (query.length < 2) return []

      const searchResults: SearchResult[] = []

      try {
        // Search products
        const productsRes = await api.get(`/products?search=${query}&limit=5`)
        const products = productsRes.data.products || []
        products.forEach((p: any) => {
          searchResults.push({
            type: 'product',
            id: p.id,
            title: p.name,
            subtitle: `SKU: ${p.sku} • ${p.category?.name || 'No category'}`,
            badge: p.quantity <= p.minStock ? 'Low Stock' : undefined,
            path: `/products`,
          })
        })

        // Search orders
        const ordersRes = await api.get(`/orders?search=${query}&limit=5`)
        const orders = ordersRes.data.orders || []
        orders.forEach((o: any) => {
          searchResults.push({
            type: 'order',
            id: o.id,
            title: o.orderNumber,
            subtitle: `${o.type} • ${o.supplier?.name || 'No supplier'}`,
            badge: o.status,
            path: `/orders`,
          })
        })

        // Search suppliers
        const suppliersRes = await api.get(`/suppliers`)
        const suppliers = suppliersRes.data.filter((s: any) =>
          s.name.toLowerCase().includes(query.toLowerCase())
        )
        suppliers.slice(0, 3).forEach((s: any) => {
          searchResults.push({
            type: 'supplier',
            id: s.id,
            title: s.name,
            subtitle: s.email || s.phone || 'No contact info',
            path: `/suppliers`,
          })
        })

        // Search categories
        const categoriesRes = await api.get(`/categories`)
        const categories = categoriesRes.data.filter((c: any) =>
          c.name.toLowerCase().includes(query.toLowerCase())
        )
        categories.slice(0, 3).forEach((c: any) => {
          searchResults.push({
            type: 'category',
            id: c.id,
            title: c.name,
            subtitle: c.description || 'No description',
            path: `/categories`,
          })
        })

        return searchResults
      } catch (error) {
        console.error('Search error:', error)
        return []
      }
    },
    enabled: query.length >= 2 && isOpen,
  })

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter' && results.length > 0) {
        e.preventDefault()
        handleSelect(results[selectedIndex])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, results, selectedIndex])

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [results])

  const handleSelect = (result: SearchResult) => {
    navigate(result.path)
    onClose()
  }

  const getTypeIcon = (type: string) => {
    const icons = {
      product: '📦',
      order: '📋',
      supplier: '🏢',
      category: '📁',
    }
    return icons[type as keyof typeof icons] || '📄'
  }

  const getTypeBadge = (type: string) => {
    const variants: Record<string, any> = {
      product: 'success',
      order: 'info',
      supplier: 'warning',
      category: 'info',
    }
    return (
      <Badge variant={variants[type]}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    )
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-[10%] left-1/2 -translate-x-1/2 w-full max-w-2xl z-50">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mx-4">
          {/* Search Input */}
          <div className="p-4 border-b-4 border-black">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products, orders, suppliers, categories..."
              className="w-full text-lg font-bold px-4 py-3 border-4 border-black focus:outline-none focus:ring-4 focus:ring-yellow-400"
            />
          </div>

          {/* Search Results */}
          <div className="max-h-[60vh] overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center">
                <p className="font-bold text-gray-600">Searching...</p>
              </div>
            ) : query.length < 2 ? (
              <div className="p-8 text-center">
                <p className="font-bold text-gray-600 mb-2">
                  Type to start searching
                </p>
                <p className="text-sm text-gray-500 font-medium">
                  Search across products, orders, suppliers, and categories
                </p>
              </div>
            ) : results.length === 0 ? (
              <div className="p-8 text-center">
                <p className="font-bold text-gray-600">No results found</p>
                <p className="text-sm text-gray-500 font-medium mt-1">
                  Try a different search term
                </p>
              </div>
            ) : (
              <div>
                {results.map((result, index) => (
                  <div
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSelect(result)}
                    className={`p-4 border-b-2 border-black cursor-pointer transition-all ${
                      index === selectedIndex
                        ? 'bg-yellow-400 translate-x-1 translate-y-1'
                        : 'bg-white hover:bg-yellow-100'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{getTypeIcon(result.type)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg truncate">
                            {result.title}
                          </h3>
                          {getTypeBadge(result.type)}
                          {result.badge && (
                            <Badge variant="danger">{result.badge}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 font-medium truncate">
                          {result.subtitle}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-gray-100 border-t-4 border-black">
            <div className="flex items-center justify-between text-sm font-bold text-gray-600">
              <div className="flex gap-4">
                <span>↑↓ Navigate</span>
                <span>↵ Select</span>
                <span>ESC Close</span>
              </div>
              {results.length > 0 && (
                <span>{results.length} results</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
