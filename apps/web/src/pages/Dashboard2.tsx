import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'
import Card from '../components/Card'
import Badge from '../components/Badge'
import api from '../services/api'

interface DashboardStats {
  totalProducts: number
  lowStockCount: number
  pendingOrdersCount: number
  todayMovementsCount: number
  totalStockValue: number
}

interface CategoryData {
  name: string
  count: number
}

interface Product {
  id: string
  sku: string
  name: string
  quantity: number
  minStock: number
  category: { name: string }
}

interface Movement {
  id: string
  type: string
  quantity: number
  createdAt: string
  product: {
    name: string
    sku: string
  }
  user: {
    name: string
  }
}

export default function Dashboard2() {
  const navigate = useNavigate()

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/stats')
      return response.data as {
        stats: DashboardStats
        categoryDistribution: CategoryData[]
      }
    },
  })

  const { data: lowStockData } = useQuery({
    queryKey: ['low-stock-alerts'],
    queryFn: async () => {
      const response = await api.get('/dashboard/low-stock')
      return response.data as { products: Product[] }
    },
  })

  const { data: recentMovementsData } = useQuery({
    queryKey: ['recent-movements'],
    queryFn: async () => {
      const response = await api.get('/dashboard/recent-movements')
      return response.data as { movements: Movement[] }
    },
  })

  const stats = statsData?.stats
  const categoryDistribution = statsData?.categoryDistribution || []
  const lowStockProducts = lowStockData?.products || []
  const recentMovements = recentMovementsData?.movements || []

  // Calculate movement trend data from recent movements
  const movementTrend = recentMovements
    .slice(0, 7)
    .reverse()
    .map((movement, index) => ({
      name: `Day ${index + 1}`,
      movements: movement.quantity,
      date: new Date(movement.createdAt).toLocaleDateString(),
    }))

  const getStockLevelBadge = (quantity: number, minStock: number) => {
    if (quantity === 0) {
      return <Badge variant="danger">Out of Stock</Badge>
    }
    if (quantity <= minStock) {
      return <Badge variant="danger">Critical</Badge>
    }
    if (quantity <= minStock * 1.5) {
      return <Badge variant="warning">Low</Badge>
    }
    return <Badge variant="success">OK</Badge>
  }

  const getMovementTypeBadge = (type: string) => {
    const badges: Record<string, JSX.Element> = {
      IN: <Badge variant="success">In</Badge>,
      OUT: <Badge variant="danger">Out</Badge>,
      ADJUSTMENT: <Badge variant="info">Adj</Badge>,
      RETURN: <Badge variant="warning">Return</Badge>,
      DAMAGED: <Badge variant="danger">Damaged</Badge>,
    }
    return badges[type] || <Badge variant="info">{type}</Badge>
  }

  return (
    <div>
      {/* Header Section */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold mb-2">Alternative Dashboard</h1>
          <p className="text-gray-700 font-medium">
            Modern view of your inventory metrics
          </p>
        </div>
        <div className="flex gap-3">
          <button
            className="neo-btn-secondary text-sm"
            onClick={() => window.location.reload()}
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* Top Row - Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-yellow-300 to-yellow-400 hover:translate-x-1 hover:translate-y-1 transition-transform cursor-pointer">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xs font-bold mb-1 uppercase tracking-wider">
                Products
              </h3>
              <p className="text-3xl font-bold">
                {statsLoading ? '...' : stats?.totalProducts || 0}
              </p>
            </div>
            <div className="text-2xl">📦</div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-red-300 to-rose-400 hover:translate-x-1 hover:translate-y-1 transition-transform cursor-pointer">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xs font-bold mb-1 uppercase tracking-wider">
                Low Stock
              </h3>
              <p className="text-3xl font-bold">
                {statsLoading ? '...' : stats?.lowStockCount || 0}
              </p>
            </div>
            <div className="text-2xl">⚠️</div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-400 to-purple-500 text-white hover:translate-x-1 hover:translate-y-1 transition-transform cursor-pointer">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xs font-bold mb-1 uppercase tracking-wider">
                Pending Orders
              </h3>
              <p className="text-3xl font-bold">
                {statsLoading ? '...' : stats?.pendingOrdersCount || 0}
              </p>
            </div>
            <div className="text-2xl">🛒</div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-300 to-cyan-400 hover:translate-x-1 hover:translate-y-1 transition-transform cursor-pointer">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xs font-bold mb-1 uppercase tracking-wider">
                Today's Activity
              </h3>
              <p className="text-3xl font-bold">
                {statsLoading ? '...' : stats?.todayMovementsCount || 0}
              </p>
            </div>
            <div className="text-2xl">📊</div>
          </div>
        </Card>
      </div>

      {/* Middle Row - Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Category Bar Chart */}
        <Card>
          <h2 className="text-xl font-bold mb-4">Products by Category</h2>
          {categoryDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={categoryDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#000" />
                <XAxis
                  dataKey="name"
                  stroke="#000"
                  style={{ fontWeight: 'bold' }}
                />
                <YAxis stroke="#000" style={{ fontWeight: 'bold' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '3px solid #000',
                    borderRadius: 0,
                    fontWeight: 'bold',
                  }}
                />
                <Bar dataKey="count" fill="#FACC15" stroke="#000" strokeWidth={2} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center py-8 text-gray-600 font-medium">
              No categories yet
            </p>
          )}
        </Card>

        {/* Movement Trend */}
        <Card>
          <h2 className="text-xl font-bold mb-4">Recent Activity Trend</h2>
          {movementTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={movementTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#000" />
                <XAxis
                  dataKey="name"
                  stroke="#000"
                  style={{ fontWeight: 'bold' }}
                />
                <YAxis stroke="#000" style={{ fontWeight: 'bold' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '3px solid #000',
                    borderRadius: 0,
                    fontWeight: 'bold',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="movements"
                  stroke="#8B5CF6"
                  strokeWidth={3}
                  dot={{ fill: '#8B5CF6', r: 6, stroke: '#000', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center py-8 text-gray-600 font-medium">
              No movement data available
            </p>
          )}
        </Card>
      </div>

      {/* Bottom Row - Tables and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Critical Alerts - 1/3 width */}
        <Card className="bg-red-50">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span>⚠️</span> Critical Alerts
          </h2>
          {lowStockProducts.length > 0 ? (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {lowStockProducts.slice(0, 5).map((product) => (
                <div
                  key={product.id}
                  className="bg-white border-3 border-black p-2 cursor-pointer hover:bg-yellow-50 transition-colors"
                  onClick={() => navigate('/products')}
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-bold text-sm">{product.name}</p>
                    {getStockLevelBadge(product.quantity, product.minStock)}
                  </div>
                  <p className="text-xs text-gray-600 font-medium">
                    Stock: <span className="text-red-600 font-bold">{product.quantity}</span> / Min: {product.minStock}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-gray-600 font-medium text-sm">
              All good! ✓
            </p>
          )}
        </Card>

        {/* Recent Movements - 2/3 width */}
        <Card className="lg:col-span-2">
          <h2 className="text-xl font-bold mb-4">Latest Movements</h2>
          {recentMovements.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-3 border-black">
                    <th className="text-left py-2 px-3 font-bold">Time</th>
                    <th className="text-left py-2 px-3 font-bold">Product</th>
                    <th className="text-left py-2 px-3 font-bold">Type</th>
                    <th className="text-right py-2 px-3 font-bold">Qty</th>
                    <th className="text-left py-2 px-3 font-bold">User</th>
                  </tr>
                </thead>
                <tbody>
                  {recentMovements.slice(0, 6).map((movement, index) => (
                    <tr
                      key={movement.id}
                      className={`border-b-2 border-black ${
                        index % 2 === 0 ? 'bg-cyan-50' : 'bg-white'
                      }`}
                    >
                      <td className="py-2 px-3 font-medium">
                        {new Date(movement.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="py-2 px-3 font-medium">
                        {movement.product.name}
                      </td>
                      <td className="py-2 px-3">
                        {getMovementTypeBadge(movement.type)}
                      </td>
                      <td
                        className={`py-2 px-3 font-bold text-right ${
                          movement.type === 'IN' ||
                          movement.type === 'RETURN'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {movement.type === 'IN' || movement.type === 'RETURN'
                          ? '+'
                          : '-'}
                        {movement.quantity}
                      </td>
                      <td className="py-2 px-3 font-medium">
                        {movement.user.name}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center py-8 text-gray-600 font-medium">
              No movements yet
            </p>
          )}
        </Card>
      </div>

      {/* Quick Actions Bar */}
      <Card className="bg-gradient-to-r from-yellow-200 via-cyan-200 to-purple-200">
        <div className="flex flex-wrap gap-3 items-center">
          <h2 className="text-lg font-bold mr-4">Quick Actions:</h2>
          <button
            className="neo-btn text-sm"
            onClick={() => navigate('/products?action=add')}
          >
            ➕ Add Product
          </button>
          <button
            className="neo-btn-secondary text-sm"
            onClick={() => navigate('/stock-movements?action=record')}
          >
            📝 Record Movement
          </button>
          <button
            className="neo-btn-secondary text-sm"
            onClick={() => navigate('/orders?action=create')}
          >
            🛒 New Order
          </button>
          <button
            className="neo-btn-secondary text-sm"
            onClick={() => navigate('/products')}
          >
            📋 View All Products
          </button>
        </div>
      </Card>
    </div>
  )
}
