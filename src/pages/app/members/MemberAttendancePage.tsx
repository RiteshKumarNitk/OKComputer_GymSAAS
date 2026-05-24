import React from "react"
import { ManualCheckin } from "@/features/attendance/ManualCheckin"
import { AttendanceLog } from "@/features/attendance/AttendanceLog"
import { AttendanceHistory } from "@/features/attendance/AttendanceHistory"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QrCode, List, ArrowLeft, CalendarDays } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/common"

export const MemberAttendancePage: React.FC = () => {
  const navigate = useNavigate()
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/members")} className="h-10 w-10 p-0 rounded-xl bg-white border border-slate-200">
           <ArrowLeft className="h-5 w-5 text-slate-500" />
        </Button>
        <PageHeader
          title="Member Attendance"
          subtitle="Track and manage gym check-ins and history"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column: Check-in Actions */}
        <div className="lg:col-span-1 space-y-6">
          <ManualCheckin />

          {/* QR Code Section */}
          <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl bg-white dark:bg-slate-900 text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-orange-50 rounded-xl flex items-center justify-center shadow-inner">
              <QrCode className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">QR Check-in System</h3>
              <p className="text-xs text-slate-400 font-medium mt-2 leading-relaxed">
                Members can scan their unique QR code at the kiosk to automatically check in and verify membership status.
              </p>
            </div>
            <Button variant="outline" className="w-full rounded-xl font-bold border-slate-200 text-slate-600">
                Setup Hardware
            </Button>
          </div>
        </div>

        {/* Right Column: Logs & History */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="today" className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-1 border border-slate-100 inline-flex">
                <TabsList className="bg-transparent h-10">
                <TabsTrigger value="today" className="rounded-xl px-6 data-[state=active]:bg-slate-900 data-[state=active]:text-white font-bold transition-all">
                    <List className="h-4 w-4 mr-2" />
                    Today's Log
                </TabsTrigger>
                <TabsTrigger value="history" className="rounded-xl px-6 data-[state=active]:bg-slate-900 data-[state=active]:text-white font-bold transition-all">
                    <CalendarDays className="h-4 w-4 mr-2" />
                    Full History
                </TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="today" className="animate-in slide-in-from-bottom-2">
              <AttendanceLog />
            </TabsContent>
            <TabsContent value="history" className="space-y-4 animate-in slide-in-from-bottom-2">
              <AttendanceHistory />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
