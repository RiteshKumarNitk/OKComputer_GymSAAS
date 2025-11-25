import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const BillingPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Billing & Payments</CardTitle>
          <CardDescription>
            Manage payments, subscriptions, and financial reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Billing and payment system coming soon...</p>
        </CardContent>
      </Card>
    </div>
  )
}