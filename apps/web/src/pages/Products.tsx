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
import ProductImage from '../components/ProductImage'
import ProductsGrid from '../components/ProductsGrid'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../components/Table'
import { exportToCSV, formatProductsForExport } from '../utils/exportCSV'

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

  const handleExport = () => {
    if (products.length === 0) {
      alert('No products to export')
      return
    }
    const formattedData = formatProductsForExport(products)
    exportToCSV(formattedData, 'products')
  }

  const getStockBadge = (quantity: number, minStock: number) => {
    if (quantity === 0) {
      return <Badge variant="danger">Out of Stock</Badge>
    }
    if (quantity <= minStock) {
      return <Badge variant="danger">Low Stock</Badge>
    }
    if (quantity <= minStock * 1.5) {
      return <Badge variant="warning">Near Low</Badge>
    }
    return <Badge variant="success">Normal</Badge>
  }

  const products = productsData?.products || []
  const totalPages = Math.ceil((productsData?.total || 0) / limit)

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Products</h1>
          <p className="text-gray-700 font-medium">
            Manage your product inventory
          </p>
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
          </div>
          {selectedIds.size > 0 && (
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
          )}
          <Button variant="secondary" onClick={handleExport}>
            Export CSV
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
          isLoading={productsLoading}
        />
      ) : (
        <Card>
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
                  <TableHead>
                    <input
                      type="checkbox"
                      checked={selectedIds.size === products.length && products.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-5 h-5 border-4 border-black cursor-pointer"
                    />
                  </TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product: Product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(product.id)}
                        onChange={(e) => handleSelectOne(product.id, e.target.checked)}
                        className="w-5 h-5 border-4 border-black cursor-pointer"
                      />
                    </TableCell>
                    <TableCell>{product.sku}</TableCell>
                    <TableCell>
                      <div
                        className="flex gap-3 items-center cursor-pointer group"
                        onClick={() => navigate(`/products/${product.id}`)}
                      >
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
                        <div>
                          <div className="font-bold underline decoration-transparent group-hover:decoration-black transition-all">{product.name}</div>
                          {product.description && (
                            <div className="text-sm text-gray-600">
                              {product.description.substring(0, 50)}
                              {product.description.length > 50 ? '...' : ''}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{product.category.name}</TableCell>
                    <TableCell className="font-bold">
                      ${product.price.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-bold">
                          {product.quantity} {product.unit}
                        </div>
                        {getStockBadge(product.quantity, product.minStock)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {product.isActive ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="danger">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
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
                      </div>
                    </TableCell>
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
              { value: 'box', label: 'Box' },
              { value: 'kg', label: 'Kilogram' },
              { value: 'liter', label: 'Liter' },
              { value: 'meter', label: 'Meter' },
            ]}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <Input
              label="Selling Price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={e => setFormData({ ...formData, price: e.target.value })}
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
              label="Max Stock (Optional)"
              type="number"
              value={formData.maxStock}
              onChange={e =>
                setFormData({ ...formData, maxStock: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Category"
              value={formData.categoryId}
              onChange={e =>
                setFormData({ ...formData, categoryId: e.target.value })
              }
              options={[
                { value: '', label: 'Select Category' },
                ...categories.map((cat: Category) => ({
                  value: cat.id,
                  label: cat.name,
                })),
              ]}
              required
            />
            <Select
              label="Supplier (Optional)"
              value={formData.supplierId}
              onChange={e =>
                setFormData({ ...formData, supplierId: e.target.value })
              }
              options={[
                { value: '', label: 'No Supplier' },
                ...suppliers.map((sup: Supplier) => ({
                  value: sup.id,
                  label: sup.name,
                })),
              ]}
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={e =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
              className="w-6 h-6 border-4 border-black"
            />
            <label htmlFor="isActive" className="font-bold">
              Product is Active
            </label>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" className="flex-1">
              {editingProduct ? 'Update Product' : 'Create Product'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseModal}
              className="flex-1"
            >
              Cancel
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
    </div>
  )
}
