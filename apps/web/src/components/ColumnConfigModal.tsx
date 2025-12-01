import React, { useState, useEffect } from 'react'
import Modal from './Modal'
import Button from './Button'
import { ArrowUp, ArrowDown, Eye, EyeOff } from 'lucide-react'

export type ColumnId =
  | 'image'
  | 'sku'
  | 'name'
  | 'category'
  | 'supplier'
  | 'costPrice'
  | 'price'
  | 'quantity'
  | 'stockStatus'
  | 'isActive'
  | 'minStock'
  | 'lastMovement'
  | 'actions'

export interface ColumnConfig {
  id: ColumnId
  label: string
  isVisible: boolean
  isSortable: boolean
}

interface ColumnConfigModalProps {
  isOpen: boolean
  onClose: () => void
  currentConfig: ColumnConfig[]
  onSave: (config: ColumnConfig[]) => void
}

export const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'image', label: 'Image', isVisible: true, isSortable: false },
  { id: 'sku', label: 'SKU', isVisible: true, isSortable: true },
  { id: 'name', label: 'Name', isVisible: true, isSortable: true },
  { id: 'category', label: 'Category', isVisible: true, isSortable: true },
  { id: 'supplier', label: 'Supplier', isVisible: false, isSortable: true },
  { id: 'costPrice', label: 'Cost Price', isVisible: false, isSortable: true },
  { id: 'price', label: 'Retail Price', isVisible: true, isSortable: true },
  { id: 'quantity', label: 'Quantity', isVisible: true, isSortable: true },
  { id: 'stockStatus', label: 'Stock Status', isVisible: true, isSortable: false },
  { id: 'isActive', label: 'Active', isVisible: true, isSortable: true },
  { id: 'minStock', label: 'Min Stock', isVisible: false, isSortable: true },
  { id: 'lastMovement', label: 'Last Movement', isVisible: false, isSortable: true },
  { id: 'actions', label: 'Actions', isVisible: true, isSortable: false },
]

export default function ColumnConfigModal({ isOpen, onClose, currentConfig, onSave }: ColumnConfigModalProps) {
  const [columns, setColumns] = useState<ColumnConfig[]>(currentConfig)

  // Sync with props when modal opens
  useEffect(() => {
    if (isOpen) {
      setColumns(currentConfig)
    }
  }, [isOpen, currentConfig])

  const handleToggle = (id: ColumnId) => {
    setColumns(prev => prev.map(col =>
      col.id === id ? { ...col, isVisible: !col.isVisible } : col
    ))
  }

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === columns.length - 1) return

    const newColumns = [...columns]
    const swapIndex = direction === 'up' ? index - 1 : index + 1

    // Swap
    const temp = newColumns[swapIndex]
    newColumns[swapIndex] = newColumns[index]
    newColumns[index] = temp

    setColumns(newColumns)
  }

  const handleSave = () => {
    onSave(columns)
    onClose()
  }

  const handleReset = () => {
      setColumns(DEFAULT_COLUMNS)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configure Columns" size="md">
      <div className="space-y-4">
        <p className="text-gray-600 mb-4">
          Toggle visibility and reorder columns for the table view.
        </p>

        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
          {columns.map((col, index) => (
            <div
              key={col.id}
              className={`flex items-center justify-between p-3 border-2 border-black ${col.isVisible ? 'bg-white' : 'bg-gray-100 opacity-70'}`}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggle(col.id)}
                  className={`p-1 border-2 border-black ${col.isVisible ? 'bg-green-400' : 'bg-gray-300'}`}
                >
                  {col.isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <span className="font-bold">{col.label}</span>
              </div>

              <div className="flex gap-1">
                <button
                  onClick={() => handleMove(index, 'up')}
                  disabled={index === 0}
                  className="p-1 border-2 border-black hover:bg-yellow-200 disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  onClick={() => handleMove(index, 'down')}
                  disabled={index === columns.length - 1}
                  className="p-1 border-2 border-black hover:bg-yellow-200 disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <ArrowDown size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between pt-4 border-t-2 border-black mt-4">
          <Button variant="secondary" onClick={handleReset}>Reset Defaults</Button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>Save Changes</Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
