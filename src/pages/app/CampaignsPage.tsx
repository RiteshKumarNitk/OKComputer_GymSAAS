import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { campaignsApi, messagesApi } from "@/api/apiClient"
import { useAuth } from "@/features/auth/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { PageHeader, DataTable, ConfirmDialog } from "@/components/common"
import type { Column } from "@/components/common"
import {
  MessageCircle,
  Send,
  PlayCircle,
  Trash2,
  Smartphone,
  Eye,
  Megaphone,
  Loader2,
  AlertTriangle,
} from "lucide-react"

type CampaignStatus = "draft" | "scheduled" | "running" | "completed" | "cancelled"
type CampaignChannel = "whatsapp" | "sms"

interface Campaign {
  id: string
  name: string
  channel: CampaignChannel
  subject?: string
  body: string
  status: CampaignStatus
  targetAudience?: any
  scheduledAt?: string
  sentAt?: string
  totalRecipients: number
  totalSent: number
  totalFailed: number
  createdBy?: string
  createdAt: string
  updatedAt: string
  messages?: any[]
}

const statusConfig: Record<CampaignStatus, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-slate-100 text-slate-700 border-slate-300" },
  scheduled: { label: "Scheduled", color: "bg-blue-100 text-blue-700 border-blue-300" },
  running: { label: "Running", color: "bg-amber-100 text-amber-700 border-amber-300 animate-pulse" },
  completed: { label: "Completed", color: "bg-green-100 text-green-700 border-green-300" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700 border-red-300" },
}

export const CampaignsPage: React.FC = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showLaunchDialog, setShowLaunchDialog] = useState(false)
  const [showTestDialog, setShowTestDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null)
  const [testPhone, setTestPhone] = useState("")
  const [formName, setFormName] = useState("")
  const [formChannel, setFormChannel] = useState("whatsapp")
  const [formSubject, setFormSubject] = useState("")
  const [formBody, setFormBody] = useState("")
  const [formAudienceType, setFormAudienceType] = useState("all_active")

  // Fetch campaigns
  const { data: campaigns } = useQuery({
    queryKey: ["campaigns", user?.tenantId],
    queryFn: async () => {
      const response = await campaignsApi.list(user?.tenantId || "")
      if (response.error) throw response.error
      return (response.data || []) as Campaign[]
    },
    enabled: !!user?.tenantId,
  })

  // Fetch templates
  const { data: templates } = useQuery({
    queryKey: ["message-templates"],
    queryFn: async () => {
      const response = await messagesApi.listTemplates()
      if (response.error) throw response.error
      return response.data || []
    },
    enabled: !!user?.tenantId,
  })

  // Create campaign
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await campaignsApi.create(data)
      if (response.error) throw response.error
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] })
      setShowCreateDialog(false)
      resetForm()
      toast({ title: "Success", description: "Campaign created" })
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  })

  // Launch campaign
  const launchMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await campaignsApi.launch(id)
      if (response.error) throw response.error
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] })
      setShowLaunchDialog(false)
      toast({
        title: "Campaign Launched!",
        description: `Sent to ${data.sent} recipients${data.failed > 0 ? `, ${data.failed} failed` : ""}`,
      })
    },
    onError: (err: any) => toast({ title: "Launch Failed", description: err.message, variant: "destructive" }),
  })

  // Test send
  const testMutation = useMutation({
    mutationFn: async ({ id, to }: { id: string; to: string }) => {
      const response = await campaignsApi.test(id, to)
      if (response.error) throw response.error
      return response.data
    },
    onSuccess: () => {
      setTestPhone("")
      toast({ title: "Test Sent!", description: "Check your phone for the test message" })
    },
    onError: (err: any) => toast({ title: "Test Failed", description: err.message, variant: "destructive" }),
  })

  // Filter campaigns by status
  const filteredCampaigns = campaigns?.filter((c) => {
    if (activeTab === "all") return true
    return c.status === activeTab
  })

  const statusCounts = {
    all: campaigns?.length || 0,
    draft: campaigns?.filter((c) => c.status === "draft").length || 0,
    scheduled: campaigns?.filter((c) => c.status === "scheduled").length || 0,
    running: campaigns?.filter((c) => c.status === "running").length || 0,
    completed: campaigns?.filter((c) => c.status === "completed").length || 0,
  }

  const resetForm = () => {
    setFormName("")
    setFormChannel("whatsapp")
    setFormSubject("")
    setFormBody("")
    setFormAudienceType("all_active")
  }

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = {
      name: formName,
      channel: formChannel,
      subject: formSubject || undefined,
      body: formBody,
      targetAudience: { type: formAudienceType },
    }
    createMutation.mutate(data)
  }

  const handleLaunchConfirm = () => {
    if (selectedCampaign) {
      launchMutation.mutate(selectedCampaign.id)
    }
  }

  const handleTestSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedCampaign && testPhone) {
      testMutation.mutate({ id: selectedCampaign.id, to: testPhone })
    }
  }

  const handleDeleteCampaign = async () => {
    if (!campaignToDelete) return
    const response = await campaignsApi.delete(campaignToDelete.id)
    if (response.error) toast({ title: "Error", description: response.error.message, variant: "destructive" })
    else {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] })
      toast({ title: "Success", description: "Campaign deleted" })
    }
    setCampaignToDelete(null)
  }

  const columns: Column<Campaign>[] = [
    {
      key: "name",
      label: "Campaign",
      render: (campaign) => (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-50 text-green-600">
            {campaign.channel === "whatsapp" ? (
              <MessageCircle className="h-4 w-4" />
            ) : (
              <Smartphone className="h-4 w-4" />
            )}
          </div>
          <div>
            <p className="font-medium">{campaign.name}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {campaign.channel} · {new Date(campaign.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (campaign) => (
        <Badge variant="outline" className={statusConfig[campaign.status]?.color || ""}>
          {campaign.status === "running" && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
          {statusConfig[campaign.status]?.label || campaign.status}
        </Badge>
      ),
    },
    {
      key: "stats",
      label: "Results",
      render: (campaign) => (
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">{campaign.totalRecipients || "—"} recipients</span>
          {campaign.status === "completed" && (
            <>
              <span className="text-green-600 font-medium">{campaign.totalSent} sent</span>
              {campaign.totalFailed > 0 && <span className="text-red-500">{campaign.totalFailed} failed</span>}
            </>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      headClassName: "text-right",
      className: "text-right",
      render: (campaign) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedCampaign(campaign)
              setShowDetailDialog(true)
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {campaign.status === "draft" && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedCampaign(campaign)
                  setShowTestDialog(true)
                }}
              >
                <Send className="h-4 w-4 text-blue-500" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedCampaign(campaign)
                  setShowLaunchDialog(true)
                }}
              >
                <PlayCircle className="h-4 w-4 text-green-500" />
              </Button>
            </>
          )}
          {campaignToDelete?.id !== campaign.id && (
            <Button variant="ghost" size="sm" onClick={() => setCampaignToDelete(campaign)}>
              <Trash2 className="h-4 w-4 text-red-400" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  const audienceLabel = (audience: any) => {
    if (!audience) return "All Active Members"
    const t = audience.type
    if (t === "all_active") return "All Active Members"
    if (t === "all") return "All Members (incl. inactive)"
    if (t === "specific_members") return `${audience.memberIds?.length || 0} Specific Members`
    if (t === "all_leads") return "All Leads"
    if (t === "leads") return `Leads (${audience.status || "all"})`
    if (t === "expiring") return `Expiring in ${audience.days} days`
    return "Custom Audience"
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="WhatsApp Campaigns"
        subtitle="Create and send bulk WhatsApp/SMS campaigns to members and leads"
        titleClassName="text-3xl font-bold tracking-tight"
        actions={
          <Button onClick={() => { setShowCreateDialog(true) }} className="gap-2">
            <Megaphone className="h-4 w-4" /> New Campaign
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(statusCounts).map(([key, count]) => (
          <Card
            key={key}
            className={`cursor-pointer hover:shadow-md transition-all ${
              activeTab === key ? "ring-2 ring-green-500 border-green-500" : ""
            }`}
            onClick={() => setActiveTab(key)}
          >
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs text-muted-foreground capitalize">{key}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Campaign List */}
      <DataTable
        columns={columns}
        data={filteredCampaigns || []}
        title="Campaigns"
        emptyMessage="No campaigns yet. Create your first WhatsApp campaign to reach members."
        pagination={false}
      />

      {/* Create Campaign Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => { setShowCreateDialog(open); if (!open) resetForm() }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Campaign</DialogTitle>
            <DialogDescription>
              Send bulk WhatsApp or SMS messages to your members and leads
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Campaign Name</Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Summer Promotion 2026"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Channel</Label>
                <Select value={formChannel} onValueChange={setFormChannel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-green-500" /> WhatsApp
                      </div>
                    </SelectItem>
                    <SelectItem value="sms">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-blue-500" /> SMS
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Subject (optional)</Label>
              <Input
                value={formSubject}
                onChange={(e) => setFormSubject(e.target.value)}
                placeholder="e.g. Exclusive Offer Just For You!"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Message Body</Label>
                {templates && templates.length > 0 && (
                  <Select
                    onValueChange={(val) => {
                      const tpl = templates.find((t: any) => t.id === val)
                      if (tpl) setFormBody(tpl.body)
                    }}
                  >
                    <SelectTrigger className="w-48 h-7 text-xs">
                      <SelectValue placeholder="Load from template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((t: any) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <Textarea
                value={formBody}
                onChange={(e) => setFormBody(e.target.value)}
                placeholder="Hi {{member_name}}, check out our latest offer at {{gym_name}}!"
                className="min-h-[120px] font-mono text-sm"
                required
              />
              <p className="text-xs text-muted-foreground">
                Available placeholders: {"{{member_name}}"}, {"{{gym_name}}"}, {"{{expiry_date}}"}, {"{{plan_name}}"}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Target Audience</Label>
              <Select value={formAudienceType} onValueChange={setFormAudienceType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_active">All Active Members</SelectItem>
                  <SelectItem value="all">All Members (including inactive)</SelectItem>
                  <SelectItem value="all_leads">All Leads</SelectItem>
                  <SelectItem value="expiring">Expiring Soon (7 days)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Campaign"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Campaign Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedCampaign?.name}
              {selectedCampaign && (
                <Badge variant="outline" className={statusConfig[selectedCampaign.status]?.color || ""}>
                  {statusConfig[selectedCampaign.status]?.label}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedCampaign && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Channel</p>
                  <p className="font-medium capitalize flex items-center gap-1">
                    {selectedCampaign.channel === "whatsapp" ? (
                      <MessageCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Smartphone className="h-4 w-4" />
                    )}
                    {selectedCampaign.channel}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Target Audience</p>
                  <p className="font-medium">{audienceLabel(selectedCampaign.targetAudience)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="font-medium">{new Date(selectedCampaign.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Recipients</p>
                  <p className="font-medium">{selectedCampaign.totalRecipients || "Not sent yet"}</p>
                </div>
                {selectedCampaign.status === "completed" && (
                  <>
                    <div>
                      <p className="text-muted-foreground">Sent</p>
                      <p className="font-medium text-green-600">{selectedCampaign.totalSent}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Failed</p>
                      <p className="font-medium text-red-500">{selectedCampaign.totalFailed}</p>
                    </div>
                  </>
                )}
              </div>

              <div className="border rounded-lg p-4 bg-slate-50">
                <p className="text-xs text-muted-foreground mb-2">Message Preview</p>
                <p className="text-sm whitespace-pre-wrap font-mono">{selectedCampaign.body}</p>
              </div>

              <div className="flex gap-2 justify-end">
                {selectedCampaign.status === "draft" && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowDetailDialog(false)
                        setShowTestDialog(true)
                      }}
                    >
                      <Send className="h-4 w-4 mr-1" /> Test
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setShowDetailDialog(false)
                        setShowLaunchDialog(true)
                      }}
                    >
                      <PlayCircle className="h-4 w-4 mr-1" /> Launch
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Test Message Dialog */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Message</DialogTitle>
            <DialogDescription>
              Send a sample of "{selectedCampaign?.name}" to your phone to preview
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleTestSend} className="space-y-4">
            <div className="space-y-2">
              <Label>Your Phone Number</Label>
              <Input
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="e.g. 919876543210"
                required
              />
              <p className="text-xs text-muted-foreground">Include country code (e.g., 91 for India)</p>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={testMutation.isPending || !testPhone}>
                {testMutation.isPending ? "Sending..." : "Send Test"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Launch Confirmation Dialog */}
      <Dialog open={showLaunchDialog} onOpenChange={setShowLaunchDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" /> Launch Campaign
            </DialogTitle>
            <DialogDescription>
              This will send "{selectedCampaign?.name}" to all recipients immediately.
              {selectedCampaign?.totalRecipients
                ? ` Estimated recipients: ${selectedCampaign.totalRecipients}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
            <p className="font-medium">Before launching:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-amber-700">
              <li>Send a test message first to verify the format</li>
              <li>Make sure your WhatsApp template is approved (if applicable)</li>
              <li>This action cannot be undone once started</li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLaunchDialog(false)}>Cancel</Button>
            <Button
              onClick={handleLaunchConfirm}
              disabled={launchMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {launchMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Launching...</>
              ) : (
                <><PlayCircle className="h-4 w-4 mr-2" /> Launch Now</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!campaignToDelete}
        onOpenChange={(open) => !open && setCampaignToDelete(null)}
        title="Delete Campaign"
        description={`Are you sure you want to delete "${campaignToDelete?.name}"?`}
        confirmLabel="Delete"
        onConfirm={handleDeleteCampaign}
      />
    </div>
  )
}
