import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const DietPlansPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Diet Plans</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Nutrition & Diet Plans</CardTitle>
          <CardDescription>
            Create and manage diet plans for members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Diet plan management system coming soon...</p>
        </CardContent>
      </Card>
    </div>
  )
}