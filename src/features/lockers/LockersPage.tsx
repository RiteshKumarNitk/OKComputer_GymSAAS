import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { lockersApi, membersApi } from "@/api/apiClient"
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
import { PageHeader, ConfirmDialog } from "@/components/common"

interface Locker {
    id: string
    locker_number?: string
    lockerNumber?: string
    status: 'available' | 'occupied' | 'maintenance'
    assigned_to_memberId?: string | null
    assignedToMemberId?: string | null
    expires_at?: string | null
    expiresAt?: string | null
    members?: { fullName: string, phone: string }
    member?: { fullName: string }
}

export const LockersPage: React.FC = () => {
    const { user } = useAuth()
    const { toast } = useToast()
    const queryClient = useQueryClient()
    const [isAddLockerOpen, setIsAddLockerOpen] = useState(false)
    const [selectedLocker, setSelectedLocker] = useState<Locker | null>(null)
    const [lockerToDelete, setLockerToDelete] = useState<Locker | null>(null)
    const [assignmentMemberId, setAssignmentMemberId] = useState("")

    // Reset assignmentMemberId when selectedLocker changes
    React.useEffect(() => { setAssignmentMemberId("") }, [selectedLocker?.id])

    // Fetch Lockers
    const { data: lockers } = useQuery({
        queryKey: ["lockers", user?.tenantId],
        queryFn: async () => {
            const response = await lockersApi.list(user?.tenantId || "")
            if (response.error) throw response.error
            return response.data as unknown as Locker[]
        },
        enabled: !!user?.tenantId,
    })

    // Fetch Members for Dropdown
    const { data: members } = useQuery({
        queryKey: ["active-members", user?.tenantId],
        queryFn: async () => {
            const response = await membersApi.list(user?.tenantId || "", undefined, "active")
            if (response.error) throw response.error
            return response.data
        },
        enabled: !!user?.tenantId
    })

    // Add Locker
    const addLockerMutation = useMutation({
        mutationFn: async (number: string) => {
            const response = await lockersApi.create({
                lockerNumber: number,
                status: 'available'
            })
            if (response.error) throw response.error
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
            const response = await lockersApi.update(vars.id, {
                status: vars.status,
                assignedToMemberId: vars.memberId ?? null,
                expiresAt: vars.status === 'occupied' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null
            })
            if (response.error) throw response.error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["lockers"] })
            setSelectedLocker(null)
            toast({ title: "Locker Updated" })
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    })

    // Delete Locker
    const deleteLockerMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await lockersApi.delete(id)
            if (response.error) throw response.error
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["lockers"] }); toast({ title: "Locker removed" }) },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    })

    const confirmDelete = () => {
        if (lockerToDelete) {
            deleteLockerMutation.mutate(lockerToDelete.id)
            setLockerToDelete(null)
        }
    }

    const handleDeleteClick = (e: React.MouseEvent, locker: Locker) => {
        e.stopPropagation()
        setLockerToDelete(locker)
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Locker Management"
                subtitle="Assign lockers to members for safekeeping."
                actions={
                    <Dialog open={isAddLockerOpen} onOpenChange={setIsAddLockerOpen}>
                        <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Add Locker</Button></DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Add New Locker</DialogTitle></DialogHeader>
                            <form onSubmit={(e) => { e.preventDefault(); const num = new FormData(e.currentTarget).get("number"); if (num) addLockerMutation.mutate(num as string); }} className="space-y-4">
                                <Input name="number" placeholder="Locker Number (e.g. 101)" required />
                                <DialogFooter><Button type="submit">Create</Button></DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                }
            />

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                {lockers?.map(locker => (
                    <Card key={locker.id} className={`cursor-pointer hover:border-primary transition-all group relative ${locker.status === 'occupied' ? 'bg-red-50 dark:bg-red-950/20 border-red-200' : 'bg-green-50 dark:bg-green-950/20 border-green-200'}`}>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={(e) => handleDeleteClick(e, locker)}>
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                        <CardContent className="p-4 flex flex-col items-center justify-center text-center h-40" onClick={() => setSelectedLocker(locker)}>
                            <div className={`p-3 rounded-full mb-3 ${locker.status === 'occupied' ? 'bg-red-200 text-red-700' : 'bg-green-200 text-green-700'}`}>
                                {locker.status === 'occupied' ? <Lock className="h-6 w-6" /> : <Unlock className="h-6 w-6" />}
                            </div>
                            <h3 className="font-bold text-lg">{locker.lockerNumber || locker.locker_number}</h3>
                            {locker.status === 'occupied' ? (
                                <div className="text-xs text-red-600 mt-1">
                                    <p className="font-medium">{locker.member?.fullName || locker.members?.fullName || "Unknown"}</p>
                                    <p>Exp: {formatDate(locker.expiresAt || locker.expires_at || "")}</p>
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
                        <DialogTitle>Locker {selectedLocker?.lockerNumber || selectedLocker?.locker_number}</DialogTitle>
                        <DialogDescription>
                            Current Status: <span className="uppercase font-bold">{selectedLocker?.status}</span>
                        </DialogDescription>
                    </DialogHeader>
                    {selectedLocker?.status === 'occupied' ? (
                        <div className="space-y-4">
                            <div className="p-4 bg-muted rounded-md">
                                <p className="text-sm">Assigned to: <strong>{selectedLocker.member?.fullName || selectedLocker.members?.fullName}</strong></p>
                                <p className="text-sm">Expires: {formatDate(selectedLocker.expiresAt || selectedLocker.expires_at || "")}</p>
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
                                            <SelectItem key={m.id} value={m.id}>{m.fullName}</SelectItem>
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

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                open={!!lockerToDelete}
                onOpenChange={(open) => !open && setLockerToDelete(null)}
                title="Delete Locker"
                itemName={`Locker ${lockerToDelete?.lockerNumber || lockerToDelete?.locker_number}`}
                onConfirm={confirmDelete}
                loading={deleteLockerMutation.isPending}
                variant="danger"
                confirmLabel="Delete"
            />
        </div>
    )
}
