import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/features/auth/AuthContext"
import { feedbacksApi } from "@/api/apiClient"
import { MessageSquare, Reply, CheckCircle, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { Badge } from "@/components/ui/badge"

import { PageHeader, DataTable, ActionMenu } from "@/components/common"
import type { Column } from "@/components/common"

interface Feedback {
    id: string
    userName: string
    userMessage: string
    replyMessage?: string
    date: string
    status: 'open' | 'closed'
}

export const FeedbackPage: React.FC = () => {
    const { user } = useAuth()
    const { toast } = useToast()
    const queryClient = useQueryClient()
    const [searchQuery, setSearchQuery] = useState("")
    const [respondingTo, setRespondingTo] = useState<Feedback | null>(null)
    const [replyText, setReplyText] = useState("")
    
    const { data: feedbacksData } = useQuery({
        queryKey: ["feedbacks", user?.tenantId],
        queryFn: async () => {
            const { data, error } = await feedbacksApi.list(user?.tenantId || "")
            if (error) throw error
            return (data || []).map((c: any) => ({
                id: c.id,
                userName: c.member?.fullName || "Unknown Member",
                userMessage: c.title || c.description || "",
                replyMessage: c.status === 'closed' ? (c.description || "Resolved") : "",
                date: new Date(c.createdAt).toLocaleString(),
                status: c.status === 'resolved' || c.status === 'closed' ? 'closed' as const : 'open' as const
            })) as Feedback[]
        },
        enabled: !!user?.tenantId
    })

    const replyMutation = useMutation({
        mutationFn: async ({ id, message }: { id: string, message: string }) => {
            const { error } = await feedbacksApi.update(id, { description: message, status: 'resolved' })
            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["feedbacks"] })
            toast({ title: "Reply sent", description: "Feedback marked as resolved" })
        },
        onError: (err: any) => {
            toast({ title: "Error", description: err.message, variant: "destructive" })
        }
    })

    const handleSendReply = () => {
        if (!respondingTo || !replyText.trim()) return
        replyMutation.mutate({ id: respondingTo.id, message: replyText })
        setRespondingTo(null)
        setReplyText("")
    }

    const handleCloseIssue = (id: string) => {
        feedbacksApi.update(id, { status: 'resolved' }).then(() => {
            queryClient.invalidateQueries({ queryKey: ["feedbacks"] })
        })
    }

    const [issueName, setIssueName] = useState("")
    const [issueDesc, setIssueDesc] = useState("")

    const submitIssueMutation = useMutation({
        mutationFn: async () => {
            const { error } = await feedbacksApi.create({
                title: issueDesc,
                description: issueDesc,
                status: 'open',
                priority: 'medium',
                memberName: issueName
            })
            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["feedbacks"] })
            toast({ title: "Issue submitted" })
            setIssueName(""); setIssueDesc("")
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    })

    const feedbacks = feedbacksData || []

    const filteredData = feedbacks.filter(f => 
        f.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.id.includes(searchQuery)
    )

    const columns: Column<Feedback>[] = [
        {
            key: "id",
            label: "Feed ID",
            render: (item) => (
                <span className="text-xs font-medium text-slate-600">{item.id}</span>
            ),
        },
        {
            key: "userName",
            label: "User Name",
            render: (item) => (
                <span className="text-xs font-bold text-slate-900">{item.userName}</span>
            ),
        },
        {
            key: "userMessage",
            label: "User Message",
            render: (item) => (
                <span className="text-xs text-slate-600 max-w-[250px] truncate block">{item.userMessage}</span>
            ),
        },
        {
            key: "replyMessage",
            label: "Reply Message",
            render: (item) => (
                <span className="text-xs text-slate-600">
                    {item.replyMessage || <span className="text-slate-300 italic">No reply yet</span>}
                </span>
            ),
        },
        {
            key: "date",
            label: "Date",
            render: (item) => (
                <span className="text-[11px] text-slate-500 font-medium">{item.date}</span>
            ),
        },
        {
            key: "actions",
            label: "",
            render: (item) => (
                <div className="flex items-center justify-end gap-2">
                    {item.status === 'open' ? (
                        <Button
                            size="sm"
                            onClick={() => setRespondingTo(item)}
                            className="bg-[#EF6C00]/10 text-[#EF6C00] hover:bg-[#EF6C00]/20 font-bold text-xs h-8 px-4 border-none shadow-none"
                        >
                            Reply
                        </Button>
                    ) : (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-[10px] font-bold">Closed</Badge>
                    )}
                    <ActionMenu
                        options={[
                            { label: "Reply", icon: <Reply className="mr-3 h-4 w-4" />, onClick: () => setRespondingTo(item) },
                            { label: "Close Issue", icon: <CheckCircle className="mr-3 h-4 w-4 text-green-500" />, onClick: () => handleCloseIssue(item.id) },
                            { label: "Remove", icon: <Trash2 className="mr-3 h-4 w-4 text-red-500" />, onClick: () => { feedbacksApi.update(item.id, { status: 'resolved' }); queryClient.invalidateQueries({ queryKey: ["feedbacks"] }); }, danger: true },
                        ]}
                    />
                </div>
            ),
            className: "text-right",
        },
    ]

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500 max-w-[1400px] mx-auto">
            <PageHeader
                title="Feedback Management"
                actions={
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button className="h-9 bg-orange-600 hover:bg-orange-700 text-white rounded-md text-sm font-medium px-4 flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" /> Report Issue
                            </Button>
                        </DialogTrigger>
                            <DialogContent className="max-w-md p-6">
                                <DialogHeader>
                                    <DialogTitle className="text-lg font-bold">Report New Issue</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 pt-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-500">Member Name</label>
                                        <Input className="rounded-md" placeholder="Enter name" value={issueName} onChange={e => setIssueName(e.target.value)} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-500">Issue Details</label>
                                        <textarea className="w-full min-h-[100px] rounded-md border border-slate-200 p-3 text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none" placeholder="Describe the issue..." value={issueDesc} onChange={e => setIssueDesc(e.target.value)} />
                                    </div>
                                    <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold h-10" onClick={() => submitIssueMutation.mutate()} disabled={!issueDesc || submitIssueMutation.isPending}>{submitIssueMutation.isPending ? "Submitting..." : "Submit Issue"}</Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                }
            />

            <DataTable
                columns={columns}
                data={filteredData}
                searchable
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Search by ID or Name"
                title="Follow Ups"
                titleAction={
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-slate-500 text-[10px] font-bold">Total: {feedbacks.length}</Badge>
                        <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 text-[10px] font-bold">Open: {feedbacks.filter(f => f.status === 'open').length}</Badge>
                    </div>
                }
                emptyMessage="No feedback found."
                defaultRowsPerPage={10}
            />

            {/* Simple Reply Dialog */}
            <Dialog open={!!respondingTo} onOpenChange={(p) => !p && setRespondingTo(null)}>
                <DialogContent className="max-w-md p-0 overflow-hidden">
                    <div className="p-6 border-b">
                        <h2 className="text-lg font-bold">Reply to {respondingTo?.userName}</h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="bg-slate-50 p-4 rounded-md border text-sm text-slate-600 italic">
                            "{respondingTo?.userMessage}"
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500">Your Response</label>
                            <textarea 
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                className="w-full min-h-[120px] rounded-md border border-slate-200 p-3 text-sm focus:ring-1 focus:ring-orange-500 outline-none" 
                                placeholder="Type response..." 
                            />
                        </div>
                    </div>
                    <div className="p-6 bg-slate-50 flex justify-end gap-3">
                         <Button variant="ghost" onClick={() => setRespondingTo(null)} className="text-xs font-bold">Cancel</Button>
                         <Button onClick={handleSendReply} className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-6">Send Reply</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
