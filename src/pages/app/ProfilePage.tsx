import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { tenantsApi, usersApi } from "@/api/apiClient"
import { useAuth } from "@/features/auth/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Save } from "lucide-react"

export const ProfilePage: React.FC = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState("general")

  // Fetch Profile/Tenant Details
  const { data: profileData, isLoading } = useQuery({
    queryKey: ["profile", user?.role, user?.tenant_id, user?.id],
    queryFn: async () => {
      if (user?.role === "super_admin") {
        const { data, error } = await usersApi.get(user.id)
        if (error) throw error
        return { type: "user", data }
      } else {
        if (!user?.tenant_id) return null
        const { data, error } = await tenantsApi.get(user.tenant_id)
        if (error) throw error
        return { type: "tenant", data }
      }
    },
    enabled: !!user,
  })

  // Update Profile Mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (!user) throw new Error("Not authenticated")

      const updates: any = {}
      formData.forEach((value, key) => {
        if (value !== null && value !== "") {
          updates[key] = value
        }
      })

      if (user.role === "super_admin") {
        const { error } = await usersApi.update(user.id, updates)
        if (error) throw error
      } else {
        if (!user.tenant_id) throw new Error("No tenant ID found")
        const { error } = await tenantsApi.update(user.tenant_id, updates)
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] })
      toast({ title: "Success", description: "Profile updated successfully" })
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    updateProfileMutation.mutate(formData)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Loading your profile...</p>
      </div>
    )
  }

  if (!profileData) {
    return (
      <div className="p-8 text-center max-w-md mx-auto border rounded-xl bg-slate-50 mt-12">
        <h2 className="text-xl font-semibold text-destructive mb-2">Profile Not Found</h2>
        <p className="text-muted-foreground mb-6">We couldn't retrieve your profile information. This might be a temporary issue.</p>
        <Button onClick={() => window.location.reload()} variant="outline">Try Refreshing</Button>
      </div>
    )
  }

  const isSuperAdmin = user?.role === "super_admin"
  const displayName = isSuperAdmin ? "System Admin Profile" : "Gym Profile"

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">{displayName}</h1>
          <p className="text-muted-foreground mt-1">
            {isSuperAdmin 
              ? "Manage your administrative account and system-wide configurations." 
              : "Manage your gym's public identity, branding, and contact information."}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-100 p-1 flex-wrap h-auto">
          <TabsTrigger value="general" className="px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            {isSuperAdmin ? "Personal Details" : "General Information"}
          </TabsTrigger>
          {!isSuperAdmin && (
            <TabsTrigger value="branding" className="px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Branding & Appearance
            </TabsTrigger>
          )}
          <TabsTrigger value="security" className="px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Security & Login
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card className="shadow-lg border-slate-200 overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-6">
              <CardTitle className="text-xl">
                {isSuperAdmin ? "Admin Credentials" : "Business Profile"}
              </CardTitle>
              <CardDescription>
                These details are used across the platform for identification.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {isSuperAdmin ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Full Name</Label>
                        <Input id="full_name" name="full_name" defaultValue={profileData.data?.full_name} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Work Email</Label>
                        <Input id="email" name="email" type="email" defaultValue={profileData.data?.email} required />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid gap-2 md:col-span-2">
                        <Label htmlFor="name">Gym Name</Label>
                        <Input id="name" name="name" defaultValue={profileData.data?.name} required className="text-lg font-medium" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="owner_name">Owner Name</Label>
                        <Input id="owner_name" name="owner_name" defaultValue={profileData.data?.owner_name || ""} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="owner_phone">Contact Phone</Label>
                        <Input id="owner_phone" name="owner_phone" defaultValue={profileData.data?.owner_phone || ""} />
                      </div>
                      <div className="grid gap-2 md:col-span-2">
                        <Label htmlFor="owner_email">Official Email</Label>
                        <Input id="owner_email" name="owner_email" type="email" defaultValue={profileData.data?.owner_email || ""} />
                      </div>
                      <div className="grid gap-2 md:col-span-2">
                        <Label htmlFor="registered_address">Registered Address</Label>
                        <Input id="registered_address" name="registered_address" defaultValue={profileData.data?.registered_address || ""} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gst_number">GST Number</Label>
                        <Input id="gst_number" name="gst_number" defaultValue={profileData.data?.gst_number || ""} placeholder="XXAAAAA0000A1Z5" />
                      </div>
                    </>
                  )}
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100 mt-8">
                  <Button type="submit" size="lg" disabled={updateProfileMutation.isPending} className="shadow-md hover:shadow-lg transition-all">
                    {updateProfileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    Save Update
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {!isSuperAdmin && (
          <TabsContent value="branding">
            <Card className="shadow-lg border-slate-200 overflow-hidden">
              <CardHeader className="bg-slate-50 border-b border-slate-100 pb-6">
                <CardTitle className="text-xl">Visual Identity</CardTitle>
                <CardDescription>Customize the look and feel of your member-facing portal.</CardDescription>
              </CardHeader>
              <CardContent className="pt-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid md:grid-cols-2 gap-12">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="primary_color" className="text-sm font-semibold uppercase tracking-wider text-slate-500">Primary Brand Color</Label>
                        <div className="flex items-center gap-4 p-3 border rounded-lg bg-slate-50">
                          <Input
                            id="primary_color"
                            name="primary_color"
                            type="color"
                            className="h-12 w-24 p-1 cursor-pointer border-none rounded"
                            defaultValue={profileData.data?.primary_color || "#7c3aed"}
                          />
                          <div>
                            <p className="text-sm font-medium">Primary UI</p>
                            <p className="text-xs text-muted-foreground">Used for buttons, headers, and highlights</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="secondary_color" className="text-sm font-semibold uppercase tracking-wider text-slate-500">Secondary Accent</Label>
                        <div className="flex items-center gap-4 p-3 border rounded-lg bg-slate-50">
                          <Input
                            id="secondary_color"
                            name="secondary_color"
                            type="color"
                            className="h-12 w-24 p-1 cursor-pointer border-none rounded"
                            defaultValue={profileData.data?.secondary_color || "#4c1d95"}
                          />
                          <div>
                            <p className="text-sm font-medium">Accent UI</p>
                            <p className="text-xs text-muted-foreground">Used for icons and subtle backgrounds</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-900 rounded-xl p-6 text-white self-center">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Live Preview</h4>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full" style={{ backgroundColor: profileData.data?.primary_color || "#7c3aed" }} />
                          <div className="h-2 w-24 bg-slate-700 rounded" />
                        </div>
                        <div className="h-10 w-full rounded flex items-center justify-center text-sm font-medium" style={{ backgroundColor: profileData.data?.primary_color || "#7c3aed" }}>
                          Sample Button
                        </div>
                        <div className="h-2 w-1/2 bg-slate-800 rounded" />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-100 mt-8">
                    <Button type="submit" size="lg" disabled={updateProfileMutation.isPending}>
                      {updateProfileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Save className="mr-2 h-4 w-4" />
                      Update Branding
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="security">
          <Card className="shadow-lg border-rose-100 overflow-hidden">
            <CardHeader className="bg-rose-50 border-b border-rose-100 pb-6">
              <CardTitle className="text-xl text-rose-900">Security & Authentication</CardTitle>
              <CardDescription className="text-rose-700/70">Manage your password and platform security settings.</CardDescription>
            </CardHeader>
            <CardContent className="pt-8 space-y-6">
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-start gap-3">
                <div className="h-5 w-5 rounded-full bg-amber-200 flex items-center justify-center text-amber-900 text-xs font-bold mt-0.5">!</div>
                <div>
                  <p className="text-sm font-semibold text-amber-900">Change Password</p>
                  <p className="text-sm text-amber-800/80">To change your password, please use the "Forgot Password" link on the login page. This is for your security.</p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-100">
                <h4 className="font-semibold mb-1">Two-Factor Authentication</h4>
                <p className="text-sm text-muted-foreground mb-4">Add an extra layer of security to your account.</p>
                <Button variant="outline" disabled>Coming Soon</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}