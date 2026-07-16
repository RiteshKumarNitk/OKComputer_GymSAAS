import React from "react"
import { useQuery } from "@tanstack/react-query"
import { attendanceApi, paymentsApi, memberWorkoutsApi, invoicesApi } from "@/api/apiClient"
import type { Member } from "@/types"
import { formatDate, formatCurrency, calculateAge } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Calendar, Phone, Mail, User } from "lucide-react"

interface MemberDetailsProps {
  member: Member
  onClose: () => void
}

export const MemberDetails: React.FC<MemberDetailsProps> = ({ member, onClose }) => {
  // Fetch attendance history
  const { data: attendance } = useQuery({
    queryKey: ["member-attendance", member.id],
    queryFn: async () => {
      const response = await attendanceApi.list(member.tenantId || "", member.id)
      if (response.error) throw response.error
      return response.data?.slice(0, 10)
    },
  })

  // Fetch payments
  const { data: payments } = useQuery({
    queryKey: ["member-payments", member.id],
    queryFn: async () => {
      const response = await paymentsApi.list(member.tenantId || "", member.id)
      if (response.error) throw response.error
      return response.data?.slice(0, 10)
    },
  })

  // Fetch invoices
  const { data: invoices } = useQuery({
    queryKey: ["member-invoices", member.id],
    queryFn: async () => {
      const response = await invoicesApi.list(member.tenantId || "", member.id)
      if (response.error) throw response.error
      return response.data
    },
  })

  // Fetch assigned workouts
  const { data: workouts } = useQuery({
    queryKey: ["member-workouts", member.id],
    queryFn: async () => {
      const response = await memberWorkoutsApi.list(member.id)
      if (response.error) throw response.error
      return response.data
    },
  })

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default"
      case "inactive":
        return "secondary"
      case "suspended":
        return "destructive"
      case "expired":
        return "outline"
      default:
        return "default"
    }
  }

  return (
    <div className="space-y-6">
      {/* Member Header */}
      <div className="flex items-start space-x-4">
        <Avatar className="h-20 w-20">
          <AvatarFallback className="text-2xl">
            {(member.fullName || "").split(" ").map((n) => n[0]).join("").toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{member.fullName}</h2>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
            <span className="flex items-center">
              <User className="h-4 w-4 mr-1" />
              {member.memberCode}
            </span>
            <Badge variant={getStatusBadgeVariant(member.status)}>
              {member.status}
            </Badge>
          </div>
          {member.currentPlan && (
            <div className="mt-2">
              <span className="text-sm font-medium">{member.currentPlan.name}</span>
              <span className="text-sm text-muted-foreground ml-2">
                {formatCurrency(member.currentPlan.priceCents || 0, member.currentPlan.currency || "INR")} / {member.currentPlan.durationDays || 0} days
              </span>
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">Personal Info</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="workouts">Workouts</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {member.email && (
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{member.email}</span>
                  </div>
                )}
                {member.phone && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{member.phone}</span>
                  </div>
                )}
                {member.dob && (
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>
                      {formatDate(member.dob)} (Age: {calculateAge(member.dob)})
                    </span>
                  </div>
                )}
                {member.gender && (
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="capitalize">{member.gender}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Membership Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-sm font-medium">Joined Date:</span>
                  <span className="ml-2">{formatDate(member.joinedAt)}</span>
                </div>
                {member.planStartedAt && (
                  <div>
                    <span className="text-sm font-medium">Plan Started:</span>
                    <span className="ml-2">{formatDate(member.planStartedAt)}</span>
                  </div>
                )}
                {member.planExpiresAt && (
                  <div>
                    <span className="text-sm font-medium">Plan Expires:</span>
                    <span className="ml-2">{formatDate(member.planExpiresAt)}</span>
                  </div>
                )}
                <div>
                  <span className="text-sm font-medium">Status:</span>
                  <Badge variant={getStatusBadgeVariant(member.status)} className="ml-2">
                    {member.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {member.emergencyContact && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Emergency Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <span className="text-sm font-medium">Name:</span>
                    <span className="ml-2">{member.emergencyContact.name}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Phone:</span>
                    <span className="ml-2">{member.emergencyContact.phone}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Relationship:</span>
                    <span className="ml-2">{member.emergencyContact.relationship}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {member.notes && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{member.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle>Recent Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              {attendance && attendance.length > 0 ? (
                <div className="space-y-2">
                  {attendance.map((record: any) => (
                    <div key={record.id} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div>
                        <span className="font-medium">{formatDate(record.checkinAt)}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          {new Date(record.checkinAt).toLocaleTimeString()}
                        </span>
                      </div>
                      {record.checkoutAt && (
                        <div className="text-sm text-muted-foreground">
                          Duration: {Math.round((new Date(record.checkoutAt).getTime() - new Date(record.checkinAt).getTime()) / (1000 * 60))} min
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No attendance records found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              {payments && payments.length > 0 ? (
                <div className="space-y-2">
                  {payments.map((payment: any) => (
                    <div key={payment.id} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div>
                        <span className="font-medium">{formatDate(payment.paidAt || payment.createdAt)}</span>
                        {payment.membership && (
                          <span className="text-sm text-muted-foreground ml-2">
                            {payment.membership.name}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(payment.amountCents)}</div>
                        <div className="text-sm text-muted-foreground capitalize">{payment.provider}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No payment records found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              {invoices && invoices.length > 0 ? (
                <div className="space-y-2">
                  {invoices.map((invoice: any) => (
                    <div key={invoice.id} className="flex items-center justify-between p-3 bg-muted rounded">
                      <div>
                        <span className="font-medium">{invoice.invoiceNumber}</span>
                        <div className="text-sm text-muted-foreground mt-1">
                          Date: {formatDate(invoice.invoiceDate)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(invoice.totalPaise || 0)}</div>
                        <Badge variant={invoice.status === "paid" ? "default" : "secondary"} className="mt-1">
                          {invoice.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No invoices found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workouts">
          <Card>
            <CardHeader>
              <CardTitle>Assigned Workouts</CardTitle>
            </CardHeader>
            <CardContent>
              {workouts && workouts.length > 0 ? (
                <div className="space-y-2">
                  {workouts.map((workout: any) => (
                    <div key={workout.id} className="p-2 bg-muted rounded">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{workout.workout?.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(workout.assignedAt)}
                        </span>
                      </div>
                      {workout.workout?.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {workout.workout.description}
                        </p>
                      )}
                      {workout.completedAt && (
                        <Badge variant="default" className="mt-2">
                          Completed {formatDate(workout.completedAt)}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No workouts assigned</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  )
}