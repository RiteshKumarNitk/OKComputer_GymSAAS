import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/api/supabase"
import { useAuth } from "@/features/auth/AuthContext"
import { Lock, Unlock, Key, Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { formatDate } from "@/lib/utils"

interface Locker {
    id: string
    locker_number: string
    status: 'available' | 'occupied' | 'maintenance'
    assigned_to_member_id: string | null
    expires_at: string | null
    members?: { full_name: string, phone: string }
}

export const LockersPage: React.FC = () => {
    const { user } = useAuth()
    const { toast } = useToast()
    const queryClient = useQueryClient()
    const [isAddLockerOpen, setIsAddLockerOpen] = useState(false)
    const [selectedLocker, setSelectedLocker] = useState<Locker | null>(null)
    const [assignmentMemberId, setAssignmentMemberId] = useState("")

    // Fetch Lockers
    const { data: lockers } = useQuery({
        queryKey: ["lockers", user?.tenant_id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("lockers")
                .select("*, members(full_name, phone)")
                .eq("tenant_id", user?.tenant_id)
                .order("locker_number", { ascending: true }) // Assuming numeric strings sort might be weird but acceptable for now
            if (error) throw error
            return data as unknown as Locker[] // Supabase types are weird with joins sometimes
        },
        enabled: !!user?.tenant_id,
    })

    // Fetch Members for Dropdown
    const { data: members } = useQuery({
        queryKey: ["active-members", user?.tenant_id],
        queryFn: async () => {
            const { data } = await supabase.from("members").select("id, full_name").eq("tenant_id", user?.tenant_id).eq("status", "active")
            return data
        },
        enabled: !!user?.tenant_id
    })

    // Add Locker
    const addLockerMutation = useMutation({
        mutationFn: async (number: string) => {
            const { error } = await supabase.from("lockers").insert({
                tenant_id: user?.tenant_id,
                locker_number: number,
                status: 'available'
            })
            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["lockers"] })
            setIsAddLockerOpen(false)
            toast({ title: "Locker Added" })
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    })

    // Assign/Release Locker
    const updateLockerMutation = useMutation({
        mutationFn: async (vars: { id: string, status: string, memberId?: string | null }) => {
            const { error } = await supabase.from("lockers").update({
                status: vars.status,
                assigned_to_member_id: vars.memberId ?? null,
                expires_at: vars.status === 'occupied' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null // Default 30 days
            }).eq("id", vars.id)
            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["lockers"] })
            setSelectedLocker(null)
            toast({ title: "Locker Updated" })
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    })

    // Delete Locker
    const deleteLocker = async (id: string) => {
        if (!confirm("Remove this locker?")) return;
        await supabase.from("lockers").delete().eq("id", id)
        queryClient.invalidateQueries({ queryKey: ["lockers"] })
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Locker Management</h1>
                    <p className="text-muted-foreground">Assign lockers to members for safekeeping.</p>
                </div>
                <div className="flex gap-2">
                    <Dialog open={isAddLockerOpen} onOpenChange={setIsAddLockerOpen}>
                        <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Add Locker</Button></DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Add New Locker</DialogTitle></DialogHeader>
                            <form onSubmit={(e) => { e.preventDefault(); addLockerMutation.mutate((new FormData(e.currentTarget).get("number") as string)); }} className="space-y-4">
                                <Input name="number" placeholder="Locker Number (e.g. 101)" required />
                                <DialogFooter><Button type="submit">Create</Button></DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                    {/* Auto-Generate Button could go here */}
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                {lockers?.map(locker => (
                    <Card key={locker.id} className={`cursor-pointer hover:border-primary transition-all group relative ${locker.status === 'occupied' ? 'bg-red-50 dark:bg-red-950/20 border-red-200' : 'bg-green-50 dark:bg-green-950/20 border-green-200'}`}>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); deleteLocker(locker.id); }}>
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                        <CardContent className="p-4 flex flex-col items-center justify-center text-center h-40" onClick={() => setSelectedLocker(locker)}>
                            <div className={`p-3 rounded-full mb-3 ${locker.status === 'occupied' ? 'bg-red-200 text-red-700' : 'bg-green-200 text-green-700'}`}>
                                {locker.status === 'occupied' ? <Lock className="h-6 w-6" /> : <Unlock className="h-6 w-6" />}
                            </div>
                            <h3 className="font-bold text-lg">{locker.locker_number}</h3>
                            {locker.status === 'occupied' ? (
                                <div className="text-xs text-red-600 mt-1">
                                    <p className="font-medium">{locker.members?.full_name || "Unknown"}</p>
                                    <p>Exp: {formatDate(locker.expires_at || "")}</p>
                                </div>
                            ) : (
                                <p className="text-xs text-green-600 mt-1">Available</p>
                            )}
                        </CardContent>
                    </Card>
                ))}
                {lockers?.length === 0 && <div className="col-span-full py-10 text-center text-muted-foreground">No lockers found. Add some to get started.</div>}
            </div>

            {/* Assignment Dialog */}
            <Dialog open={!!selectedLocker} onOpenChange={(o) => !o && setSelectedLocker(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Locker {selectedLocker?.locker_number}</DialogTitle>
                        <DialogDescription>
                            Current Status: <span className="uppercase font-bold">{selectedLocker?.status}</span>
                        </DialogDescription>
                    </DialogHeader>
                    {selectedLocker?.status === 'occupied' ? (
                        <div className="space-y-4">
                            <div className="p-4 bg-muted rounded-md">
                                <p className="text-sm">Assigned to: <strong>{selectedLocker.members?.full_name}</strong></p>
                                <p className="text-sm">Expires: {formatDate(selectedLocker.expires_at || "")}</p>
                            </div>
                            <Button variant="destructive" className="w-full" onClick={() => updateLockerMutation.mutate({ id: selectedLocker.id, status: 'available', memberId: null })}>
                                <Key className="mr-2 h-4 w-4" /> Release Locker
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Assign to Member</Label>
                                <Select onValueChange={setAssignmentMemberId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Member" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {members?.map((m: any) => (
                                            <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button className="w-full" disabled={!assignmentMemberId} onClick={() => updateLockerMutation.mutate({ id: selectedLocker!.id, status: 'occupied', memberId: assignmentMemberId })}>
                                Assign Locker
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
