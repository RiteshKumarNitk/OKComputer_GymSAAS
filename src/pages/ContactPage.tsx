
import React from "react"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { Mail, Phone, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"

export const ContactPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <section className="py-16 px-4 bg-slate-50 border-b border-slate-100 text-center">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold uppercase tracking-tight text-slate-900 underline decoration-[#FF7B39] decoration-4 underline-offset-8">Contact Us</h1>
          <p className="text-sm text-slate-500 mt-4">We are available 24/7 to help you with your gym management needs.</p>
        </div>
      </section>

      <section className="py-16 px-4 max-w-7xl mx-auto grid md:grid-cols-2 gap-16">
        <div className="space-y-8">
          <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Our Office</h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="bg-slate-100 p-3 h-fit border border-slate-200">
                <MapPin className="h-5 w-5 text-[#FF7B39]" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 uppercase text-xs tracking-wider mb-1">Location</h4>
                <p className="text-sm text-slate-500">C-102, Sector 63, Noida, UP - 201301</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="bg-slate-100 p-3 h-fit border border-slate-200">
                <Phone className="h-5 w-5 text-[#FF7B39]" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 uppercase text-xs tracking-wider mb-1">Phone</h4>
                <p className="text-sm text-slate-500">+91-8882-99-8800</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="bg-slate-100 p-3 h-fit border border-slate-200">
                <Mail className="h-5 w-5 text-[#FF7B39]" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 uppercase text-xs tracking-wider mb-1">Email</h4>
                <p className="text-sm text-slate-500">contact@gymowl.in</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-8 border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight mb-6">Send Message</h2>
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Name</label>
                  <input type="text" className="w-full h-10 border border-slate-200 px-3 text-sm focus:outline-none focus:border-[#FF7B39]" />
               </div>
               <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Phone</label>
                  <input type="text" className="w-full h-10 border border-slate-200 px-3 text-sm focus:outline-none focus:border-[#FF7B39]" />
               </div>
            </div>
            <div>
               <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Subject</label>
               <input type="text" className="w-full h-10 border border-slate-200 px-3 text-sm focus:outline-none focus:border-[#FF7B39]" />
            </div>
            <div>
               <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Message</label>
               <textarea className="w-full h-32 border border-slate-200 p-3 text-sm focus:outline-none focus:border-[#FF7B39] resize-none"></textarea>
            </div>
            <Button className="w-full h-12 bg-[#FF7B39] text-white font-black uppercase text-xs tracking-widest rounded-none">
               Send Message
            </Button>
          </form>
        </div>
      </section>
      <Footer />
    </div>
  )
}
