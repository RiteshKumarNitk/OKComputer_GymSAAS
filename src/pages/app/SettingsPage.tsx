import React, { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/api/supabase"
import { useAuth } from "@/features/auth/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Save } from "lucide-react"
import type { Tenant } from "@/types"

export const SettingsPage: React.FC = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState("general")

  // Fetch Tenant Details
  const { data: tenant, isLoading } = useQuery({
    queryKey: ["tenant_settings", user?.tenant_id],
    queryFn: async () => {
      if (!user?.tenant_id) return null
      const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .eq("id", user.tenant_id)
        .single()

      if (error) throw error
      return data as Tenant
    },
    enabled: !!user?.tenant_id,
  })

  // Update Tenant Mutation
  const updateTenantMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (!user?.tenant_id) throw new Error("No tenant ID found")

      const updates: any = {}

      // General Tab Fields
      if (activeTab === "general") {
        updates.name = formData.get("name")
        updates.owner_name = formData.get("owner_name")
        updates.owner_phone = formData.get("owner_phone")
        updates.owner_email = formData.get("owner_email")
        updates.registered_address = formData.get("registered_address")
        updates.gst_number = formData.get("gst_number")
      }

      // Branding Tab Fields
      if (activeTab === "branding") {
        updates.primary_color = formData.get("primary_color")
        updates.secondary_color = formData.get("secondary_color")
        // Note: Logo upload would go here, skipping for now to keep it simple
      }

      const { error } = await supabase
        .from("tenants")
        .update(updates)
        .eq("id", user.tenant_id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant_settings"] })
      toast({ title: "Success", description: "Settings updated successfully" })
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    updateTenantMutation.mutate(formData)
  }

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  if (!tenant) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold text-destructive">Tenant Not Found</h2>
        <p className="text-muted-foreground">Could not load settings for your gym. Please contact support.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General Information</TabsTrigger>
          <TabsTrigger value="branding">Branding & Appearance</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Gym Details</CardTitle>
              <CardDescription>Manage your business information.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Gym Name</Label>
                    <Input id="name" name="name" defaultValue={tenant.name} required />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="owner_name">Owner Name</Label>
                      <Input id="owner_name" name="owner_name" defaultValue={tenant.owner_name || ""} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="owner_phone">Owner Phone</Label>
                      <Input id="owner_phone" name="owner_phone" defaultValue={tenant.owner_phone || ""} />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="owner_email">Business Email</Label>
                    <Input id="owner_email" name="owner_email" type="email" defaultValue={tenant.owner_email || ""} />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="registered_address">Registered Address</Label>
                    <Input id="registered_address" name="registered_address" defaultValue={tenant.registered_address || ""} />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="gst_number">GST Number</Label>
                    <Input id="gst_number" name="gst_number" defaultValue={tenant.gst_number || ""} />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={updateTenantMutation.isPending}>
                    {updateTenantMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle>Branding</CardTitle>
              <CardDescription>Customize how your gym looks in the app.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label htmlFor="primary_color">Primary Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="primary_color"
                        name="primary_color"
                        type="color"
                        className="h-12 w-24 p-1 cursor-pointer"
                        defaultValue={tenant.primary_color || "#000000"}
                      />
                      <span className="text-sm text-muted-foreground">Main brand color</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="secondary_color">Secondary Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="secondary_color"
                        name="secondary_color"
                        type="color"
                        className="h-12 w-24 p-1 cursor-pointer"
                        defaultValue={tenant.secondary_color || "#ffffff"}
                      />
                      <span className="text-sm text-muted-foreground">Accent color</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={updateTenantMutation.isPending}>
                    {updateTenantMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    Save Branding
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}