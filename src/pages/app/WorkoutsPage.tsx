import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const WorkoutsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Workouts</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Workout Plans</CardTitle>
          <CardDescription>
            Create and manage workout plans for members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Workout management system coming soon...</p>
        </CardContent>
      </Card>
    </div>
  )
}