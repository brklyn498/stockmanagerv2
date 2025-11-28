import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../Table'
import Badge from '../Badge'

interface ProductOrdersProps {
  productId: string | undefined
}

export default function ProductOrders({ productId }: ProductOrdersProps) {
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['product-orders', productId],
    queryFn: async () => {
      const { data } = await api.get(`/orders?productId=${productId}`)
      return data.orders
    },
    enabled: !!productId
  })

  if (isLoading) return <div>Loading orders...</div>

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-black mb-4">Related Orders</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order #</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Total Items</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ordersData?.map((order: any) => (
            <TableRow key={order.id}>
              <TableCell className="font-bold">{order.orderNumber}</TableCell>
              <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
              <TableCell>
                <Badge variant={order.type === 'PURCHASE' ? 'info' : 'success'}>
                  {order.type}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={
                  order.status === 'COMPLETED' ? 'success' :
                  order.status === 'PENDING' ? 'warning' : 'info'
                }>
                  {order.status}
                </Badge>
              </TableCell>
              <TableCell>{order.supplier?.name || '-'}</TableCell>
              <TableCell>{order.items?.length || 0}</TableCell>
            </TableRow>
          )) || (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8">No orders found for this product</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
