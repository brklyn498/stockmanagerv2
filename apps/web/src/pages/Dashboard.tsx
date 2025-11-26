import Card from '../components/Card'
import Badge from '../components/Badge'

export default function Dashboard() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-700 font-medium">
          Welcome to your stock management system
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-yellow-400">
          <h3 className="text-sm font-bold mb-2">Total Products</h3>
          <p className="text-4xl font-bold">0</p>
        </Card>

        <Card className="bg-cyan-400">
          <h3 className="text-sm font-bold mb-2">Low Stock Items</h3>
          <p className="text-4xl font-bold">0</p>
        </Card>

        <Card className="bg-purple-500 text-white">
          <h3 className="text-sm font-bold mb-2">Pending Orders</h3>
          <p className="text-4xl font-bold">0</p>
        </Card>

        <Card className="bg-rose-400">
          <h3 className="text-sm font-bold mb-2">Today's Movements</h3>
          <p className="text-4xl font-bold">0</p>
        </Card>
      </div>

      <Card>
        <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <button className="neo-btn">Add Product</button>
          <button className="neo-btn-secondary">Record Movement</button>
          <button className="neo-btn-secondary">Create Order</button>
        </div>
      </Card>

      <div className="mt-6">
        <Card>
          <h2 className="text-2xl font-bold mb-4">System Status</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Badge variant="success">API Connected</Badge>
              <span className="font-medium">Backend is running</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="info">Neobrutalism UI</Badge>
              <span className="font-medium">Design system active</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
