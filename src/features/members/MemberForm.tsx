import React, { useState, useEffect } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { membersApi, trainersApi, uploadApi } from "@/api/apiClient"
import { useAuth } from "@/features/auth/AuthContext"
import type { Member, Membership, MemberStatus, Trainer } from "@/types"
import { generateMemberCode, formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Camera } from "lucide-react"
import { format } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface MemberFormProps {
  member?: Member | null
  memberships: Membership[]
  onSuccess: () => void
  onCancel: () => void
  prefillData?: Partial<typeof formData>
}

export const MemberForm: React.FC<MemberFormProps> = ({
  member,
  memberships,
  onSuccess,
  onCancel,
  prefillData,
}) => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    dob: undefined as Date | undefined,
    gender: "",
    address: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relationship: "",
    current_plan_id: "",
    assigned_trainer_id: "",
    status: "active" as MemberStatus,
    notes: "",
    avatarUrl: "",
  })

  // Fetch trainers
  const { data: trainers } = useQuery({
    queryKey: ["trainers", user?.tenant_id],
    queryFn: async () => {
      const response = await trainersApi.list(user?.tenant_id || "")
      if (response.error) throw response.error
      // Filter active trainers if needed on client side if server doesn't support filter config
      return (response.data || []) as Trainer[]
    },
    enabled: !!user?.tenant_id,
  })

  // Initialize form with member data (mapping from camelCase response)
  useEffect(() => {
    if (member) {
      setFormData({
        full_name: member.fullName || "",
        email: member.email || "",
        phone: member.phone || "",
        dob: member.dob ? new Date(member.dob) : undefined,
        gender: member.gender || "",
        address: member.address ? (typeof member.address === 'object' ? (member.address as any).street : member.address) : "",
        emergency_contact_name: member.emergencyContact ? (member.emergencyContact as any).name : "",
        emergency_contact_phone: member.emergencyContact ? (member.emergencyContact as any).phone : "",
        emergency_contact_relationship: member.emergencyContact ? (member.emergencyContact as any).relationship : "",
        current_plan_id: member.currentPlanId || "",
        assigned_trainer_id: member.assignedTrainerId || "",
        status: member.status || "active",
        notes: member.notes || "",
        avatarUrl: member.avatarUrl || member.avatar_url || "",
      })
    } else if (prefillData) {
      setFormData(prev => ({ ...prev, ...prefillData }))
    }
  }, [member, prefillData])

  const memberMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!user?.tenant_id) {
        throw new Error("Tenant ID is missing. Please refresh the page or contact support.")
      }

      // memberData layout preserved as snake_case, generic CRUD converts it to camelCase for Prisma
      const memberData = {
        member_code: member?.memberCode || generateMemberCode(),
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        dob: data.dob?.toISOString().split("T")[0],
        gender: data.gender,
        address: data.address ? { street: data.address } : null,
        emergency_contact: data.emergency_contact_name
          ? {
            name: data.emergency_contact_name,
            phone: data.emergency_contact_phone,
            relationship: data.emergency_contact_relationship,
          }
          : null,
        current_plan_id: (data.current_plan_id && data.current_plan_id !== "none") ? data.current_plan_id : null,
        assigned_trainer_id: (data.assigned_trainer_id && data.assigned_trainer_id !== "none") ? data.assigned_trainer_id : null,
        status: data.status,
        notes: data.notes,
        avatarUrl: data.avatarUrl,
      }

      const shouldUpdatePlanDates =
        (!member && memberData.current_plan_id) ||
        (member && memberData.current_plan_id && memberData.current_plan_id !== member.currentPlanId);

      if (shouldUpdatePlanDates) {
        const selectedPlan = memberships.find(m => m.id === memberData.current_plan_id)
        if (selectedPlan) {
          const startDate = new Date()
          const endDate = new Date(startDate)
          const duration = selectedPlan.durationDays ?? selectedPlan.duration_days ?? 30
          endDate.setDate(endDate.getDate() + duration)

          Object.assign(memberData, {
            plan_started_at: startDate.toISOString(),
            plan_expires_at: endDate.toISOString()
          })
        }
      } else if (!memberData.current_plan_id) {
        Object.assign(memberData, {
          plan_started_at: null,
          plan_expires_at: null
        })
      }

      let response;
      if (member) {
        response = await membersApi.update(member.id, memberData)
      } else {
        response = await membersApi.create(memberData)
      }

      if (response.error) throw response.error
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] })
      onSuccess()
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await memberMutation.mutateAsync(formData)
  }

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const response = await uploadApi.uploadImage(file)
      if (response?.url) {
        handleInputChange("avatarUrl", response.url)
      }
    } catch (error) {
      console.error("Image upload failed:", error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Personal Information</h3>

        <div className="flex justify-center mb-6">
          <div className="relative">
            <Avatar className="h-24 w-24 border-2 border-slate-200 dark:border-slate-800">
              <AvatarImage src={formData.avatarUrl || ""} />
              <AvatarFallback className="text-xl font-bold bg-slate-100 dark:bg-slate-800">
                {formData.full_name ? formData.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase() : "M"}
              </AvatarFallback>
            </Avatar>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              id="avatar_upload"
              onChange={handleImageUpload}
            />
            <Label
              htmlFor="avatar_upload"
              className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-1.5 rounded-full cursor-pointer shadow-lg hover:bg-primary/90 transition-colors"
            >
              <Camera className="h-4 w-4" />
            </Label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => handleInputChange("full_name", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select
              value={formData.gender}
              onValueChange={(value) => handleInputChange("gender", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
                <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dob">Date of Birth</Label>
            <Input
              id="dob"
              type="date"
              value={formData.dob ? formData.dob.toISOString().split("T")[0] : ""}
              onChange={(e) => handleInputChange("dob", e.target.value ? new Date(e.target.value) : undefined)}
              onClick={(e) => (e.target as any).showPicker?.()}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Emergency Contact</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="emergency_contact_name">Contact Name</Label>
            <Input
              id="emergency_contact_name"
              value={formData.emergency_contact_name}
              onChange={(e) => handleInputChange("emergency_contact_name", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emergency_contact_phone">Contact Phone</Label>
            <Input
              id="emergency_contact_phone"
              type="tel"
              value={formData.emergency_contact_phone}
              onChange={(e) => handleInputChange("emergency_contact_phone", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emergency_contact_relationship">Relationship</Label>
            <Input
              id="emergency_contact_relationship"
              value={formData.emergency_contact_relationship}
              onChange={(e) => handleInputChange("emergency_contact_relationship", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Membership Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Membership Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="current_plan_id">Membership Plan</Label>
            <Select
              value={formData.current_plan_id}
              onValueChange={(value) => handleInputChange("current_plan_id", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select membership plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Plan</SelectItem>
                {memberships?.map((membership) => (
                  <SelectItem key={membership.id} value={membership.id}>
                    {membership.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assigned_trainer_id">Assigned Trainer</Label>
            <Select
              value={formData.assigned_trainer_id}
              onValueChange={(value) => handleInputChange("assigned_trainer_id", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select trainer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Trainer</SelectItem>
                {trainers?.map((trainer) => (
                  <SelectItem key={trainer.id} value={trainer.id}>
                    {trainer.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleInputChange("status", value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Selected Plan Details - LIVE PREVIEW */}
        {formData.current_plan_id && formData.current_plan_id !== "none" && (() => {
          const plan = memberships.find(m => m.id === formData.current_plan_id)
          if (!plan) return null
          const startDate = new Date()
          const endDate = new Date(startDate)
          const duration = plan.durationDays ?? plan.duration_days ?? 30
          endDate.setDate(endDate.getDate() + duration)
          const price = plan.priceCents ?? plan.price_cents ?? 0

          return (
            <div className="mt-4 p-4 border rounded-lg bg-primary/5 space-y-3">
              <h4 className="font-semibold text-primary flex items-center gap-2">
                Selected Plan: {plan.name}
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Price</p>
                  <p className="font-bold text-lg">{formatCurrency(price, plan.currency || "INR")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Duration</p>
                  <p className="font-medium">{duration} Days</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Valid Until</p>
                  <p className="font-bold text-red-600">{format(endDate, "PPP")}</p>
                </div>
              </div>
            </div>
          )
        })()}
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => handleInputChange("notes", e.target.value)}
          placeholder="Any additional notes about this member..."
          rows={3}
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={memberMutation.isPending}>
          {memberMutation.isPending
            ? "Saving..."
            : member
              ? "Update Member"
              : "Create Member"}
        </Button>
      </div>
    </form>
  )
}