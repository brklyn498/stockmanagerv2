import { useState, useEffect } from 'react'
import Button from './Button'
import Input from './Input'
import Select from './Select'
import MultiSelect from './MultiSelect'

export interface FilterState {
    search: string
    categories: string[]
    suppliers: string[]
    stockStatus: string
    priceMin: string
    priceMax: string
    isActive: string
    dateFrom: string
    dateTo: string
}

interface FilterPanelProps {
    filters: FilterState
    onFiltersChange: (filters: FilterState) => void
    categories: Array<{ id: string; name: string }>
    suppliers: Array<{ id: string; name: string }>
    onSaveFilter?: (name: string, filters: FilterState) => void
    savedFilters?: Array<{ name: string; filters: FilterState }>
    onLoadFilter?: (filters: FilterState) => void
    onDeleteFilter?: (name: string) => void
}

export default function FilterPanel({
    filters,
    onFiltersChange,
    categories,
    suppliers,
    onSaveFilter,
    savedFilters = [],
    onLoadFilter,
    onDeleteFilter,
}: FilterPanelProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [showSaveDialog, setShowSaveDialog] = useState(false)
    const [filterName, setFilterName] = useState('')

    // Internal state for manual application
    const [localFilters, setLocalFilters] = useState<FilterState>(filters)
    const [isDirty, setIsDirty] = useState(false)

    // Sync local state when parent filters change (e.g. from URL load or saved filter load)
    useEffect(() => {
        setLocalFilters(filters)
        setIsDirty(false)
    }, [filters])

    const handleLocalChange = (updates: Partial<FilterState>) => {
        setLocalFilters(prev => {
            const newState = { ...prev, ...updates }
            // Check if different from applied filters
            const isDifferent = JSON.stringify(newState) !== JSON.stringify(filters)
            setIsDirty(isDifferent)
            return newState
        })
    }

    const handleApply = () => {
        onFiltersChange(localFilters)
        setIsDirty(false)
    }

    const handleClearAll = () => {
        const emptyState: FilterState = {
            search: '',
            categories: [],
            suppliers: [],
            stockStatus: 'all',
            priceMin: '',
            priceMax: '',
            isActive: 'all',
            dateFrom: '',
            dateTo: '',
        }
        setLocalFilters(emptyState)
        onFiltersChange(emptyState)
        setIsDirty(false)
    }

    const handleSave = () => {
        if (filterName.trim() && onSaveFilter) {
            onSaveFilter(filterName.trim(), localFilters) // Save what's currently in the form
            setFilterName('')
            setShowSaveDialog(false)
        }
    }

    const hasActiveFilters =
        filters.search ||
        filters.categories.length > 0 ||
        filters.suppliers.length > 0 ||
        filters.stockStatus !== 'all' ||
        filters.priceMin ||
        filters.priceMax ||
        filters.isActive !== 'all' ||
        filters.dateFrom ||
        filters.dateTo

    return (
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-6">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b-4 border-black">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold">FILTERS</h2>
                    {hasActiveFilters && (
                        <span className="bg-yellow-400 px-3 py-1 border-2 border-black font-bold text-sm">
                            ACTIVE
                        </span>
                    )}
                </div>
                <div className="flex gap-3">
                    {hasActiveFilters && (
                        <Button variant="secondary" onClick={handleClearAll}>
                            Clear All
                        </Button>
                    )}
                    <Button variant="secondary" onClick={() => setIsExpanded(!isExpanded)}>
                        {isExpanded ? 'Hide Filters' : 'Show Filters'}
                    </Button>
                </div>
            </div>

            {/* Expandable Content */}
            {isExpanded && (
                <div className="p-6 space-y-6">
                    {/* Quick Search */}
                    <div>
                        <Input
                            label="Search"
                            placeholder="Search by name, SKU, barcode..."
                            value={localFilters.search}
                            onChange={(e) => handleLocalChange({ search: e.target.value })}
                        />
                    </div>

                    {/* Multi-Select Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <MultiSelect
                            label="Categories"
                            placeholder="Select categories..."
                            options={categories.map((cat) => ({ value: cat.id, label: cat.name }))}
                            value={localFilters.categories}
                            onChange={(categories) => handleLocalChange({ categories })}
                        />

                        <MultiSelect
                            label="Suppliers"
                            placeholder="Select suppliers..."
                            options={suppliers.map((sup) => ({ value: sup.id, label: sup.name }))}
                            value={localFilters.suppliers}
                            onChange={(suppliers) => handleLocalChange({ suppliers })}
                        />
                    </div>

                    {/* Stock Status & Active Status */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                            label="Stock Status"
                            value={localFilters.stockStatus}
                            onChange={(e) => handleLocalChange({ stockStatus: e.target.value })}
                            options={[
                                { value: 'all', label: 'All Stock Levels' },
                                { value: 'out', label: 'Out of Stock' },
                                { value: 'low', label: 'Low Stock' },
                                { value: 'normal', label: 'Normal Stock' },
                                { value: 'overstocked', label: 'Overstocked' },
                            ]}
                        />

                        <div>
                            <label className="block font-bold mb-2">Active Status</label>
                            <div className="flex gap-6 items-center h-[50px]">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="isActive"
                                        value="all"
                                        checked={localFilters.isActive === 'all'}
                                        onChange={(e) => handleLocalChange({ isActive: e.target.value })}
                                        className="w-5 h-5 border-4 border-black cursor-pointer"
                                    />
                                    <span className="font-bold">All</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="isActive"
                                        value="true"
                                        checked={localFilters.isActive === 'true'}
                                        onChange={(e) => handleLocalChange({ isActive: e.target.value })}
                                        className="w-5 h-5 border-4 border-black cursor-pointer"
                                    />
                                    <span className="font-bold">Active</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="isActive"
                                        value="false"
                                        checked={localFilters.isActive === 'false'}
                                        onChange={(e) => handleLocalChange({ isActive: e.target.value })}
                                        className="w-5 h-5 border-4 border-black cursor-pointer"
                                    />
                                    <span className="font-bold">Inactive</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Price Range */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Min Price ($)"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={localFilters.priceMin}
                            onChange={(e) => handleLocalChange({ priceMin: e.target.value })}
                        />

                        <Input
                            label="Max Price ($)"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={localFilters.priceMax}
                            onChange={(e) => handleLocalChange({ priceMax: e.target.value })}
                        />
                    </div>

                    {/* Date Range */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="From Date"
                            type="date"
                            value={localFilters.dateFrom}
                            onChange={(e) => handleLocalChange({ dateFrom: e.target.value })}
                        />

                        <Input
                            label="To Date"
                            type="date"
                            value={localFilters.dateTo}
                            onChange={(e) => handleLocalChange({ dateTo: e.target.value })}
                        />
                    </div>

                    {/* Saved Filters & Actions */}
                    <div className="border-t-4 border-black pt-6 flex flex-wrap gap-3 items-end">
                        <div className="flex-grow">
                             {savedFilters.length > 0 && onLoadFilter && (
                                <div className="min-w-[200px]">
                                    <label className="block font-bold mb-2">Saved Filters</label>
                                    <div className="flex gap-2">
                                        <select
                                            className="flex-1 px-4 py-2 bg-white border-4 border-black font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                                            onChange={(e) => {
                                                const filter = savedFilters.find((f) => f.name === e.target.value)
                                                if (filter) {
                                                    onLoadFilter(filter.filters)
                                                    // Also update local state immediately so UI reflects loaded filter
                                                    setLocalFilters(filter.filters)
                                                }
                                                e.target.value = ''
                                            }}
                                            defaultValue=""
                                        >
                                            <option value="" disabled>
                                                Load saved filter...
                                            </option>
                                            {savedFilters.map((filter) => (
                                                <option key={filter.name} value={filter.name}>
                                                    {filter.name}
                                                </option>
                                            ))}
                                        </select>
                                        {onDeleteFilter && (
                                            <select
                                                className="px-4 py-2 bg-red-500 text-white border-4 border-black font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                                                onChange={(e) => {
                                                    if (e.target.value && confirm(`Delete filter "${e.target.value}"?`)) {
                                                        onDeleteFilter(e.target.value)
                                                    }
                                                    e.target.value = ''
                                                }}
                                                defaultValue=""
                                            >
                                                <option value="" disabled>
                                                    Delete...
                                                </option>
                                                {savedFilters.map((filter) => (
                                                    <option key={filter.name} value={filter.name}>
                                                        {filter.name}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            {onSaveFilter && (
                                <Button variant="secondary" onClick={() => setShowSaveDialog(true)}>
                                    Save Filter
                                </Button>
                            )}
                            <Button
                                onClick={handleApply}
                                disabled={!isDirty}
                                className={!isDirty ? 'opacity-50 cursor-not-allowed' : 'animate-pulse'}
                            >
                                Apply Filters
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Save Filter Dialog */}
            {showSaveDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 w-96">
                        <h3 className="text-xl font-bold mb-4">Save Filter</h3>
                        <Input
                            label="Filter Name"
                            value={filterName}
                            onChange={(e) => setFilterName(e.target.value)}
                            placeholder="e.g., Low Stock Electronics"
                        />
                        <div className="flex gap-3 mt-4">
                            <Button onClick={handleSave}>Save</Button>
                            <Button variant="secondary" onClick={() => setShowSaveDialog(false)}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
