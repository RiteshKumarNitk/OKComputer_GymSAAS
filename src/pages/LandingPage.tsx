import React from "react"
import { useNavigate, Link } from "react-router-dom"
import {
   Phone,
   CheckCircle2,
   Users,
   BarChart3,
   Shield,
   Layout,
   MessageSquare,
   Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"

export const LandingPage: React.FC = () => {
   const navigate = useNavigate()

   const brands = [
      "Origin Gym", "Sculpt Master", "Indian Iron", "Tornado", "The Warrior",
      "Gym Discovery", "Gym Naka", "The Fitness Lounge", "Pulse Fitness",
      "Urban Fitness", "Alpha Fitness Studio", "Avengers The Gym"
   ]

   const smartFeatures = [
      {
         title: "Members Management",
         description: "This feature streamlines the administrative tasks associated with managing gym memberships, user profiles, attendance, payments, and communication.",
         icon: <Users className="h-6 w-6 text-[#FF7B39]" />,
      },
      {
         title: "IVR System",
         description: "Incorporating IVR technology into a gym's communication strategy can lead to improved operational efficiency, enhanced member satisfaction, and more effective utilization of staff resources.",
         icon: <Phone className="h-6 w-6 text-[#FF7B39]" />,
      },
      {
         title: "WhatsApp",
         description: "WhatsApp can serve as a powerful tool to enhance member engagement, improve communication, and create a stronger bond between gyms and their members.",
         icon: <MessageSquare className="h-6 w-6 text-[#FF7B39]" />,
      },
      {
         title: "BMI Integration",
         description: "BMI integration provides members with an initial baseline measurement of their body composition, helping them understand where they stand in terms of health and fitness.",
         icon: <Zap className="h-6 w-6 text-[#FF7B39]" />,
      },
      {
         title: "Pay Roll Management",
         description: "Payroll management extremely helpful for gym owners and managers in streamlining their administrative processes and ensuring accurate and timely payment to their staff.",
         icon: <BarChart3 className="h-6 w-6 text-[#FF7B39]" />,
      },
      {
         title: "Data Security",
         description: "OTP (One-Time Password) system and IP security are strong measures to enhance data safety in your Gym. These security practices contribute significantly to protecting user accounts and sensitive information.",
         icon: <Shield className="h-6 w-6 text-[#FF7B39]" />,
      },
   ]

   const testimonials = [
      {
         text: "We have been associated with Gymowl from a long time as we feel like the marketing strategy made by them helped us a lot to grow our business everyday and it was quite easy to come out of this pandemic by following the marketing with them",
         author: "Sandeep",
         role: "Founder of Workout Zone"
      },
      {
         text: "Gymowl has given a perfect solution for the gym owners like me to take the account of their business by providing their gym management software with all the necessary features useful to grown the business and the whatapp feature in their software is the thing most liked by me.",
         author: "Dhruvil Patel",
         role: "Founder of Euro Fit"
      },
      {
         text: "I just love the fact that the software provides me with all the features to manage and build my business. As a new business owner, I find the software very easy to use and also very informative. Thank You, Gymowl",
         author: "Kaustubh Lokhande",
         role: "Founder of Loha the Fitness Kingdom"
      },
      {
         text: "When I opened my fitness centre a few months ago. Gymowl worked with me and ensured a great start to beginning my doors on the first day. Even better, they are always ready when I need anything. Support is great!",
         author: "Abhinav Chauhan",
         role: "Founder of U-Turn Fitness"
      },
      {
         text: "I think you can add member measurements, and also that you can add a login to your website for your customers for online booking - and it looks professional. I can't see how I can run and manage my gym without it.",
         author: "Sajjan Singh",
         role: "Founder of Purohit Dairy"
      }
   ]

   const blogs = [
      {
         title: "Boost Member Engagement Through Gym Software",
         excerpt: "In this blog, let's collect points and details about how you can use gym management software...",
         image: "https://gymowl.in/blog/wp-content/uploads/2023/12/Engagement.jpg",
      },
      {
         title: "Top Features Every Gym Management Software...",
         excerpt: "Nowadays, managing a fitness business effectively is challenging for success in...",
         image: "https://gymowl.in/blog/wp-content/uploads/2023/12/Features.jpg",
      },
      {
         title: "How to Manage Your Gym Easily?",
         excerpt: "Nowadays we are in an environment as competitive as it gym/fitness industry. If you don't know how to manage...",
         image: "https://gymowl.in/blog/wp-content/uploads/2023/12/Manage.jpg",
      },
      {
         title: "Physical fitness versus covid-19 pandemic",
         excerpt: "Fitness word implies a condition of being physically fit and healthy. This meaning has...",
         image: "https://gymowl.in/blog/wp-content/uploads/2023/12/Covid.jpg",
      }
   ]

   return (
      <div className="min-h-screen font-sans bg-white text-slate-800">
         <Navbar />

         {/* Hero Section */}
         <section className="bg-slate-50 py-16 lg:py-24 border-b border-slate-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
               <div className="flex flex-col lg:flex-row items-center gap-16">
                  <div className="flex-1 space-y-8">
                     <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 leading-tight">
                        Gym management software for <br />
                        <span className="text-[#FF7B39]">fitness industry</span>
                     </h1>
                     <p className="text-lg text-slate-600 font-semibold leading-relaxed max-w-2xl">
                        All-In-One Gym Membership Management Software With Multiple Features Made for Gyms & Fitness Health Clubs.
                     </p>
                     <div className="flex flex-col sm:flex-row gap-4">
                        <Button
                           size="lg"
                           onClick={() => navigate("/signup")}
                           className="bg-[#FF7B39] hover:bg-[#e66a39] text-white h-14 px-10 text-lg font-bold rounded-none shadow-sm"
                        >
                           Request a free demo
                        </Button>
                        <div className="flex flex-col justify-center text-xs font-bold text-slate-400 uppercase tracking-widest leading-loose">
                           <span>No credit card required</span>
                           <span>Cancel anytime</span>
                        </div>
                     </div>
                     <div className="pt-4 border-l-4 border-[#FF7B39] pl-6 italic font-bold text-slate-400 tracking-wider">
                        India's best gym software
                     </div>
                  </div>
                  <div className="flex-1">
                     <img
                        src="https://gymowl.in/images/banner1.png"
                        alt="Gym Management Software"
                        className="w-full h-auto border border-slate-200 rounded-none shadow-sm"
                     />
                  </div>
               </div>
            </div>
         </section>

         {/* Content Section 1: Sign up & Manage */}
         <section className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-20 items-center">
               <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-slate-900 border-b-2 border-[#FF7B39] pb-2 inline-block">Gymowl provides smart fitness features</h2>
                  <p className="text-sm text-slate-600 leading-relaxed">
                     Sign-up members and prospects online or through an in-person kiosk, using a laptop, tablet or mobile device. Manage multiple programs, customize ranks, levels and promotion criteria.
                  </p>
                  <div className="space-y-4 pt-4">
                     <div className="flex gap-4">
                        <CheckCircle2 className="h-5 w-5 text-[#FF7B39] shrink-0" />
                        <div>
                           <h4 className="font-bold text-slate-800 uppercase text-xs tracking-wider">Online Gym Management Software</h4>
                        </div>
                     </div>
                     <div className="flex gap-4">
                        <CheckCircle2 className="h-5 w-5 text-[#FF7B39] shrink-0" />
                        <div>
                           <h4 className="font-bold text-slate-800 uppercase text-xs tracking-wider">Member Registration Process</h4>
                           <p className="text-xs text-slate-500 mt-1">Empower your club members with our top-notch fitness software solutions, granting them autonomy and self-management capabilities.</p>
                        </div>
                     </div>
                     <div className="flex gap-4">
                        <CheckCircle2 className="h-5 w-5 text-[#FF7B39] shrink-0" />
                        <div>
                           <h4 className="font-bold text-slate-800 uppercase text-xs tracking-wider">Club Retention</h4>
                           <p className="text-xs text-slate-500 mt-1">Our software uses cutting-edge analytics and comprehensive reporting to help you increase your gym's retention rate. Track member activity, identify churn risks, and send targeted communications.</p>
                        </div>
                     </div>
                  </div>
               </div>
               <div className="bg-slate-50 p-4 border border-slate-100">
                  <img src="https://gymowl.in/images/mockup.png" alt="Mockup" className="w-full h-auto" />
               </div>
            </div>
         </section>

         {/* Operations & Marketing Grid */}
         <section className="py-20 bg-slate-50 border-y border-slate-100 text-center">
            <div className="max-w-7xl mx-auto px-4 space-y-16">
               <div className="max-w-2xl mx-auto space-y-4">
                  <h2 className="text-3xl font-bold text-slate-900 uppercase">Gym Software For Fitness Health Club</h2>
                  <p className="text-[#FF7B39] font-black uppercase tracking-widest text-xs">India's finest gym software</p>
               </div>
               <div className="grid md:grid-cols-2 gap-12 text-left">
                  <div className="bg-white p-10 border border-slate-200">
                     <Layout className="h-8 w-8 text-[#FF7B39] mb-6" />
                     <h4 className="text-xl font-bold text-slate-900 mb-4 uppercase">Sales & Marketing</h4>
                     <p className="text-sm text-slate-600 leading-relaxed">
                        Our specialized platform enables you to improve member acquisition at your fitness club and boost your sales and marketing performance. Maximize your reach and attract new club members like never before.
                     </p>
                  </div>
                  <div className="bg-white p-10 border border-slate-200">
                     <Zap className="h-8 w-8 text-[#FF7B39] mb-6" />
                     <h4 className="text-xl font-bold text-slate-900 mb-4 uppercase">Operations</h4>
                     <p className="text-sm text-slate-600 leading-relaxed">
                        Our health club and fitness management software solutions are intended to make running your club a breeze. Assist you with streamlining your operations and saving time and money.
                     </p>
                  </div>
               </div>
            </div>
         </section>

         {/* Smart Features Grid */}
         <section className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4">
               <div className="text-center mb-16 space-y-4">
                  <h2 className="text-3xl font-bold text-slate-900 uppercase">Top Fitness Club Management Software</h2>
                  <p className="text-[#FF7B39] font-black uppercase tracking-[0.2em] text-xs">Gymowl provides smart fitness features</p>
               </div>

               <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
                  {smartFeatures.map((f, i) => (
                     <div key={i} className="p-8 border border-slate-100 hover:border-[#FF7B39]/50 transition-colors">
                        <div className="mb-6">{f.icon}</div>
                        <h4 className="text-lg font-bold text-slate-900 mb-3 uppercase tracking-tight">{f.title}</h4>
                        <p className="text-sm text-slate-500 leading-relaxed">{f.description}</p>
                     </div>
                  ))}
               </div>
            </div>
         </section>

         {/* Brand & Data Approach */}
         <section className="py-20 bg-slate-900 text-white">
            <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-12">
               <div className="space-y-4 border-l-2 border-[#FF7B39] pl-8">
                  <h4 className="text-xl font-bold uppercase tracking-widest text-[#FF7B39]">Hassle-Free Experience.</h4>
                  <p className="text-sm text-slate-400 leading-relaxed">
                     Hassle-free experience is now the currency that drives customer loyalty. Make life convenient for members on a day-to-day basis.
                  </p>
               </div>
               <div className="space-y-4 border-l-2 border-[#FF7B39] pl-8">
                  <h4 className="text-xl font-bold uppercase tracking-widest text-[#FF7B39]">Data-Centric</h4>
                  <p className="text-sm text-slate-400 leading-relaxed">
                     Adopt a data-centric approach with our gym software, leveraging its insightful data analytics to empower your decision-making process.
                  </p>
               </div>
               <div className="space-y-4 border-l-2 border-[#FF7B39] pl-8">
                  <h4 className="text-xl font-bold uppercase tracking-widest text-[#FF7B39]">Be a Brand</h4>
                  <p className="text-sm text-slate-400 leading-relaxed">
                     Service is the silent ambassador of your brand and your ambassador earn reputation by trying to do hard things well.
                  </p>
               </div>
            </div>
         </section>

         {/* Brands List */}
         <section className="py-20 bg-white border-b border-slate-100">
            <div className="max-w-7xl mx-auto px-4 text-center">
               <h2 className="text-xl font-bold text-slate-400 uppercase tracking-[0.3em] mb-12">We are fortunate to work with exceptional brands</h2>
               <div className="flex flex-wrap justify-center gap-x-12 gap-y-8">
                  {brands.map(b => (
                     <span key={b} className="text-sm font-black text-slate-300 uppercase tracking-widest hover:text-[#FF7B39] transition-colors cursor-default">{b}</span>
                  ))}
               </div>
            </div>
         </section>

         {/* Member App Section */}
         <section className="py-24 bg-slate-50 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4">
               <div className="flex flex-col lg:flex-row items-center gap-20">
                  <div className="flex-1 space-y-10">
                     <div className="space-y-4">
                        <h2 className="text-3xl font-bold text-slate-900 uppercase">Gymowl member application</h2>
                        <p className="text-[#FF7B39] font-black uppercase tracking-widest text-xs">gym member management app</p>
                     </div>
                     <h3 className="text-2xl font-bold italic text-slate-500">Don’t get suffocated with overcrowded Clients, we have Application for you</h3>
                     <ul className="space-y-6">
                        {[
                           "Check your everyday attendance on GymOwl Mobile App.",
                           "Get Expired Membership Alert, Payment Alert and many More.",
                           "Engage your members by sharing fitness workout plan on members mobile with No of Sets & reps and 2000+ Workout Gifs.",
                           "Engage your members by sharing Diet plan on members mobile with regular notification and diet updates.",
                           "Increase members retention rate by providing members workout journey and body measurement results with compression."
                        ].map((text, i) => (
                           <li key={i} className="flex gap-4">
                              <div className="h-5 w-5 rounded-full bg-[#FF7B39]/10 flex items-center justify-center shrink-0">
                                 <span className="text-[10px] font-black text-[#FF7B39]">{i + 1}</span>
                              </div>
                              <p className="text-sm text-slate-600 font-semibold">{text}</p>
                           </li>
                        ))}
                     </ul>
                     <div className="flex gap-4 pt-6">
                        <img src="https://gymowl.in/images/app_store.png" className="h-14" alt="App Store" />
                        <img src="https://gymowl.in/images/play_store.png" className="h-14" alt="Play Store" />
                     </div>
                  </div>
                  <div className="flex-1 flex justify-center">
                     <img src="https://gymowl.in/images/app-screen.png" alt="App" className="max-h-[600px]" />
                  </div>
               </div>
            </div>
         </section>

         {/* Testimonials */}
         <section className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 text-center space-y-16">
               <div className="space-y-4">
                  <h2 className="text-4xl font-bold text-slate-900">Gymowl</h2>
                  <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">Trusted by 500+ the Worldwide Gyms and Fitness Studios</p>
               </div>

               <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {testimonials.map((t, i) => (
                     <div key={i} className="p-10 border border-slate-100 bg-slate-50 text-left relative group hover:border-[#FF7B39] transition-colors">
                        <div className="text-[#FF7B39] text-5xl font-black absolute top-6 right-8 opacity-10 group-hover:opacity-20 transition-opacity">“</div>
                        <h5 className="text-[10px] font-black uppercase text-[#FF7B39] tracking-widest mb-6">Reviews</h5>
                        <p className="text-sm text-slate-500 leading-relaxed font-semibold italic mb-8">
                           {t.text}
                        </p>
                        <div className="pt-6 border-t border-slate-200">
                           <p className="text-sm font-bold text-slate-900">{t.author}</p>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.role}</p>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </section>

         {/* Final Statistics Bar */}
         <section className="bg-slate-900 py-16 text-white text-center">
            <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 lg:grid-cols-3 gap-12">
               <div className="space-y-1">
                  <span className="block text-4xl font-black text-[#FF7B39]">99%</span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Customer Retention Rate</span>
               </div>
               <div className="space-y-1">
                  <span className="block text-4xl font-black text-[#FF7B39]">500</span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Trusted by Brands</span>
               </div>
               <div className="space-y-1 col-span-2 lg:col-span-1">
                  <span className="block text-4xl font-black text-[#FF7B39]">Pan India</span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Location</span>
               </div>
            </div>
         </section>

         {/* Digital Transform Section */}
         <section className="py-24 bg-white text-center">
            <div className="max-w-3xl mx-auto px-4 space-y-8">
               <h2 className="text-3xl font-bold text-slate-900 uppercase">Digitally Transform Your Health Club</h2>
               <p className="text-sm text-slate-500 leading-relaxed">
                  Our cutting-edge fitness software serves as a digital hub, enabling a range of options and fitness encounters through seamless data utilization and integrations. By harnessing the power of technology, we empower fitness facilities to embark on a transformative digital journey.
               </p>
            </div>
         </section>

         {/* Trial Form Section */}
         <section className="py-20 bg-slate-50">
            <div className="max-w-xl mx-auto px-4">
               <div className="bg-white p-10 border border-slate-200">
                  <h2 className="text-xl font-bold text-slate-900 text-center mb-8 uppercase tracking-widest underline decoration-[#FF7B39] decoration-4 underline-offset-8">Schedule a FREE Trial</h2>
                  <form className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                        <input type="text" placeholder="First Name *" className="border border-slate-200 h-10 px-4 text-sm w-full focus:outline-none focus:border-[#FF7B39]" />
                        <input type="text" placeholder="Last Name *" className="border border-slate-200 h-10 px-4 text-sm w-full focus:outline-none focus:border-[#FF7B39]" />
                     </div>
                     <input type="text" placeholder="Company Name *" className="border border-slate-200 h-10 px-4 text-sm w-full focus:outline-none focus:border-[#FF7B39]" />
                     <input type="text" placeholder="Phone Number *" className="border border-slate-200 h-10 px-4 text-sm w-full focus:outline-none focus:border-[#FF7B39]" />
                     <input type="email" placeholder="Enter your email address *" className="border border-slate-200 h-10 px-4 text-sm w-full focus:outline-none focus:border-[#FF7B39]" />
                     <input type="password" placeholder="Create your password *" className="border border-slate-200 h-10 px-4 text-sm w-full focus:outline-none focus:border-[#FF7B39]" />
                     <Button className="w-full bg-[#FF7B39] text-white font-black h-12 rounded-none uppercase text-xs tracking-widest mt-4">
                        Request a free trial
                     </Button>
                  </form>
               </div>
            </div>
         </section>

         {/* Blogs Final Section */}
         <section id="blog" className="py-24 bg-white border-t border-slate-100">
            <div className="max-w-7xl mx-auto px-4">
               <div className="flex items-end justify-between mb-16">
                  <h2 className="text-2xl font-bold text-slate-900 uppercase underline decoration-[#FF7B39] decoration-4 underline-offset-8">Get to know more from GYMOWL BLOG</h2>
                  <Link to="/blog" className="text-[#FF7B39] font-black text-xs uppercase tracking-widest hover:underline">View All</Link>
               </div>

               <div className="grid md:grid-cols-4 gap-8">
                  {blogs.map((b, i) => (
                     <div key={i} className="space-y-4 group">
                        <div className="h-40 overflow-hidden border border-slate-100 bg-slate-50">
                           <img src={b.image} className="w-full h-full object-cover grayscale transition-all group-hover:grayscale-0 group-hover:scale-105" alt="Blog" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#FF7B39] transition-colors leading-tight">{b.title}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed">{b.excerpt}</p>
                        <Link to="/blog" className="text-[10px] font-black text-[#FF7B39] uppercase tracking-widest hover:underline block pt-2">Read more</Link>
                     </div>
                  ))}
               </div>
            </div>
         </section>

         <Footer />
      </div>
   )
}
