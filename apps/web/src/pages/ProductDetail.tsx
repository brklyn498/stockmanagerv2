import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2 } from 'lucide-react'
import Button from '../components/Button'
import Card from '../components/Card'
import Badge from '../components/Badge'
import ProductImage from '../components/ProductImage'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'
import { useState } from 'react'
import ProductOverview from '../components/product/ProductOverview'
import ProductStockHistory from '../components/product/ProductStockHistory'
import ProductOrders from '../components/product/ProductOrders'
import ProductAnalytics from '../components/product/ProductAnalytics'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'orders' | 'analytics'>('overview')

  const { data: productData, isLoading, refetch } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data } = await api.get(`/products/${id}`)
      return data.product
    },
    enabled: !!id,
  })

  const { data: analyticsData } = useQuery({
    queryKey: ['product-analytics', id],
    queryFn: async () => {
      const { data } = await api.get(`/products/${id}/analytics`)
      return data.analytics
    },
    enabled: !!id,
  })

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen font-bold text-xl">Loading product...</div>
  }

  if (!productData) {
    return <div className="text-center py-10 font-bold text-xl">Product not found</div>
  }

  const stockStatus = (qty: number, min: number) => {
    if (qty === 0) return { label: 'Out of Stock', color: 'bg-red-500' }
    if (qty <= min) return { label: 'Low Stock', color: 'bg-red-400' }
    if (qty <= min * 1.5) return { label: 'Near Low', color: 'bg-orange-400' }
    return { label: 'Normal', color: 'bg-green-400' }
  }

  const status = stockStatus(productData.quantity, productData.minStock)
  const margin = productData.price > 0
    ? ((productData.price - productData.costPrice) / productData.price * 100).toFixed(1)
    : '0.0'

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={() => navigate('/products')} className="px-3">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight">{productData.name}</h1>
            <div className="flex gap-2 text-sm font-bold text-gray-600 mt-1">
              <span>SKU: {productData.sku}</span>
              <span>•</span>
              <span>{productData.category?.name}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate(`/products?edit=${id}`)}>
            <Edit className="w-4 h-4 mr-2" /> Edit
          </Button>
          <Button variant="danger" onClick={() => {
            if(confirm('Are you sure you want to delete this product?')) {
              // TODO: Implement delete
            }
          }}>
            <Trash2 className="w-4 h-4 mr-2" /> Delete
          </Button>
        </div>
      </div>

      {/* Main Info Block */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Image */}
        <div className="md:col-span-1">
          <ProductImage
            images={productData.images || []}
            alt={productData.name}
            productId={id}
            onImageDeleted={() => refetch()}
          />
        </div>

        {/* Right: Info & Metrics */}
        <div className="md:col-span-2 space-y-6">
           {/* Metrics Row */}
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <MetricCard label="Stock" value={`${productData.quantity} ${productData.unit}`} />
             <MetricCard label="Value" value={`$${(productData.quantity * productData.costPrice).toLocaleString()}`} />
             <MetricCard label="Retail Value" value={`$${(productData.quantity * productData.price).toLocaleString()}`} />
             <MetricCard label="Profit Margin" value={`${margin}%`} color={parseFloat(margin) > 30 ? 'text-green-600' : 'text-orange-600'} />

             <div className={`p-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${status.color}`}>
                <div className="text-xs font-bold uppercase tracking-wide opacity-80">Status</div>
                <div className="text-xl font-black mt-1">{status.label}</div>
             </div>

             <MetricCard label="Days of Stock" value={analyticsData?.daysOfStock || '...'} />
             <MetricCard label="Avg Daily Sales" value={analyticsData?.avgDailySales || '...'} />
             <MetricCard label="Total Sold" value={analyticsData?.totalSold || '0'} />
           </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
        <div className="flex border-b-4 border-black overflow-x-auto">
          <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>Overview</TabButton>
          <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')}>Stock History</TabButton>
          <TabButton active={activeTab === 'orders'} onClick={() => setActiveTab('orders')}>Orders</TabButton>
          <TabButton active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')}>Analytics</TabButton>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && <ProductOverview product={productData} />}
          {activeTab === 'history' && <ProductStockHistory productId={id} />}
          {activeTab === 'orders' && <ProductOrders productId={id} />}
          {activeTab === 'analytics' && <ProductAnalytics productId={id} analytics={analyticsData} />}
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value, color = 'text-black' }: { label: string, value: string | number, color?: string }) {
  return (
    <div className="bg-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="text-xs font-bold uppercase tracking-wide text-gray-500">{label}</div>
      <div className={`text-xl font-black mt-1 ${color}`}>{value}</div>
    </div>
  )
}

function TabButton({ children, active, onClick }: { children: React.ReactNode, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-4 font-black uppercase text-sm tracking-wider hover:bg-yellow-100 transition-colors whitespace-nowrap ${active ? 'bg-yellow-400 border-r-4 border-black' : 'border-r-4 border-black last:border-r-0'}`}
    >
      {children}
    </button>
  )
}
