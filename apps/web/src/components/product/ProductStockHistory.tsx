import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../Table'
import Badge from '../Badge'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import Card from '../Card'

interface ProductStockHistoryProps {
  productId: string | undefined
}

export default function ProductStockHistory({ productId }: ProductStockHistoryProps) {
  const { data: movementsData, isLoading } = useQuery({
    queryKey: ['movements', productId],
    queryFn: async () => {
      // Assuming getStockMovements supports filtering by productId
      const { data } = await api.get(`/stock-movements?productId=${productId}`)
      return data.movements
    },
    enabled: !!productId
  })

  // Prepare chart data (cumulative stock over time is hard without snapshotting,
  // so we'll visualize movement quantities for now)
  const chartData = (movementsData || []).slice().reverse().map((m: any) => ({
    date: new Date(m.createdAt).toLocaleDateString(),
    quantity: ['OUT', 'DAMAGED'].includes(m.type) ? -m.quantity : m.quantity,
    type: m.type
  }))

  if (isLoading) return <div>Loading history...</div>

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-black mb-4">Stock Movement Trends</h3>
        <Card className="h-[300px] w-full bg-white p-2">
           <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{fontSize: 12, fontWeight: 'bold'}} />
              <YAxis tick={{fontSize: 12, fontWeight: 'bold'}} />
              <Tooltip
                 contentStyle={{border: '4px solid black', borderRadius: 0, boxShadow: '4px 4px 0px 0px black'}}
                 itemStyle={{fontWeight: 'bold'}}
              />
              <Area
                type="monotone"
                dataKey="quantity"
                stroke="#000"
                strokeWidth={3}
                fill="#FACC15"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div>
        <h3 className="text-xl font-black mb-4">Movement Log</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>User</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movementsData?.map((movement: any) => (
              <TableRow key={movement.id}>
                <TableCell>{new Date(movement.createdAt).toLocaleString()}</TableCell>
                <TableCell>
                  <Badge variant={
                    movement.type === 'IN' ? 'success' :
                    movement.type === 'OUT' ? 'warning' :
                    movement.type === 'DAMAGED' ? 'danger' : 'info'
                  }>
                    {movement.type}
                  </Badge>
                </TableCell>
                <TableCell className={`font-bold ${['OUT', 'DAMAGED'].includes(movement.type) ? 'text-red-500' : 'text-green-600'}`}>
                  {['OUT', 'DAMAGED'].includes(movement.type) ? '-' : '+'}{movement.quantity}
                </TableCell>
                <TableCell>{movement.reason || '-'}</TableCell>
                <TableCell>{movement.user?.name}</TableCell>
              </TableRow>
            )) || (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">No movements recorded</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
