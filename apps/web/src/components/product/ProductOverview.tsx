import Card from '../Card'

interface ProductOverviewProps {
  product: any
}

export default function ProductOverview({ product }: ProductOverviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-black mb-4">Description</h3>
          <Card className="bg-yellow-50 min-h-[100px]">
            <p className="font-medium whitespace-pre-wrap">{product.description || 'No description provided.'}</p>
          </Card>
        </div>

        <div>
          <h3 className="text-xl font-black mb-4">Pricing Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border-2 border-black bg-white">
              <div className="text-xs font-bold text-gray-500 uppercase">Cost Price</div>
              <div className="text-2xl font-black">${product.costPrice.toFixed(2)}</div>
            </div>
            <div className="p-4 border-2 border-black bg-white">
              <div className="text-xs font-bold text-gray-500 uppercase">Retail Price</div>
              <div className="text-2xl font-black">${product.price.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-black mb-4">Inventory Settings</h3>
          <div className="grid grid-cols-2 gap-4">
             <div className="p-4 border-2 border-black bg-white">
              <div className="text-xs font-bold text-gray-500 uppercase">Min Stock (Alert)</div>
              <div className="text-2xl font-black text-red-500">{product.minStock}</div>
            </div>
            <div className="p-4 border-2 border-black bg-white">
              <div className="text-xs font-bold text-gray-500 uppercase">Max Stock</div>
              <div className="text-2xl font-black">{product.maxStock || '∞'}</div>
            </div>
            <div className="p-4 border-2 border-black bg-white col-span-2">
              <div className="text-xs font-bold text-gray-500 uppercase">Barcode</div>
              <div className="text-xl font-mono font-bold mt-1">{product.barcode || 'N/A'}</div>
            </div>
          </div>
        </div>

        <div>
           <h3 className="text-xl font-black mb-4">Supplier Info</h3>
           {product.supplier ? (
             <Card>
               <div className="font-bold text-lg">{product.supplier.name}</div>
               <div className="text-sm mt-2 space-y-1">
                 {product.supplier.email && <div>✉️ {product.supplier.email}</div>}
                 {product.supplier.phone && <div>📞 {product.supplier.phone}</div>}
                 {product.supplier.address && <div>📍 {product.supplier.address}</div>}
               </div>
             </Card>
           ) : (
             <div className="p-4 border-2 border-dashed border-gray-400 text-gray-500 font-bold text-center">
               No supplier linked
             </div>
           )}
        </div>
      </div>
    </div>
  )
}
