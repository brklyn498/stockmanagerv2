import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'
import Button from '../components/Button'
import Input from '../components/Input'
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

interface Supplier {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  createdAt: string
  updatedAt: string
  _count?: {
    products: number
  }
}

export default function Suppliers() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  })

  // Fetch suppliers
  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data } = await api.get('/suppliers')
      // Ensure we always return an array
      return Array.isArray(data.suppliers) ? data.suppliers : []
    },
  })

  // Create supplier mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post('/suppliers', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      setIsModalOpen(false)
      resetForm()
    },
  })

  // Update supplier mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return api.put(`/suppliers/${id}`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      setIsModalOpen(false)
      setEditingSupplier(null)
      resetForm()
    },
  })

  // Delete supplier mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/suppliers/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
    },
  })

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
    })
  }

  const handleOpenModal = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier)
      setFormData({
        name: supplier.name,
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
      })
    } else {
      setEditingSupplier(null)
      resetForm()
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingSupplier(null)
    resetForm()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const payload = {
      name: formData.name,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      address: formData.address || undefined,
    }

    if (editingSupplier) {
      updateMutation.mutate({ id: editingSupplier.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this supplier?')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Suppliers</h1>
          <p className="text-gray-700 font-medium">
            Manage your product suppliers and vendors
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>Add Supplier</Button>
      </div>

      {/* Suppliers Table */}
      <Card>
        {isLoading ? (
          <div className="text-center py-8 font-bold">Loading suppliers...</div>
        ) : !Array.isArray(suppliers) || suppliers.length === 0 ? (
          <div className="text-center py-8 font-bold">
            No suppliers found. Add your first supplier!
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(suppliers || []).map((supplier: Supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell>
                    <div className="font-bold">{supplier.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {supplier.email && (
                        <div className="text-sm">
                          📧 {supplier.email}
                        </div>
                      )}
                      {supplier.phone && (
                        <div className="text-sm">
                          📞 {supplier.phone}
                        </div>
                      )}
                      {!supplier.email && !supplier.phone && (
                        <div className="text-sm text-gray-500">-</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {supplier.address || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-bold">
                      {supplier._count?.products || 0} products
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenModal(supplier)}
                        className="px-3 py-1 bg-cyan-400 border-2 border-black font-bold hover:translate-x-0.5 hover:translate-y-0.5"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(supplier.id)}
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
        )}
      </Card>

      {/* Supplier Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingSupplier ? 'Edit Supplier' : 'Add Supplier'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Supplier Name"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="e.g., Tech Supplies Inc."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Email (Optional)"
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder="contact@supplier.com"
            />
            <Input
              label="Phone (Optional)"
              type="tel"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              placeholder="555-0123"
            />
          </div>

          <div className="w-full">
            <label className="block font-bold mb-2 text-black">
              Address (Optional)
            </label>
            <textarea
              value={formData.address}
              onChange={e =>
                setFormData({ ...formData, address: e.target.value })
              }
              className="neo-input w-full"
              rows={3}
              placeholder="Street address, city, state, ZIP"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" className="flex-1">
              {editingSupplier ? 'Update Supplier' : 'Create Supplier'}
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
