
import React from "react"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"

export const BlogPage: React.FC = () => {
  const blogs = [
    {
      title: "How to increase your gym revenue in 2026",
      category: "Business",
      image: "https://gymowl.in/blog/wp-content/uploads/2023/12/GYM-REVENUE.jpg",
      date: "Dec 15, 2025"
    },
    {
      title: "The importance of digital attendance for gyms",
      category: "Technology",
      image: "https://gymowl.in/blog/wp-content/uploads/2023/12/attendance.jpg",
      date: "Jan 10, 2026"
    },
    {
      title: "5 ways to improve member retention rate",
      category: "Retention",
      image: "https://gymowl.in/blog/wp-content/uploads/2023/12/retention.jpg",
      date: "Feb 22, 2026"
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <section className="py-12 bg-slate-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-2xl font-bold uppercase tracking-tight text-slate-900 underline decoration-[#FF7B39] decoration-4 underline-offset-8">Our Blog</h1>
          <p className="text-sm text-slate-500 mt-4">Insights, tips, and the latest in fitness and business management.</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto py-16 px-4 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {blogs.map((blog, i) => (
          <div key={i} className="group cursor-pointer">
            <div className="h-48 overflow-hidden mb-6 border border-slate-100">
              <img src={blog.image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt={blog.title} />
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF7B39]">{blog.category}</span>
                <span className="h-1 w-1 bg-slate-300 rounded-full"></span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{blog.date}</span>
              </div>
              <h4 className="text-lg font-bold text-slate-900 group-hover:text-[#FF7B39] transition-colors leading-snug">
                {blog.title}
              </h4>
            </div>
          </div>
        ))}
      </div>
      <Footer />
    </div>
  )
}
