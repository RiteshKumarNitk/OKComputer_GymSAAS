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

          {/* QR Code Kiosk Link */}
          <button
            onClick={() => navigate("/qr-kiosk")}
            className="p-6 border rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 text-center space-y-4 w-full transition-all hover:shadow-md hover:border-indigo-300 cursor-pointer group"
          >
            <div className="mx-auto w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
              <QrCode className="h-6 w-6 text-indigo-500 group-hover:text-indigo-600" />
            </div>
            <div>
              <h3 className="font-medium text-indigo-700">QR Kiosk Check-in</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Open the QR scanner kiosk for rapid member check-in
              </p>
            </div>
          </button>
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