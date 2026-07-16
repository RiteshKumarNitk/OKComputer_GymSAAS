import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { messageTemplatesApi } from "@/api/apiClient"
import { useAuth } from "@/features/auth/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { PageHeader, DataTable, ConfirmDialog } from "@/components/common"
import type { Column } from "@/components/common"
import {
  MessageCircle,
  Smartphone,
  Mail,
  Edit3,
  Trash2,
  Send,
  Copy,
  FileText,
} from "lucide-react"

interface MessageTemplate {
  id: string
  tenantId: string
  name: string
  triggerKey: string | null
  channel: "sms" | "whatsapp" | "email" | "in_app" | "push"
  subject: string | null
  body: string
  isActive: boolean
  isSystem: boolean
  createdAt: string
  updatedAt: string
}

const channelIcon = (channel: string) => {
  switch (channel) {
    case "whatsapp": return <MessageCircle className="h-4 w-4 text-green-500" />
    case "sms": return <Smartphone className="h-4 w-4 text-blue-500" />
    case "email": return <Mail className="h-4 w-4 text-purple-500" />
    default: return <MessageCircle className="h-4 w-4 text-slate-400" />
  }
}

const channelLabel = (channel: string) => {
  switch (channel) {
    case "whatsapp": return "WhatsApp"
    case "sms": return "SMS"
    case "email": return "Email"
    case "in_app": return "In-App"
    case "push": return "Push"
    default: return channel
  }
}

export const MessageTemplatesPage: React.FC = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [showFormDialog, setShowFormDialog] = useState(false)
  const [showTestDialog, setShowTestDialog] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null)
  const [templateToDelete, setTemplateToDelete] = useState<MessageTemplate | null>(null)
  const [testPhone, setTestPhone] = useState("")
  const [testTemplateId, setTestTemplateId] = useState<string | null>(null)
  const [showInactive, setShowInactive] = useState(false)

  // Form state
  const [formName, setFormName] = useState("")
  const [formChannel, setFormChannel] = useState("whatsapp")
  const [formTriggerKey, setFormTriggerKey] = useState("")
  const [formSubject, setFormSubject] = useState("")
  const [formBody, setFormBody] = useState("")

  // Fetch templates
  const { data: templates } = useQuery({
    queryKey: ["message-templates", showInactive],
    queryFn: async () => {
      const response = await messageTemplatesApi.list(showInactive)
      if (response.error) throw response.error
      return (response.data || []) as MessageTemplate[]
    },
    enabled: !!user?.tenantId,
  })

  const activeTemplates = templates?.filter((t) => t.isActive) || []
  const inactiveTemplates = templates?.filter((t) => !t.isActive) || []

  // Create template
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await messageTemplatesApi.create(data)
      if (response.error) throw response.error
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["message-templates"] })
      closeForm()
      toast({ title: "Success", description: "Template created" })
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  })

  // Update template
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await messageTemplatesApi.update(id, data)
      if (response.error) throw response.error
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["message-templates"] })
      closeForm()
      toast({ title: "Success", description: "Template updated" })
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  })

  // Test template
  const testMutation = useMutation({
    mutationFn: async ({ id, to }: { id: string; to: string }) => {
      const response = await messageTemplatesApi.test(id, to)
      if (response.error) throw response.error
      return response.data
    },
    onSuccess: () => {
      setTestPhone("")
      toast({ title: "Test Sent!", description: "Sample message sent to your phone" })
    },
    onError: (err: any) => toast({ title: "Test Failed", description: err.message, variant: "destructive" }),
  })

  const resetForm = () => {
    setFormName("")
    setFormChannel("whatsapp")
    setFormTriggerKey("")
    setFormSubject("")
    setFormBody("")
  }

  const openCreate = () => {
    setEditingTemplate(null)
    resetForm()
    setShowFormDialog(true)
  }

  const openEdit = (template: MessageTemplate) => {
    setEditingTemplate(template)
    setFormName(template.name)
    setFormChannel(template.channel)
    setFormTriggerKey(template.triggerKey || "")
    setFormSubject(template.subject || "")
    setFormBody(template.body)
    setShowFormDialog(true)
  }

  const closeForm = () => {
    setShowFormDialog(false)
    setEditingTemplate(null)
    resetForm()
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      name: formName,
      channel: formChannel,
      triggerKey: formTriggerKey || undefined,
      subject: formSubject || undefined,
      body: formBody,
    }
    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleToggleActive = async (template: MessageTemplate) => {
    const response = await messageTemplatesApi.update(template.id, { isActive: !template.isActive })
    if (response.error) toast({ title: "Error", description: response.error.message, variant: "destructive" })
    else {
      queryClient.invalidateQueries({ queryKey: ["message-templates"] })
      toast({ title: "Success", description: `Template ${template.isActive ? "deactivated" : "activated"}` })
    }
  }

  const handleDelete = async () => {
    if (!templateToDelete) return
    const response = await messageTemplatesApi.delete(templateToDelete.id)
    if (response.error) toast({ title: "Error", description: response.error.message, variant: "destructive" })
    else {
      queryClient.invalidateQueries({ queryKey: ["message-templates"] })
      toast({ title: "Success", description: "Template deleted" })
    }
    setTemplateToDelete(null)
  }

  const handleTest = (template: MessageTemplate) => {
    setTestTemplateId(template.id)
    setTestPhone("")
    setShowTestDialog(true)
  }

  const handleTestSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (testTemplateId && testPhone) {
      testMutation.mutate({ id: testTemplateId, to: testPhone })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: "Copied!", description: "Template body copied to clipboard" })
    })
  }

  const triggerKeyHint = (key: string | null) => {
    if (!key) return null
    const labels: Record<string, string> = {
      membership_expiry_7d: "7 days before expiry",
      membership_expiry_3d: "3 days before expiry",
      membership_expiry_1d: "1 day before expiry",
      new_member: "On new member signup",
      payment_done: "On successful payment",
      payment_failed: "On payment failure",
      birthday: "On member's birthday",
      workout_reminder: "Daily workout reminder",
    }
    return labels[key] || key
  }

  const columns: Column<MessageTemplate>[] = [
    {
      key: "name",
      label: "Template",
      render: (tpl) => (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-50">
            {channelIcon(tpl.channel)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium">{tpl.name}</p>
              {!tpl.isActive && (
                <Badge variant="outline" className="text-[10px] bg-slate-100 text-slate-500">Inactive</Badge>
              )}
              {tpl.isSystem && (
                <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-600">System</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{channelLabel(tpl.channel)}</p>
          </div>
        </div>
      ),
    },
    {
      key: "trigger",
      label: "Trigger",
      render: (tpl) => (
        <div>
          {tpl.triggerKey ? (
            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
              {triggerKeyHint(tpl.triggerKey)}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">Manual only</span>
          )}
        </div>
      ),
    },
    {
      key: "preview",
      label: "Preview",
      className: "max-w-xs",
      render: (tpl) => (
        <p className="text-xs text-muted-foreground truncate font-mono">
          {tpl.body?.substring(0, 60)}{(tpl.body?.length || 0) > 60 ? "..." : ""}
        </p>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      headClassName: "text-right",
      className: "text-right",
      render: (tpl) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(tpl.body)} title="Copy body">
            <Copy className="h-4 w-4 text-slate-400" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleTest(tpl)} title="Send test">
            <Send className="h-4 w-4 text-blue-500" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => openEdit(tpl)} title="Edit">
            <Edit3 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleToggleActive(tpl)} title={tpl.isActive ? "Deactivate" : "Activate"}>
            <div className={`h-3 w-3 rounded-full ${tpl.isActive ? "bg-green-500" : "bg-slate-300"}`} />
          </Button>
          {!tpl.isSystem && (
            <Button variant="ghost" size="sm" onClick={() => setTemplateToDelete(tpl)} title="Delete">
              <Trash2 className="h-4 w-4 text-red-400" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Message Templates"
        subtitle="Create and manage reusable WhatsApp, SMS, and email templates for campaigns and automated messages"
        titleClassName="text-3xl font-bold tracking-tight"
        actions={
          <Button onClick={openCreate} className="gap-2">
            <FileText className="h-4 w-4" /> New Template
          </Button>
        }
      />

      {/* Stats + Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex gap-4 text-sm">
          <span className="text-muted-foreground">
            <strong className="text-foreground">{activeTemplates.length}</strong> active
          </span>
          <span className="text-muted-foreground">
            <strong className="text-foreground">{inactiveTemplates.length}</strong> inactive
          </span>
          <span className="text-muted-foreground">
            <strong className="text-foreground">{templates?.length || 0}</strong> total
          </span>
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
          <span>Show inactive</span>
          <Switch checked={showInactive} onCheckedChange={setShowInactive} />
        </label>
      </div>

      {/* Template List */}
      <DataTable
        columns={columns}
        data={templates || []}
        title="Templates"
        emptyMessage="No templates yet. Create your first reusable message template."
        pagination={false}
      />

      {/* Create/Edit Dialog */}
      <Dialog open={showFormDialog} onOpenChange={(open) => { if (!open) closeForm() }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Edit Template" : "Create Template"}</DialogTitle>
            <DialogDescription>
              {editingTemplate
                ? "Update the message template details below."
                : "Create a reusable message template for campaigns and automated notifications."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Template Name *</Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Membership Expiry Reminder"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Channel</Label>
                <Select value={formChannel} onValueChange={setFormChannel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">
                      <span className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-green-500" /> WhatsApp</span>
                    </SelectItem>
                    <SelectItem value="sms">
                      <span className="flex items-center gap-2"><Smartphone className="h-4 w-4 text-blue-500" /> SMS</span>
                    </SelectItem>
                    <SelectItem value="email">
                      <span className="flex items-center gap-2"><Mail className="h-4 w-4 text-purple-500" /> Email</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Trigger Key (optional)</Label>
                <Select value={formTriggerKey} onValueChange={setFormTriggerKey}>
                  <SelectTrigger><SelectValue placeholder="Select trigger..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No trigger (manual only)</SelectItem>
                    <SelectItem value="membership_expiry_7d">Membership Expiry (7 days)</SelectItem>
                    <SelectItem value="membership_expiry_3d">Membership Expiry (3 days)</SelectItem>
                    <SelectItem value="membership_expiry_1d">Membership Expiry (1 day)</SelectItem>
                    <SelectItem value="new_member">New Member Signup</SelectItem>
                    <SelectItem value="payment_done">Payment Successful</SelectItem>
                    <SelectItem value="payment_failed">Payment Failed</SelectItem>
                    <SelectItem value="birthday">Member Birthday</SelectItem>
                    <SelectItem value="workout_reminder">Workout Reminder</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subject (optional)</Label>
                <Input
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  placeholder="e.g. Your membership is expiring soon"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Message Body *</Label>
              <Textarea
                value={formBody}
                onChange={(e) => setFormBody(e.target.value)}
                placeholder="Hi {{member_name}}, your membership at {{gym_name}} is expiring on {{expiry_date}}."
                className="min-h-[140px] font-mono text-sm"
                required
              />
              <div className="flex flex-wrap gap-2">
                {["{{member_name}}", "{{gym_name}}", "{{expiry_date}}", "{{plan_name}}", "{{amount}}", "{{due_date}}"].map((p) => (
                  <button
                    key={p}
                    type="button"
                    className="px-2 py-0.5 text-xs bg-slate-100 hover:bg-slate-200 rounded border text-slate-600 font-mono transition-colors"
                    onClick={() => setFormBody((prev) => prev + p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg bg-slate-50 p-3 border">
              <p className="text-xs font-medium text-muted-foreground mb-1">Preview</p>
              <p className="text-sm whitespace-pre-wrap font-mono">
                {formBody
                  .replace(/\{\{member_name\}\}/g, "Rahul")
                  .replace(/\{\{gym_name\}\}/g, "Your Gym")
                  .replace(/\{\{expiry_date\}\}/g, new Date().toLocaleDateString())
                  .replace(/\{\{plan_name\}\}/g, "Premium")
                  .replace(/\{\{amount\}\}/g, "₹999")
                  .replace(/\{\{due_date\}\}/g, new Date().toLocaleDateString())
                  || "Enter a message body to see preview"}
              </p>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending)
                  ? "Saving..." : editingTemplate ? "Save Changes" : "Create Template"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Test Dialog */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Message</DialogTitle>
            <DialogDescription>Send a sample of this template to your phone to preview the format</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleTestSend} className="space-y-4">
            <div className="space-y-2">
              <Label>Phone Number</Label>
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

      <ConfirmDialog
        open={!!templateToDelete}
        onOpenChange={(open) => !open && setTemplateToDelete(null)}
        title="Delete Template"
        description={`Are you sure you want to delete "${templateToDelete?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </div>
  )
}
