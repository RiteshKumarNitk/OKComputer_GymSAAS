import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const SchedulePage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Schedule</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Trainer Scheduling</CardTitle>
          <CardDescription>
            Book sessions and manage trainer availability
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Trainer scheduling system coming soon...</p>
        </CardContent>
      </Card>
    </div>
  )
}