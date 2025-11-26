import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'
import Button from '../components/Button'
import Input from '../components/Input'
import Select from '../components/Select'
import Badge from '../components/Badge'
import Card from '../components/Card'
import Modal from '../components/Modal'
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
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [page, setPage] = useState(1)
  const limit = 10

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
    queryKey: ['products', page, search, categoryFilter, stockFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(categoryFilter !== 'all' && { categoryId: categoryFilter }),
        ...(stockFilter === 'low' && { lowStock: 'true' }),
      })
      const { data } = await api.get(`/products?${params}`)
      return data
    },
  })

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
  }

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
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
      barcode: formData.barcode || undefined,
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
      updateMutation.mutate({ id: editingProduct.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteMutation.mutate(id)
    }
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
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleExport}>
            Export CSV
          </Button>
          <Button onClick={() => handleOpenModal()}>Add Product</Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <Select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Categories' },
              ...categories.map((cat: Category) => ({
                value: cat.id,
                label: cat.name,
              })),
            ]}
          />
          <Select
            value={stockFilter}
            onChange={e => setStockFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Stock Levels' },
              { value: 'low', label: 'Low Stock Only' },
            ]}
          />
          <Button
            variant="secondary"
            onClick={() => {
              setSearch('')
              setCategoryFilter('all')
              setStockFilter('all')
            }}
          >
            Clear Filters
          </Button>
        </div>
      </Card>

      {/* Products Table */}
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
                    <TableCell>{product.sku}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-bold">{product.name}</div>
                        {product.description && (
                          <div className="text-sm text-gray-600">
                            {product.description.substring(0, 50)}
                            {product.description.length > 50 ? '...' : ''}
                          </div>
                        )}
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

      {/* Product Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingProduct ? 'Edit Product' : 'Add Product'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
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
            label="Description"
            value={formData.description}
            onChange={e =>
              setFormData({ ...formData, description: e.target.value })
            }
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Barcode"
              value={formData.barcode}
              onChange={e =>
                setFormData({ ...formData, barcode: e.target.value })
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
          </div>

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
    </div>
  )
}
