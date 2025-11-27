import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
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

export default function Dashboard() {
  const navigate = useNavigate()

  const { data: statsData, isLoading: statsLoading, isError: statsError, error: statsErrorDetails, refetch: refetchStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/stats')
      return response.data as {
        stats: DashboardStats
        categoryDistribution: CategoryData[]
      }
    },
  })

  const { data: lowStockData, isError: lowStockError } = useQuery({
    queryKey: ['low-stock-alerts'],
    queryFn: async () => {
      const response = await api.get('/dashboard/low-stock')
      return response.data as { products: Product[] }
    },
  })

  const { data: recentMovementsData, isError: movementsError } = useQuery({
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

  // Colors for pie chart - using Neobrutalism palette
  const COLORS = ['#FACC15', '#A855F7', '#22D3EE', '#FB7185', '#4ADE80']

  const getStockLevelBadge = (quantity: number, minStock: number) => {
    if (quantity === 0) {
      return <Badge variant="danger">Out of Stock</Badge>
    }
    if (quantity <= minStock) {
      return <Badge variant="danger">Low Stock</Badge>
    }
    if (quantity <= minStock * 1.5) {
      return <Badge variant="warning">Near Low</Badge>
    }
    return <Badge variant="success">Normal</Badge>
  }

  const getMovementTypeBadge = (type: string) => {
    const badges: Record<string, JSX.Element> = {
      IN: <Badge variant="success">Stock In</Badge>,
      OUT: <Badge variant="danger">Stock Out</Badge>,
      ADJUSTMENT: <Badge variant="info">Adjustment</Badge>,
      RETURN: <Badge variant="warning">Return</Badge>,
      DAMAGED: <Badge variant="danger">Damaged</Badge>,
    }
    return badges[type] || <Badge variant="info">{type}</Badge>
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-700 font-medium">
          Welcome to your stock management system
        </p>
      </div>

      {/* Connection Error Banner */}
      {statsError && (
        <div className="mb-6 bg-red-500 border-4 border-black p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⚠️</span>
              <div>
                <h3 className="text-white font-bold text-lg">Connection Error</h3>
                <p className="text-white font-medium">
                  Unable to load dashboard data. {statsErrorDetails instanceof Error ? statsErrorDetails.message : 'Please check your connection.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => refetchStats()}
              className="neo-btn bg-white hover:bg-gray-100"
            >
              🔄 Retry
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-yellow-400">
          <h3 className="text-sm font-bold mb-2">Total Products</h3>
          <p className="text-4xl font-bold">
            {statsLoading ? '...' : statsError ? '—' : stats?.totalProducts || 0}
          </p>
        </Card>

        <Card className="bg-cyan-400">
          <h3 className="text-sm font-bold mb-2">Low Stock Items</h3>
          <p className="text-4xl font-bold">
            {statsLoading ? '...' : statsError ? '—' : stats?.lowStockCount || 0}
          </p>
        </Card>

        <Card className="bg-purple-500 text-white">
          <h3 className="text-sm font-bold mb-2">Pending Orders</h3>
          <p className="text-4xl font-bold">
            {statsLoading ? '...' : statsError ? '—' : stats?.pendingOrdersCount || 0}
          </p>
        </Card>

        <Card className="bg-rose-400">
          <h3 className="text-sm font-bold mb-2">Today's Movements</h3>
          <p className="text-4xl font-bold">
            {statsLoading ? '...' : statsError ? '—' : stats?.todayMovementsCount || 0}
          </p>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <button
            className="neo-btn"
            onClick={() => navigate('/products?action=add')}
          >
            Add Product
          </button>
          <button
            className="neo-btn-secondary"
            onClick={() => navigate('/stock-movements?action=record')}
          >
            Record Movement
          </button>
          <button
            className="neo-btn-secondary"
            onClick={() => navigate('/orders?action=create')}
          >
            Create Order
          </button>
        </div>
      </Card>

      {/* Charts and Alerts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Category Distribution Chart */}
        <Card>
          <h2 className="text-2xl font-bold mb-4">Category Distribution</h2>
          {categoryDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                  stroke="#000000"
                  strokeWidth={3}
                >
                  {categoryDistribution.map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '4px solid #000',
                    borderRadius: 0,
                    fontWeight: 'bold',
                  }}
                />
                <Legend
                  wrapperStyle={{
                    fontWeight: 'bold',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center py-8 text-gray-600 font-medium">
              No categories yet
            </p>
          )}
        </Card>

        {/* Low Stock Alerts */}
        <Card className="bg-red-100">
          <h2 className="text-2xl font-bold mb-4">Low Stock Alerts</h2>
          {lowStockProducts.length > 0 ? (
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {lowStockProducts.slice(0, 10).map((product) => (
                <div
                  key={product.id}
                  className="bg-white border-4 border-black p-3 flex justify-between items-center cursor-pointer hover:translate-x-1 hover:translate-y-1 transition-transform"
                  onClick={() => navigate('/products')}
                >
                  <div>
                    <p className="font-bold">{product.name}</p>
                    <p className="text-sm text-gray-600 font-medium">
                      SKU: {product.sku} • {product.category.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-2xl text-red-600">
                      {product.quantity}
                    </p>
                    {getStockLevelBadge(product.quantity, product.minStock)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-gray-600 font-medium">
              All products have sufficient stock!
            </p>
          )}
        </Card>
      </div>

      {/* Recent Movements */}
      <Card>
        <h2 className="text-2xl font-bold mb-4">Recent Stock Movements</h2>
        {recentMovements.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-4 border-black">
                  <th className="text-left py-3 px-4 font-bold">Date & Time</th>
                  <th className="text-left py-3 px-4 font-bold">Product</th>
                  <th className="text-left py-3 px-4 font-bold">Type</th>
                  <th className="text-right py-3 px-4 font-bold">Quantity</th>
                  <th className="text-left py-3 px-4 font-bold">User</th>
                </tr>
              </thead>
              <tbody>
                {recentMovements.slice(0, 10).map((movement, index) => (
                  <tr
                    key={movement.id}
                    className={`border-b-2 border-black ${index % 2 === 0 ? 'bg-yellow-50' : 'bg-white'
                      }`}
                  >
                    <td className="py-3 px-4 font-medium">
                      {new Date(movement.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {movement.product.name}
                      <span className="text-sm text-gray-600 ml-2">
                        ({movement.product.sku})
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {getMovementTypeBadge(movement.type)}
                    </td>
                    <td
                      className={`py-3 px-4 font-bold text-right ${movement.type === 'IN' ||
                        movement.type === 'RETURN' ||
                        movement.type === 'ADJUSTMENT'
                        ? 'text-green-600'
                        : 'text-red-600'
                        }`}
                    >
                      {movement.type === 'IN' ||
                        movement.type === 'RETURN' ||
                        (movement.type === 'ADJUSTMENT' && movement.quantity > 0)
                        ? '+'
                        : ''}
                      {movement.quantity}
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {movement.user.name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center py-8 text-gray-600 font-medium">
            No stock movements recorded yet
          </p>
        )}
      </Card>
    </div>
  )
}
