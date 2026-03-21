import React, { useState, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { membershipsApi } from "@/api/apiClient"
import { useAuth } from "@/features/auth/AuthContext"
import type { Membership } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"

interface PlanFormProps {
  plan?: Membership | null
  onSuccess: () => void
  onCancel: () => void
}

export const PlanForm: React.FC<PlanFormProps> = ({
  plan,
  onSuccess,
  onCancel,
}) => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price_cents: 0,
    duration_days: 30,
    is_active: true,
  })

  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name || "",
        description: plan.description || "",
        price_cents: plan.priceCents ?? plan.price_cents ?? 0,
        duration_days: plan.durationDays ?? plan.duration_days ?? 30,
        is_active: plan.isActive ?? plan.is_active ?? true,
      })
    }
  }, [plan])

  const planMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!user?.tenant_id) throw new Error("Tenant ID is missing")

      const payload = {
        ...data,
        tenant_id: user.tenant_id,
        // Ensure price is integer
        price_cents: Math.round(data.price_cents),
        currency: "INR", // Default required by Prisma
      }

      let response
      if (plan) {
        response = await membershipsApi.update(plan.id, payload)
      } else {
        response = await membershipsApi.create(payload)
      }

      if (response.error) throw response.error
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memberships"] })
      onSuccess()
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await planMutation.mutateAsync(formData)
  }

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Plan Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleInputChange("name", e.target.value)}
          placeholder="e.g., Monthly Gold"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Price (₹) *</Label>
          <Input
            id="price"
            type="number"
            value={formData.price_cents / 100}
            onChange={(e) => handleInputChange("price_cents", Math.round(parseFloat(e.target.value || "0") * 100))}
            min="0"
            step="0.01"
            required
          />
          <p className="text-xs text-muted-foreground">Stored internally as {formData.price_cents} paise</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration">Duration (Days) *</Label>
          <Input
            id="duration"
            type="number"
            value={formData.duration_days}
            onChange={(e) => handleInputChange("duration_days", parseInt(e.target.value || "30"))}
            min="1"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          placeholder="What's included in this plan..."
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => handleInputChange("is_active", !!checked)}
        />
        <Label htmlFor="is_active" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Active
        </Label>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={planMutation.isPending}>
          {planMutation.isPending ? "Saving..." : plan ? "Update Plan" : "Create Plan"}
        </Button>
      </div>
    </form>
  )
}
