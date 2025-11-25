import React, { useState, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/api/supabase"
import { useAuth } from "@/features/auth/AuthContext"
import type { Member, Membership, MemberStatus } from "@/types"
import { generateMemberCode, formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

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
    status: "active" as MemberStatus,
    notes: "",
  })

  // Initialize form with member data
  useEffect(() => {
    if (member) {
      setFormData({
        full_name: member.full_name,
        email: member.email || "",
        phone: member.phone || "",
        dob: member.dob ? new Date(member.dob) : undefined,
        gender: member.gender || "",
        address: member.address?.street || "",
        emergency_contact_name: member.emergency_contact?.name || "",
        emergency_contact_phone: member.emergency_contact?.phone || "",
        emergency_contact_relationship: member.emergency_contact?.relationship || "",
        current_plan_id: member.current_plan_id || "",
        status: member.status,
        notes: member.notes || "",
      })
    }
  }, [member])

  const memberMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const memberData = {
        tenant_id: user?.tenant_id,
        member_code: member?.member_code || generateMemberCode(),
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
        status: data.status,
        notes: data.notes,
      }

      if (member) {
        const { error } = await supabase
          .from("members")
          .update(memberData)
          .eq("id", member.id)
          .eq("tenant_id", user?.tenant_id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from("members")
          .insert(memberData)
        if (error) throw error
      }
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Personal Information</h3>

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
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.dob && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.dob ? format(formData.dob, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.dob}
                  onSelect={(date) => handleInputChange("dob", date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
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
                    {membership.name} - {formatCurrency(membership.price_cents, membership.currency)} / {membership.duration_days} days
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