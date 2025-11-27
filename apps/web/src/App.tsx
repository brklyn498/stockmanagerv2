import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Dashboard2 from './pages/Dashboard2'
import Products from './pages/Products'
import Categories from './pages/Categories'
import Suppliers from './pages/Suppliers'
import Clients from './pages/Clients'
import StockMovements from './pages/StockMovements'
import Orders from './pages/Orders'
import Receipt from './pages/Receipt'
import Layout from './components/Layout'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 3, // Retry failed requests up to 3 times
      retryDelay: (attemptIndex) => {
        // Exponential backoff: 1s, 2s, 4s (capped at 30s)
        return Math.min(1000 * Math.pow(2, attemptIndex), 30000)
      },
      staleTime: 30000, // Consider data fresh for 30 seconds
      gcTime: 5 * 60 * 1000, // Keep unused data in cache for 5 minutes
      refetchOnReconnect: true, // Refetch when network reconnects
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout><Dashboard /></Layout>} />
          <Route path="/dashboard2" element={<Layout><Dashboard2 /></Layout>} />
          <Route path="/products" element={<Layout><Products /></Layout>} />
          <Route path="/categories" element={<Layout><Categories /></Layout>} />
          <Route path="/suppliers" element={<Layout><Suppliers /></Layout>} />
          <Route path="/clients" element={<Layout><Clients /></Layout>} />
          <Route path="/stock-movements" element={<Layout><StockMovements /></Layout>} />
          <Route path="/orders" element={<Layout><Orders /></Layout>} />
          <Route path="/receipt/:id" element={<Receipt />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
