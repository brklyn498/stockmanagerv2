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
import { exportToCSV, formatMovementsForExport } from '../utils/exportCSV'

interface StockMovement {
  id: string
  type: string
  quantity: number
  reason?: string
  reference?: string
  createdAt: string
  product: {
    id: string
    name: string
    sku: string
  }
  user: {
    id: string
    name: string
  }
}

interface Product {
  id: string
  name: string
  sku: string
  quantity: number
}

export default function StockMovements() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [productFilter, setProductFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [page, setPage] = useState(1)
  const limit = 20

  // Form state
  const [formData, setFormData] = useState({
    productId: '',
    type: 'IN',
    quantity: '',
    reason: '',
    reference: '',
  })

  // Fetch stock movements
  const { data: movementsData, isLoading: movementsLoading } = useQuery({
    queryKey: ['stock-movements', page, productFilter, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(productFilter !== 'all' && { productId: productFilter }),
        ...(typeFilter !== 'all' && { type: typeFilter }),
      })
      const { data } = await api.get(`/stock-movements?${params}`)
      return data
    },
  })

  // Fetch products for dropdown
  const { data: productsData } = useQuery({
    queryKey: ['products-all'],
    queryFn: async () => {
      const { data } = await api.get('/products?limit=1000')
      return data
    },
  })

  // Create movement mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post('/stock-movements', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setIsModalOpen(false)
      resetForm()
    },
  })

  const resetForm = () => {
    setFormData({
      productId: '',
      type: 'IN',
      quantity: '',
      reason: '',
      reference: '',
    })
  }

  const handleOpenModal = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    resetForm()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const payload = {
      productId: formData.productId,
      type: formData.type,
      quantity: parseInt(formData.quantity),
      reason: formData.reason || undefined,
      reference: formData.reference || undefined,
    }

    createMutation.mutate(payload)
  }

  const handleExport = () => {
    if (movements.length === 0) {
      alert('No movements to export')
      return
    }
    const formattedData = formatMovementsForExport(movements)
    exportToCSV(formattedData, 'stock_movements')
  }

  const getTypeBadge = (type: string) => {
    const badges = {
      IN: <Badge variant="success">Stock In</Badge>,
      OUT: <Badge variant="warning">Stock Out</Badge>,
      ADJUSTMENT: <Badge variant="info">Adjustment</Badge>,
      RETURN: <Badge variant="success">Return</Badge>,
      DAMAGED: <Badge variant="danger">Damaged</Badge>,
    }
    return badges[type as keyof typeof badges] || <Badge>{type}</Badge>
  }

  const movements = movementsData?.movements || []
  const totalPages = Math.ceil((movementsData?.total || 0) / limit)
  const products = productsData?.products || []

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Stock Movements</h1>
          <p className="text-gray-700 font-medium">
            Track all stock changes and inventory movements
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleExport}>
            Export CSV
          </Button>
          <Button onClick={handleOpenModal}>Record Movement</Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            value={productFilter}
            onChange={e => {
              setProductFilter(e.target.value)
              setPage(1)
            }}
            options={[
              { value: 'all', label: 'All Products' },
              ...products.map((product: Product) => ({
                value: product.id,
                label: `${product.sku} - ${product.name}`,
              })),
            ]}
          />
          <Select
            value={typeFilter}
            onChange={e => {
              setTypeFilter(e.target.value)
              setPage(1)
            }}
            options={[
              { value: 'all', label: 'All Movement Types' },
              { value: 'IN', label: 'Stock In' },
              { value: 'OUT', label: 'Stock Out' },
              { value: 'ADJUSTMENT', label: 'Adjustment' },
              { value: 'RETURN', label: 'Return' },
              { value: 'DAMAGED', label: 'Damaged' },
            ]}
          />
          <Button
            variant="secondary"
            onClick={() => {
              setProductFilter('all')
              setTypeFilter('all')
              setPage(1)
            }}
          >
            Clear Filters
          </Button>
        </div>
      </Card>

      {/* Movements Table */}
      <Card>
        {movementsLoading ? (
          <div className="text-center py-8 font-bold">
            Loading movements...
          </div>
        ) : movements.length === 0 ? (
          <div className="text-center py-8 font-bold">
            No movements found. Record your first stock movement!
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>User</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((movement: StockMovement) => (
                  <TableRow key={movement.id}>
                    <TableCell>
                      <div className="font-bold">
                        {new Date(movement.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-600">
                        {new Date(movement.createdAt).toLocaleTimeString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-bold">{movement.product.name}</div>
                      <div className="text-sm text-gray-600">
                        SKU: {movement.product.sku}
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(movement.type)}</TableCell>
                    <TableCell>
                      <div
                        className={`font-bold text-lg ${
                          movement.type === 'IN' || movement.type === 'RETURN'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {movement.type === 'IN' || movement.type === 'RETURN'
                          ? '+'
                          : '-'}
                        {movement.quantity}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {movement.reason || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {movement.reference || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">
                        {movement.user.name}
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
                {Math.min(page * limit, movementsData?.total || 0)} of{' '}
                {movementsData?.total || 0} movements
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

      {/* Record Movement Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Record Stock Movement"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Product"
            value={formData.productId}
            onChange={e =>
              setFormData({ ...formData, productId: e.target.value })
            }
            options={[
              { value: '', label: 'Select Product' },
              ...products.map((product: Product) => ({
                value: product.id,
                label: `${product.sku} - ${product.name} (Current: ${product.quantity})`,
              })),
            ]}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Movement Type"
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value })}
              options={[
                { value: 'IN', label: 'Stock In (+)' },
                { value: 'OUT', label: 'Stock Out (-)' },
                { value: 'ADJUSTMENT', label: 'Adjustment' },
                { value: 'RETURN', label: 'Return (+)' },
                { value: 'DAMAGED', label: 'Damaged (-)' },
              ]}
            />
            <Input
              label="Quantity"
              type="number"
              min="1"
              value={formData.quantity}
              onChange={e =>
                setFormData({ ...formData, quantity: e.target.value })
              }
              required
              placeholder="Enter quantity"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Reason (Optional)"
              value={formData.reason}
              onChange={e =>
                setFormData({ ...formData, reason: e.target.value })
              }
              placeholder="e.g., New delivery, Sold, Damaged in transit"
            />
            <Input
              label="Reference (Optional)"
              value={formData.reference}
              onChange={e =>
                setFormData({ ...formData, reference: e.target.value })
              }
              placeholder="e.g., PO-12345, Invoice #"
            />
          </div>

          <div className="bg-yellow-100 border-4 border-black p-4">
            <h4 className="font-bold mb-2">Movement Types:</h4>
            <ul className="space-y-1 text-sm">
              <li>
                <strong>Stock In:</strong> Adds to inventory (e.g., new
                purchase, restocking)
              </li>
              <li>
                <strong>Stock Out:</strong> Removes from inventory (e.g., sale,
                transfer)
              </li>
              <li>
                <strong>Adjustment:</strong> Correct inventory count
                (positive/negative)
              </li>
              <li>
                <strong>Return:</strong> Customer/supplier returns (adds to
                inventory)
              </li>
              <li>
                <strong>Damaged:</strong> Damaged goods (removes from inventory)
              </li>
            </ul>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" className="flex-1">
              Record Movement
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
