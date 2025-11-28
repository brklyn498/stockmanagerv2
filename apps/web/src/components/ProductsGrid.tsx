import ProductCard from './ProductCard'

interface Product {
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

interface ProductsGridProps {
    products: Product[]
    onEdit: (product: Product) => void
    onDelete: (id: string) => void
    onQuickStock: (product: Product) => void
    onDuplicate: (product: Product) => void
    isLoading?: boolean
}

export default function ProductsGrid({ products, onEdit, onDelete, onQuickStock, onDuplicate, isLoading }: ProductsGridProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                    <div
                        key={i}
                        className="bg-gray-200 border-4 border-black h-96 animate-pulse"
                    />
                ))}
            </div>
        )
    }

    if (products.length === 0) {
        return (
            <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-12 text-center">
                <p className="text-2xl font-bold text-gray-600">No products found</p>
                <p className="text-gray-500 mt-2">Try adjusting your filters or add a new product</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
                <ProductCard
                    key={product.id}
                    product={product}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onQuickStock={onQuickStock}
                    onDuplicate={onDuplicate}
                />
            ))}
        </div>
    )
}
