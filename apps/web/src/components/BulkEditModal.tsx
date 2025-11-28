import { useState } from 'react'
import Modal from './Modal'
import Button from './Button'
import Input from './Input'
import Select from './Select'

interface BulkEditModalProps {
    isOpen: boolean
    onClose: () => void
    actionType:
    | 'category'
    | 'supplier'
    | 'prices'
    | 'stock'
    | 'activate'
    | 'deactivate'
    | 'delete'
    selectedCount: number
    categories?: Array<{ id: string; name: string }>
    suppliers?: Array<{ id: string; name: string }>
    onConfirm: (data: any) => void
    isLoading?: boolean
}

export default function BulkEditModal({
    isOpen,
    onClose,
    actionType,
    selectedCount,
    categories = [],
    suppliers = [],
    onConfirm,
    isLoading = false,
}: BulkEditModalProps) {
    const [categoryId, setCategoryId] = useState('')
    const [supplierId, setSupplierId] = useState('')
    const [adjustmentType, setAdjustmentType] = useState<'increase' | 'decrease'>('increase')
    const [value, setValue] = useState('')
    const [applyTo, setApplyTo] = useState<'price' | 'costPrice' | 'both'>('both')
    const [stockAdjustment, setStockAdjustment] = useState<'add' | 'subtract' | 'set'>('add')
    const [stockValue, setStockValue] = useState('')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        switch (actionType) {
            case 'category':
                if (!categoryId) {
                    alert('Please select a category')
                    return
                }
                onConfirm({ categoryId })
                break

            case 'supplier':
                onConfirm({ supplierId: supplierId || null })
                break

            case 'prices':
                if (!value || parseFloat(value) <= 0) {
                    alert('Please enter a valid percentage')
                    return
                }
                onConfirm({ adjustmentType, value: parseFloat(value), applyTo })
                break

            case 'stock':
                if (!stockValue || parseInt(stockValue) < 0) {
                    alert('Please enter a valid quantity')
                    return
                }
                onConfirm({ adjustmentType: stockAdjustment, value: parseInt(stockValue) })
                break

            case 'activate':
                onConfirm({ isActive: true })
                break

            case 'deactivate':
                onConfirm({ isActive: false })
                break

            case 'delete':
                if (
                    confirm(
                        `Are you sure you want to delete ${selectedCount} product(s)? This action cannot be undone.`
                    )
                ) {
                    onConfirm({})
                }
                break
        }
    }

    const getTitleAndContent = () => {
        switch (actionType) {
            case 'category':
                return {
                    title: 'Bulk Edit Category',
                    content: (
                        <div className="space-y-4">
                            <p className="font-bold">
                                Change category for {selectedCount} selected product(s)
                            </p>
                            <Select
                                label="New Category"
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                options={[
                                    { value: '', label: 'Select Category' },
                                    ...categories.map((cat) => ({ value: cat.id, label: cat.name })),
                                ]}
                                required
                            />
                        </div>
                    ),
                }

            case 'supplier':
                return {
                    title: 'Bulk Edit Supplier',
                    content: (
                        <div className="space-y-4">
                            <p className="font-bold">
                                Change supplier for {selectedCount} selected product(s)
                            </p>
                            <Select
                                label="New Supplier"
                                value={supplierId}
                                onChange={(e) => setSupplierId(e.target.value)}
                                options={[
                                    { value: '', label: 'No Supplier' },
                                    ...suppliers.map((sup) => ({ value: sup.id, label: sup.name })),
                                ]}
                            />
                        </div>
                    ),
                }

            case 'prices':
                return {
                    title: 'Bulk Adjust Prices',
                    content: (
                        <div className="space-y-4">
                            <p className="font-bold">
                                Adjust prices for {selectedCount} selected product(s)
                            </p>

                            <div className="grid grid-cols-2 gap-4">
                                <Select
                                    label="Action"
                                    value={adjustmentType}
                                    onChange={(e) => setAdjustmentType(e.target.value as 'increase' | 'decrease')}
                                    options={[
                                        { value: 'increase', label: 'Increase' },
                                        { value: 'decrease', label: 'Decrease' },
                                    ]}
                                />

                                <Input
                                    label="Percentage (%)"
                                    type="number"
                                    step="0.01"
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    placeholder="e.g., 10"
                                    required
                                />
                            </div>

                            <Select
                                label="Apply To"
                                value={applyTo}
                                onChange={(e) => setApplyTo(e.target.value as 'price' | 'costPrice' | 'both')}
                                options={[
                                    { value: 'both', label: 'Both Prices' },
                                    { value: 'price', label: 'Retail Price Only' },
                                    { value: 'costPrice', label: 'Cost Price Only' },
                                ]}
                            />
                        </div>
                    ),
                }

            case 'stock':
                return {
                    title: 'Bulk Adjust Stock',
                    content: (
                        <div className="space-y-4">
                            <p className="font-bold">
                                Adjust stock for {selectedCount} selected product(s)
                            </p>

                            <Select
                                label="Adjustment Type"
                                value={stockAdjustment}
                                onChange={(e) => setStockAdjustment(e.target.value as 'add' | 'subtract' | 'set')}
                                options={[
                                    { value: 'add', label: 'Add' },
                                    { value: 'subtract', label: 'Subtract' },
                                    { value: 'set', label: 'Set To' },
                                ]}
                            />

                            <Input
                                label="Quantity"
                                type="number"
                                value={stockValue}
                                onChange={(e) => setStockValue(e.target.value)}
                                placeholder="e.g., 50"
                                required
                            />
                        </div>
                    ),
                }

            case 'activate':
                return {
                    title: 'Bulk Activate Products',
                    content: (
                        <div className="space-y-4">
                            <p className="font-bold">
                                Activate {selectedCount} selected product(s)?
                            </p>
                            <p className="text-sm">
                                This will make these products active and available for sale.
                            </p>
                        </div>
                    ),
                }

            case 'deactivate':
                return {
                    title: 'Bulk Deactivate Products',
                    content: (
                        <div className="space-y-4">
                            <p className="font-bold">
                                Deactivate {selectedCount} selected product(s)?
                            </p>
                            <p className="text-sm">
                                This will make these products inactive and unavailable for sale.
                            </p>
                        </div>
                    ),
                }

            case 'delete':
                return {
                    title: 'Bulk Delete Products',
                    content: (
                        <div className="space-y-4">
                            <div className="bg-red-100 border-4 border-red-500 p-4">
                                <p className="font-bold text-red-800">⚠️ WARNING</p>
                                <p className="text-red-800">
                                    You are about to delete {selectedCount} product(s). This action CANNOT be undone!
                                </p>
                            </div>
                        </div>
                    ),
                }

            default:
                return { title: '', content: null }
        }
    }

    const { title, content } = getTitleAndContent()

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <form onSubmit={handleSubmit} className="space-y-6">
                {content}

                <div className="flex gap-4 pt-4">
                    <Button type="submit" className="flex-1" disabled={isLoading}>
                        {isLoading ? 'Processing...' : 'Apply Changes'}
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                        className="flex-1"
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                </div>
            </form>
        </Modal>
    )
}
