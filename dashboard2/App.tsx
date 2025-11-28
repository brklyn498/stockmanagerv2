import React from 'react';
import { Package, Bell, Plus, ClipboardList } from 'lucide-react';
import NeoCard from './components/NeoCard';
import NeoButton from './components/NeoButton';
import Badge from './components/Badge';
import { ActivityItem, Stats } from './types';

// Constants from the image
const INITIAL_STATS: Stats = {
  totalProducts: 1250,
  stockValue: 85320,
  lowStockItems: 18,
  pendingOrders: 32,
};

const INITIAL_ACTIVITY: ActivityItem[] = [
  { id: '1', product: 'Premium Wireless Headphones', action: 'Stock In', quantity: '+50', date: '2023-10-27 10:45 AM' },
  { id: '2', product: 'Ergonomic Office Chair', action: 'Stock Out', quantity: '-10', date: '2023-10-27 09:12 AM' },
  { id: '3', product: 'Smart Coffee Maker', action: 'Low Stock Alert', quantity: '5 remaining', date: '2023-10-26 05:30 PM' },
  { id: '4', product: 'Mechanical Keyboard', action: 'Stock In', quantity: '+25', date: '2023-10-26 11:00 AM' },
];

const App: React.FC = () => {

  return (
    <div className="min-h-screen bg-beige p-4 md:p-8 font-sans text-black selection:bg-neoYellow">
      {/* Header */}
      <header className="flex flex-col md:flex-row items-center justify-between mb-12 gap-4 border-b-2 border-black pb-6">
        <div className="flex items-center gap-3">
          <Package className="w-8 h-8 md:w-10 md:h-10 stroke-[2.5]" />
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Stockify</h1>
        </div>
        <div className="flex gap-4">
          <button className="w-12 h-12 flex items-center justify-center border-2 border-black rounded-lg bg-white shadow-neo hover:translate-y-1 hover:translate-x-1 hover:shadow-none transition-all">
            <Bell className="w-6 h-6" />
          </button>
          <button className="w-12 h-12 flex items-center justify-center border-2 border-black rounded-lg bg-white shadow-neo hover:translate-y-1 hover:translate-x-1 hover:shadow-none transition-all font-bold text-lg">
            AD
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto space-y-10">
        
        {/* Dashboard Title & Actions */}
        <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h2 className="text-3xl font-extrabold mb-2">Dashboard</h2>
            <p className="text-gray-700 font-medium text-lg">Welcome back, here's your stock overview.</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <NeoButton icon={<Plus className="w-5 h-5" />}>
              New Product
            </NeoButton>
            <NeoButton variant="secondary" icon={<ClipboardList className="w-5 h-5" />}>
              View Orders
            </NeoButton>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <NeoCard color="yellow" className="p-6 h-40 flex flex-col justify-between hover:scale-[1.02] transition-transform">
            <span className="font-medium text-lg opacity-90">Total Products</span>
            <span className="text-4xl md:text-5xl font-extrabold">{INITIAL_STATS.totalProducts.toLocaleString()}</span>
          </NeoCard>
          
          <NeoCard color="green" className="p-6 h-40 flex flex-col justify-between hover:scale-[1.02] transition-transform">
            <span className="font-medium text-lg opacity-90">Total Stock Value</span>
            <span className="text-4xl md:text-5xl font-extrabold">${INITIAL_STATS.stockValue.toLocaleString()}</span>
          </NeoCard>
          
          <NeoCard color="pink" className="p-6 h-40 flex flex-col justify-between hover:scale-[1.02] transition-transform">
            <span className="font-medium text-lg opacity-90">Items Low on Stock</span>
            <span className="text-4xl md:text-5xl font-extrabold">{INITIAL_STATS.lowStockItems}</span>
          </NeoCard>
          
          <NeoCard color="blue" className="p-6 h-40 flex flex-col justify-between hover:scale-[1.02] transition-transform">
            <span className="font-medium text-lg opacity-90">Pending Orders</span>
            <span className="text-4xl md:text-5xl font-extrabold">{INITIAL_STATS.pendingOrders}</span>
          </NeoCard>
        </section>

        {/* Recent Activity Table */}
        <section>
          <h3 className="text-2xl font-bold mb-6">Recent Activity</h3>
          
          <div className="border-2 border-black shadow-neo bg-white rounded-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-beige border-b-2 border-black">
                    <th className="p-4 font-bold uppercase text-sm tracking-wider border-r-2 border-black last:border-r-0">Product</th>
                    <th className="p-4 font-bold uppercase text-sm tracking-wider border-r-2 border-black last:border-r-0">Action</th>
                    <th className="p-4 font-bold uppercase text-sm tracking-wider border-r-2 border-black last:border-r-0">Quantity</th>
                    <th className="p-4 font-bold uppercase text-sm tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black">
                  {INITIAL_ACTIVITY.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-medium border-r-2 border-black last:border-r-0 whitespace-nowrap md:whitespace-normal">
                        {item.product}
                      </td>
                      <td className="p-4 border-r-2 border-black last:border-r-0">
                        <Badge type={item.action} />
                      </td>
                      <td className="p-4 font-bold border-r-2 border-black last:border-r-0">
                        {item.quantity}
                      </td>
                      <td className="p-4 font-medium text-gray-700 whitespace-nowrap">
                        {item.date}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination / Footer of table */}
            <div className="bg-beige p-3 border-t-2 border-black flex justify-center">
                <button className="text-sm font-bold hover:underline">View All Activity</button>
            </div>
          </div>
        </section>
        
        {/* Footer */}
        <footer className="pt-10 pb-6 text-center text-gray-500 font-medium">
            <p>&copy; 2024 Stockify Inc.</p>
        </footer>

      </main>
    </div>
  );
};

export default App;