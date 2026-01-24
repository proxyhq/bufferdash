"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const data = [
  { month: "Aug", amount: 8400 },
  { month: "Sep", amount: 10200 },
  { month: "Oct", amount: 9100 },
  { month: "Nov", amount: 11800 },
  { month: "Dec", amount: 14200 },
  { month: "Jan", amount: 12450 },
]

export function MonthlySpending() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Trend</CardTitle>
        <CardDescription>Last 6 months spending</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={12}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={12}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Bar
                dataKey="amount"
                fill="#8b5cf6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
