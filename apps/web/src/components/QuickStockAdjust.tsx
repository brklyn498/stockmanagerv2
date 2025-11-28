import { useState, useEffect } from 'react'
import Modal from './Modal'
import Input from './Input'
import Select from './Select'
import Button from './Button'

interface QuickStockAdjustProps {
    isOpen: boolean
    onClose: () => void
    product: {
        id: string
        name: string
        quantity: number
    } | null
    onConfirm: (data: {
        type: 'add' | 'remove' | 'set'
        quantity: number
        reason: string
        notes: string
    }) => void
    isLoading?: boolean
}

export default function QuickStockAdjust({
    isOpen,
    onClose,
    product,
    onConfirm,
    isLoading = false,
}: QuickStockAdjustProps) {
    const [type, setType] = useState<'add' | 'remove' | 'set'>('add')
    const [quantity, setQuantity] = useState('')
    const [reason, setReason] = useState('')
    const [notes, setNotes] = useState('')

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setType('add')
            setQuantity('')
            setReason('')
            setNotes('')
        }
    }, [isOpen])

    if (!product) return null

    const currentStock = product.quantity
    const adjustQty = parseInt(quantity) || 0

    let newStock = currentStock
    if (type === 'add') newStock += adjustQty
    if (type === 'remove') newStock -= adjustQty
    if (type === 'set') newStock = adjustQty

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!quantity || parseInt(quantity) < 0) return

        onConfirm({
            type,
            quantity: parseInt(quantity),
            reason,
            notes,
        })
    }

    const reasonOptions = [
        { value: '', label: 'Select a reason...' },
        { value: 'shipment', label: 'Received shipment' },
        { value: 'count', label: 'Inventory count' },
        { value: 'damaged', label: 'Damaged' },
        { value: 'returned', label: 'Returned' },
        { value: 'other', label: 'Other' },
    ]

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Adjust Stock: ${product.name}`}
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-gray-100 p-4 border-2 border-black">
                    <div className="text-lg font-bold mb-2">Current Stock: {currentStock}</div>
                    <div className="flex items-center gap-2 text-xl">
                        <span>New Stock:</span>
                        <span className={`font-black ${newStock < currentStock ? 'text-red-600' :
                                newStock > currentStock ? 'text-green-600' : 'text-black'
                            }`}>
                            {newStock}
                        </span>
                        <span className="text-sm text-gray-500 font-normal">
                            ({newStock > currentStock ? '+' : ''}{newStock - currentStock})
                        </span>
                    </div>
                </div>

                <div>
                    <label className="block font-bold mb-2">Adjustment Type</label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="type"
                                checked={type === 'add'}
                                onChange={() => setType('add')}
                                className="w-5 h-5 accent-black"
                            />
                            <span className="font-bold">Add (+)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="type"
                                checked={type === 'remove'}
                                onChange={() => setType('remove')}
                                className="w-5 h-5 accent-black"
                            />
                            <span className="font-bold">Remove (-)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="type"
                                checked={type === 'set'}
                                onChange={() => setType('set')}
                                className="w-5 h-5 accent-black"
                            />
                            <span className="font-bold">Set (=)</span>
                        </label>
                    </div>
                </div>

                <Input
                    label="Quantity"
                    type="number"
                    min="0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                    autoFocus
                />

                <Select
                    label="Reason"
                    options={reasonOptions}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                />

                <Input
                    label="Notes (Optional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional details..."
                />

                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading || !quantity}>
                        {isLoading ? 'Saving...' : 'Save Adjustment'}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}
