import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const AnalyticsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Business Analytics</CardTitle>
          <CardDescription>
            Detailed reports and insights about your gym business
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Advanced analytics dashboard coming soon...</p>
        </CardContent>
      </Card>
    </div>
  )
}