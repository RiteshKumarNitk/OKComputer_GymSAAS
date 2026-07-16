import React, { useState, useCallback, useRef, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/features/auth/AuthContext"
import { qrApi } from "@/api/apiClient"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useNavigate } from "react-router-dom"
import { PageHeader } from "@/components/common"
import { QrCode, CheckCircle, XCircle, Camera, Smartphone, UserCheck } from "lucide-react"

export const QrKioskPage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [qrToken, setQrToken] = useState("")
  const [lastResult, setLastResult] = useState<{
    success: boolean
    message: string
    member?: { fullName: string; memberCode: string }
  } | null>(null)

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // QR check-in mutation
  const checkinMutation = useMutation({
    mutationFn: async (token: string) => {
      const response = await qrApi.checkin(token, user?.tenantId || "")
      if (response.error) throw response.error
      return response.data
    },
    onSuccess: (data) => {
      setLastResult({
        success: true,
        message: data.message || "Check-in successful!",
        member: data.member,
      })
      setQrToken("")
      queryClient.invalidateQueries({ queryKey: ["attendance-log"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })

      // Auto-clear success after 3 seconds
      setTimeout(() => setLastResult(null), 3000)
    },
    onError: (error: any) => {
      setLastResult({
        success: false,
        message: error.message || "Check-in failed",
      })
      setTimeout(() => setLastResult(null), 3000)
    },
  })

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!qrToken.trim()) return
      checkinMutation.mutate(qrToken.trim())
    },
    [qrToken, checkinMutation]
  )

  // Handle paste from external QR scanner
  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const pasted = e.clipboardData.getData("text")
      if (pasted && pasted.length > 10) {
        setQrToken(pasted)
        checkinMutation.mutate(pasted)
      }
    },
    [checkinMutation]
  )

  const handleManualEntry = () => {
    navigate("/attendance") // Go to manual check-in page
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="QR Kiosk Check-in"
        subtitle="Scan member QR codes for rapid check-in"
        titleClassName="text-3xl font-bold tracking-tight"
        onBack={() => navigate("/front-desk")}
        actions={
          <Button variant="outline" onClick={handleManualEntry} className="gap-2">
            <UserCheck className="h-4 w-4" /> Manual Check-in
          </Button>
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* QR Scanner Card */}
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" /> QR Scanner
            </CardTitle>
            <CardDescription className="text-indigo-100">
              Point QR code reader at member&apos;s phone or card
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Scanner Mode Info */}
            <div className="flex items-center justify-center p-8 bg-slate-50 dark:bg-slate-900 rounded-xl border-2 border-dashed border-slate-200">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Smartphone className="h-8 w-8 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Ready to Scan</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Paste QR token or use USB scanner
                  </p>
                </div>
              </div>
            </div>

            {/* Manual Token Input */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={qrToken}
                  onChange={(e) => setQrToken(e.target.value)}
                  onPaste={handlePaste}
                  placeholder="Scan or paste QR token..."
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all"
                  autoFocus
                  disabled={checkinMutation.isPending}
                />
              </div>
              <Button
                type="submit"
                className="w-full h-12 text-base font-bold"
                disabled={!qrToken.trim() || checkinMutation.isPending}
              >
                {checkinMutation.isPending ? "Processing..." : "Check In via QR"}
              </Button>
            </form>

            {/* Keyboard shortcut hint */}
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <kbd className="px-2 py-1 bg-slate-100 rounded text-[10px] font-mono">Enter</kbd>
              <span>to check in</span>
              <span className="mx-1">•</span>
              <kbd className="px-2 py-1 bg-slate-100 rounded text-[10px] font-mono">Ctrl+V</kbd>
              <span>to paste QR token</span>
            </div>
          </CardContent>
        </Card>

        {/* Result & Info Card */}
        <div className="space-y-6">
          {/* Last Check-in Result */}
          <Card className={`border-2 transition-all ${lastResult?.success ? "border-green-400 bg-green-50" : lastResult ? "border-red-400 bg-red-50" : "border-slate-200"}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {lastResult?.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : lastResult ? (
                  <XCircle className="h-5 w-5 text-red-600" />
                ) : (
                  <QrCode className="h-5 w-5 text-slate-400" />
                )}
                {lastResult?.success ? "Checked In!" : lastResult ? "Failed" : "Last Result"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lastResult ? (
                <div className="space-y-3">
                  <p className={`font-bold text-lg ${lastResult.success ? "text-green-700" : "text-red-700"}`}>
                    {lastResult.message}
                  </p>
                  {lastResult.member && (
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                      <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-bold">{lastResult.member.fullName}</p>
                        <p className="text-sm text-muted-foreground">{lastResult.member.memberCode}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <p className="text-sm">No check-ins yet</p>
                  <p className="text-xs mt-1">Scan a QR code to get started</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold">Kiosk Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-0.5">1</Badge>
                <p className="text-muted-foreground">Member shows their QR code from the member portal</p>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-0.5">2</Badge>
                <p className="text-muted-foreground">Scan the QR code with a USB scanner or paste the token</p>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-0.5">3</Badge>
                <p className="text-muted-foreground">QR tokens auto-refresh every 5 minutes for security</p>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-0.5">4</Badge>
                <p className="text-muted-foreground">Already checked-in members will be notified</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
