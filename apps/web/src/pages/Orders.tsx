import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
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
import { exportToCSV, exportToExcel, formatOrdersForExport, ORDER_EXPORT_COLUMNS } from '../utils/export'
import ExportMenu, { ExportOptions } from '../components/ExportMenu'

interface Order {
  id: string
  orderNumber: string
  type: string
  status: string
  totalAmount: number
  notes?: string
  createdAt: string
  updatedAt: string
  supplier?: {
    id: string
    name: string
  }
  user: {
    id: string
    name: string
  }
  items: OrderItem[]
}

interface OrderItem {
  id: string
  quantity: number
  unitPrice: number
  product: {
    id: string
    name: string
    sku: string
  }
}

interface Product {
  id: string
  name: string
  sku: string
  price: number
  costPrice: number
  quantity: number
}

interface Supplier {
  id: string
  name: string
}

export default function Orders() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const limit = 10

  // Export state
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    type: 'PURCHASE',
    supplierId: '',
    notes: '',
    items: [] as Array<{ productId: string; quantity: number; unitPrice: number }>,
  })

  // Current item being added
  const [currentItem, setCurrentItem] = useState({
    productId: '',
    quantity: '1',
    unitPrice: '',
  })

  // Fetch orders
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders', page, typeFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(typeFilter !== 'all' && { type: typeFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
      })
      const { data } = await api.get(`/orders?${params}`)
      return data
    },
  })

  // Fetch products
  const { data: productsData } = useQuery({
    queryKey: ['products-all'],
    queryFn: async () => {
      const { data } = await api.get('/products?limit=1000')
      return data.products || []
    },
  })

  // Fetch suppliers
  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data } = await api.get('/suppliers')
      return data.suppliers || []
    },
  })

  // Create order mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post('/orders', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setIsModalOpen(false)
      setIsCreating(false)
      resetForm()
    },
  })

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return api.put(`/orders/${id}/status`, { status })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setViewingOrder(null)
      setIsModalOpen(false)
    },
  })

  // Delete order mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/orders/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })

  const resetForm = () => {
    setFormData({
      type: 'PURCHASE',
      supplierId: '',
      notes: '',
      items: [],
    })
    setCurrentItem({
      productId: '',
      quantity: '1',
      unitPrice: '',
    })
  }

  const handleOpenCreateModal = () => {
    resetForm()
    setIsCreating(true)
    setIsModalOpen(true)
  }

  const handleOpenViewModal = (order: Order) => {
    setViewingOrder(order)
    setIsCreating(false)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setViewingOrder(null)
    setIsCreating(false)
    resetForm()
  }

  // Extract data early to use in handlers
  const orders = ordersData?.orders || []
  const totalPages = Math.ceil((ordersData?.total || 0) / limit)
  const products = Array.isArray(productsData) ? productsData : (productsData?.products || [])

  const handleAddItem = () => {
    const product = products.find((p: Product) => p.id === currentItem.productId)
    if (!product || !currentItem.quantity) return

    const quantity = parseInt(currentItem.quantity)
    const unitPrice = currentItem.unitPrice
      ? parseFloat(currentItem.unitPrice)
      : formData.type === 'PURCHASE'
        ? product.costPrice
        : product.price

    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          productId: currentItem.productId,
          quantity,
          unitPrice,
        },
      ],
    })

    setCurrentItem({
      productId: '',
      quantity: '1',
      unitPrice: '',
    })
  }

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.items.length === 0) {
      alert('Please add at least one item to the order')
      return
    }

    const totalAmount = formData.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    )

    const payload = {
      type: formData.type,
      supplierId: formData.supplierId || undefined,
      notes: formData.notes || undefined,
      totalAmount,
      items: formData.items,
    }

    createMutation.mutate(payload)
  }

  const handleExport = async (options: ExportOptions) => {
    setIsExporting(true)
    try {
      let dataToExport = []

      if (options.scope === 'current_page') {
        dataToExport = orders
      } else if (options.scope === 'selected') {
        // Orders page doesn't have selection yet, but if it did...
        // For now, scope 'selected' is disabled in menu if count is 0
        dataToExport = []
      } else if (options.scope === 'all') {
        const params = new URLSearchParams({
          limit: '100000',
        })
        if (typeFilter !== 'all') params.set('type', typeFilter)
        if (statusFilter !== 'all') params.set('status', statusFilter)

        const { data } = await api.get(`/orders?${params}`)
        dataToExport = data.orders
      }

      if (dataToExport.length === 0) {
        alert('No data to export')
        return
      }

      const formattedData = formatOrdersForExport(dataToExport)

      if (options.format === 'csv') {
        exportToCSV(formattedData, 'orders')
      } else {
        await exportToExcel(formattedData, ORDER_EXPORT_COLUMNS, 'orders', 'Order History')
      }
    } catch (error) {
      console.error('Export failed', error)
      alert('Failed to export data')
    } finally {
      setIsExporting(false)
    }
  }

  const handleUpdateStatus = (orderId: string, newStatus: string) => {
    if (confirm(`Update order status to ${newStatus}?`)) {
      updateStatusMutation.mutate({ id: orderId, status: newStatus })
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this order?')) {
      deleteMutation.mutate(id)
    }
  }

  const getTypeBadge = (type: string) => {
    return type === 'PURCHASE' ? (
      <Badge variant="info">Purchase</Badge>
    ) : (
      <Badge variant="warning">Sale</Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      PENDING: <Badge variant="warning">Pending</Badge>,
      APPROVED: <Badge variant="info">Approved</Badge>,
      PROCESSING: <Badge variant="info">Processing</Badge>,
      COMPLETED: <Badge variant="success">Completed</Badge>,
      CANCELLED: <Badge variant="danger">Cancelled</Badge>,
    }
    return badges[status as keyof typeof badges] || <Badge>{status}</Badge>
  }

  const calculateTotal = () => {
    return formData.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    )
  }

  // Loading state
  if (ordersLoading) {
    return (
      <div>
        <h1 className="text-4xl font-bold mb-8">Orders</h1>
        <Card>
          <p className="text-center py-8 font-medium">Loading orders...</p>
        </Card>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Orders</h1>
          <p className="text-gray-700 font-medium">
            Manage purchase and sales orders
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setIsExportMenuOpen(true)}>
            Export
          </Button>
          <Button onClick={handleOpenCreateModal}>Create Order</Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            value={typeFilter}
            onChange={e => {
              setTypeFilter(e.target.value)
              setPage(1)
            }}
            options={[
              { value: 'all', label: 'All Types' },
              { value: 'PURCHASE', label: 'Purchase Orders' },
              { value: 'SALE', label: 'Sales Orders' },
            ]}
          />
          <Select
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'PENDING', label: 'Pending' },
              { value: 'APPROVED', label: 'Approved' },
              { value: 'PROCESSING', label: 'Processing' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ]}
          />
          <Button
            variant="secondary"
            onClick={() => {
              setTypeFilter('all')
              setStatusFilter('all')
              setPage(1)
            }}
          >
            Clear Filters
          </Button>
        </div>
      </Card>

      {/* Orders Table */}
      <Card>
        {ordersLoading ? (
          <div className="text-center py-8 font-bold">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-8 font-bold">
            No orders found. Create your first order!
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order: Order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div className="font-bold">{order.orderNumber}</div>
                    </TableCell>
                    <TableCell>{getTypeBadge(order.type)}</TableCell>
                    <TableCell>
                      {order.supplier ? order.supplier.name : '-'}
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>
                      <div className="font-bold text-lg">
                        ${order.totalAmount.toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenViewModal(order)}
                          className="px-3 py-1 bg-cyan-400 border-2 border-black font-bold hover:translate-x-0.5 hover:translate-y-0.5"
                        >
                          View
                        </button>
                        <button
                          onClick={() => navigate(`/receipt/${order.id}`)}
                          className="px-3 py-1 bg-green-400 border-2 border-black font-bold hover:translate-x-0.5 hover:translate-y-0.5"
                        >
                          Receipt
                        </button>
                        {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                          <button
                            onClick={() => handleDelete(order.id)}
                            className="px-3 py-1 bg-red-400 border-2 border-black font-bold hover:translate-x-0.5 hover:translate-y-0.5"
                          >
                            Delete
                          </button>
                        )}
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
                {Math.min(page * limit, ordersData?.total || 0)} of{' '}
                {ordersData?.total || 0} orders
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

      {/* Create Order Modal */}
      {isCreating && (
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title="Create Order"
          size="xl"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Order Type"
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
                options={[
                  { value: 'PURCHASE', label: 'Purchase Order (Buy Stock)' },
                  { value: 'SALE', label: 'Sales Order (Sell Stock)' },
                ]}
              />
              <Select
                label="Supplier (Optional for Purchase)"
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

            <div className="w-full">
              <label className="block font-bold mb-2 text-black">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={e =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="neo-input w-full"
                rows={2}
                placeholder="Order notes..."
              />
            </div>

            {/* Add Items Section */}
            <div className="border-4 border-black p-4 bg-yellow-50">
              <h3 className="font-bold text-lg mb-4">Add Items to Order</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <Select
                    label="Product"
                    value={currentItem.productId}
                    onChange={e => {
                      const product = products.find(
                        (p: Product) => p.id === e.target.value
                      )
                      setCurrentItem({
                        ...currentItem,
                        productId: e.target.value,
                        unitPrice: product
                          ? formData.type === 'PURCHASE'
                            ? product.costPrice.toString()
                            : product.price.toString()
                          : '',
                      })
                    }}
                    options={[
                      { value: '', label: 'Select Product' },
                      ...products.map((product: Product) => ({
                        value: product.id,
                        label: `${product.sku} - ${product.name} (Stock: ${product.quantity})`,
                      })),
                    ]}
                  />
                </div>
                <Input
                  label="Quantity"
                  type="number"
                  min="1"
                  value={currentItem.quantity}
                  onChange={e =>
                    setCurrentItem({ ...currentItem, quantity: e.target.value })
                  }
                />
                <Input
                  label="Unit Price"
                  type="number"
                  step="0.01"
                  value={currentItem.unitPrice}
                  onChange={e =>
                    setCurrentItem({ ...currentItem, unitPrice: e.target.value })
                  }
                />
              </div>
              <Button
                type="button"
                onClick={handleAddItem}
                className="mt-4"
                variant="secondary"
                disabled={!currentItem.productId || !currentItem.quantity}
              >
                Add Item
              </Button>
            </div>

            {/* Order Items List */}
            {formData.items.length > 0 && (
              <div className="border-4 border-black">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Subtotal</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.items.map((item, index) => {
                      const product = products.find(
                        (p: Product) => p.id === item.productId
                      )
                      return (
                        <TableRow key={index}>
                          <TableCell>
                            {product ? `${product.sku} - ${product.name}` : 'Unknown'}
                          </TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>${item.unitPrice.toFixed(2)}</TableCell>
                          <TableCell className="font-bold">
                            ${(item.quantity * item.unitPrice).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="px-2 py-1 bg-red-400 border-2 border-black font-bold text-sm"
                            >
                              Remove
                            </button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
                <div className="p-4 border-t-4 border-black bg-yellow-400">
                  <div className="text-right text-2xl font-bold">
                    Total: ${calculateTotal().toFixed(2)}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button type="submit" className="flex-1" disabled={formData.items.length === 0}>
                Create Order
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
      )}

      {/* View Order Modal */}
      {viewingOrder && (
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={`Order ${viewingOrder.orderNumber}`}
          size="xl"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-bold mb-1">Type:</p>
                {getTypeBadge(viewingOrder.type)}
              </div>
              <div>
                <p className="font-bold mb-1">Status:</p>
                {getStatusBadge(viewingOrder.status)}
              </div>
              <div>
                <p className="font-bold mb-1">Supplier:</p>
                <p>{viewingOrder.supplier?.name || '-'}</p>
              </div>
              <div>
                <p className="font-bold mb-1">Created:</p>
                <p>{new Date(viewingOrder.createdAt).toLocaleString()}</p>
              </div>
            </div>

            {viewingOrder.notes && (
              <div>
                <p className="font-bold mb-1">Notes:</p>
                <p className="p-3 border-2 border-black bg-gray-50">
                  {viewingOrder.notes}
                </p>
              </div>
            )}

            <div className="border-4 border-black">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewingOrder.items.map((item: OrderItem) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-bold">{item.product.name}</div>
                        <div className="text-sm text-gray-600">
                          SKU: {item.product.sku}
                        </div>
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>${item.unitPrice.toFixed(2)}</TableCell>
                      <TableCell className="font-bold">
                        ${(item.quantity * item.unitPrice).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="p-4 border-t-4 border-black bg-yellow-400">
                <div className="text-right text-2xl font-bold">
                  Total: ${viewingOrder.totalAmount.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Status Update Actions */}
            {viewingOrder.status !== 'COMPLETED' && viewingOrder.status !== 'CANCELLED' && (
              <div className="border-4 border-black p-4 bg-yellow-50">
                <h4 className="font-bold mb-3">Update Order Status:</h4>
                <div className="flex flex-wrap gap-2">
                  {viewingOrder.status === 'PENDING' && (
                    <>
                      <Button
                        onClick={() =>
                          handleUpdateStatus(viewingOrder.id, 'APPROVED')
                        }
                        variant="secondary"
                      >
                        Approve
                      </Button>
                      <Button
                        onClick={() =>
                          handleUpdateStatus(viewingOrder.id, 'CANCELLED')
                        }
                        variant="danger"
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                  {viewingOrder.status === 'APPROVED' && (
                    <Button
                      onClick={() =>
                        handleUpdateStatus(viewingOrder.id, 'PROCESSING')
                      }
                      variant="secondary"
                    >
                      Start Processing
                    </Button>
                  )}
                  {viewingOrder.status === 'PROCESSING' && (
                    <Button
                      onClick={() =>
                        handleUpdateStatus(viewingOrder.id, 'COMPLETED')
                      }
                    >
                      Complete Order
                    </Button>
                  )}
                </div>
                <p className="text-sm mt-3 text-gray-700">
                  Note: Completing a {viewingOrder.type === 'PURCHASE' ? 'purchase' : 'sale'} order will automatically{' '}
                  {viewingOrder.type === 'PURCHASE' ? 'increase' : 'decrease'} stock levels.
                </p>
              </div>
            )}

            <Button variant="secondary" onClick={handleCloseModal} className="w-full">
              Close
            </Button>
          </div>
        </Modal>
      )}

      <ExportMenu
        isOpen={isExportMenuOpen}
        onClose={() => setIsExportMenuOpen(false)}
        onExport={handleExport}
        totalItems={ordersData?.total || 0}
        selectedCount={0} // No selection implemented in Orders yet
        entityName="Orders"
        isLoading={isExporting}
      />
    </div>
  )
}
