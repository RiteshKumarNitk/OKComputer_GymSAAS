import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/api/supabase"
import { useAuth } from "@/features/auth/AuthContext"
import {
    Search,
    Plus,
    MoreVertical,
    Phone,
    Mail,
    MessageCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"

export interface Lead {
    id: string
    full_name: string
    email: string | null
    phone: string
    status: 'new' | 'contacted' | 'trial' | 'converted' | 'lost'
    source: string
    notes: string | null
    created_at: string
}

export const LeadsPage: React.FC = () => {
    const { user } = useAuth()
    const { toast } = useToast()
    const queryClient = useQueryClient()
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
    const [searchQuery, setSearchQuery] = useState("")

    // Fetch Leads
    const { data: leads } = useQuery({
        queryKey: ["leads", user?.tenant_id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("leads")
                .select("*")
                .eq("tenant_id", user?.tenant_id)
                .order("created_at", { ascending: false })
            if (error) throw error
            return data as Lead[]
        },
        enabled: !!user?.tenant_id,
    })

    // Add/Update Mutation
    const saveLeadMutation = useMutation({
        mutationFn: async (formData: FormData) => {
            const data = {
                tenant_id: user?.tenant_id,
                full_name: formData.get("full_name") as string,
                email: formData.get("email") as string,
                phone: formData.get("phone") as string,
                status: formData.get("status") as string,
                source: formData.get("source") as string,
                notes: formData.get("notes") as string,
            }

            if (selectedLead) {
                const { error } = await supabase
                    .from("leads")
                    .update(data)
                    .eq("id", selectedLead.id)
                if (error) throw error
            } else {
                const { error } = await supabase.from("leads").insert([data])
                if (error) throw error
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leads"] })
            setIsAddOpen(false)
            setSelectedLead(null)
            toast({ title: "Success", description: `Lead ${selectedLead ? "updated" : "added"} successfully` })
        },
        onError: (error: any) => {
            toast({ title: "Error", description: error.message, variant: "destructive" })
        },
    })

    // Delete Mutation
    const deleteLeadMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("leads").delete().eq("id", id)
            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leads"] })
            toast({ title: "Success", description: "Lead deleted successfully" })
        },
    })


    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        saveLeadMutation.mutate(formData)
    }

    const filteredLeads = leads?.filter(lead =>
        lead.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.phone.includes(searchQuery)
    )

    const statusColors = {
        new: "bg-blue-100 text-blue-800",
        contacted: "bg-yellow-100 text-yellow-800",
        trial: "bg-purple-100 text-purple-800",
        converted: "bg-green-100 text-green-800",
        lost: "bg-red-100 text-red-800"
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Lead Management</h1>
                <Button onClick={() => { setSelectedLead(null); setIsAddOpen(true) }}>
                    <Plus className="mr-2 h-4 w-4" /> Add New Lead
                </Button>
            </div>

            <div className="flex items-center space-x-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search leads..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Kanban-ish / Grid View */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredLeads?.map((lead) => (
                    <Card key={lead.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-lg">{lead.full_name}</CardTitle>
                                    <CardDescription className="flex items-center mt-1">
                                        <Badge variant="secondary" className={statusColors[lead.status]}>
                                            {lead.status.toUpperCase()}
                                        </Badge>
                                        <span className="ml-2 text-xs text-muted-foreground">
                                            {lead.source}
                                        </span>
                                    </CardDescription>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => { setSelectedLead(lead); setIsAddOpen(true) }}>
                                            Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => deleteLeadMutation.mutate(lead.id)} className="text-destructive">
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center text-muted-foreground">
                                    <Phone className="mr-2 h-4 w-4" />
                                    {lead.phone}
                                </div>
                                {lead.email && (
                                    <div className="flex items-center text-muted-foreground">
                                        <Mail className="mr-2 h-4 w-4" />
                                        {lead.email}
                                    </div>
                                )}
                                <div className="flex items-center justify-between pt-2">
                                    <Button variant="outline" size="sm" className="w-full mr-2" onClick={() => window.open(`https://wa.me/${lead.phone.replace(/\D/g, '')}`, '_blank')}>
                                        <MessageCircle className="mr-2 h-3 w-3" /> WhatsApp
                                    </Button>
                                    <Button variant="outline" size="sm" className="w-full" onClick={() => window.location.href = `tel:${lead.phone}`}>
                                        <Phone className="mr-2 h-3 w-3" /> Call
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{selectedLead ? "Edit Lead" : "Add New Lead"}</DialogTitle>
                        <DialogDescription>
                            Enter the potential member's details here.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="full_name">Full Name</Label>
                                <Input id="full_name" name="full_name" required defaultValue={selectedLead?.full_name} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input id="phone" name="phone" required defaultValue={selectedLead?.phone} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" defaultValue={selectedLead?.email || ''} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select name="status" defaultValue={selectedLead?.status || "new"}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="new">New</SelectItem>
                                        <SelectItem value="contacted">Contacted</SelectItem>
                                        <SelectItem value="trial">Trial</SelectItem>
                                        <SelectItem value="converted">Converted</SelectItem>
                                        <SelectItem value="lost">Lost</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="source">Source</Label>
                                <Select name="source" defaultValue={selectedLead?.source || "walk-in"}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select source" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="walk-in">Walk-in</SelectItem>
                                        <SelectItem value="social_media">Social Media</SelectItem>
                                        <SelectItem value="referral">Referral</SelectItem>
                                        <SelectItem value="website">Website</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea id="notes" name="notes" placeholder="Any specific requirements..." defaultValue={selectedLead?.notes || ''} />
                        </div>

                        <DialogFooter>
                            <Button type="submit" disabled={saveLeadMutation.isPending}>
                                {saveLeadMutation.isPending ? "Saving..." : "Save Lead"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
