import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import Card from '../Card'

interface ProductAnalyticsProps {
  productId: string | undefined
  analytics: any
}

export default function ProductAnalytics({ analytics }: ProductAnalyticsProps) {
  if (!analytics) return <div>Loading analytics...</div>

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-black mb-4">Movement Frequency (Last 12 Months)</h3>
        <Card className="h-[400px] w-full bg-white p-2">
           <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.movementFrequency}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{fontSize: 12, fontWeight: 'bold'}} />
              <YAxis tick={{fontSize: 12, fontWeight: 'bold'}} />
              <Tooltip
                 cursor={{fill: '#fef08a', opacity: 0.4}}
                 contentStyle={{border: '4px solid black', borderRadius: 0, boxShadow: '4px 4px 0px 0px black'}}
                 itemStyle={{fontWeight: 'bold'}}
              />
              <Legend wrapperStyle={{fontWeight: 'bold', paddingTop: '10px'}} />
              <Bar dataKey="in" name="Stock In" fill="#4ade80" stroke="#000" strokeWidth={2} />
              <Bar dataKey="out" name="Stock Out" fill="#f87171" stroke="#000" strokeWidth={2} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <Card>
            <h4 className="font-bold uppercase text-gray-500 mb-2">Turnover Rate</h4>
            <div className="text-4xl font-black">{analytics.turnoverRate}</div>
            <p className="text-sm mt-2 font-medium">Times inventory sold over selected period</p>
         </Card>

         <Card>
            <h4 className="font-bold uppercase text-gray-500 mb-2">Avg. Daily Sales</h4>
            <div className="text-4xl font-black">{analytics.avgDailySales}</div>
            <p className="text-sm mt-2 font-medium">Units sold per day (last 30 days)</p>
         </Card>
      </div>
    </div>
  )
}
