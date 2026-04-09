
import React from "react"
import { useNavigate, Link } from "react-router-dom"
import { Facebook, Twitter, Instagram, Linkedin, Youtube, MapPin, Phone, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"

export const Footer: React.FC = () => {
  const navigate = useNavigate()

  return (
    <footer className="bg-slate-900 text-slate-400 py-16 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 pb-12 border-b border-slate-800">
          <div className="space-y-6">
            <img src="https://gymowl.in/images/logo.png" alt="gymowl" className="h-10 w-auto" />
            <p className="leading-relaxed text-xs">
              Gym Management Software in Noida | Delhi NCR | Gujarat | Haryana | Gurugram | Ghaziabad | Mumbai | Pune | Bangalore | Odisha | Hyderabad | Indore
            </p>
            <div className="flex gap-4">
               <Instagram className="h-4 w-4 cursor-pointer hover:text-white transition-colors" />
               <Linkedin className="h-4 w-4 cursor-pointer hover:text-white transition-colors" />
               <Facebook className="h-4 w-4 cursor-pointer hover:text-white transition-colors" />
               <Youtube className="h-4 w-4 cursor-pointer hover:text-white transition-colors" />
               <Twitter className="h-4 w-4 cursor-pointer hover:text-white transition-colors" />
            </div>
          </div>
          
          <div className="space-y-6">
             <h5 className="font-bold text-white uppercase tracking-wider text-xs">Contact Us</h5>
             <ul className="space-y-4 text-xs font-semibold">
                <li className="flex gap-3">
                   <MapPin className="h-5 w-5 text-[#FF7B39] shrink-0" />
                   <span>H-157 Third Floor Noida, Sector 63, <br/>Uttar Pradesh, 201307</span>
                </li>
                <li className="flex gap-3">
                   <Mail className="h-5 w-5 text-[#FF7B39] shrink-0" />
                   <span>info@gymowl.in</span>
                </li>
                <li className="flex gap-3">
                   <Phone className="h-5 w-5 text-[#FF7B39] shrink-0" />
                   <span>+91 85878 85643 <br/>+91 92897 90047</span>
                </li>
             </ul>
          </div>

          <div className="space-y-6">
             <h5 className="font-bold text-white uppercase tracking-wider text-xs">Resources</h5>
             <ul className="space-y-3 font-semibold">
                <li><Link to="/blog" className="hover:text-white">Blog</Link></li>
                <li><Link to="/contact" className="hover:text-white">Contact Support</Link></li>
                <li><Link to="/faqs" className="hover:text-white">FAQs</Link></li>
             </ul>
          </div>

          <div className="space-y-6">
             <h5 className="font-bold text-white uppercase tracking-wider text-xs">Company</h5>
             <ul className="space-y-3 font-semibold">
                <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link to="/app-privacy" className="hover:text-white">App Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white">Terms of Use</Link></li>
                <li className="pt-4 border-t border-slate-800/50">
                   <Button 
                      variant="link" 
                      onClick={() => navigate("/signin")}
                      className="p-0 h-auto text-slate-400 hover:text-white font-bold text-xs uppercase tracking-wider underline decoration-[#FF7B39] decoration-2 underline-offset-4"
                   >
                      ADMIN LOGIN
                   </Button>
                </li>
             </ul>
          </div>
        </div>
        
        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-bold uppercase tracking-widest text-slate-500">
          <p>© Copyright 2023 Riziliant Technologies Pvt. Ltd. All rights reserved</p>
        </div>
      </div>
    </footer>
  )
}
