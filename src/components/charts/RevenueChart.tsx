import React from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { formatCurrency } from "@/lib/utils"

interface RevenueChartProps {
  data: { month: string; revenue: number }[]
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  const formattedData = data.map((item) => ({
    ...item,
    revenue: item.revenue / 100, // Convert from cents to dollars
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col space-y-1">
              <span className="text-[0.8rem] uppercase text-muted-foreground">Month</span>
              <span className="font-bold">{label}</span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-[0.8rem] uppercase text-muted-foreground">Revenue</span>
              <span className="font-bold">{formatCurrency(payload[0].value * 100)}</span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={formattedData}>
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis
          dataKey="month"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar
          dataKey="revenue"
          fill="hsl(var(--primary))"
          radius={[4, 4, 0, 0]}
          name="Revenue"
        />
      </BarChart>
    </ResponsiveContainer>
  )
}