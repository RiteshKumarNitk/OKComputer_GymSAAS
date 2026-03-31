import React, { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
// Auth context provides signIn function and user state management
import { useAuth } from "@/features/auth/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Activity, Eye, EyeOff } from "lucide-react"

export const SignInPage: React.FC = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [isPhoneLogin, setIsPhoneLogin] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { signIn, signInWithPhone } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || "/dashboard"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      if (isPhoneLogin) {
        if (!otpSent) {
          setOtpSent(true)
          setIsLoading(false)
          return
        } else {
          await signInWithPhone(phone, "TEST_BYPASS")
        }
      } else {
        await signIn(email, password)
      }

      // Read stored user to check role for redirect
      const stored = localStorage.getItem("gym_user")
      if (stored) {
        const user = JSON.parse(stored)
        if (user.role === "member") {
          navigate("/member/dashboard", { replace: true })
          return
        }
        if (user.role === "super_admin") {
          navigate("/super-admin", { replace: true })
          return
        }
      }

      navigate(from, { replace: true })
    } catch (err: any) {
      setError(err.message || "Invalid credentials")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950">
      {/* Ambient background glows */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-indigo-500/20 mix-blend-screen filter blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-purple-500/20 mix-blend-screen filter blur-3xl animate-pulse delay-700" />
      </div>

      <div className="w-full max-w-md px-4">
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-2">
            <Activity className="h-12 w-12 text-indigo-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
            <span className="text-4xl font-extrabold tracking-tight text-white">Gym<span className="text-indigo-400">Pro</span></span>
          </div>
        </div>

        <Card className="border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-white">Welcome back</CardTitle>
            <CardDescription className="text-center text-slate-400">
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="bg-red-950/50 border-red-500/30 text-red-200">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {!isPhoneLogin ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-300">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className="bg-white/5 border-white/10 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-300">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        className="bg-white/5 border-white/10 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </>
              ) : !otpSent ? (
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-slate-300">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    disabled={isLoading}
                    className="bg-white/5 border-white/10 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              ) : (
                <>
                  <Alert className="bg-blue-950/50 border-blue-500/30 text-blue-200">
                    <AlertDescription>Use static OTP: 123456 for testing</AlertDescription>
                  </Alert>
                  <div className="space-y-2 mt-2">
                    <Label htmlFor="otp" className="text-slate-300">OTP Code</Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                      maxLength={6}
                      disabled={isLoading}
                      className="bg-white/5 border-white/10 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                </>
              )}

              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all duration-200" disabled={isLoading}>
                {isLoading ? "Processing..." : !isPhoneLogin ? "Sign in" : !otpSent ? "Send OTP" : "Verify & Sign in"}
              </Button>

              <div className="text-center mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsPhoneLogin(!isPhoneLogin);
                    setOtpSent(false);
                  }}
                  className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  {isPhoneLogin ? "Use Email instead" : "Use Phone instead"}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}