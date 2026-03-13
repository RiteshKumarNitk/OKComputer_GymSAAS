import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { 
  CreditCard, 
  MessageSquare, 
  Globe, 
  ShieldCheck, 
  Save, 
  Database
} from "lucide-react"

export const SuperAdminSettings: React.FC = () => {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Platform Settings</h1>
                <p className="text-muted-foreground">Configure global integrations and SaaS behavior.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* PAYMENT GATEWAY */}
                <Card className="border-2 border-slate-100 shadow-sm">
                    <CardHeader className="bg-slate-50 border-b">
                        <div className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-indigo-600" />
                            <CardTitle className="text-lg">Payment Gateway (Razorpay)</CardTitle>
                        </div>
                        <CardDescription>Main collector for SaaS subscription payments.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="space-y-2">
                            <Label>Razorpay Key ID</Label>
                            <Input placeholder="rzp_live_..." type="password" />
                        </div>
                        <div className="space-y-2">
                            <Label>Razorpay Secret</Label>
                            <Input placeholder="••••••••••••••••" type="password" />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="space-y-0.5">
                                <Label>Test Mode (Sandbox)</Label>
                                <p className="text-xs text-muted-foreground">Transactions will not charge real money.</p>
                            </div>
                            <Switch checked={true} />
                        </div>
                    </CardContent>
                    <CardFooter className="border-t bg-slate-50/50 py-3">
                        <Button className="ml-auto" size="sm"><Save className="mr-2 h-4 w-4" /> Save Key</Button>
                    </CardFooter>
                </Card>

                {/* WHATSAPP & SMS */}
                <Card className="border-2 border-slate-100 shadow-sm">
                    <CardHeader className="bg-slate-50 border-b">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-emerald-600" />
                            <CardTitle className="text-lg">Communication Gateways</CardTitle>
                        </div>
                        <CardDescription>Engage tenants and members via WhatsApp/SMS.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="space-y-2">
                            <Label>WhatsApp Business API Link</Label>
                            <Input placeholder="https://api.whatsapp.com/..." />
                        </div>
                        <div className="space-y-2">
                            <Label>Twilio Account SID (SMS)</Label>
                            <Input placeholder="AC..." type="password" />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-emerald-50/30 rounded-lg border border-emerald-100">
                            <div className="space-y-0.5">
                                <Label>Global Alerts Enabled</Label>
                                <p className="text-xs text-muted-foreground">Allow platform to send auto-renewal alerts.</p>
                            </div>
                            <Switch checked={true} />
                        </div>
                    </CardContent>
                    <CardFooter className="border-t bg-slate-50/50 py-3">
                        <Button className="ml-auto" size="sm" variant="outline"><Save className="mr-2 h-4 w-4" /> Update Comm Config</Button>
                    </CardFooter>
                </Card>

                {/* STORAGE & DATABASE */}
                <Card className="border-2 border-slate-100 shadow-sm">
                    <CardHeader className="bg-slate-50 border-b">
                        <div className="flex items-center gap-2">
                            <Database className="h-5 w-5 text-blue-600" />
                            <CardTitle className="text-lg">Resource Settings</CardTitle>
                        </div>
                        <CardDescription>Manage cloud storage and database limits.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="space-y-2">
                            <Label>Cloudinary Upload Preset</Label>
                            <Input placeholder="gym_logos_preset" />
                        </div>
                        <div className="space-y-4 pt-2">
                            <div className="flex items-center justify-between">
                                <Label>Maximum Tenant Memory Pool</Label>
                                <span className="text-xs font-mono text-slate-500">256MB / Tenant</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 w-[45%]" />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="border-t bg-slate-50/50 py-3">
                        <Button className="ml-auto" size="sm" variant="outline"><ShieldCheck className="mr-2 h-4 w-4" /> Verify Storage</Button>
                    </CardFooter>
                </Card>

                {/* BRANDING */}
                <Card className="border-2 border-slate-100 shadow-sm">
                    <CardHeader className="bg-slate-50 border-b">
                        <div className="flex items-center gap-2">
                            <Globe className="h-5 w-5 text-slate-600" />
                            <CardTitle className="text-lg">Platform Branding</CardTitle>
                        </div>
                        <CardDescription>White-label settings for the main SaaS portal.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Portal Name</Label>
                                <Input defaultValue="GymOwl Pro" />
                            </div>
                            <div className="space-y-2">
                                <Label>Support Email</Label>
                                <Input defaultValue="support@gymowl.in" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="space-y-0.5">
                                <Label>White Labeling Enabled</Label>
                                <p className="text-xs text-muted-foreground">Hide "Powered by GymOwl" on invoices.</p>
                            </div>
                            <Switch checked={false} />
                        </div>
                    </CardContent>
                    <CardFooter className="border-t bg-slate-50/50 py-3">
                        <Button className="ml-auto" size="sm" variant="default"><Save className="mr-2 h-4 w-4" /> Save Branding</Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
