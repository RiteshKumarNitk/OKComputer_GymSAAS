import React from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { membershipsApi } from "@/api/apiClient"
import { useAuth } from "@/features/auth/AuthContext"
import { 
  ArrowLeft, 
  UserPlus
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MemberForm } from "@/features/members/MemberForm"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/common"

export const AddMemberPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  // Fetch memberships for the form
  const { data: memberships, isLoading } = useQuery({
    queryKey: ["memberships", user?.tenantId],
    queryFn: async () => {
      const response = await membershipsApi.list(user?.tenantId || "")
      if (response.error) throw response.error
      return response.data || []
    },
    enabled: !!user?.tenantId,
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="rounded-full h-10 w-10 p-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <PageHeader
          title="Member Onboarding"
          subtitle="Register new member and activate membership"
        />
      </div>

      <Card className="border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-blue-600" /> Member Details
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <MemberForm
              memberships={memberships || []}
              onSuccess={() => navigate("/members")}
              onCancel={() => navigate("/members")}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
