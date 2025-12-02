import { useState } from 'react'
import Modal from './Modal'
import Button from './Button'
import { FileSpreadsheet, FileText } from 'lucide-react'

export interface ExportOptions {
  format: 'xlsx' | 'csv'
  scope: 'current_page' | 'all' | 'selected'
}

interface ExportMenuProps {
  isOpen: boolean
  onClose: () => void
  onExport: (options: ExportOptions) => void
  totalItems: number
  selectedCount: number
  entityName: string // e.g., 'Products', 'Orders'
  isLoading?: boolean
}

export default function ExportMenu({
  isOpen,
  onClose,
  onExport,
  totalItems,
  selectedCount,
  entityName,
  isLoading = false
}: ExportMenuProps) {
  const [format, setFormat] = useState<'xlsx' | 'csv'>('xlsx')
  const [scope, setScope] = useState<'current_page' | 'all' | 'selected'>(
    selectedCount > 0 ? 'selected' : 'all'
  )

  const handleExport = () => {
    onExport({ format, scope })
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Export ${entityName}`}
      size="md"
    >
      <div className="space-y-6">
        {/* Scope Selection */}
        <div>
          <h3 className="font-bold text-lg mb-3 border-b-2 border-black pb-1">1. What to Export?</h3>
          <div className="space-y-2">
            <label className="flex items-center p-3 border-2 border-black hover:bg-yellow-50 cursor-pointer transition-all">
              <input
                type="radio"
                name="scope"
                value="all"
                checked={scope === 'all'}
                onChange={() => setScope('all')}
                className="w-5 h-5 border-4 border-black mr-3 accent-black"
              />
              <div className="flex-1">
                <span className="font-bold block">All {entityName}</span>
                <span className="text-sm text-gray-600">Export entire database ({totalItems} records)</span>
              </div>
            </label>

            <label className="flex items-center p-3 border-2 border-black hover:bg-yellow-50 cursor-pointer transition-all">
              <input
                type="radio"
                name="scope"
                value="current_page"
                checked={scope === 'current_page'}
                onChange={() => setScope('current_page')}
                className="w-5 h-5 border-4 border-black mr-3 accent-black"
              />
              <div className="flex-1">
                <span className="font-bold block">Current Page</span>
                <span className="text-sm text-gray-600">Export only what's visible now</span>
              </div>
            </label>

            <label className={`flex items-center p-3 border-2 border-black transition-all ${selectedCount === 0 ? 'opacity-50 bg-gray-100 cursor-not-allowed' : 'hover:bg-yellow-50 cursor-pointer'}`}>
              <input
                type="radio"
                name="scope"
                value="selected"
                checked={scope === 'selected'}
                onChange={() => setScope('selected')}
                disabled={selectedCount === 0}
                className="w-5 h-5 border-4 border-black mr-3 accent-black"
              />
              <div className="flex-1">
                <span className="font-bold block">Selected Rows</span>
                <span className="text-sm text-gray-600">
                  {selectedCount > 0
                    ? `Export ${selectedCount} selected record${selectedCount > 1 ? 's' : ''}`
                    : 'Select rows in the table first'}
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Format Selection */}
        <div>
          <h3 className="font-bold text-lg mb-3 border-b-2 border-black pb-1">2. File Format</h3>
          <div className="grid grid-cols-2 gap-4">
            <label
              className={`flex flex-col items-center justify-center p-4 border-4 cursor-pointer transition-all ${
                format === 'xlsx'
                  ? 'border-black bg-yellow-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-1'
                  : 'border-gray-300 hover:border-black hover:bg-yellow-50'
              }`}
            >
              <input
                type="radio"
                name="format"
                value="xlsx"
                checked={format === 'xlsx'}
                onChange={() => setFormat('xlsx')}
                className="hidden"
              />
              <FileSpreadsheet size={32} className="mb-2" />
              <span className="font-bold">Excel (.xlsx)</span>
            </label>

            <label
              className={`flex flex-col items-center justify-center p-4 border-4 cursor-pointer transition-all ${
                format === 'csv'
                  ? 'border-black bg-yellow-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-1'
                  : 'border-gray-300 hover:border-black hover:bg-yellow-50'
              }`}
            >
              <input
                type="radio"
                name="format"
                value="csv"
                checked={format === 'csv'}
                onChange={() => setFormat('csv')}
                className="hidden"
              />
              <FileText size={32} className="mb-2" />
              <span className="font-bold">CSV (.csv)</span>
            </label>
          </div>
        </div>

        <div className="flex gap-4 pt-4 border-t-2 border-gray-200">
          <Button
            onClick={handleExport}
            className="flex-1 py-3 text-lg"
            disabled={isLoading}
          >
            {isLoading ? 'Preparing Export...' : `Export ${entityName}`}
          </Button>
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  )
}
