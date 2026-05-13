import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import type { SalesAnalytics } from '@/types/domain';

export function SalesCharts({ analytics }: { analytics: SalesAnalytics }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Daily sales volume</CardTitle>
        </CardHeader>
        <CardContent className="h-[320px]">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={analytics.dailySales}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d8e2ee" vertical={false} />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Bar dataKey="units" fill="hsl(var(--chart-2))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Revenue trend</CardTitle>
        </CardHeader>
        <CardContent className="h-[320px]">
          <ResponsiveContainer height="100%" width="100%">
            <LineChart data={analytics.dailySales}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d8e2ee" vertical={false} />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Line
                dataKey="revenue"
                dot={{ fill: 'hsl(var(--chart-1))', r: 4 }}
                stroke="hsl(var(--chart-1))"
                strokeWidth={3}
                type="monotone"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
