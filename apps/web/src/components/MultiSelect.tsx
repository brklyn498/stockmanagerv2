import { useState, useRef, useEffect } from 'react'

interface Option {
    value: string
    label: string
}

interface MultiSelectProps {
    options: Option[]
    value: string[]
    onChange: (values: string[]) => void
    label?: string
    placeholder?: string
}

export default function MultiSelect({
    options,
    value,
    onChange,
    label,
    placeholder = 'Select...',
}: MultiSelectProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen])

    const filteredOptions = options.filter((option) =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleToggle = (optionValue: string) => {
        if (value.includes(optionValue)) {
            onChange(value.filter((v) => v !== optionValue))
        } else {
            onChange([...value, optionValue])
        }
    }

    const handleSelectAll = () => {
        if (value.length === options.length) {
            onChange([])
        } else {
            onChange(options.map((opt) => opt.value))
        }
    }

    const displayText =
        value.length === 0
            ? placeholder
            : value.length === 1
                ? options.find((opt) => opt.value === value[0])?.label || placeholder
                : `${value.length} selected`

    return (
        <div className="relative" ref={dropdownRef}>
            {label && <label className="block font-bold mb-2">{label}</label>}

            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-2 bg-white border-4 border-black font-bold text-left flex justify-between items-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
                <span className={value.length === 0 ? 'text-gray-500' : ''}>
                    {displayText}
                </span>
                <span>{isOpen ? '▲' : '▼'}</span>
            </button>

            {isOpen && (
                <div className="absolute z-50 mt-2 w-full bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-h-80 overflow-hidden flex flex-col">
                    {/* Search */}
                    <div className="p-3 border-b-4 border-black">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border-4 border-black font-bold"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>

                    {/* Select All */}
                    <div className="border-b-4 border-black">
                        <label className="flex items-center px-4 py-3 hover:bg-yellow-100 cursor-pointer font-bold">
                            <input
                                type="checkbox"
                                checked={value.length === options.length && options.length > 0}
                                onChange={handleSelectAll}
                                className="w-5 h-5 border-4 border-black mr-3 cursor-pointer"
                            />
                            <span>Select All</span>
                        </label>
                    </div>

                    {/* Options List */}
                    <div className="overflow-y-auto max-h-60">
                        {filteredOptions.length === 0 ? (
                            <div className="px-4 py-3 text-gray-500 font-bold">No options found</div>
                        ) : (
                            filteredOptions.map((option) => (
                                <label
                                    key={option.value}
                                    className="flex items-center px-4 py-3 hover:bg-yellow-100 cursor-pointer border-b-2 border-black last:border-b-0"
                                >
                                    <input
                                        type="checkbox"
                                        checked={value.includes(option.value)}
                                        onChange={() => handleToggle(option.value)}
                                        className="w-5 h-5 border-4 border-black mr-3 cursor-pointer"
                                    />
                                    <span className="font-bold">{option.label}</span>
                                </label>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
