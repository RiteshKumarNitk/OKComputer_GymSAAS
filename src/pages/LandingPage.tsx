
import React from "react"
import { useNavigate } from "react-router-dom"
import { 
  Users, 
  Smartphone, 
  LineChart, 
  CreditCard, 
  CheckCircle2, 
  ArrowRight, 
  Menu, 
  X,
  Dumbbell,
  Calendar,
  Zap,
  ShieldCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const LandingPage: React.FC = () => {
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)

  const features = [
    {
      title: "Member Management",
      description: "Seamlessly register, track, and manage all your gym members in one intuitive dashboard.",
      icon: <Users className="h-10 w-10 text-[#FF7B47]" />,
    },
    {
      title: "Mobile App Access",
      description: "Dedicated member portal for workout logs, attendance QR codes, and class schedules.",
      icon: <Smartphone className="h-10 w-10 text-[#FF7B47]" />,
    },
    {
      title: "Attendance Tracking",
      description: "Quick QR-based check-ins and real-time attendance reports for both staff and members.",
      icon: <Calendar className="h-10 w-10 text-[#FF7B47]" />,
    },
    {
      title: "Billing & Invoicing",
      description: "Automated payment tracking, recurring billing, and professional invoice generation.",
      icon: <CreditCard className="h-10 w-10 text-[#FF7B47]" />,
    },
    {
      title: "Analytics & Reports",
      description: "Deep insights into revenue, member growth, and gym performance with visual charts.",
      icon: <LineChart className="h-10 w-10 text-[#FF7B47]" />,
    },
    {
      title: "Staff & Trainer Portal",
      description: "Manage trainers, assign schedules, and track staff performance across multiple branches.",
      icon: <ShieldCheck className="h-10 w-10 text-[#FF7B47]" />,
    },
  ]

  const pricing = [
    {
      name: "Starter",
      price: "₹1,999",
      period: "/month",
      features: ["Up to 100 Members", "Basic Attendance", "Single Branch", "Support Tickets"],
      buttonText: "Get Started",
      highlight: false,
    },
    {
      name: "Professional",
      price: "₹4,999",
      period: "/month",
      features: ["Up to 500 Members", "Full Mobile App Access", "Billing & Analytics", "Multi-branch Support", "Staff Management"],
      buttonText: "Most Popular",
      highlight: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      features: ["Unlimited Members", "Custom Branding", "Priority Support", "Dedicated Account Manager", "Advanced API Access"],
      buttonText: "Contact Us",
      highlight: false,
    },
  ]

  return (
    <div className="min-h-screen font-sans bg-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-2">
              <div className="bg-[#FF7B47] p-2 rounded-lg">
                <Dumbbell className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-neutral-900 italic">GYM<span className="text-[#FF7B47] non-italic font-extrabold uppercase ml-1">OWL</span></span>
            </div>
            
            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-sm font-medium text-neutral-600 hover:text-[#FF7B47] transition-colors">Features</a>
              <a href="#pricing" className="text-sm font-medium text-neutral-600 hover:text-[#FF7B47] transition-colors">Pricing</a>
              <a href="#about" className="text-sm font-medium text-neutral-600 hover:text-[#FF7B47] transition-colors">About</a>
              <Button 
                variant="ghost" 
                onClick={() => navigate("/signin")}
                className="text-sm font-semibold text-neutral-900 border-2 border-transparent hover:border-[#FF7B47] transition-all"
              >
                Sign In
              </Button>
              <Button 
                onClick={() => navigate("/signup")}
                className="bg-[#FF7B47] hover:bg-[#e66a39] text-white px-6 font-bold rounded-full shadow-lg hover:shadow-xl transition-all"
              >
                Get Started
              </Button>
            </div>

            {/* Mobile Nav Toggle */}
            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-b absolute w-full px-4 pt-2 pb-6 space-y-2">
            <a href="#features" className="block px-3 py-2 text-base font-medium text-neutral-600">Features</a>
            <a href="#pricing" className="block px-3 py-2 text-base font-medium text-neutral-600">Pricing</a>
            <Button onClick={() => navigate("/signin")} className="w-full justify-start" variant="ghost">Sign In</Button>
            <Button onClick={() => navigate("/signup")} className="w-full bg-[#FF7B47] text-white">Get Started</Button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 bg-[#121212] text-white overflow-hidden">
        <div className="absolute top-0 right-0 -mt-24 -mr-24 w-96 h-96 bg-[#FF7B47] opacity-10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 -mb-24 -ml-24 w-72 h-72 bg-[#FF7B47] opacity-10 rounded-full blur-[100px]"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 text-center lg:text-left space-y-8">
              <Badge className="bg-[#FF7B47]/20 text-[#FF7B47] border-[#FF7B47]/30 hover:bg-[#FF7B47]/20 px-4 py-1.5 text-sm font-semibold uppercase tracking-wider">
                All-in-One Gym Solution
              </Badge>
              <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-tight">
                Manage Your Gym <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF7B47] to-[#ffaa87]">
                  Like a Professional
                </span>
              </h1>
              <p className="text-xl text-neutral-400 max-w-2xl">
                Ultimate platform for gym owners to handle memberships, attendance, payments, and staff in one powerful interface. Grow your fitness business with data-driven insights.
              </p>
              <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
                <Button 
                  size="lg" 
                  onClick={() => navigate("/signup")}
                  className="bg-[#FF7B47] hover:bg-[#e66a39] text-white h-14 px-8 text-lg font-bold rounded-full group transition-all transform hover:scale-105"
                >
                  Start FREE Trial <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-bold rounded-full border-neutral-700 bg-transparent hover:bg-neutral-800 text-white transition-all transform hover:scale-105">
                  Request Demo
                </Button>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-8 pt-4">
                <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-[#121212] bg-neutral-800 flex items-center justify-center overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="avatar" />
                    </div>
                  ))}
                </div>
                <div className="text-sm">
                  <span className="block font-bold">500+ Gyms Trusted Us</span>
                  <span className="text-neutral-500 font-medium">Join our growing community</span>
                </div>
              </div>
            </div>
            <div className="flex-1 relative">
              <div className="relative z-20 transform perspective-1000 rotate-y-[-5deg] rotate-x-[5deg] hover:rotate-0 transition-transform duration-700">
                <img 
                   src="https://framerusercontent.com/images/8rO7v0E6lq3S7v6Xb1vLz1lM.png?rect=0%2C0%2C1920%2C1080&v=1bc76a16" // Replace with generated dashboard mockup if reachable
                   alt="Software Mockup" 
                   className="rounded-2xl shadow-2xl border border-neutral-800"
                />
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-white/5 blur-3xl rounded-full z-10 pointer-events-none"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By / Brands */}
      <div className="bg-white py-12 border-b">
         <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-neutral-400 font-semibold mb-8 uppercase tracking-widest text-xs">Integrates with your favorite tools</p>
            <div className="flex flex-wrap justify-center items-center gap-12 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
               <img src="https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg" className="h-6" alt="Razorpay" />
               <img src="https://upload.wikimedia.org/wikipedia/commons/b/b1/Stripe_Logo%2C_revised_2016.svg" className="h-6" alt="Stripe" />
               <img src="https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg" className="h-6" alt="Meta" />
               <img src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" className="h-6" alt="Google" />
            </div>
         </div>
      </div>

      {/* Features Section */}
      <section id="features" className="py-24 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-20">
            <h2 className="text-[#FF7B47] font-bold uppercase tracking-widest text-sm">Everything you need</h2>
            <h3 className="text-4xl lg:text-5xl font-extrabold text-neutral-900">Powerful Features for Gym Success</h3>
            <p className="text-lg text-neutral-500 max-w-2xl mx-auto">
              Our comprehensive suite of tools is specifically built to cater to the unique needs of modern fitness businesses.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <Card key={idx} className="border-none shadow-sm hover:shadow-xl transition-shadow duration-300 overflow-hidden group">
                <CardContent className="p-8 space-y-4">
                  <div className="bg-[#FF7B47]/10 p-4 rounded-2xl w-fit group-hover:bg-[#FF7B47] transition-colors duration-300">
                    <div className="group-hover:text-white transition-colors duration-300">
                      {feature.icon}
                    </div>
                  </div>
                  <h4 className="text-xl font-bold text-neutral-900">{feature.title}</h4>
                  <p className="text-neutral-500 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile App Section */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="bg-[#1a1a1a] rounded-[3rem] p-12 lg:p-20 relative overflow-hidden flex flex-col lg:flex-row items-center gap-16 text-white">
              <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF7B47] opacity-10 rounded-full blur-[100px]"></div>
              
              <div className="flex-1 space-y-8 relative z-10">
                 <div className="bg-white/10 p-4 rounded-2xl w-fit">
                    <Zap className="h-8 w-8 text-[#FF7B47]" />
                 </div>
                 <h2 className="text-4xl lg:text-5xl font-extrabold">Exclusive Member Mobile Portal</h2>
                 <p className="text-lg text-neutral-400">
                    Empower your members with a dedicated app to track their fitness journey, book classes, and check-in instantly using QR codes.
                 </p>
                 <ul className="space-y-4">
                    {["Real-time workout logging", "QR-based attendance check-in", "Personalized diet tracking", "Instant notifications", "Secure membership profile"].map((item, i) => (
                       <li key={i} className="flex items-center gap-3 font-medium">
                          <CheckCircle2 className="h-5 w-5 text-[#FF7B47]" /> {item}
                       </li>
                    ))}
                 </ul>
                 <div className="flex gap-4 pt-4">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" className="h-10 cursor-pointer" alt="App Store" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" className="h-10 cursor-pointer" alt="Google Play" />
                 </div>
              </div>
              <div className="flex-1 relative z-10">
                 <img 
                    src="https://framerusercontent.com/images/vVpX8hP8U6vLh8U6vLh8U6vLh8.png" // Replace with mobile app mockup
                    alt="App Preview" 
                    className="max-h-[600px] mx-auto drop-shadow-2xl"
                 />
              </div>
           </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-neutral-50 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center space-y-4 mb-20">
            <h2 className="text-[#FF7B47] font-bold uppercase tracking-widest text-sm">Clear Packaging</h2>
            <h3 className="text-4xl lg:text-5xl font-extrabold text-neutral-900">Choose the Right Plan for You</h3>
            <p className="text-lg text-neutral-500 max-w-2xl mx-auto">
              Simple, transparent pricing with no hidden fees. Start with what you need and scale as you grow.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {pricing.map((plan, idx) => (
              <Card 
                key={idx} 
                className={`relative border-none overflow-hidden transition-all duration-300 hover:-translate-y-2 ${
                   plan.highlight ? 'bg-[#1a1a1a] text-white shadow-2xl scale-105 z-10 ring-4 ring-[#FF7B47]/20' : 'bg-white shadow-lg'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute top-0 right-0 bg-[#FF7B47] text-white px-4 py-1 text-xs font-bold uppercase tracking-widest rounded-bl-xl">
                    Recommended
                  </div>
                )}
                <CardContent className="p-10 space-y-8">
                  <div className="space-y-4">
                    <h4 className="text-2xl font-bold">{plan.name}</h4>
                    <div className="flex items-baseline">
                      <span className="text-5xl font-extrabold tracking-tighter">{plan.price}</span>
                      <span className="text-neutral-500 ml-2 font-medium">{plan.period}</span>
                    </div>
                  </div>
                  <ul className="space-y-4 py-8 border-y border-neutral-100 dark:border-neutral-800">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className={`h-5 w-5 mt-0.5 shrink-0 ${plan.highlight ? 'text-[#FF7B47]' : 'text-neutral-400'}`} />
                        <span className={plan.highlight ? 'text-neutral-300' : 'text-neutral-600'}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`w-full h-14 rounded-xl font-bold text-lg shadow-md hover:shadow-xl transition-all ${
                       plan.highlight ? 'bg-[#FF7B47] hover:bg-[#e66a39] text-white' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-900'
                    }`}
                  >
                    {plan.buttonText}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-[#FF7B47]">
         <div className="max-w-7xl mx-auto px-4 text-center text-white space-y-8">
            <h2 className="text-4xl lg:text-6xl font-extrabold leading-tight">Ready to Transform <br />Your Fitness Business?</h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto font-medium">
               Join hundreds of gym owners who have already moved to GymOwl. Claim your 14-day free trial now.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
               <Button onClick={() => navigate("/signup")} className="bg-white text-[#FF7B47] hover:bg-neutral-100 h-16 px-12 text-xl font-black rounded-full shadow-2xl transition-all transform hover:scale-105">
                  START YOUR 14-DAY TRIAL
               </Button>
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer id="about" className="bg-[#121212] text-white pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-4 gap-12 pb-16 border-b border-neutral-800">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="bg-[#FF7B47] p-2 rounded-lg">
                  <Dumbbell className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold tracking-tight italic">GYM<span className="text-[#FF7B47] non-italic font-extrabold uppercase ml-1">OWL</span></span>
              </div>
              <p className="text-neutral-500 font-medium">
                The world's most intuitive and powerful gym management platform. Built for professionals, by professionals.
              </p>
            </div>
            <div>
              <h5 className="font-bold text-lg mb-6 tracking-wide">Product</h5>
              <ul className="space-y-4 text-neutral-500 font-medium">
                <li><a href="#" className="hover:text-[#FF7B47] transition-colors">Member App</a></li>
                <li><a href="#" className="hover:text-[#FF7B47] transition-colors">Staff Portal</a></li>
                <li><a href="#" className="hover:text-[#FF7B47] transition-colors">Analytics</a></li>
                <li><a href="#" className="hover:text-[#FF7B47] transition-colors">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold text-lg mb-6 tracking-wide">Resources</h5>
              <ul className="space-y-4 text-neutral-500 font-medium">
                <li><a href="#" className="hover:text-[#FF7B47] transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-[#FF7B47] transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-[#FF7B47] transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-[#FF7B47] transition-colors">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold text-lg mb-6 tracking-wide">Company</h5>
              <ul className="space-y-4 text-neutral-500 font-medium">
                <li><a href="#" className="hover:text-[#FF7B47] transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-[#FF7B47] transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-[#FF7B47] transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-[#FF7B47] transition-colors">Blog</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-10 flex flex-col md:flex-row justify-between items-center text-neutral-500 text-sm font-medium gap-6">
            <p>© 2026 OKComputer GymSAAS. All rights reserved.</p>
            <div className="flex gap-8">
              <span>Built with ❤️ for the Fitness Community</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
