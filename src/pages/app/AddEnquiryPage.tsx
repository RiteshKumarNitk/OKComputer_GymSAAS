import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { leadsApi, followUpsApi } from "@/api/apiClient"
import { 
  ArrowLeft, 
  Save, 
  X, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Target, 
  DollarSign, 
  Layers, 
  Clock, 
  MessageSquare,
  Calendar,
  CheckCircle2,
  Filter
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

const GYM_SERVICES = [
  "General", "Massage", "Kick Boxing", "Fitness Workout", 
  "Personal Training", "Yoga", "Zumba", "Aerobics"
]

export const AddEnquiryPage: React.FC = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    mobile: "",
    email: "",
    gender: "male",
    leadType: "warm",
    budget: "",
    address: "",
    remark: "",
    services: [] as string[],
    bookTrial: false,
    addFollowUp: true
  })

  const handleServiceToggle = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const leadPayload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        fullName: `${formData.firstName} ${formData.lastName}`.trim(),
        phone: formData.mobile,
        email: formData.email,
        gender: formData.gender,
        priority: formData.leadType,
        budget: parseFloat(formData.budget) || 0,
        address: formData.address,
        notes: formData.remark,
        services: formData.services,
        source: 'walk-in'
      }

      const leadRes = await leadsApi.create(leadPayload)
      if (leadRes.error) throw leadRes.error

      if (formData.addFollowUp && leadRes.data?.id) {
        // Set default follow up for 3 days later
        const followUpDate = new Date()
        followUpDate.setDate(followUpDate.getDate() + 3)

        const followUpPayload = {
          leadId: leadRes.data.id,
          type: 'enquiry',
          priority: formData.leadType,
          followUpDate: followUpDate.toISOString(),
          notes: 'New enquiry follow-up',
          status: 'pending'
        }
        const followUpRes = await followUpsApi.create(followUpPayload)
        if (followUpRes.error) console.error("Follow-up error:", followUpRes.error)
      }

      toast({
        title: "Enquiry Added",
        description: "The potential lead has been registered for follow-up.",
      })
      navigate("/dashboard")
    } catch (err: any) {
      toast({
        title: "Submission Failed",
        description: err.message,
        variant: "destructive"
      })
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="rounded-full h-10 w-10 p-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">New Lead Enquiry</h1>
            <p className="text-sm text-slate-500">Add a visitor for follow-up and trial booking</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate(-1)} className="rounded-xl font-bold">
            <X className="h-4 w-4 mr-2" /> Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-orange-500 hover:bg-orange-600 text-white px-8 rounded-xl font-bold shadow-lg shadow-orange-500/20">
            <Save className="h-4 w-4 mr-2" /> Submit Enquiry
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Form Fields */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
            <CardHeader className="border-b dark:border-slate-800">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <User className="h-4 w-4 text-orange-500" /> Personal Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">First Name</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:ring-2 focus:ring-orange-500 transition-all"
                    placeholder="Enter first name"
                    value={formData.firstName}
                    onChange={e => setFormData({...formData, firstName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Last Name</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:ring-2 focus:ring-orange-500 transition-all"
                    placeholder="Enter last name"
                    value={formData.lastName}
                    onChange={e => setFormData({...formData, lastName: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mobile Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                      type="tel" 
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:ring-2 focus:ring-orange-500 transition-all"
                      placeholder="e.g. 98765 43210"
                      value={formData.mobile}
                      onChange={e => setFormData({...formData, mobile: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                      type="email" 
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:ring-2 focus:ring-orange-500 transition-all"
                      placeholder="example@mail.com"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Residential Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <textarea 
                    rows={3}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:ring-2 focus:ring-orange-500 transition-all resize-none"
                    placeholder="Enter complete address"
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
            <CardHeader className="border-b dark:border-slate-800">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Layers className="h-4 w-4 text-blue-500" /> Interest & Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gym Services Interested In</label>
                <div className="flex flex-wrap gap-2">
                  {GYM_SERVICES.map(service => (
                    <button
                      key={service}
                      type="button"
                      onClick={() => handleServiceToggle(service)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                        formData.services.includes(service)
                          ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-blue-300'
                      }`}
                    >
                      {service}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Remarks / Lead Summary</label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <textarea 
                    rows={4}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:ring-2 focus:ring-orange-500 transition-all resize-none"
                    placeholder="Add details about the conversation or special requests..."
                    value={formData.remark}
                    onChange={e => setFormData({...formData, remark: e.target.value})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Status / Specifics */}
        <div className="space-y-6">
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
            <CardHeader className="border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <CardTitle className="text-sm font-bold">Lead Status</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Target className="h-3 w-3" /> Lead Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['hot', 'warm', 'cold'].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({...formData, leadType: type})}
                      className={`py-2 rounded-lg text-[10px] font-bold capitalize transition-all border ${
                        formData.leadType === type
                          ? type === 'hot' ? 'bg-rose-500 border-rose-500 text-white' : type === 'warm' ? 'bg-orange-500 border-orange-500 text-white' : 'bg-blue-500 border-blue-500 text-white'
                          : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-500'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <User className="h-3 w-3" /> Gender
                </label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, gender: 'male' })}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                      formData.gender === 'male' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-slate-200'
                    }`}
                  >
                    Male
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, gender: 'female' })}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                      formData.gender === 'female' ? 'bg-rose-50 border-rose-200 text-rose-600' : 'border-slate-200'
                    }`}
                  >
                    Female
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <DollarSign className="h-3 w-3" /> Budget (Per Month)
                </label>
                <div className="relative font-bold">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                  <input 
                    type="number" 
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 transition-all"
                    placeholder="Monthly budget"
                    value={formData.budget}
                    onChange={e => setFormData({...formData, budget: e.target.value})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
            <div className="p-6 space-y-4">
              {/* Trial Booking Block */}
              <div className="space-y-4">
                <div 
                  className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all border ${
                    formData.bookTrial ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100'
                  }`}
                  onClick={() => setFormData({...formData, bookTrial: !formData.bookTrial})}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${formData.bookTrial ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight">Book a Trial</p>
                      <p className="text-[9px] text-slate-500 leading-tight">Schedule visitor workout</p>
                    </div>
                  </div>
                  {formData.bookTrial && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                </div>

                {formData.bookTrial && (
                  <div className="p-4 bg-white dark:bg-slate-900 border border-emerald-100 rounded-xl space-y-4 animate-in fade-in zoom-in-95 duration-300">
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Trainer</label>
                       <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:ring-1 focus:ring-emerald-500 outline-none">
                         <option>Select Trainer</option>
                         <option>Vikram Rathore</option>
                         <option>Sneha Kapoor</option>
                       </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Start Date</label>
                        <input type="date" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Last Date</label>
                        <input type="date" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 space-y-2">
                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Preferred Time</label>
                         <input type="time" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
                      </div>
                      <div className="h-12 w-20 bg-emerald-100 rounded-xl flex flex-col items-center justify-center border border-emerald-200 mt-5">
                         <span className="text-xs font-black text-emerald-700">03</span>
                         <span className="text-[8px] font-bold text-emerald-600 uppercase">Days</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Follow Up Block */}
              <div className="space-y-4 pt-2 border-t dark:border-slate-800">
                <div 
                  className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all border ${
                    formData.addFollowUp ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-100'
                  }`}
                  onClick={() => setFormData({...formData, addFollowUp: !formData.addFollowUp})}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${formData.addFollowUp ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight">Add Follow-Up</p>
                      <p className="text-[9px] text-slate-500 leading-tight">Remind for future call</p>
                    </div>
                  </div>
                  {formData.addFollowUp && <CheckCircle2 className="h-5 w-5 text-orange-500" />}
                </div>

                {formData.addFollowUp && (
                  <div className="p-4 bg-white dark:bg-slate-900 border border-orange-100 rounded-xl space-y-4 animate-in fade-in zoom-in-95 duration-300">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                          Follow-up Date* <Filter className="h-2 w-2" />
                        </label>
                        <input type="date" required className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Allocate (Staff)</label>
                        <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold">
                           <option>Select Member</option>
                           <option>Manager Amit</option>
                           <option>Admin Riya</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Follow-up Type</label>
                      <div className="grid grid-cols-3 gap-1">
                        {['Enquiry', 'Balance', 'Feedback'].map(type => (
                          <button key={type} type="button" className="py-1 text-[9px] font-bold uppercase border border-slate-200 rounded-md hover:bg-slate-50">{type}</button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">To Do*</label>
                       <textarea 
                        rows={2}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs resize-none"
                        placeholder="Task details..."
                       />
                    </div>

                    <Button type="button" className="w-full h-9 bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-bold uppercase rounded-lg shadow-md shadow-orange-500/10">
                       <Save className="h-3 w-3 mr-2" /> Save Follow-up
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-t dark:border-slate-800">
              <p className="text-[10px] text-slate-500 italic text-center">Visitor and scheduled activities will be tracked in the dashboard immediately.</p>
            </div>
          </Card>
        </div>
      </form>
    </div>
  )
}
