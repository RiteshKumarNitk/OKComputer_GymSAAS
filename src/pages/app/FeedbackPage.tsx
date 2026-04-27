import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageSquare, Star, ThumbsUp, ThumbsDown } from "lucide-react"

export const FeedbackPage: React.FC = () => {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Feedback Management</h1>
                <p className="text-slate-500 text-lg">Manage and respond to member feedback and suggestions.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-orange-50 border-orange-100 shadow-sm overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <MessageSquare className="h-24 w-24 text-orange-600" />
                    </div>
                    <CardHeader>
                        <CardTitle className="text-orange-900 group flex items-center gap-2">
                            Total Feedback
                        </CardTitle>
                        <CardDescription className="text-orange-700/70 shadow-orange-100">Across all branches</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-orange-950">24</div>
                        <p className="text-sm text-orange-700 mt-2 font-medium">+12% from last month</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-20">
                        <Star className="h-24 w-24 text-amber-400" />
                    </div>
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            Avg. Rating
                        </CardTitle>
                        <CardDescription className="text-slate-400">Member satisfaction score</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-white flex items-center gap-2">
                            4.8 <span className="text-amber-400 text-2xl">★★★★★</span>
                        </div>
                        <p className="text-sm text-slate-400 mt-2 font-medium">Based on 128 reviews</p>
                    </CardContent>
                </Card>

                <Card className="bg-white border-slate-200 shadow-sm overflow-hidden relative">
                    <CardHeader>
                        <CardTitle className="text-slate-900">Sentiment</CardTitle>
                        <CardDescription>Real-time analysis</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div className="bg-green-500 h-full w-[85%]" />
                                </div>
                                <p className="text-[10px] mt-1 text-slate-500 uppercase font-bold tracking-wider">Positive (85%)</p>
                            </div>
                            <div className="flex-1">
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div className="bg-red-400 h-full w-[15%]" />
                                </div>
                                <p className="text-[10px] mt-1 text-slate-500 uppercase font-bold tracking-wider">Negative (15%)</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Recent Feedback</CardTitle>
                        <CardDescription>Click on a feedback to view details and respond.</CardDescription>
                    </div>
                    <Button variant="outline" size="sm">View All</Button>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-slate-100">
                        {[
                            { name: "Rahul S.", content: "The new rowing machines are great! But the locker area needs more frequent cleaning.", rating: 4, type: "Suggestion" },
                            { name: "Priya K.", content: "Yoga classes are getting too crowded. Can we have more batches?", rating: 3, type: "Complaint" },
                            { name: "Amit M.", content: "Trainer Vikram is exceptional. Very helpful and knowledgeable.", rating: 5, type: "Compliment" }
                        ].map((item, i) => (
                            <div key={i} className="p-6 hover:bg-slate-50/50 transition-colors group cursor-pointer">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-900">{item.name}</span>
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                                item.type === 'Complaint' ? "bg-red-50 text-red-600" :
                                                item.type === 'Compliment' ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"
                                            )}>
                                                {item.type}
                                            </span>
                                        </div>
                                        <p className="text-slate-600 line-clamp-2">{item.content}</p>
                                    </div>
                                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-orange-600">
                                            <ThumbsUp className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-red-500">
                                            <ThumbsDown className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ")
}
