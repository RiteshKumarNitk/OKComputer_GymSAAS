import React, { useState, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/api/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, CheckCircle2, FileText, CreditCard, Upload } from "lucide-react"
import { generateInvoicePDF } from "@/utils/invoiceGenerator"

interface TenantOnboardingWizardProps {
    onComplete: () => void
    onCancel: () => void
}

export const TenantOnboardingWizard: React.FC<TenantOnboardingWizardProps> = ({ onComplete, onCancel }) => {
    const { toast } = useToast()
    const queryClient = useQueryClient()
    const [step, setStep] = useState(1)
    const [isLoading, setIsLoading] = useState(false)
    const [logoFile, setLogoFile] = useState<File | null>(null)
    const [ownerPhotoFile, setOwnerPhotoFile] = useState<File | null>(null)

    // Form State
    const [formData, setFormData] = useState({
        // Step 1: Basic & Branding
        name: "",
        slug: "",
        owner_name: "",
        owner_email: "",
        owner_phone: "",
        primary_color: "#7c3aed",
        secondary_color: "#4c1d95",

        // Step 2: Business & Billing
        business_type: "gym",
        gst_number: "",
        pan_number: "",
        registered_address: "",
        billing_currency: "INR",
        billing_cycle: "monthly",
        payment_gateway_preference: "cash",
        invoice_prefix: "INV",

        // Step 3: First Branch
        branch_name: "",
        branch_address: "",
        branch_phone: "",
        branch_email: "",

        // Step 4: Services (Checkboxes)
        services: {
            strength: true,
            cardio: true,
            crossfit: false,
            zumba: false,
            yoga: false,
            mma: false,
        },

        // Step 4: Default Plans
        create_default_plans: true,

        // Step 5: Payment
        payment_amount: "0",
        payment_method: "cash",
        payment_date: new Date().toISOString().split('T')[0],
    })

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'owner') => {
        if (e.target.files && e.target.files[0]) {
            if (type === 'logo') setLogoFile(e.target.files[0])
            else setOwnerPhotoFile(e.target.files[0])
        }
    }

    // Dynamic Pricing Logic
    useEffect(() => {
        if (step === 5) {
            const baseFee = 5000
            const serviceCount = Object.values(formData.services).filter(Boolean).length
            const calculatedAmount = baseFee + (serviceCount * 1000)
            setFormData(prev => ({ ...prev, payment_amount: calculatedAmount.toString() }))
        }
    }, [step])

    const handleServiceChange = (service: string, checked: boolean) => {
        setFormData(prev => ({
            ...prev,
            services: { ...prev.services, [service]: checked }
        }))
    }

    const generateSlug = (name: string) => {
        const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "-")
        setFormData(prev => ({ ...prev, slug }))
    }

    const handleSubmit = async () => {
        console.log("Starting onboarding process...");
        setIsLoading(true)
        try {
            console.log("Step 1: Creating Tenant...");
            console.log("Tenant Data:", {
                name: formData.name,
                slug: formData.slug,
                owner_email: formData.owner_email,
            });

            // 1. Create Tenant (Minimal Insert First)
            console.log("Attempting minimal tenant insert...");

            // Create a promise that rejects after 10 seconds
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Database request timed out. Check your network or database locks.")), 10000)
            );

            const insertPromise = supabase
                .from("tenants")
                .insert([{
                    name: formData.name,
                    slug: formData.slug,
                    // Only inserting minimal fields first to avoid schema/serialization issues
                }])
                .select()
                .single();

            const result: any = await Promise.race([insertPromise, timeoutPromise]);
            const { data: tenant, error: tenantError } = result;

            if (tenantError) {
                console.error("Error creating tenant (minimal):", tenantError);
                throw tenantError;
            }
            if (!tenant) {
                throw new Error("Tenant created but no data returned.");
            }
            console.log("Minimal tenant created:", tenant.id);

            // 1.5 Update with full details
            console.log("Updating tenant with full details...");
            const { error: updateError } = await supabase
                .from("tenants")
                .update({
                    owner_name: formData.owner_name,
                    owner_email: formData.owner_email,
                    owner_phone: formData.owner_phone,
                    primary_color: formData.primary_color,
                    secondary_color: formData.secondary_color,
                    business_type: formData.business_type,
                    gst_number: formData.gst_number,
                    pan_number: formData.pan_number,
                    registered_address: formData.registered_address,
                    billing_currency: formData.billing_currency,
                    billing_cycle: formData.billing_cycle,
                    payment_gateway_preference: formData.payment_gateway_preference,
                    invoice_prefix: formData.invoice_prefix,
                    subscription_status: 'active',
                    subscription_expires_at: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
                })
                .eq("id", tenant.id);

            if (updateError) {
                console.error("Error updating tenant details:", updateError);
                // Don't throw here, we can still proceed or at least we have the tenant
                toast({ title: "Warning", description: "Tenant created but some details failed to save.", variant: "destructive" });
            }

            // 1.1 Upload Files if present
            let logoUrl = null
            let ownerPhotoUrl = null

            if (logoFile) {
                console.log("Uploading logo...");
                const fileExt = logoFile.name.split('.').pop()
                const fileName = `${tenant.id}/logo.${fileExt}`
                const { error: uploadError } = await supabase.storage
                    .from('tenants-public')
                    .upload(fileName, logoFile)

                if (uploadError) {
                    console.error("Logo upload error (non-fatal):", uploadError);
                } else {
                    const { data: { publicUrl } } = supabase.storage
                        .from('tenants-public')
                        .getPublicUrl(fileName)
                    logoUrl = publicUrl
                }
            }

            if (ownerPhotoFile) {
                console.log("Uploading owner photo...");
                const fileExt = ownerPhotoFile.name.split('.').pop()
                const fileName = `${tenant.id}/owner.${fileExt}`
                const { error: uploadError } = await supabase.storage
                    .from('tenants-public')
                    .upload(fileName, ownerPhotoFile)

                if (uploadError) {
                    console.error("Owner photo upload error (non-fatal):", uploadError);
                } else {
                    const { data: { publicUrl } } = supabase.storage
                        .from('tenants-public')
                        .getPublicUrl(fileName)
                    ownerPhotoUrl = publicUrl
                }
            }

            // Update tenant with URLs if uploaded
            if (logoUrl || ownerPhotoUrl) {
                console.log("Updating tenant with image URLs...");
                await supabase
                    .from("tenants")
                    .update({
                        logo_url: logoUrl,
                        owner_photo_url: ownerPhotoUrl
                    })
                    .eq("id", tenant.id)
            }

            // 2. Create First Branch
            if (formData.branch_name) {
                console.log("Creating branch...");
                const { error: branchError } = await supabase
                    .from("branches")
                    .insert([{
                        tenant_id: tenant.id,
                        name: formData.branch_name,
                        address: formData.branch_address,
                        phone: formData.branch_phone,
                        // email: formData.branch_email, // Removed to prevent schema errors
                    }])
                if (branchError) console.error("Error creating branch:", branchError)
            }

            // 3. Create Services
            console.log("Creating services...");
            const servicesToCreate = Object.entries(formData.services)
                .filter(([_, enabled]) => enabled)
                .map(([name]) => ({
                    tenant_id: tenant.id,
                    name: name.charAt(0).toUpperCase() + name.slice(1), // Capitalize
                    type: name === "strength" || name === "cardio" ? "facility" : "class",
                    description: `Standard ${name} access`,
                }))

            if (servicesToCreate.length > 0) {
                const { error: serviceError } = await supabase
                    .from("services")
                    .insert(servicesToCreate)
                if (serviceError) console.error("Error creating services:", serviceError)
            }

            // 4. Create Default Plans with Random Indian Prices
            if (formData.create_default_plans) {
                console.log("Creating default plans...");
                const isZumba = formData.services.zumba;
                // Base price between 1000 and 3000 INR
                const baseMonthlyPrice = (Math.floor(Math.random() * 21) + 10) * 100;

                // Add premium for Zumba (e.g., 500 INR)
                const zumbaPremium = isZumba ? 500 : 0;

                const monthlyPrice = baseMonthlyPrice + zumbaPremium;

                // Calculate other durations with slight discounts
                const quarterlyPrice = Math.round(monthlyPrice * 3 * 0.9); // 10% discount
                const halfYearlyPrice = Math.round(monthlyPrice * 6 * 0.85); // 15% discount
                const yearlyPrice = Math.round(monthlyPrice * 12 * 0.75); // 25% discount

                // Convert to cents for DB
                const defaultPlans = [
                    { name: "Monthly", duration_days: 30, price_cents: monthlyPrice * 100 },
                    { name: "Quarterly", duration_days: 90, price_cents: quarterlyPrice * 100 },
                    { name: "Half-Yearly", duration_days: 180, price_cents: halfYearlyPrice * 100 },
                    { name: "Yearly", duration_days: 365, price_cents: yearlyPrice * 100 },
                    { name: "PT Add-on", duration_days: 30, price_cents: 500000, type: "addon" }, // Fixed 5000 INR for PT
                ]

                const plansData = defaultPlans.map(plan => ({
                    tenant_id: tenant.id,
                    name: plan.name,
                    duration_days: plan.duration_days,
                    price_cents: plan.price_cents,
                    currency: formData.billing_currency,
                    is_active: true,
                }))

                const { error: planError } = await supabase
                    .from("memberships")
                    .insert(plansData)
                if (planError) console.error("Error creating plans:", planError)
            }

            // 5. Generate Invoice & Save Record
            console.log("Generating invoice...");
            const amountCents = Math.round(parseFloat(formData.payment_amount) * 100)
            const invoiceNumber = `${formData.invoice_prefix}-${Date.now().toString().slice(-6)}`

            if (amountCents > 0) {
                const { error: invoiceError } = await supabase
                    .from("saas_invoices")
                    .insert([{
                        tenant_id: tenant.id,
                        invoice_number: invoiceNumber,
                        amount_cents: amountCents,
                        currency: formData.billing_currency,
                        status: 'paid',
                        payment_method: formData.payment_method,
                        payment_date: new Date(formData.payment_date).toISOString(),
                        items: [{ description: "Initial Setup & Subscription Fee", amount: amountCents }]
                    }])

                if (invoiceError) {
                    console.error("Error creating invoice record:", invoiceError)
                    toast({ title: "Warning", description: "Tenant created but invoice record failed.", variant: "destructive" })
                } else {
                    console.log("Generating PDF...");
                    try {
                        // Generate PDF
                        generateInvoicePDF({
                            invoiceNumber: invoiceNumber,
                            date: new Date(formData.payment_date),
                            items: [{ description: "Initial Setup & Subscription Fee", amount: amountCents }],
                            totalAmount: amountCents,
                            currency: formData.billing_currency,
                            paymentMethod: formData.payment_method,
                            status: 'paid'
                        }, {
                            name: formData.name,
                            ownerName: formData.owner_name,
                            email: formData.owner_email,
                            phone: formData.owner_phone,
                            address: formData.registered_address
                        })
                    } catch (pdfError) {
                        console.error("PDF Generation Error:", pdfError);
                        toast({ title: "Warning", description: "Tenant created but PDF generation failed.", variant: "destructive" });
                    }
                }
            }

            console.log("Onboarding complete!");
            toast({ title: "Success", description: "Tenant onboarding completed & invoice generated!" })
            queryClient.invalidateQueries({ queryKey: ["tenants"] })
            onComplete()

        } catch (error: any) {
            console.error("Onboarding error:", error)
            toast({ title: "Error", description: error.message, variant: "destructive" })
        } finally {
            console.log("Finally block reached. Stopping loading.");
            setIsLoading(false)
        }
    }

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold tracking-tight">New Gym Onboarding</h2>
                    <div className="text-sm text-muted-foreground">Step {step} of 5</div>
                </div>
                {/* Progress Bar */}
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-500 ease-in-out"
                        style={{ width: `${(step / 5) * 100}%` }}
                    />
                </div>
            </div>

            <Card className="border-2">
                <CardHeader>
                    <CardTitle>
                        {step === 1 && "Basic Details & Branding"}
                        {step === 2 && "Business & Billing"}
                        {step === 3 && "First Branch Setup"}
                        {step === 4 && "Services & Plans"}
                        {step === 5 && "Review & Payment"}
                    </CardTitle>
                    <CardDescription>
                        {step === 1 && "Let's start with the basics of the gym."}
                        {step === 2 && "Configure legal and financial details."}
                        {step === 3 && "Add the main branch location."}
                        {step === 4 && "Select services and create default plans."}
                        {step === 5 && "Verify details and record initial payment."}
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* STEP 1: BASICS */}
                    {step === 1 && (
                        <div className="grid gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Gym Name *</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => {
                                            handleInputChange("name", e.target.value)
                                            generateSlug(e.target.value)
                                        }}
                                        placeholder="e.g. Fitzone Fitness"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Slug (URL) *</Label>
                                    <Input value={formData.slug} onChange={(e) => handleInputChange("slug", e.target.value)} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Owner Full Name *</Label>
                                <Input value={formData.owner_name} onChange={(e) => handleInputChange("owner_name", e.target.value)} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Owner Email *</Label>
                                    <Input type="email" value={formData.owner_email} onChange={(e) => handleInputChange("owner_email", e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Owner Phone</Label>
                                    <Input value={formData.owner_phone} onChange={(e) => handleInputChange("owner_phone", e.target.value)} />
                                </div>
                            </div>

                            {/* Colors removed from UI as per request */}

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                <div className="space-y-2">
                                    <Label>Gym Logo</Label>
                                    <div className="flex items-center gap-2">
                                        <Input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'logo')} />
                                        {logoFile && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Owner Photo</Label>
                                    <div className="flex items-center gap-2">
                                        <Input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'owner')} />
                                        {ownerPhotoFile && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: BUSINESS */}
                    {step === 2 && (
                        <div className="grid gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Business Type</Label>
                                    <Select value={formData.business_type} onValueChange={(v) => handleInputChange("business_type", v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="gym">Gym</SelectItem>
                                            <SelectItem value="studio">Fitness Studio</SelectItem>
                                            <SelectItem value="crossfit">CrossFit Box</SelectItem>
                                            <SelectItem value="zumba">Zumba Studio</SelectItem>
                                            <SelectItem value="yoga">Yoga Studio</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Currency</Label>
                                    <Select value={formData.billing_currency} onValueChange={(v) => handleInputChange("billing_currency", v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="INR">INR (₹)</SelectItem>
                                            <SelectItem value="USD">USD ($)</SelectItem>
                                            <SelectItem value="EUR">EUR (€)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>GST Number</Label>
                                    <Input value={formData.gst_number} onChange={(e) => handleInputChange("gst_number", e.target.value)} placeholder="Optional" />
                                </div>
                                <div className="space-y-2">
                                    <Label>PAN Number</Label>
                                    <Input value={formData.pan_number} onChange={(e) => handleInputChange("pan_number", e.target.value)} placeholder="Optional" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Registered Address</Label>
                                <Textarea value={formData.registered_address} onChange={(e) => handleInputChange("registered_address", e.target.value)} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Invoice Prefix</Label>
                                    <Input value={formData.invoice_prefix} onChange={(e) => handleInputChange("invoice_prefix", e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Payment Gateway</Label>
                                    <Select value={formData.payment_gateway_preference} onValueChange={(v) => handleInputChange("payment_gateway_preference", v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="cash">Cash Only</SelectItem>
                                            <SelectItem value="razorpay">Razorpay</SelectItem>
                                            <SelectItem value="stripe">Stripe</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: BRANCH */}
                    {step === 3 && (
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <Label>Main Branch Name *</Label>
                                <Input
                                    value={formData.branch_name}
                                    onChange={(e) => handleInputChange("branch_name", e.target.value)}
                                    placeholder="e.g. Malviya Nagar Branch"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Address</Label>
                                <Textarea
                                    value={formData.branch_address}
                                    onChange={(e) => handleInputChange("branch_address", e.target.value)}
                                    placeholder="Full address of this branch"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Branch Phone</Label>
                                    <Input value={formData.branch_phone} onChange={(e) => handleInputChange("branch_phone", e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Branch Email</Label>
                                    <Input value={formData.branch_email} onChange={(e) => handleInputChange("branch_email", e.target.value)} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: SERVICES & PLANS */}
                    {step === 4 && (
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <Label className="text-base">Services Offered</Label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {Object.entries(formData.services).map(([key, value]) => (
                                        <div key={key} className="flex items-center space-x-2 border p-3 rounded-md hover:bg-accent">
                                            <Checkbox
                                                id={key}
                                                checked={value}
                                                onCheckedChange={(checked) => handleServiceChange(key, checked as boolean)}
                                            />
                                            <Label htmlFor={key} className="capitalize cursor-pointer flex-1">{key}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="create_plans"
                                        checked={formData.create_default_plans}
                                        onCheckedChange={(checked) => handleInputChange("create_default_plans", checked)}
                                    />
                                    <div className="grid gap-1.5 leading-none">
                                        <Label htmlFor="create_plans" className="text-base font-medium">
                                            Create Default Membership Plans?
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            We will create standard Monthly, Quarterly, and Yearly plans for you.
                                        </p>
                                    </div>
                                </div>

                                {formData.create_default_plans && (
                                    <div className="bg-muted/50 p-4 rounded-md text-sm space-y-2">
                                        <p className="text-xs text-muted-foreground mb-2">Note: Prices are generated randomly based on market rates and selected services (e.g., Zumba adds premium).</p>
                                        <div className="flex justify-between"><span>Monthly Plan</span><span className="font-mono">~₹1,500 - ₹3,500</span></div>
                                        <div className="flex justify-between"><span>Quarterly Plan</span><span className="font-mono">~₹4,000 - ₹9,000</span></div>
                                        <div className="flex justify-between"><span>Half-Yearly Plan</span><span className="font-mono">~₹7,500 - ₹16,000</span></div>
                                        <div className="flex justify-between"><span>Yearly Plan</span><span className="font-mono">~₹12,000 - ₹25,000</span></div>
                                        <div className="flex justify-between"><span>PT Add-on</span><span className="font-mono">₹5,000</span></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* STEP 5: REVIEW & PAYMENT */}
                    {step === 5 && (
                        <div className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h3 className="font-semibold flex items-center"><FileText className="w-4 h-4 mr-2" /> Review Details</h3>
                                    <div className="text-sm space-y-2 border p-4 rounded-md bg-muted/20">
                                        <div className="grid grid-cols-3 gap-2">
                                            <span className="text-muted-foreground">Gym:</span>
                                            <span className="col-span-2 font-medium">{formData.name}</span>

                                            <span className="text-muted-foreground">Owner:</span>
                                            <span className="col-span-2 font-medium">{formData.owner_name}</span>

                                            <span className="text-muted-foreground">Email:</span>
                                            <span className="col-span-2 font-medium">{formData.owner_email}</span>

                                            <span className="text-muted-foreground">Branch:</span>
                                            <span className="col-span-2 font-medium">{formData.branch_name}</span>

                                            <span className="text-muted-foreground">Services:</span>
                                            <span className="col-span-2 font-medium capitalize">
                                                {Object.entries(formData.services).filter(([_, v]) => v).map(([k]) => k).join(", ")}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-semibold flex items-center"><CreditCard className="w-4 h-4 mr-2" /> Initial Payment</h3>
                                    <div className="space-y-4 border p-4 rounded-md">
                                        <div className="space-y-2">
                                            <Label>Amount Received ({formData.billing_currency})</Label>
                                            <Input
                                                type="number"
                                                value={formData.payment_amount}
                                                onChange={(e) => handleInputChange("payment_amount", e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Payment Method</Label>
                                            <Select value={formData.payment_method} onValueChange={(v) => handleInputChange("payment_method", v)}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="cash">Cash</SelectItem>
                                                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                                    <SelectItem value="upi">UPI</SelectItem>
                                                    <SelectItem value="cheque">Cheque</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Payment Date</Label>
                                            <Input
                                                type="date"
                                                value={formData.payment_date}
                                                onChange={(e) => handleInputChange("payment_date", e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-50 text-blue-900 p-4 rounded-md text-sm flex items-start">
                                <CheckCircle2 className="w-5 h-5 mr-2 mt-0.5 shrink-0" />
                                <div>
                                    <p className="font-semibold">Ready to Onboard?</p>
                                    <p>Clicking "Complete" will create the tenant, set up their environment, and generate an invoice for the amount above.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>

                <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={step === 1 ? onCancel : () => setStep(s => s - 1)}>
                        {step === 1 ? "Cancel" : "Back"}
                    </Button>

                    {step < 5 ? (
                        <Button onClick={() => setStep(s => s + 1)}>
                            Next Step
                        </Button>
                    ) : (
                        <Button onClick={handleSubmit} disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Complete & Generate Invoice
                                </>
                            )}
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    )
}
