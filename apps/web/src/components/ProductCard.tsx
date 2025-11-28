import { useNavigate } from 'react-router-dom'
import Button from './Button'
import Badge from './Badge'

interface ProductCardProps {
    product: {
        id: string
        sku: string
        name: string
        description?: string
        barcode?: string
        price: number
        costPrice: number
        quantity: number
        minStock: number
        maxStock?: number
        unit: string
        isActive: boolean
        imageUrl?: string
        images: {
            id: string
            url: string
            isPrimary: boolean
        }[]
        category: {
            id: string
            name: string
        }
        supplier?: {
            id: string
            name: string
        }
    }
    onEdit: (product: any) => void
    onDelete: (id: string) => void
}

export default function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
    const navigate = useNavigate()

    const getStockBadge = () => {
        const { quantity, minStock, maxStock } = product

        if (quantity === 0) {
            return <Badge variant="danger">Out</Badge>
        }
        if (quantity <= minStock) {
            return <Badge variant="danger">Low</Badge>
        }
        if (maxStock && quantity > maxStock) {
            return <Badge variant="info">Over</Badge>
        }
        return <Badge variant="success">Normal</Badge>
    }

    // Get primary image or first image
    const primaryImage = product.images?.find(img => img.isPrimary)?.url ||
        product.images?.[0]?.url ||
        product.imageUrl

    return (
        <div
            className="group bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
            onClick={() => navigate(`/products/${product.id}`)}
        >
            {/* Image Section */}
            <div className="relative aspect-square bg-gray-100 border-b-4 border-black overflow-hidden">
                {primaryImage ? (
                    <img
                        src={`http://localhost:3001${primaryImage}`}
                        alt={product.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <span className="text-6xl">📦</span>
                    </div>
                )}

                {/* Hover Actions Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                        variant="primary"
                        onClick={(e) => {
                            e.stopPropagation()
                            onEdit(product)
                        }}
                        className="text-sm py-1 px-3"
                    >
                        Edit
                    </Button>
                    <Button
                        variant="danger"
                        onClick={(e) => {
                            e.stopPropagation()
                            if (confirm(`Delete ${product.name}?`)) {
                                onDelete(product.id)
                            }
                        }}
                        className="text-sm py-1 px-3"
                    >
                        Delete
                    </Button>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-4 space-y-2">
                {/* Product Name */}
                <h3 className="font-bold text-lg line-clamp-2 min-h-[3.5rem]">
                    {product.name}
                </h3>

                {/* SKU */}
                <p className="text-sm text-gray-600 font-medium">
                    SKU: {product.sku}
                </p>

                {/* Category */}
                <p className="text-sm text-gray-600 font-medium">
                    {product.category.name}
                </p>

                {/* Price */}
                <p className="text-2xl font-black">
                    ${product.price.toFixed(2)}
                </p>

                {/* Stock Row */}
                <div className="flex items-center justify-between pt-2 border-t-2 border-black">
                    <div>
                        <p className="text-xs font-bold text-gray-600 uppercase">Stock</p>
                        <p className="text-lg font-black">{product.quantity}</p>
                    </div>
                    <div>
                        {getStockBadge()}
                    </div>
                </div>
            </div>
        </div>
    )
}
