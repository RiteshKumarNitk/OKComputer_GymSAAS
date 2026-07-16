import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/features/auth/AuthContext"
import { notificationsApiExtended } from "@/api/apiClient"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Bell,
  CheckCheck,
  Info,
  AlertTriangle,
  CreditCard,
  Dumbbell,
  Calendar,
  Clock,
  X,
  BellDot,
} from "lucide-react"
import { formatDate } from "@/lib/utils"

interface Notification {
  id: string
  notificationType: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
  data?: any
}

const notificationIcon = (type: string) => {
  switch (type) {
    case "membership_expiring":
    case "renewal":
      return <CreditCard className="h-4 w-4 text-orange-500" />
    case "missed_followup":
      return <Clock className="h-4 w-4 text-red-500" />
    case "payment":
    case "payment_received":
      return <CreditCard className="h-4 w-4 text-green-500" />
    case "workout_assigned":
      return <Dumbbell className="h-4 w-4 text-blue-500" />
    case "schedule":
      return <Calendar className="h-4 w-4 text-purple-500" />
    case "alert":
    case "warning":
      return <AlertTriangle className="h-4 w-4 text-amber-500" />
    default:
      return <Info className="h-4 w-4 text-slate-500" />
  }
}

export const NotificationCenter: React.FC = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)

  // Fetch unread count
  const { data: unreadData } = useQuery({
    queryKey: ["notifications-unread"],
    queryFn: async () => {
      const response = await notificationsApiExtended.unreadCount()
      if (response.error) throw response.error
      return response.data
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Poll every 30s
  })

  // Fetch notifications
  const { data: notificationsData } = useQuery({
    queryKey: ["notifications-list"],
    queryFn: async () => {
      const response = await notificationsApiExtended.list()
      if (response.error) throw response.error
      return response.data
    },
    enabled: !!user?.id && open,
  })

  // Mark as read mutation
  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await notificationsApiExtended.markRead(id)
      if (response.error) throw response.error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] })
      queryClient.invalidateQueries({ queryKey: ["notifications-list"] })
    },
  })

  // Mark all as read mutation
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const response = await notificationsApiExtended.markAllRead()
      if (response.error) throw response.error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] })
      queryClient.invalidateQueries({ queryKey: ["notifications-list"] })
      toast({ title: "All notifications marked as read" })
    },
  })

  const notifications: Notification[] = notificationsData?.data || []
  const unreadCount = unreadData?.count || 0

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
          {unreadCount > 0 ? (
            <>
              <BellDot className="h-5 w-5 text-orange-500" />
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            </>
          ) : (
            <Bell className="h-5 w-5 text-slate-400" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0" align="end" sideOffset={8}>
        <Card className="border-0">
          <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-1 text-[10px] h-5">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1 text-muted-foreground"
                onClick={() => markAllReadMutation.mutate()}
              >
                <CheckCheck className="h-3 w-3" /> Mark all read
              </Button>
            )}
          </CardHeader>
          <ScrollArea className="h-[400px]">
            <CardContent className="p-0">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bell className="h-10 w-10 text-slate-200 mb-3" />
                  <p className="text-sm text-muted-foreground font-medium">No notifications</p>
                  <p className="text-xs text-muted-foreground mt-1">You're all caught up!</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-3 p-4 transition-colors ${
                        !notification.isRead ? "bg-blue-50/30" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="mt-0.5">{notificationIcon(notification.notificationType)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm ${!notification.isRead ? "font-bold" : "font-medium"} truncate`}>
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 shrink-0 opacity-50 hover:opacity-100"
                              onClick={() => markReadMutation.mutate(notification.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <div className="h-2 w-2 bg-blue-500 rounded-full mt-2 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </ScrollArea>
        </Card>
      </PopoverContent>
    </Popover>
  )
}
