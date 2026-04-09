
import React from "react"
import { useNavigate, Link } from "react-router-dom"
import { Menu, X, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"

export const Navbar: React.FC = () => {
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Pricing", href: "/pricing" },
    { name: "Blog", href: "/blog" },
    { name: "Contact Us", href: "/contact" },
  ]

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex items-center">
            <Link to="/">
              <img src="https://gymowl.in/images/logo.png" alt="Gymowl" className="h-10 w-auto" />
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link key={link.name} to={link.href} className="text-sm font-semibold text-slate-700 hover:text-[#FF7B39]">
                {link.name}
              </Link>
            ))}
            <div className="flex items-center gap-2 text-slate-700 font-bold ml-4">
              <Phone className="h-4 w-4 text-[#FF7B39]" />
              <span className="text-sm">+91 85878 85643</span>
            </div>
            <Button 
              onClick={() => navigate("/signup")}
              className="bg-[#FF7B39] hover:bg-[#e66a39] text-white px-6 h-11 font-bold rounded shadow-sm"
            >
              Get FREE Trial
            </Button>
          </div>

          <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-600 p-2">
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 py-4 px-4 space-y-3 shadow-lg">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              to={link.href} 
              className="block px-4 py-2 text-base font-semibold text-slate-700 hover:bg-slate-50 rounded"
              onClick={() => setIsMenuOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          <Button onClick={() => navigate("/signup")} className="w-full bg-[#FF7B39] text-white font-bold h-12">Get FREE Trial</Button>
        </div>
      )}
    </nav>
  )
}
