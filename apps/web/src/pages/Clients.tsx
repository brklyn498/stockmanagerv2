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
import { exportToCSV } from '../utils/export'

interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export default function Clients() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [search, setSearch] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  })

  // Fetch clients
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients', search],
    queryFn: async () => {
      const { data } = await api.get('/clients', {
        params: search ? { search } : undefined,
      })
      // Ensure we always return an array
      return Array.isArray(data.clients) ? data.clients : []
    },
  })

  // Create client mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post('/clients', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      setIsModalOpen(false)
      resetForm()
    },
  })

  // Update client mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return api.put(`/clients/${id}`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      setIsModalOpen(false)
      setEditingClient(null)
      resetForm()
    },
  })

  // Delete client mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/clients/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      notes: '',
    })
  }

  const handleOpenModal = (client?: Client) => {
    if (client) {
      setEditingClient(client)
      setFormData({
        name: client.name,
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        notes: client.notes || '',
      })
    } else {
      setEditingClient(null)
      resetForm()
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingClient(null)
    resetForm()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const payload = {
      name: formData.name,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      address: formData.address || undefined,
      notes: formData.notes || undefined,
    }

    if (editingClient) {
      updateMutation.mutate({ id: editingClient.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this client?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleExportCSV = () => {
    if (!Array.isArray(clients) || clients.length === 0) {
      alert('No clients to export')
      return
    }

    const csvData = clients.map(client => ({
      Name: client.name,
      Email: client.email || '-',
      Phone: client.phone || '-',
      Address: client.address || '-',
      Notes: client.notes || '-',
      'Created Date': new Date(client.createdAt).toLocaleDateString(),
    }))

    const timestamp = new Date().toISOString().split('T')[0]
    exportToCSV(csvData, `clients-${timestamp}.csv`)
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Clients</h1>
          <p className="text-gray-700 font-medium">
            Manage your customer database
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleExportCSV}>
            Export CSV
          </Button>
          <Button onClick={() => handleOpenModal()}>Add Client</Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <Input
          placeholder="Search clients by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Clients Table */}
      <Card>
        {isLoading ? (
          <div className="text-center py-8 font-bold">Loading clients...</div>
        ) : !Array.isArray(clients) || clients.length === 0 ? (
          <div className="text-center py-8 font-bold">
            No clients found. Add your first client!
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(clients || []).map((client: Client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <div className="font-bold">{client.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {client.email && (
                        <div className="text-sm">
                          📧 {client.email}
                        </div>
                      )}
                      {client.phone && (
                        <div className="text-sm">
                          📞 {client.phone}
                        </div>
                      )}
                      {!client.email && !client.phone && (
                        <div className="text-sm text-gray-500">-</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {client.address || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm max-w-xs truncate">
                      {client.notes || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenModal(client)}
                        className="px-3 py-1 bg-cyan-400 border-2 border-black font-bold hover:translate-x-0.5 hover:translate-y-0.5"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(client.id)}
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

      {/* Client Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingClient ? 'Edit Client' : 'Add Client'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Client Name"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="e.g., John Doe"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Email (Optional)"
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@example.com"
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
              rows={4}
              placeholder="Additional notes about this client..."
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" className="flex-1">
              {editingClient ? 'Update Client' : 'Create Client'}
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
