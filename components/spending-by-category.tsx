"use client"

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const data = [
  { name: "Shopping", value: 4200, color: "#8b5cf6" },
  { name: "Subscriptions", value: 1800, color: "#06b6d4" },
  { name: "Transport", value: 2100, color: "#f59e0b" },
  { name: "Food & Drink", value: 2800, color: "#10b981" },
  { name: "Other", value: 1550, color: "#6b7280" },
]

const total = data.reduce((sum, item) => sum + item.value, 0)

export function SpendingByCategory() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>By Category</CardTitle>
        <CardDescription>Spending breakdown this month</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <div className="w-32 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={55}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 flex flex-col gap-2">
            {data.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="size-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span>{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">${item.value.toLocaleString()}</span>
                  <span className="text-muted-foreground text-xs">
                    {((item.value / total) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
