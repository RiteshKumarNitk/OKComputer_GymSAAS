
import React from "react"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export const PricingPage: React.FC = () => {
  const plans = [
    {
      name: "Starter",
      price: "₹1,999",
      period: "/month",
      features: ["Up to 100 Members", "Basic Attendance", "Single Branch", "Support Tickets"],
    },
    {
      name: "Professional",
      price: "₹4,999",
      period: "/month",
      features: ["Up to 500 Members", "Full Mobile App Access", "Billing & Analytics", "Multi-branch Support", "Staff Management"],
      highlighted: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      features: ["Unlimited Members", "Custom Branding", "Priority Support", "Dedicated Account Manager", "Advanced API Access"],
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <section className="py-16 px-4 bg-slate-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-2xl font-bold uppercase tracking-tight text-slate-900 underline decoration-[#FF7B39] decoration-4 underline-offset-8">Our Pricing Plans</h1>
          <p className="text-sm text-slate-500 mt-4">Simple, transparent pricing for your gym or fitness center.</p>
        </div>
      </section>

      <section className="py-16 px-4 max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
        {plans.map((plan, i) => (
          <div key={i} className={`p-8 border rounded-none ${plan.highlighted ? 'border-[#FF7B39] bg-slate-50' : 'border-slate-200'}`}>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">{plan.name}</h3>
            <div className="flex items-baseline mb-6">
              <span className="text-3xl font-black text-slate-900">{plan.price}</span>
              <span className="text-slate-500 ml-1 font-bold text-xs uppercase">{plan.period}</span>
            </div>
            <ul className="space-y-4 mb-8">
              {plan.features.map(f => (
                <li key={f} className="flex items-center gap-3 text-xs font-bold text-slate-600">
                  <CheckCircle2 className="h-4 w-4 text-[#FF7B39]" /> {f}
                </li>
              ))}
            </ul>
            <Button className={`w-full h-12 rounded-none font-black text-xs uppercase tracking-widest ${plan.highlighted ? 'bg-[#FF7B39] text-white' : 'bg-slate-900 text-white'}`}>
              Choose Plan
            </Button>
          </div>
        ))}
      </section>
      <Footer />
    </div>
  )
}
