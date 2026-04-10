import React, { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/features/auth/AuthContext"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Globe, CreditCard } from "lucide-react"

export const SettingsPage: React.FC = () => {
    const { user } = useAuth()
    const { toast } = useToast()
    const queryClient = useQueryClient()

    // Form states
    const [name, setName] = useState("")
    const [logoUrl, setLogoUrl] = useState("")
    const [phone, setPhone] = useState("")
    const [email, setEmail] = useState("")
    const [address, setAddress] = useState("")
    const [currency, setCurrency] = useState("INR")
    const [invoicePrefix, setInvoicePrefix] = useState("GYM")
    // Keys
    const [razorpayKeyId, setRazorpayKeyId] = useState("")
    const [razorpayKeySecret, setRazorpayKeySecret] = useState("")

    // Fetch Tenant Settings
    const { data: tenant, isLoading } = useQuery({
        queryKey: ["tenant", user?.tenantId],
        queryFn: async () => {
             const token = localStorage.getItem("gym_token")
             const res = await fetch(`/api/tenants/${user?.tenantId}`, {
                 headers: { "Authorization": `Bearer ${token}` }
             })
             if (!res.ok) throw new Error("Failed to fetch tenant settings")
             return res.json()
        },
        enabled: !!user?.tenantId
    })

    // Populate forms once loaded
    useEffect(() => {
        if (tenant) {
            setName(tenant.name || "")
            setLogoUrl(tenant.logoUrl || "")
            setPhone(tenant.phone || "")
            setEmail(tenant.email || "")
            setAddress(tenant.registeredAddress || "")
            setCurrency(tenant.currency || "INR")
            setInvoicePrefix(tenant.invoicePrefix || "GYM")
            setRazorpayKeyId(tenant.razorpayKeyId || "")
            setRazorpayKeySecret(tenant.razorpayKeySecret || "")
        }
    }, [tenant])

    const updateSettingsMutation = useMutation({
        mutationFn: async (updates: any) => {
             const token = localStorage.getItem("gym_token")
             const res = await fetch(`/api/tenants/${user?.tenantId}`, {
                 method: "PATCH",
                 headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                 body: JSON.stringify(updates)
             })
             if (!res.ok) throw new Error("Failed to update settings")
             return res.json()
        },
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ["tenant"] })
             toast({ title: "Success", description: "Settings saved successfully" })
        },
        onError: (err: any) => {
             toast({ title: "Error", description: err.message || "Save failed", variant: "destructive" })
        }
    })

    const handleSave = () => {
        updateSettingsMutation.mutate({
            name,
            logoUrl,
            phone,
            email,
            registeredAddress: address,
            currency,
            invoicePrefix,
            razorpayKeyId,
            razorpayKeySecret
        })
    }

    if (isLoading) return <div className="p-4">Loading settings...</div>

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                     <h1 className="text-3xl font-bold tracking-tight">Business Settings</h1>
                     <p className="text-muted-foreground">Manage branding, location, and payment keys securely Node.</p>
                </div>
                <Button onClick={handleSave} disabled={updateSettingsMutation.isPending}>
                       {updateSettingsMutation.isPending ? "Saving..." : "Save All Changes"}
                </Button>
            </div>

            <Tabs defaultValue="branding" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-3">
                    <TabsTrigger value="branding" className="flex items-center gap-2"><Globe className="h-4 w-4" /> Branding</TabsTrigger>
                    <TabsTrigger value="business" className="flex items-center gap-2"><Settings className="h-4 w-4" /> Business</TabsTrigger>
                    <TabsTrigger value="payment" className="flex items-center gap-2"><CreditCard className="h-4 w-4" /> Payments</TabsTrigger>
                </TabsList>

                {/* --- Branding Tab --- */}
                <TabsContent value="branding" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader><CardTitle>Branding & Logo</CardTitle><CardDescription>Update your logo and showcase branding Node safely.</CardDescription></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <Label htmlFor="name">Gym Name</Label>
                                <Input id="name" value={name} onChange={(e)=>setName(e.target.value)} required />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="logoUrl">Logo URL</Label>
                                <Input id="logoUrl" value={logoUrl} onChange={(e)=>setLogoUrl(e.target.value)} placeholder="https://..." />
                            </div>
                            {logoUrl && (
                                <div className="mt-2">
                                     <p className="text-sm font-medium mb-1">Preview:</p>
                                     <img src={logoUrl} alt="Logo Preview" className="h-16 object-contain rounded border p-1" onError={(e)=>{ e.currentTarget.style.display="none" }} />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- Business Tab --- */}
                <TabsContent value="business" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader><CardTitle>Business Details</CardTitle><CardDescription>Manage addresses and invoicing prefixes node safely.</CardDescription></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label htmlFor="email">Public Email</Label>
                                    <Input id="email" value={email} onChange={(e)=>setEmail(e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input id="phone" value={phone} onChange={(e)=>setPhone(e.target.value)} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="address">Registered Address</Label>
                                <Textarea id="address" value={address} onChange={(e)=>setAddress(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label htmlFor="invoice">Invoice Prefix</Label>
                                    <Input id="invoice" value={invoicePrefix} onChange={(e)=>setInvoicePrefix(e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="currency">Currency</Label>
                                    <Input id="currency" value={currency} disabled />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- Payments Tab --- */}
                <TabsContent value="payment" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader><CardTitle>Payment Gateway (Razorpay)</CardTitle><CardDescription>Inject keys to automate payments Node layout safely.</CardDescription></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <Label htmlFor="keyId">Razorpay Key ID</Label>
                                <Input id="keyId" value={razorpayKeyId} onChange={(e)=>setRazorpayKeyId(e.target.value)} placeholder="rzp_live_..." />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="keySecret">Razorpay Key Secret</Label>
                                <Input id="keySecret" type="password" value={razorpayKeySecret} onChange={(e)=>setRazorpayKeySecret(e.target.value)} placeholder="Secret Token" />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default SettingsPage;