import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/common"

export const AnalyticsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" titleClassName="text-3xl font-bold tracking-tight" />
      
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