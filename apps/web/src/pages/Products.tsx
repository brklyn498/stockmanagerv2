import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import Button from '../components/Button'
import Input from '../components/Input'
import Select from '../components/Select'
import Badge from '../components/Badge'
import Card from '../components/Card'
import Modal from '../components/Modal'
import BulkEditModal from '../components/BulkEditModal'
import FilterPanel, { FilterState } from '../components/FilterPanel'
import ImageUpload from '../components/ImageUpload'
import ProductsGrid from '../components/ProductsGrid'
import QuickStockAdjust from '../components/QuickStockAdjust'
import StockStatusBadge from '../components/StockStatusBadge'
import ColumnConfigModal, { ColumnConfig, DEFAULT_COLUMNS } from '../components/ColumnConfigModal'
import { Settings } from 'lucide-react'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../components/Table'
import { exportToCSV, exportToExcel, formatProductsForExport, PRODUCT_EXPORT_COLUMNS } from '../utils/export'
import ExportMenu, { ExportOptions } from '../components/ExportMenu'

interface Product {
  id: string
  sku: string
  name: string
  description?: string
  barcode?: string
  price: number
  costPrice: number
  quantity: number
  minStock: number
  maxStock?: number
  unit: string
  isActive: boolean
  imageUrl?: string
  images: {
    id: string
    url: string;
    isPrimary: boolean
  }[]
  category: {
    id: string
    name: string
  }
  supplier?: {
    id: string
    name: string
  }
}

interface Category {
  id: string
  name: string
}

interface Supplier {
  id: string
  name: string
}

export default function Products() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [page, setPage] = useState(1)
  const limit = 10

  // View mode state
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'compact'>(() => {
    return (localStorage.getItem('productsViewMode') as any) || 'table'
  })

  const handleViewModeChange = (mode: 'table' | 'cards' | 'compact') => {
    setViewMode(mode)
    localStorage.setItem('productsViewMode', mode)
  }

  // Column Configuration
  const [columnConfig, setColumnConfig] = useState<ColumnConfig[]>(() => {
    const saved = localStorage.getItem('productsColumnConfig')
    return saved ? JSON.parse(saved) : DEFAULT_COLUMNS
  })
  const [isColumnConfigOpen, setIsColumnConfigOpen] = useState(false)

  const handleSaveColumnConfig = (config: ColumnConfig[]) => {
    setColumnConfig(config)
    localStorage.setItem('productsColumnConfig', JSON.stringify(config))
  }

  // Filter state (initialized from URL)
  const [filters, setFilters] = useState<FilterState>({
    search: searchParams.get('search') || '',
    categories: searchParams.get('categories')?.split(',').filter(Boolean) || [],
    suppliers: searchParams.get('suppliers')?.split(',').filter(Boolean) || [],
    stockStatus: searchParams.get('stockStatus') || 'all',
    priceMin: searchParams.get('priceMin') || '',
    priceMax: searchParams.get('priceMax') || '',
    isActive: searchParams.get('isActive') || 'all',
    dateFrom: searchParams.get('dateFrom') || '',
    dateTo: searchParams.get('dateTo') || '',
  })

  // Saved filters in localStorage
  const [savedFilters, setSavedFilters] = useState<Array<{ name: string; filters: FilterState }>>(() => {
    const saved = localStorage.getItem('productFilters')
    return saved ? JSON.parse(saved) : []
  })

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams()

    if (filters.search) params.set('search', filters.search)
    if (filters.categories.length > 0) params.set('categories', filters.categories.join(','))
    if (filters.suppliers.length > 0) params.set('suppliers', filters.suppliers.join(','))
    if (filters.stockStatus !== 'all') params.set('stockStatus', filters.stockStatus)
    if (filters.priceMin) params.set('priceMin', filters.priceMin)
    if (filters.priceMax) params.set('priceMax', filters.priceMax)
    if (filters.isActive !== 'all') params.set('isActive', filters.isActive)
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
    if (filters.dateTo) params.set('dateTo', filters.dateTo)
    if (page > 1) params.set('page', page.toString())

    setSearchParams(params, { replace: true })
  }, [filters, page, setSearchParams])

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [bulkActionType, setBulkActionType] = useState<
    'category' | 'supplier' | 'prices' | 'stock' | 'activate' | 'deactivate' | 'delete'
  >('category')

  // Export state
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // Image Upload State
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [productImages, setProductImages] = useState<any[]>([])

  // Form state
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    barcode: '',
    price: '',
    costPrice: '',
    quantity: '',
    minStock: '',
    maxStock: '',
    unit: 'piece',
    categoryId: '',
    supplierId: '',
    isActive: true,
  })

  // Fetch products
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products', page, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })

      if (filters.search) params.set('search', filters.search)
      if (filters.categories.length > 0) params.set('categories', filters.categories.join(','))
      if (filters.suppliers.length > 0) params.set('suppliers', filters.suppliers.join(','))
      if (filters.stockStatus !== 'all') params.set('stockStatus', filters.stockStatus)
      if (filters.priceMin) params.set('priceMin', filters.priceMin)
      if (filters.priceMax) params.set('priceMax', filters.priceMax)
      if (filters.isActive !== 'all') params.set('isActive', filters.isActive)
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
      if (filters.dateTo) params.set('dateTo', filters.dateTo)

      const { data } = await api.get(`/products?${params}`)
      return data
    },
  })

  const products = productsData?.products || []
  const totalPages = Math.ceil((productsData?.total || 0) / limit)

  // Quick Stock Adjust State
  const [quickStockProduct, setQuickStockProduct] = useState<Product | null>(null)
  const [isQuickStockModalOpen, setIsQuickStockModalOpen] = useState(false)

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return
      }

      // Only work if a single product is selected or we have a focused product (future)
      // For now, we'll just implement global shortcuts if needed, but the spec says "on product detail page"
      // or "when product row is focused/selected".
      // Since we don't have row focus state yet, we'll skip global shortcuts for specific products
      // unless we implement selection-based actions.

      // However, let's implement the shortcuts if we have exactly one product selected
      if (selectedIds.size === 1) {
        const productId = Array.from(selectedIds)[0]
        const product = products.find((p: Product) => p.id === productId)

        if (product) {
          switch (e.key) {
            case '+':
              e.preventDefault()
              handleQuickStock(product)
              break
            case '-':
              e.preventDefault()
              handleQuickStock(product) // Modal handles type
              break
            case 'd':
              e.preventDefault()
              handleDuplicate(product)
              break
            case 'l':
              e.preventDefault()
              alert(`Printing label for ${product.sku}...`)
              break
            case 'h':
              e.preventDefault()
              // Navigate to history tab (future)
              alert('History tab not implemented yet')
              break
            case 'o':
              e.preventDefault()
              // Create order (future)
              alert('Create order not implemented yet')
              break
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedIds, products])

  // Handle URL edit action
  useEffect(() => {
    const editId = searchParams.get('edit')
    if (editId && productsData?.products) {
      const productToEdit = productsData.products.find((p: Product) => p.id === editId)
      if (productToEdit) {
        handleOpenModal(productToEdit)
        // Clear param after opening
        setSearchParams({})
      }
    }
  }, [searchParams, productsData])

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get('/categories')
      return data
    },
  })
  const categories = categoriesData?.categories || []

  // Fetch suppliers
  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data } = await api.get('/suppliers')
      return data
    },
  })
  const suppliers = suppliersData?.suppliers || []

  // Create product mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post('/products', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setIsModalOpen(false)
      resetForm()
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 'Failed to create product'
      alert(errorMessage)
    },
  })

  // Update product mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return api.put(`/products/${id}`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setIsModalOpen(false)
      setEditingProduct(null)
      resetForm()
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 'Failed to update product'
      alert(errorMessage)
    },
  })

  // Image mutations
  const uploadImagesMutation = useMutation({
    mutationFn: async ({ id, files }: { id: string; files: File[] }) => {
      const formData = new FormData()
      files.forEach((file) => formData.append('images', file))
      return api.post(`/products/${id}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      // Update local state to show new images
      setProductImages((prev) => [...prev, ...data.data.images])
      setUploadedFiles([])
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Failed to upload images')
    },
  })

  const deleteImageMutation = useMutation({
    mutationFn: async ({ id, imageId }: { id: string; imageId: string }) => {
      return api.delete(`/products/${id}/images/${imageId}`)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setProductImages((prev) => prev.filter((img) => img.id !== variables.imageId))
    },
  })

  const setPrimaryImageMutation = useMutation({
    mutationFn: async ({ id, imageId }: { id: string; imageId: string }) => {
      return api.put(`/products/${id}/images/${imageId}/primary`)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setProductImages((prev) =>
        prev.map((img) => ({
          ...img,
          isPrimary: img.id === variables.imageId,
        }))
      )
    },
  })

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/products/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })

  const resetForm = () => {
    setFormData({
      sku: '',
      name: '',
      description: '',
      barcode: '',
      price: '',
      costPrice: '',
      quantity: '',
      minStock: '',
      maxStock: '',
      unit: 'piece',
      categoryId: '',
      supplierId: '',
      isActive: true,
    })
    setUploadedFiles([])
    setProductImages([])
  }

  const handleQuickStock = (product: Product) => {
    setQuickStockProduct(product)
    setIsQuickStockModalOpen(true)
  }

  const handleDuplicate = (product: Product) => {
    const newProduct = {
      ...product,
      sku: `${product.sku}-COPY`,
      name: `${product.name} (Copy)`,
      images: [], // Don't copy images for now as they are linked to specific IDs
      imageUrl: undefined
    }
    handleOpenModal(newProduct)
  }

  const quickStockMutation = useMutation({
    mutationFn: async (data: { productIds: string[]; type: string; quantity: number; reason: string; notes: string }) => {
      // We'll use the bulk endpoint as it supports what we need
      return api.put('/products/bulk/stock', {
        ...data,
        userId: 'system' // In a real app, get from auth context
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setIsQuickStockModalOpen(false)
      setQuickStockProduct(null)
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Failed to adjust stock')
    }
  })

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      setProductImages(product.images || [])
      setFormData({
        sku: product.sku,
        name: product.name,
        description: product.description || '',
        barcode: product.barcode || '',
        price: product.price.toString(),
        costPrice: product.costPrice.toString(),
        quantity: product.quantity.toString(),
        minStock: product.minStock.toString(),
        maxStock: product.maxStock?.toString() || '',
        unit: product.unit,
        categoryId: product.category.id,
        supplierId: product.supplier?.id || '',
        isActive: product.isActive,
      })
    } else {
      setEditingProduct(null)
      resetForm()
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingProduct(null)
    resetForm()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const payload = {
      sku: formData.sku,
      name: formData.name,
      description: formData.description || undefined,
      price: parseFloat(formData.price),
      costPrice: parseFloat(formData.costPrice),
      quantity: parseInt(formData.quantity),
      minStock: parseInt(formData.minStock),
      maxStock: formData.maxStock ? parseInt(formData.maxStock) : undefined,
      unit: formData.unit,
      categoryId: formData.categoryId,
      supplierId: formData.supplierId || undefined,
      isActive: formData.isActive,
    }

    if (editingProduct) {
      // For updates, we just update the product data
      // Images are handled separately via the ImageUpload component
      updateMutation.mutate({ id: editingProduct.id, data: payload })

      // If there are pending files, upload them
      if (uploadedFiles.length > 0) {
        setIsUploading(true)
        uploadImagesMutation.mutate(
          { id: editingProduct.id, files: uploadedFiles },
          {
            onSettled: () => setIsUploading(false),
          }
        )
      }
    } else {
      // For creates, we create the product first, then upload images if any
      createMutation.mutate(payload, {
        onSuccess: (response) => {
          const newProductId = response.data.id
          if (uploadedFiles.length > 0) {
            setIsUploading(true)
            uploadImagesMutation.mutate(
              { id: newProductId, files: uploadedFiles },
              {
                onSettled: () => setIsUploading(false),
              }
            )
          }
        },
      })
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteMutation.mutate(id)
    }
  }

  // Bulk operations mutations
  const bulkOperationMutation = useMutation({
    mutationFn: async ({ action, data }: { action: string; data: any }) => {
      const productIds = Array.from(selectedIds)

      switch (action) {
        case 'category':
          return api.put('/products/bulk/category', { productIds, ...data })
        case 'supplier':
          return api.put('/products/bulk/supplier', { productIds, ...data })
        case 'prices':
          return api.put('/products/bulk/prices', { productIds, ...data })
        case 'stock':
          return api.put('/products/bulk/stock', { productIds, ...data, userId: 'system' })
        case 'activate':
          return api.put('/products/bulk/status', { productIds, isActive: true })
        case 'deactivate':
          return api.put('/products/bulk/status', { productIds, isActive: false })
        case 'status':
          return api.put('/products/bulk/status', { productIds, ...data })
        case 'delete':
          return api.delete('/products/bulk', { data: { productIds } })
        default:
          throw new Error('Invalid bulk action')
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setSelectedIds(new Set())
      setIsBulkModalOpen(false)
      alert(`Bulk ${variables.action} completed successfully`)
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Bulk operation failed')
    },
  })

  const handleBulkAction = (action: typeof bulkActionType) => {
    if (selectedIds.size === 0) {
      alert('Please select at least one product')
      return
    }

    setBulkActionType(action)
    setIsBulkModalOpen(true)
  }

  const handleBulkConfirm = (data: any) => {
    bulkOperationMutation.mutate({ action: bulkActionType, data })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newSet = new Set<string>(products.map((p: Product) => p.id))
      setSelectedIds(newSet)
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds)
    if (checked) {
      newSet.add(id)
    } else {
      newSet.delete(id)
    }
    setSelectedIds(newSet)
  }

  const handleExport = async (options: ExportOptions) => {
    setIsExporting(true)
    try {
      let dataToExport = []

      if (options.scope === 'current_page') {
        dataToExport = products
      } else if (options.scope === 'selected') {
        dataToExport = products.filter((p: Product) => selectedIds.has(p.id))
      } else if (options.scope === 'all') {
        // Fetch all products matching current filters
        const params = new URLSearchParams({
          limit: '100000', // Large limit for "all"
        })

        // Apply current filters
        if (filters.search) params.set('search', filters.search)
        if (filters.categories.length > 0) params.set('categories', filters.categories.join(','))
        if (filters.suppliers.length > 0) params.set('suppliers', filters.suppliers.join(','))
        if (filters.stockStatus !== 'all') params.set('stockStatus', filters.stockStatus)
        if (filters.priceMin) params.set('priceMin', filters.priceMin)
        if (filters.priceMax) params.set('priceMax', filters.priceMax)
        if (filters.isActive !== 'all') params.set('isActive', filters.isActive)
        if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
        if (filters.dateTo) params.set('dateTo', filters.dateTo)

        const { data } = await api.get(`/products?${params}`)
        dataToExport = data.products
      }

      if (dataToExport.length === 0) {
        alert('No data to export')
        return
      }

      const formattedData = formatProductsForExport(dataToExport)

      if (options.format === 'csv') {
        exportToCSV(formattedData, 'products')
      } else {
        // Filter columns based on visibility config if needed
        // For now, we'll export all standard columns but we could filter PRODUCT_EXPORT_COLUMNS based on columnConfig
        const visibleColumnIds = new Set(columnConfig.filter(c => c.isVisible).map(c => c.id))

        // Map our internal column IDs to export keys
        // Note: PRODUCT_EXPORT_COLUMNS uses 'sku', 'name' etc.
        // columnConfig uses similar IDs.

        // Let's filter the standard columns list based on what's visible in the table
        // plus always include essential IDs if they were hidden (optional decision)

        // For simplicity and "Creative" requirement, let's export the full defined set
        // or filter it if the user really wants WYSIWYG.
        // Requirement says "Yes" to respecting user column config.

        const filteredColumns = PRODUCT_EXPORT_COLUMNS.filter(col => {
           // Mapping some tricky ones
           if (col.key === 'createdAt') return true // Always nice to have
           if (col.key === 'isActive') return visibleColumnIds.has('isActive')
           // Explicit cast or check since PRODUCT_EXPORT_COLUMNS keys might not match exactly ColumnId type
           return visibleColumnIds.has(col.key as any)
        })

        // If filtering removed everything (unlikely), fallback to all
        const columnsToUse = filteredColumns.length > 0 ? filteredColumns : PRODUCT_EXPORT_COLUMNS

        await exportToExcel(formattedData, columnsToUse, 'products', 'Product Inventory')
      }
    } catch (error: any) {
      console.error('Export failed', error)
      const errorMessage = error?.code === 'ECONNABORTED'
        ? 'Export timed out. Try exporting fewer records or use filters to narrow down the data.'
        : error?.message || 'Failed to export data. Please try again.'
      alert(errorMessage)
    } finally {
      setIsExporting(false)
    }
  }

  // Calculate stock stats
  const stockStats = products.reduce((acc: any, product: Product) => {
    if (product.quantity === 0) acc.out++;
    else if (product.quantity < product.minStock) acc.low++;
    else if (product.maxStock && product.quantity > product.maxStock) acc.over++;
    return acc;
  }, { out: 0, low: 0, over: 0 });

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Products</h1>
          <div className="flex gap-4 items-center mb-2">
            <p className="text-gray-700 font-medium">
              Manage your product inventory
            </p>
            {(stockStats.out > 0 || stockStats.low > 0 || stockStats.over > 0) && (
              <div className="flex gap-2 text-sm font-bold">
                 {stockStats.low > 0 && (
                   <span 
                     className="text-orange-600 cursor-pointer hover:underline"
                     onClick={() => setFilters(prev => ({ ...prev, stockStatus: 'low' }))}
                   >
                     {stockStats.low} Low Stock
                   </span>
                 )}
                 {stockStats.out > 0 && (
                   <span 
                     className="text-red-600 cursor-pointer hover:underline"
                     onClick={() => setFilters(prev => ({ ...prev, stockStatus: 'out_of_stock' }))}
                   >
                     {stockStats.out} Out of Stock
                   </span>
                 )}
                 {stockStats.over > 0 && (
                   <span 
                     className="text-purple-600 cursor-pointer hover:underline"
                     onClick={() => setFilters(prev => ({ ...prev, stockStatus: 'overstocked' }))}
                   >
                     {stockStats.over} Overstocked
                   </span>
                 )}
              </div>
            )}
          </div>
          {selectedIds.size > 0 && (
            <div className="mt-2">
              <Badge variant="success">{selectedIds.size} product(s) selected</Badge>
            </div>
          )}
        </div>
        <div className="flex gap-3">
          {/* View Mode Toggle */}
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'table' ? 'primary' : 'secondary'}
              onClick={() => handleViewModeChange('table')}
              className="text-sm py-2"
            >
              ☰ Table
            </Button>
            <Button
              variant={viewMode === 'cards' ? 'primary' : 'secondary'}
              onClick={() => handleViewModeChange('cards')}
              className="text-sm py-2"
            >
              ▦ Cards
            </Button>
            <Button
              variant={viewMode === 'compact' ? 'primary' : 'secondary'}
              onClick={() => handleViewModeChange('compact')}
              className="text-sm py-2"
            >
              ≡ Compact
            </Button>
            {viewMode !== 'cards' && (
              <Button
                variant="secondary"
                onClick={() => setIsColumnConfigOpen(true)}
                className="text-sm py-2 px-2"
                title="Configure Columns"
              >
                <Settings size={18} />
              </Button>
            )}
          </div>
          {selectedIds.size > 0 && (
            <div className="flex gap-2">
              {selectedIds.size === 1 && (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      const id = Array.from(selectedIds)[0]
                      const product = products.find((p: Product) => p.id === id)
                      if (product) handleQuickStock(product)
                    }}
                    className="text-sm py-2"
                  >
                    ± Stock
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      const id = Array.from(selectedIds)[0]
                      const product = products.find((p: Product) => p.id === id)
                      if (product) handleDuplicate(product)
                    }}
                    className="text-sm py-2"
                  >
                    Duplicate
                  </Button>
                </>
              )}
              <select
                className="px-4 py-2 bg-yellow-400 border-4 border-black font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                onChange={(e) => {
                  const value = e.target.value
                  if (value) {
                    handleBulkAction(value as any)
                    e.target.value = '' // Reset
                  }
                }}
                defaultValue=""
              >
                <option value="" disabled>Bulk Actions</option>
                <option value="category">Edit Category</option>
                <option value="supplier">Edit Supplier</option>
                <option value="prices">Adjust Prices</option>
                <option value="stock">Adjust Stock</option>
                <option value="activate">Activate</option>
                <option value="deactivate">Deactivate</option>
                <option value="delete">Delete</option>
              </select>
            </div>
          )}
          <Button variant="secondary" onClick={() => setIsExportMenuOpen(true)}>
            Export
          </Button>
          <Button onClick={() => handleOpenModal()}>Add Product</Button>
        </div>
      </div>

      {/* Filter Panel */}
      <FilterPanel
        filters={filters}
        onFiltersChange={setFilters}
        categories={categories}
        suppliers={suppliers}
        savedFilters={savedFilters}
        onSaveFilter={(name, filterState) => {
          const newSaved = [...savedFilters, { name, filters: filterState }]
          setSavedFilters(newSaved)
          localStorage.setItem('productFilters', JSON.stringify(newSaved))
        }}
        onLoadFilter={(filterState) => setFilters(filterState)}
        onDeleteFilter={(name) => {
          const newSaved = savedFilters.filter((f) => f.name !== name)
          setSavedFilters(newSaved)
          localStorage.setItem('productFilters', JSON.stringify(newSaved))
        }}
      />

      {/* Products Display - Conditional View Mode */}
      {viewMode === 'cards' ? (
        <ProductsGrid
          products={products}
          onEdit={(product) => handleOpenModal(product)}
          onDelete={handleDelete}
          onQuickStock={handleQuickStock}
          onDuplicate={handleDuplicate}
          isLoading={productsLoading}
        />
      ) : (
        <Card className={viewMode === 'compact' ? 'p-2' : ''}>
          {productsLoading ? (
            <div className="text-center py-8 font-bold">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 font-bold">
              No products found. Add your first product!
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className={viewMode === 'compact' ? 'py-2 text-xs' : ''}>
                      <input
                        type="checkbox"
                        checked={selectedIds.size === products.length && products.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="w-5 h-5 border-4 border-black cursor-pointer"
                      />
                    </TableHead>
                    {columnConfig.filter(c => c.isVisible).map(col => (
                      <TableHead key={col.id} className={viewMode === 'compact' ? 'py-2 text-xs' : ''}>
                        {col.label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product: Product) => (
                    <TableRow key={product.id} className={viewMode === 'compact' ? 'hover:bg-yellow-50' : ''}>
                      <TableCell className={viewMode === 'compact' ? 'py-1' : ''}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(product.id)}
                          onChange={(e) => handleSelectOne(product.id, e.target.checked)}
                          className="w-5 h-5 border-4 border-black cursor-pointer"
                        />
                      </TableCell>

                      {columnConfig.filter(c => c.isVisible).map(col => {
                        const isCompact = viewMode === 'compact'
                        const cellClass = isCompact ? 'py-1 text-sm' : ''

                        switch (col.id) {
                          case 'image':
                            return (
                              <TableCell key={col.id} className={cellClass}>
                                {isCompact ? (
                                  <div className="w-8 h-8 flex-shrink-0 border border-black">
                                    {product.imageUrl ? (
                                      <img
                                        src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001'}${product.imageUrl}`}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-gray-100" />
                                    )}
                                  </div>
                                ) : (
                                  <div className="w-12 h-12 flex-shrink-0 group-hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all border-2 border-black">
                                    {product.imageUrl ? (
                                      <img
                                        src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001'}${product.imageUrl}`}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                                        <span className="text-xs">No Img</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </TableCell>
                            )
                          case 'sku':
                            return <TableCell key={col.id} className={cellClass}>{product.sku}</TableCell>
                          case 'name':
                            return (
                              <TableCell key={col.id} className={cellClass}>
                                <div
                                  className="font-bold underline decoration-transparent group-hover:decoration-black transition-all cursor-pointer"
                                  onClick={() => navigate(`/products/${product.id}`)}
                                >
                                  {product.name}
                                </div>
                                {!isCompact && product.description && (
                                  <div className="text-sm text-gray-600">
                                    {product.description.substring(0, 50)}
                                    {product.description.length > 50 ? '...' : ''}
                                  </div>
                                )}
                              </TableCell>
                            )
                          case 'category':
                            return <TableCell key={col.id} className={cellClass}>{product.category.name}</TableCell>
                          case 'supplier':
                            return <TableCell key={col.id} className={cellClass}>{product.supplier?.name || '-'}</TableCell>
                          case 'price':
                            return <TableCell key={col.id} className={`${cellClass} font-bold`}>${product.price.toFixed(2)}</TableCell>
                          case 'costPrice':
                            return <TableCell key={col.id} className={cellClass}>${product.costPrice.toFixed(2)}</TableCell>
                          case 'quantity':
                            return (
                              <TableCell key={col.id} className={cellClass}>
                                {isCompact ? (
                                  <span className="font-bold">{product.quantity}</span>
                                ) : (
                                  <div className="font-bold">{product.quantity} {product.unit}</div>
                                )}
                              </TableCell>
                            )
                          case 'stockStatus':
                            return (
                              <TableCell key={col.id} className={cellClass}>
                                <StockStatusBadge 
                                  quantity={product.quantity} 
                                  minStock={product.minStock} 
                                  maxStock={product.maxStock}
                                  showIcon={!isCompact}
                                  className={isCompact ? 'text-xs py-0.5' : ''}
                                />
                              </TableCell>
                            )
                          case 'isActive':
                            return (
                              <TableCell key={col.id} className={cellClass}>
                                {product.isActive ? (
                                  <Badge variant="success">Active</Badge>
                                ) : (
                                  <Badge variant="danger">Inactive</Badge>
                                )}
                              </TableCell>
                            )
                          case 'minStock':
                            return <TableCell key={col.id} className={cellClass}>{product.minStock}</TableCell>
                          case 'lastMovement':
                            return <TableCell key={col.id} className={cellClass}>-</TableCell>
                          case 'actions':
                            return (
                              <TableCell key={col.id} className={cellClass}>
                                <div className={`flex gap-2 ${isCompact ? 'scale-90 origin-left' : ''}`}>
                                  <button
                                    onClick={() => handleOpenModal(product)}
                                    className="px-3 py-1 bg-cyan-400 border-2 border-black font-bold hover:translate-x-0.5 hover:translate-y-0.5"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDelete(product.id)}
                                    className="px-3 py-1 bg-red-400 border-2 border-black font-bold hover:translate-x-0.5 hover:translate-y-0.5"
                                  >
                                    Delete
                                  </button>
                                  <button
                                    onClick={() => handleQuickStock(product)}
                                    className="px-3 py-1 bg-gray-200 border-2 border-black font-bold hover:translate-x-0.5 hover:translate-y-0.5"
                                    title="Adjust Stock"
                                  >
                                    ±
                                  </button>
                                  <div className="relative group">
                                    <button className="px-3 py-1 bg-gray-200 border-2 border-black font-bold hover:translate-x-0.5 hover:translate-y-0.5">
                                      ...
                                    </button>
                                    <div className="absolute right-0 top-full mt-1 w-48 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hidden group-hover:block z-10">
                                      <button
                                        onClick={() => handleDuplicate(product)}
                                        className="w-full text-left px-4 py-2 hover:bg-yellow-100 font-bold border-b-2 border-black"
                                      >
                                        Duplicate
                                      </button>
                                      <button
                                        onClick={() => alert('Print label')}
                                        className="w-full text-left px-4 py-2 hover:bg-yellow-100 font-bold border-b-2 border-black"
                                      >
                                        Print Label
                                      </button>
                                      <button
                                        onClick={() => alert('View History')}
                                        className="w-full text-left px-4 py-2 hover:bg-yellow-100 font-bold"
                                      >
                                        History
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                            )
                          default:
                            return <TableCell key={col.id} />
                        }
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="mt-6 flex items-center justify-between">
                <div className="font-bold">
                  Showing {(page - 1) * limit + 1} to{' '}
                  {Math.min(page * limit, productsData?.total || 0)} of{' '}
                  {productsData?.total || 0} products
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center px-4 font-bold">
                    Page {page} of {totalPages}
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      )}

      {/* Product Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingProduct ? 'Edit Product' : 'Add Product'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image Upload Section */}
          <div className="mb-6">
            <label className="block text-sm font-bold mb-2">Product Images</label>
            <ImageUpload
              files={uploadedFiles}
              onDrop={(files) => setUploadedFiles(prev => [...prev, ...files])}
              onRemove={(index) => setUploadedFiles(prev => prev.filter((_, i) => i !== index))}
              uploadedImages={productImages}
              onRemoveUploaded={(imageId) => {
                if (editingProduct) {
                  deleteImageMutation.mutate({ id: editingProduct.id, imageId })
                }
              }}
              onSetPrimary={(imageId) => {
                if (editingProduct) {
                  setPrimaryImageMutation.mutate({ id: editingProduct.id, imageId })
                }
              }}
              isLoading={isUploading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="SKU"
              value={formData.sku}
              onChange={e => setFormData({ ...formData, sku: e.target.value })}
              required
            />
            <Input
              label="Product Name"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <Input
            label="Barcode (Optional)"
            value={formData.barcode}
            onChange={(e) =>
              setFormData({ ...formData, barcode: e.target.value })
            }
            placeholder="Enter barcode if available"
          />

          <Input
            label="Description"
            value={formData.description}
            onChange={e =>
              setFormData({ ...formData, description: e.target.value })
            }
          />

          <Select
            label="Unit"
            value={formData.unit}
            onChange={e => setFormData({ ...formData, unit: e.target.value })}
            options={[
              { value: 'piece', label: 'Piece' },
              { value: 'kg', label: 'Kilogram (kg)' },
              { value: 'g', label: 'Gram (g)' },
              { value: 'l', label: 'Liter (l)' },
              { value: 'ml', label: 'Milliliter (ml)' },
              { value: 'box', label: 'Box' },
              { value: 'pack', label: 'Pack' },
              { value: 'set', label: 'Set' },
              { value: 'pair', label: 'Pair' },
              { value: 'meter', label: 'Meter (m)' },
            ]}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={e => setFormData({ ...formData, price: e.target.value })}
              required
            />
            <Input
              label="Cost Price"
              type="number"
              step="0.01"
              value={formData.costPrice}
              onChange={e =>
                setFormData({ ...formData, costPrice: e.target.value })
              }
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Quantity"
              type="number"
              value={formData.quantity}
              onChange={e =>
                setFormData({ ...formData, quantity: e.target.value })
              }
              required
            />
            <Input
              label="Min Stock"
              type="number"
              value={formData.minStock}
              onChange={e =>
                setFormData({ ...formData, minStock: e.target.value })
              }
              required
            />
            <Input
              label="Max Stock"
              type="number"
              value={formData.maxStock}
              onChange={e =>
                setFormData({ ...formData, maxStock: e.target.value })
              }
            />
          </div>

          <Select
            label="Category"
            value={formData.categoryId}
            onChange={e =>
              setFormData({ ...formData, categoryId: e.target.value })
            }
            options={[
              { value: '', label: 'Select Category' },
              ...categories.map((c: Category) => ({
                value: c.id,
                label: c.name,
              })),
            ]}
            required
          />

          <Select
            label="Supplier"
            value={formData.supplierId}
            onChange={e =>
              setFormData({ ...formData, supplierId: e.target.value })
            }
            options={[
              { value: '', label: 'Select Supplier' },
              ...suppliers.map((s: Supplier) => ({
                value: s.id,
                label: s.name,
              })),
            ]}
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={e =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
              className="w-5 h-5 border-4 border-black"
            />
            <label htmlFor="isActive" className="font-bold">
              Active Product
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit">
              {editingProduct ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </form>
      </Modal>
      {/* Bulk Edit Modal */}
      <BulkEditModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        actionType={bulkActionType}
        selectedCount={selectedIds.size}
        categories={categories}
        suppliers={suppliers}
        onConfirm={handleBulkConfirm}
        isLoading={bulkOperationMutation.isPending}
      />

      {/* Quick Stock Adjust Modal */}
      <QuickStockAdjust
        isOpen={isQuickStockModalOpen}
        onClose={() => setIsQuickStockModalOpen(false)}
        product={quickStockProduct}
        isLoading={quickStockMutation.isPending}
        onConfirm={(data) => {
          if (quickStockProduct) {
            quickStockMutation.mutate({
              productIds: [quickStockProduct.id],
              ...data
            })
          }
        }}
      />

      <ColumnConfigModal
        isOpen={isColumnConfigOpen}
        onClose={() => setIsColumnConfigOpen(false)}
        currentConfig={columnConfig}
        onSave={handleSaveColumnConfig}
      />

      <ExportMenu
        isOpen={isExportMenuOpen}
        onClose={() => setIsExportMenuOpen(false)}
        onExport={handleExport}
        totalItems={productsData?.total || 0}
        selectedCount={selectedIds.size}
        entityName="Products"
        isLoading={isExporting}
      />
    </div>
  )
}
