import React, { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, MoreVertical, MessageSquare, Reply, CheckCircle, XCircle, Trash2, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Feedback {
    id: string
    userName: string
    userMessage: string
    replyMessage?: string
    date: string
    status: 'open' | 'closed'
}

const initialFeedback: Feedback[] = [
    { id: "913", userName: "Anchal Rajput", userMessage: "I am suffering issue with your trainer", replyMessage: "I WILL SHOOT HIM MAM", date: "13 Apr, 2026 01:07 PM", status: 'closed' },
    { id: "870", userName: "Iswar singh", userMessage: "ishwarpreet singh", replyMessage: "", date: "10 Mar, 2026 05:03 PM", status: 'open' },
    { id: "855", userName: "shivaam gupta", userMessage: "hibshsuksah dhhahha", replyMessage: "ok sir i willsee", date: "14 Feb, 2026 06:52 PM", status: 'closed' },
    { id: "854", userName: "Rahul Verma", userMessage: "Gym AC is not working properly", replyMessage: "", date: "12 Feb, 2026 10:15 AM", status: 'open' },
    { id: "853", userName: "Sneha Kapur", userMessage: "Locker room needs cleaning", replyMessage: "Done", date: "10 Feb, 2026 04:30 PM", status: 'closed' },
]

export const FeedbackPage: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState("")
    const [feedbacks, setFeedbacks] = useState<Feedback[]>(initialFeedback)
    const [respondingTo, setRespondingTo] = useState<Feedback | null>(null)
    const [replyText, setReplyText] = useState("")
    
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1)
    const [rowsPerPage, setRowsPerPage] = useState(10)

    const handleSendReply = () => {
        if (!respondingTo) return
        setFeedbacks(prev => prev.map(f => 
            f.id === respondingTo.id 
                ? { ...f, replyMessage: replyText, status: 'closed' } 
                : f
        ))
        setRespondingTo(null)
        setReplyText("")
    }

    const filteredData = feedbacks.filter(f => 
        f.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.id.includes(searchQuery)
    )

    const totalPages = Math.ceil(filteredData.length / rowsPerPage)
    const paginatedData = filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500 max-w-[1400px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Feedback Management</h1>
                
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search by ID or Name"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-9 w-64 rounded-md border-slate-200 text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                        />
                    </div>
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
                                    <Input className="rounded-md" placeholder="Enter name" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500">Issue Details</label>
                                    <textarea className="w-full min-h-[100px] rounded-md border border-slate-200 p-3 text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none" placeholder="Describe the issue..." />
                                </div>
                                <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold h-10">Submit Issue</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Card className="border-slate-200 shadow-sm rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                   <h2 className="text-sm font-bold text-slate-700">Follow Ups</h2>
                   <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-slate-500 text-[10px] font-bold">Total: {feedbacks.length}</Badge>
                        <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 text-[10px] font-bold">Open: {feedbacks.filter(f => f.status === 'open').length}</Badge>
                   </div>
                </div>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/30 hover:bg-transparent">
                                <TableHead className="text-xs font-bold text-slate-500 px-6">Feed ID</TableHead>
                                <TableHead className="text-xs font-bold text-slate-500">User Name</TableHead>
                                <TableHead className="text-xs font-bold text-slate-500">User Message</TableHead>
                                <TableHead className="text-xs font-bold text-slate-500">Reply Message</TableHead>
                                <TableHead className="text-xs font-bold text-slate-500">Date</TableHead>
                                <TableHead className="text-right px-6"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedData.map((item) => (
                                <TableRow key={item.id} className="hover:bg-slate-50/50">
                                    <TableCell className="px-6 py-4 text-xs font-medium text-slate-600">{item.id}</TableCell>
                                    <TableCell className="py-4 text-xs font-bold text-slate-900">{item.userName}</TableCell>
                                    <TableCell className="py-4 text-xs text-slate-600 max-w-[250px] truncate">{item.userMessage}</TableCell>
                                    <TableCell className="py-4 text-xs text-slate-600">
                                        {item.replyMessage || <span className="text-slate-300 italic">No reply yet</span>}
                                    </TableCell>
                                    <TableCell className="py-4 text-[11px] text-slate-500 font-medium">{item.date}</TableCell>
                                    <TableCell className="px-6 py-4 text-right">
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
                                            
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-white border text-slate-400">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuItem onClick={() => setRespondingTo(item)} className="text-xs font-medium"><Reply className="mr-2 h-3.5 w-3.5" /> Reply</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setRespondingTo(null)} className="text-xs font-medium"><CheckCircle className="mr-2 h-3.5 w-3.5 text-green-500" /> Close Issue</DropdownMenuItem>
                                                    <DropdownMenuItem className="text-xs font-medium"><ExternalLink className="mr-2 h-3.5 w-3.5" /> WhatsApp</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-xs font-medium text-red-600"><Trash2 className="mr-2 h-3.5 w-3.5" /> Delete</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Simplified Pagination */}
                <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                        <div className="flex items-center gap-2">
                            Rows per page:
                            <Select value={rowsPerPage.toString()} onValueChange={(v) => {setRowsPerPage(parseInt(v)); setCurrentPage(1);}}>
                                <SelectTrigger className="h-7 w-16 text-xs border-slate-300">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[5, 10, 20, 50].map(n => (
                                        <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <span>Showing {(currentPage-1)*rowsPerPage + 1} to {Math.min(currentPage*rowsPerPage, filteredData.length)} of {filteredData.length} entries</span>
                    </div>

                    <div className="flex items-center gap-1">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                            className="h-8 w-8 p-0"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex gap-1">
                            {Array.from({length: totalPages}, (_, i) => i + 1).map(page => (
                                <Button
                                    key={page}
                                    variant={currentPage === page ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setCurrentPage(page)}
                                    className={`h-8 w-8 p-0 text-xs ${currentPage === page ? 'bg-slate-800 text-white border-slate-800' : 'text-slate-600'}`}
                                >
                                    {page}
                                </Button>
                            ))}
                        </div>
                        <Button 
                             variant="outline" 
                             size="sm" 
                             disabled={currentPage === totalPages}
                             onClick={() => setCurrentPage(p => p + 1)}
                             className="h-8 w-8 p-0"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </Card>

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
