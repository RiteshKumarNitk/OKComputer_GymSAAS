import React from "react"
import { ManualCheckin } from "@/features/attendance/ManualCheckin"
import { AttendanceLog } from "@/features/attendance/AttendanceLog"
import { AttendanceHistory } from "@/features/attendance/AttendanceHistory"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QrCode, List, Calendar } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { PageHeader } from "@/components/common"

export const AttendancePage: React.FC = () => {
  const navigate = useNavigate()
  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        titleClassName="text-3xl font-bold tracking-tight"
        onBack={() => navigate("/front-desk")}
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: Check-in Actions */}
        <div className="md:col-span-1 space-y-6">
          <ManualCheckin />

          {/* QR Code Placeholder */}
          <div className="p-6 border rounded-lg bg-slate-50 text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
              <QrCode className="h-6 w-6 text-slate-400" />
            </div>
            <div>
              <h3 className="font-medium">QR Check-in</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Members can scan their QR code at the front desk kiosk.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Logs & History */}
        <div className="md:col-span-2">
          <Tabs defaultValue="today" className="space-y-4">
            <TabsList>
              <TabsTrigger value="today">
                <List className="h-4 w-4 mr-2" />
                Today's Log
              </TabsTrigger>
              <TabsTrigger value="history">
                <Calendar className="h-4 w-4 mr-2" />
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="today">
              <AttendanceLog />
            </TabsContent>
            <TabsContent value="history" className="space-y-4">
              <AttendanceHistory />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}