import React, { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { tenantsApi, branchesApi, servicesApi, membershipsApi, billingApi, uploadApi } from "@/api/apiClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { 
    Loader2, 
    CheckCircle2, 
    CreditCard, 
    Building2, 
    User, 
    Image as ImageIcon,
    Settings,
    Shield,
    ChevronRight,
    ChevronLeft,
    Sparkles,
    Check,
    Eye,
    EyeOff,
    Key
} from "lucide-react"
import { generateInvoicePDF } from "@/utils/invoiceGenerator"
import { cn } from "@/lib/utils"

interface TenantOnboardingWizardProps {
    onComplete: () => void
    onCancel: () => void
    initialData?: any // Added for Edit Mode
}

const STEPS = [
    { title: "Business Identity", icon: Building2, desc: "Gym name & branding" },
    { title: "Owner Profile", icon: User, desc: "Personal & credentials" },
    { title: "SaaS Package", icon: Sparkles, desc: "Services & default plans" },
    { title: "Review & Pay", icon: CreditCard, desc: "Confirmation" }
]

export const TenantOnboardingWizard: React.FC<TenantOnboardingWizardProps> = ({ onComplete, onCancel, initialData }) => {
    const { toast } = useToast()
    const queryClient = useQueryClient()
    const [step, setStep] = useState(1)
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [logoFile, setLogoFile] = useState<File | null>(null)
    const [logoPreview, setLogoPreview] = useState<string | null>(initialData?.logoUrl || null)
    const [ownerPhotoFile, setOwnerPhotoFile] = useState<File | null>(null)

    const isEditMode = !!initialData

    // Form State
    const [formData, setFormData] = useState({
        // Identity (CamelCase to match Prisma exactly)
        name: initialData?.name || "",
        slug: initialData?.slug || "",
        businessType: initialData?.businessType || "gym",
        registeredAddress: initialData?.registeredAddress || "",
        
        // Owner
        ownerName: initialData?.ownerName || "",
        ownerEmail: initialData?.ownerEmail || "",
        ownerPhone: initialData?.ownerPhone || "",
        ownerPassword: "", // Don't pre-fill password for security
        
        // Billing Config
        currency: initialData?.currency || "INR",
        invoicePrefix: initialData?.invoicePrefix || "GYM",
        paymentGatewayPreference: initialData?.paymentGatewayPreference || "cash",

        // Services (Default for new, or empty for edit)
        services: {
            strength: true,
            cardio: true,
            crossfit: false,
            zumba: false,
            yoga: false,
            mma: false,
        },
        create_default_plans: !isEditMode,

        // Taxation (Mandatory for Indian Gyms)
        gstNumber: initialData?.gstNumber || "",
        panNumber: initialData?.panNumber || "",

        // Payment
        payment_amount: "9999",
        payment_method: "cash",
        payment_date: new Date().toISOString().split('T')[0],
    })

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        if (field === "name" && !isEditMode) { // Only auto-gen slug on creation
            const slug = value.toLowerCase().replace(/[^a-z0-9]/g, "-")
            setFormData(prev => ({ ...prev, slug, name: value }))
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'owner') => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            if (type === 'logo') {
                setLogoFile(file)
                setLogoPreview(URL.createObjectURL(file))
            } else {
                setOwnerPhotoFile(file)
            }
        }
    }

    const handleServiceChange = (service: string, checked: boolean) => {
        setFormData(prev => ({
            ...prev,
            services: { ...prev.services, [service]: checked }
        }))
    }

    const handleSubmit = async () => {
        setIsLoading(true)
        try {
            // 1. Upload Files
            let logoUrl = initialData?.logoUrl || null
            let ownerPhotoUrl = initialData?.ownerPhotoUrl || null
            if (logoFile) {
                const res = await uploadApi.uploadImage(logoFile)
                if (res) logoUrl = res.url
            }
            if (ownerPhotoFile) {
                const res = await uploadApi.uploadImage(ownerPhotoFile)
                if (res) ownerPhotoUrl = res.url
            }

            if (isEditMode) {
                // UPDATE MODE
                const updateData: any = {
                    name: formData.name,
                    businessType: formData.businessType,
                    registeredAddress: formData.registeredAddress,
                    ownerName: formData.ownerName,
                    ownerEmail: formData.ownerEmail,
                    ownerPhone: formData.ownerPhone,
                    currency: formData.currency,
                    invoicePrefix: formData.invoicePrefix,
                    paymentGatewayPreference: formData.paymentGatewayPreference,
                    gstNumber: formData.gstNumber,
                    panNumber: formData.panNumber,
                    logoUrl: logoUrl,
                    ownerPhotoUrl: ownerPhotoUrl,
                }
                
                if (formData.ownerPassword) {
                    updateData.ownerPassword = formData.ownerPassword
                }

                const { error } = await tenantsApi.update(initialData.id, updateData)
                if (error) throw error

                toast({ title: "Profile Updated", description: `Changes for ${formData.name} saved successfully.` })
            } else {
                // CREATE MODE (Original logic)
                const { data: tenant, error: tenantError } = await tenantsApi.create({
                    name: formData.name,
                    slug: formData.slug,
                    businessType: formData.businessType,
                    registeredAddress: formData.registeredAddress,
                    ownerName: formData.ownerName,
                    ownerEmail: formData.ownerEmail,
                    ownerPhone: formData.ownerPhone,
                    ownerPassword: formData.ownerPassword,
                    currency: formData.currency,
                    invoicePrefix: formData.invoicePrefix,
                    paymentGatewayPreference: formData.paymentGatewayPreference,
                    gstNumber: formData.gstNumber,
                    panNumber: formData.panNumber,
                    logoUrl: logoUrl,
                    ownerPhotoUrl: ownerPhotoUrl,
                    subscriptionStatus: 'active',
                    subscriptionExpiresAt: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
                })

                if (tenantError) throw tenantError
                if (!tenant) throw new Error("Failed to create tenant")

                // 3. Create Default Branch
                await branchesApi.create({
                    tenantId: tenant.id,
                    name: "Main Branch",
                    address: formData.registeredAddress,
                    phone: formData.ownerPhone,
                })

                // 4. Create Services
                const servicesToCreate = Object.entries(formData.services)
                    .filter(([_, enabled]) => enabled)
                    .map(([name]) => ({
                        tenantId: tenant.id,
                        name: name.charAt(0).toUpperCase() + name.slice(1),
                        type: name === "strength" || name === "cardio" ? "facility" : "class",
                        description: `Standard ${name} access`,
                    }))

                for (const service of servicesToCreate) {
                    await servicesApi.create(service)
                }

                // 5. Create Default Subscription Plan
                if (formData.create_default_plans) {
                    await membershipsApi.create({
                        name: "SaaS Subscription (Standard)", 
                        durationDays: 365, 
                        priceCents: parseInt(formData.payment_amount) * 100,
                        tenantId: tenant.id,
                        currency: formData.currency,
                        isActive: true,
                    })
                }

                // 6. Generate Invoice
                const amountCents = Math.round(parseFloat(formData.payment_amount) * 100)
                const invoiceNumber = `${formData.invoicePrefix}-${Date.now().toString().slice(-6)}`

                if (amountCents > 0) {
                    await billingApi.createInvoice({
                        tenantId: tenant.id,
                        invoiceNumber: invoiceNumber,
                        amountInr: parseFloat(formData.payment_amount),
                        status: 'paid',
                        paymentDate: new Date(formData.payment_date).toISOString(),
                    })

                    generateInvoicePDF({
                        invoiceNumber: invoiceNumber,
                        date: new Date(formData.payment_date),
                        items: [{ description: "Platform Onboarding & 1 Year SaaS Subscription", amount: amountCents }],
                        totalAmount: amountCents,
                        currency: formData.currency,
                        paymentMethod: formData.payment_method,
                        status: 'paid'
                    }, {
                        name: formData.name,
                        ownerName: formData.ownerName,
                        email: formData.ownerEmail,
                        phone: formData.ownerPhone,
                        address: formData.registeredAddress
                    })
                }

                toast({ 
                    title: "Platform Launch Successful!", 
                    description: `Created account for ${formData.ownerEmail}. Account is now fully functional.`,
                })
            }
            queryClient.invalidateQueries({ queryKey: ["tenants"] })
            onComplete()

        } catch (error: any) {
            console.error("Onboarding error:", error)
            toast({ title: "Error", description: error.message, variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }

    const nextStep = () => setStep(s => s + 1)
    const prevStep = () => setStep(s => s - 1)

    return (
        <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto">
            {/* Sidebar Steps */}
            <div className="lg:w-72 flex flex-row lg:flex-col gap-2 p-1 overflow-x-auto lg:overflow-visible shrink-0">
                {STEPS.map((s, i) => {
                    const stepNum = i + 1
                    const isActive = step === stepNum
                    const isCompleted = step > stepNum
                    return (
                        <div 
                            key={i}
                            className={cn(
                                "flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 min-w-[200px] lg:min-w-0",
                                isActive ? "bg-indigo-600 text-white border-indigo-600 shadow-lg scale-[1.02]" : "bg-white text-slate-500 border-slate-100",
                                isCompleted ? "border-emerald-100 bg-emerald-50/30" : ""
                            )}
                        >
                            <div className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                                isActive ? "bg-indigo-500" : "bg-slate-100",
                                isCompleted ? "bg-emerald-500 text-white" : ""
                            )}>
                                {isCompleted ? <Check className="w-5 h-5 text-white" /> : <s.icon className="w-5 h-5" />}
                            </div>
                            <div className="hidden md:block">
                                <p className="text-sm font-bold leading-tight">{s.title}</p>
                                <p className={cn("text-[10px]", isActive ? "text-indigo-100" : "text-slate-400")}>{s.desc}</p>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Main Content */}
            <div className="flex-1">
                <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl overflow-hidden min-h-[500px]">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100">
                        <div 
                            className="h-full bg-indigo-600 transition-all duration-500"
                            style={{ width: `${(step / STEPS.length) * 100}%` }}
                        />
                    </div>

                    <CardHeader className="pt-10 px-8 pb-4">
                        <div className="flex items-center gap-2 text-indigo-600 mb-1">
                            <Sparkles className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">{isEditMode ? "Gym Profile Update" : "Gym SaaS Onboarding"}</span>
                        </div>
                        <CardTitle className="text-3xl font-extrabold text-slate-900 leading-tight">
                            {isEditMode && step === 3 ? "Manage Features" : STEPS[step-1].title}
                        </CardTitle>
                        <CardDescription className="text-slate-500">
                            {isEditMode && step === 3 ? "Enable or disable platform features for this gym." : STEPS[step-1].desc}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="px-8 py-6">
                        {/* STEP 1: IDENTITY */}
                        {step === 1 && (
                            <div className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-slate-700 font-semibold">Legal (Gym) Name</Label>
                                        <Input 
                                            placeholder="e.g. Iron & Grit Fitness" 
                                            value={formData.name}
                                            onChange={(e) => handleInputChange("name", e.target.value)}
                                            className="h-12 border-slate-200 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-700 font-semibold">Web Slug (autogen)</Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">gymowl.in/</span>
                                            <Input 
                                                className="h-12 border-slate-200 pl-20 bg-slate-50 font-mono text-xs"
                                                value={formData.slug}
                                                readOnly
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-slate-700 font-semibold">GST Number (Optional)</Label>
                                        <Input 
                                            placeholder="22AAAAA0000A1Z5" 
                                            value={formData.gstNumber}
                                            onChange={(e) => handleInputChange("gstNumber", e.target.value)}
                                            className="h-12 border-slate-200 uppercase font-mono text-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-700 font-semibold">PAN Number</Label>
                                        <Input 
                                            placeholder="ABCDE1234F" 
                                            value={formData.panNumber}
                                            onChange={(e) => handleInputChange("panNumber", e.target.value)}
                                            className="h-12 border-slate-200 uppercase font-mono text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-slate-700 font-semibold">Business Address</Label>
                                    <Textarea 
                                        placeholder="Enter the registered address for invoicing..." 
                                        value={formData.registeredAddress}
                                        onChange={(e) => handleInputChange("registeredAddress", e.target.value)}
                                        className="min-h-[100px] border-slate-200 resize-none"
                                    />
                                </div>

                                <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-xl bg-white border-2 border-dashed border-indigo-200 flex items-center justify-center overflow-hidden shrink-0">
                                        {logoPreview ? <img src={logoPreview} className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6 text-indigo-300" />}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-indigo-900">Upload Gym Logo</p>
                                        <p className="text-xs text-indigo-600/70 mb-2">Recommended size: 512x512 PNG/SVG</p>
                                        <Label htmlFor="logo-upload" className="cursor-pointer">
                                            <div className="inline-flex items-center px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full hover:bg-indigo-700 transition">
                                                Select File
                                            </div>
                                            <input id="logo-upload" type="file" className="hidden" onChange={(e) => handleFileChange(e, 'logo')} />
                                        </Label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 2: OWNER */}
                        {step === 2 && (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-slate-700 font-semibold">Full Name of Owner</Label>
                                    <Input 
                                        placeholder="John Doe" 
                                        value={formData.ownerName}
                                        onChange={(e) => handleInputChange("ownerName", e.target.value)}
                                        className="h-12 border-slate-200"
                                    />
                                </div>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-slate-700 font-semibold">Primary Contact Email</Label>
                                        <Input 
                                            placeholder="owner@gym.com" 
                                            type="email"
                                            value={formData.ownerEmail}
                                            onChange={(e) => handleInputChange("ownerEmail", e.target.value)}
                                            className="h-12 border-slate-200"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-700 font-semibold">Phone Number</Label>
                                        <Input 
                                            placeholder="+91 98765 43210" 
                                            value={formData.ownerPhone}
                                            onChange={(e) => handleInputChange("ownerPhone", e.target.value)}
                                            className="h-12 border-slate-200 font-mono text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                    <Label className="text-indigo-900 font-bold flex items-center gap-2">
                                        <Key className="w-4 h-4" />
                                        Set Owner Login Password
                                    </Label>
                                    <div className="relative">
                                        <Input 
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Create a strong password for the owner" 
                                            value={formData.ownerPassword}
                                            onChange={(e) => handleInputChange("ownerPassword", e.target.value)}
                                            className="h-12 border-slate-200 pr-12"
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-2">Share this password with the owner. They will use their email to login.</p>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: SAAS PACKAGE */}
                        {step === 3 && (
                            <div className="space-y-8">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {Object.entries(formData.services).map(([key, value]) => (
                                        <div 
                                            key={key} 
                                            onClick={() => handleServiceChange(key, !value)}
                                            className={cn(
                                                "cursor-pointer p-4 rounded-xl border-2 transition-all flex items-center justify-between group",
                                                value ? "border-indigo-600 bg-indigo-50/50" : "border-slate-100 hover:border-slate-300"
                                            )}
                                        >
                                            <span className={cn("text-sm font-bold capitalize", value ? "text-indigo-900" : "text-slate-500")}>{key}</span>
                                            {value && <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>}
                                        </div>
                                    ))}
                                </div>

                                <div className="bg-slate-900 rounded-2xl p-6 text-white overflow-hidden relative shadow-xl">
                                    <div className="absolute top-0 right-0 p-8 transform translate-x-10 -translate-y-10 group-hover:translate-x-0 transition-transform">
                                        <div className="w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full" />
                                    </div>
                                    
                                    <div className="flex justify-between items-center mb-6">
                                        <div>
                                            <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest">SaaS License Type</p>
                                            <h4 className="text-xl font-bold">Standard Platform Access</h4>
                                        </div>
                                        <Settings className="w-6 h-6 text-slate-700" />
                                    </div>

                                    <div className="space-y-3 mb-8">
                                        <div className="flex items-center gap-2 text-sm text-slate-300"><Check className="w-4 h-4 text-emerald-400" /> Multi-branch Enabled</div>
                                        <div className="flex items-center gap-2 text-sm text-slate-300"><Check className="w-4 h-4 text-emerald-400" /> Custom SMS Branding</div>
                                        <div className="flex items-center gap-2 text-sm text-slate-300"><Check className="w-4 h-4 text-emerald-400" /> Integrated Fee Collection</div>
                                    </div>

                                    <div className="flex items-baseline gap-2 pt-4 border-t border-slate-800">
                                        <span className="text-3xl font-extrabold text-indigo-400">₹9,999</span>
                                        <span className="text-slate-500 text-xs text-indigo-200">/year + taxes</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 4: REVIEW & PAY */}
                        {step === 4 && (
                            <div className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <h4 className="font-bold text-slate-900 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Account Summary</h4>
                                        <div className="space-y-3 bg-slate-50 p-5 rounded-xl border relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-2"><Shield className="w-12 h-12 text-slate-200/50" /></div>
                                            <div className="flex justify-between text-sm"><span className="text-slate-500">Owner Login:</span> <span className="font-bold text-indigo-700">{formData.ownerEmail}</span></div>
                                            <div className="flex justify-between text-sm"><span className="text-slate-500">Password:</span> <span className="font-mono text-xs">{showPassword ? formData.ownerPassword : "••••••••"}</span></div>
                                            <div className="flex justify-between text-sm pt-2 border-t mt-2"><span className="text-slate-500">Gym Portal:</span> <span className="font-mono text-xs text-indigo-600">{formData.slug}.gymowl.in</span></div>
                                        </div>

                                        <div className="bg-indigo-600 rounded-xl p-5 text-white shadow-lg space-y-1">
                                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Total Fees (SaaS)</p>
                                            <p className="text-3xl font-extrabold font-mono">₹{formData.payment_amount}</p>
                                            <p className="text-[10px] opacity-70 italic">License valid for 365 days from today</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="font-bold text-slate-900 flex items-center gap-2"><CreditCard className="w-4 h-4 text-indigo-500" /> Payment Record</h4>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs">Payment Method Received</Label>
                                                <Select value={formData.payment_method} onValueChange={(v) => handleInputChange("payment_method", v)}>
                                                    <SelectTrigger className="bg-white border-slate-200"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="cash">Direct Cash / Deposit</SelectItem>
                                                        <SelectItem value="bank_transfer">IMPS/NEFT Transfer</SelectItem>
                                                        <SelectItem value="upi">UPI (GPay/PhonePe)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs">Actual Amount Paid</Label>
                                                <Input 
                                                    type="number" 
                                                    value={formData.payment_amount}
                                                    onChange={(e) => handleInputChange("payment_amount", e.target.value)}
                                                    className="bg-white border-slate-200 font-bold"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>

                    <CardFooter className="bg-slate-50/50 border-t p-8 flex justify-between items-center">
                        <Button 
                            variant="ghost" 
                            onClick={step === 1 ? onCancel : prevStep}
                            className="text-slate-500 font-bold"
                        >
                            <ChevronLeft className="w-4 h-4 mr-2" />
                            {step === 1 ? "Discard" : "Previous"}
                        </Button>

                        <div className="flex items-center gap-4">
                            {step < STEPS.length ? (
                                <Button 
                                    onClick={nextStep}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 shadow-xl px-8"
                                    disabled={step === 1 && !formData.name}
                                >
                                    Continue
                                    <ChevronRight className="w-4 h-4 ml-2" />
                                </Button>
                            ) : (
                                <Button 
                                    onClick={handleSubmit} 
                                    disabled={isLoading}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg px-8 h-12"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            {isEditMode ? "Saving..." : "Go Live..."}
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="mr-2 h-4 w-4" />
                                            {isEditMode ? "Update & Save Profile" : "Launch Platform & Send Invoice"}
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
