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
}

export const MemberForm: React.FC<MemberFormProps> = ({
  member,
  memberships,
  onSuccess,
  onCancel,
}) => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    dob: undefined as Date | undefined,
    gender: "",
    address: "",
    emergencyContact_name: "",
    emergencyContact_phone: "",
    emergencyContact_relationship: "",
    currentPlanId: "",
    assigned_trainerId: "",
    status: "active" as MemberStatus,
    notes: "",
    avatarUrl: "",
  })

  // Fetch trainers
  const { data: trainers } = useQuery({
    queryKey: ["trainers", user?.tenantId],
    queryFn: async () => {
      const response = await trainersApi.list(user?.tenantId || "")
      if (response.error) throw response.error
      // Filter active trainers if needed on client side if server doesn't support filter config
      return (response.data || []) as Trainer[]
    },
    enabled: !!user?.tenantId,
  })

  // Initialize form with member data (mapping from camelCase response)
  useEffect(() => {
    if (member) {
      setFormData({
        fullName: member.fullName || "",
        email: member.email || "",
        phone: member.phone || "",
        dob: member.dob ? new Date(member.dob) : undefined,
        gender: member.gender || "",
        address: member.address ? (typeof member.address === 'object' ? (member.address as any).street : member.address) : "",
        emergencyContact_name: member.emergencyContact ? (member.emergencyContact as any).name : "",
        emergencyContact_phone: member.emergencyContact ? (member.emergencyContact as any).phone : "",
        emergencyContact_relationship: member.emergencyContact ? (member.emergencyContact as any).relationship : "",
        currentPlanId: member.currentPlanId || "",
        assigned_trainerId: member.assignedTrainerId || "",
        status: member.status || "active",
        notes: member.notes || "",
        avatarUrl: member.avatarUrl || member.avatarUrl || "",
      })
    }
  }, [member])

  const memberMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!user?.tenantId) {
        throw new Error("Tenant ID is missing. Please refresh the page or contact support.")
      }

      // memberData layout preserved as snake_case, generic CRUD converts it to camelCase for Prisma
      const memberData = {
        memberCode: member?.memberCode || generateMemberCode(),
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        dob: data.dob?.toISOString().split("T")[0],
        gender: data.gender,
        address: data.address ? { street: data.address } : null,
        emergencyContact: data.emergencyContact_name
          ? {
            name: data.emergencyContact_name,
            phone: data.emergencyContact_phone,
            relationship: data.emergencyContact_relationship,
          }
          : null,
        currentPlanId: (data.currentPlanId && data.currentPlanId !== "none") ? data.currentPlanId : null,
        assigned_trainerId: (data.assigned_trainerId && data.assigned_trainerId !== "none") ? data.assigned_trainerId : null,
        status: data.status,
        notes: data.notes,
        avatarUrl: data.avatarUrl,
      }

      const shouldUpdatePlanDates =
        (!member && memberData.currentPlanId) ||
        (member && memberData.currentPlanId && memberData.currentPlanId !== member.currentPlanId);

      if (shouldUpdatePlanDates) {
        const selectedPlan = memberships.find(m => m.id === memberData.currentPlanId)
        if (selectedPlan) {
          const startDate = new Date()
          const endDate = new Date(startDate)
          const duration = selectedPlan.durationDays ?? selectedPlan.durationDays ?? 30
          endDate.setDate(endDate.getDate() + duration)

          Object.assign(memberData, {
            planStartedAt: startDate.toISOString(),
            planExpiresAt: endDate.toISOString()
          })
        }
      } else if (!memberData.currentPlanId) {
        Object.assign(memberData, {
          planStartedAt: null,
          planExpiresAt: null
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
                {formData.fullName ? formData.fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase() : "M"}
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
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => handleInputChange("fullName", e.target.value)}
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
            <Label htmlFor="emergencyContact_name">Contact Name</Label>
            <Input
              id="emergencyContact_name"
              value={formData.emergencyContact_name}
              onChange={(e) => handleInputChange("emergencyContact_name", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emergencyContact_phone">Contact Phone</Label>
            <Input
              id="emergencyContact_phone"
              type="tel"
              value={formData.emergencyContact_phone}
              onChange={(e) => handleInputChange("emergencyContact_phone", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emergencyContact_relationship">Relationship</Label>
            <Input
              id="emergencyContact_relationship"
              value={formData.emergencyContact_relationship}
              onChange={(e) => handleInputChange("emergencyContact_relationship", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Membership Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Membership Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="currentPlanId">Membership Plan</Label>
            <Select
              value={formData.currentPlanId}
              onValueChange={(value) => handleInputChange("currentPlanId", value)}
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
            <Label htmlFor="assigned_trainerId">Assigned Trainer</Label>
            <Select
              value={formData.assigned_trainerId}
              onValueChange={(value) => handleInputChange("assigned_trainerId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select trainer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Trainer</SelectItem>
                {trainers?.map((trainer) => (
                  <SelectItem key={trainer.id} value={trainer.id}>
                    {trainer.fullName}
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
        {formData.currentPlanId && formData.currentPlanId !== "none" && (() => {
          const plan = memberships.find(m => m.id === formData.currentPlanId)
          if (!plan) return null
          const startDate = new Date()
          const endDate = new Date(startDate)
          const duration = plan.durationDays ?? plan.durationDays ?? 30
          endDate.setDate(endDate.getDate() + duration)
          const price = plan.priceCents ?? plan.priceCents ?? 0

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