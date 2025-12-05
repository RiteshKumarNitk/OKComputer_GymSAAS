import React, { createContext, useContext, useEffect, useState } from "react"
import type { AuthUser, UserRole } from "@/types"
import { supabase } from "@/api/supabase"
import { useQuery, useQueryClient } from "@tanstack/react-query"

interface AuthContextType {
  user: AuthUser | null
  session: any | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string, role?: string, tenantId?: string) => Promise<void>
  signOut: () => Promise<void>
  hasRole: (roles: UserRole[]) => boolean
  hasPermission: (permission: string) => boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const queryClient = useQueryClient()

  //-------------------------------------------------------
  // Fetch User Profile (users_profile table)
  //-------------------------------------------------------
  const { data: userProfile, error: profileError, isLoading: isProfileLoading } = useQuery({
    queryKey: ["userProfile", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null

      const { data, error } = await supabase
        .from("users_profile")
        .select("*")
        .eq("id", session.user.id)
        .single()

      if (error) {
        // If profile is missing (PGRST116), try to create it on the fly (Self-Healing)
        if (error.code === 'PGRST116') {
          console.warn("Profile missing, attempting to create default profile...");
          const { data: newProfile, error: createError } = await supabase
            .from("users_profile")
            .insert({
              id: session.user.id,
              email: session.user.email,
              full_name: session.user.user_metadata?.full_name || "New User",
              role: session.user.user_metadata?.role || "gym_owner",
              tenant_id: session.user.user_metadata?.tenant_id || null
            })
            .select()
            .single();
          
          if (createError) {
             console.error("Failed to auto-create profile:", createError);
             throw createError;
          }
          return newProfile;
        }
        
        console.error("Error fetching user profile:", error)
        throw error
      }
      return data
    },
    enabled: !!session?.user?.id,
    retry: 1,
  })

  //-------------------------------------------------------
  // Initialize Auth State
  //-------------------------------------------------------
  useEffect(() => {
    const init = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      setSession(currentSession)

      if (!currentSession) {
        // No session, definitely logged out
        setUser(null)
        setIsLoading(false)
        return
      }

      // We have a session, check for profile
      if (userProfile) {
        // Profile loaded successfully
        setUser({
          id: currentSession.user.id,
          email: currentSession.user.email!,
          role: userProfile.role,
          tenant_id: userProfile.tenant_id,
          full_name: userProfile.full_name,
        })
        setIsLoading(false)
      } else if (profileError) {
        // Profile fetch failed (RLS or network)
        console.error("AuthContext: Profile fetch failed", profileError)
        // Optional: Don't logout immediately if it's just a network blip, 
        // but for RLS issues we usually have to.
        setUser(null)
        setIsLoading(false)
      } else {
        // Session exists, but profile is loading or idle.
        // Keep isLoading = true and wait for next effect run.
        console.log("AuthContext: Session found, waiting for profile...")
      }
    }

    init()
  }, [userProfile, profileError])

  //-------------------------------------------------------
  // Listen to Auth State Changes
  //-------------------------------------------------------
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession)

        if (event === "SIGNED_OUT") {
          setUser(null)
          queryClient.clear()
          return
        }

        if (newSession?.user) {
          await queryClient.invalidateQueries({ queryKey: ["userProfile"] })
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [queryClient])

  //-------------------------------------------------------
  // Sign In (Correct Supabase Syntax)
  //-------------------------------------------------------
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
  }

  //-------------------------------------------------------
  // Sign Up (Correct Syntax + Metadata for Trigger)
  //-------------------------------------------------------
  const signUp = async (email: string, password: string, fullName: string, role?: string, tenantId?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
          tenant_id: tenantId,
        },
      },
    })

    if (error) throw error
  }

  //-------------------------------------------------------
  // Sign Out
  //-------------------------------------------------------
  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  //-------------------------------------------------------
  // Role Based Access
  //-------------------------------------------------------
  const hasRole = (roles: UserRole[]): boolean => {
    if (!user) return false
    return roles.includes(user.role)
  }

  const hasPermission = (permission: string): boolean => {
    if (!user) return false

    const permissions: Record<UserRole, string[]> = {
      super_admin: ["*"],
      gym_owner: [
        "view_dashboard",
        "manage_members",
        "manage_trainers",
        "manage_billing",
        "view_analytics",
        "manage_settings",
      ],
      manager: [
        "view_dashboard",
        "manage_members",
        "manage_trainers",
        "view_billing",
        "view_analytics",
      ],
      trainer: [
        "view_dashboard",
        "view_members",
        "manage_workouts",
        "manage_diet_plans",
        "view_schedule",
      ],
      frontdesk: [
        "view_dashboard",
        "view_members",
        "manage_attendance",
        "view_payments",
      ],
      member: [
        "view_own_profile",
        "view_own_workouts",
        "view_own_diet_plans",
        "view_attendance",
      ],
    }

    const userPermissions = permissions[user.role] || []
    return userPermissions.includes("*") || userPermissions.includes(permission)
  }

  //-------------------------------------------------------
  // Refresh User
  //-------------------------------------------------------
  const refreshUser = async () => {
    await queryClient.invalidateQueries({ queryKey: ["userProfile"] })
  }

  //-------------------------------------------------------
  // Final Context
  //-------------------------------------------------------
  const value: AuthContextType = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    hasRole,
    hasPermission,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}


// import React, { createContext, useContext, useEffect, useState } from "react"
// import type { AuthUser, UserRole } from "@/types"
// import { supabase, auth } from "@/api/supabase"
// import { useQuery, useQueryClient } from "@tanstack/react-query"

// interface AuthContextType {
//   user: AuthUser | null
//   session: any | null
//   isLoading: boolean
//   signIn: (email: string, password: string) => Promise<void>
//   signUp: (email: string, password: string, fullName: string) => Promise<void>
//   signOut: () => Promise<void>
//   hasRole: (roles: UserRole[]) => boolean
//   hasPermission: (permission: string) => boolean
//   refreshUser: () => Promise<void>
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined)

// export const useAuth = () => {
//   const context = useContext(AuthContext)
//   if (!context) {
//     throw new Error("useAuth must be used within an AuthProvider")
//   }
//   return context
// }

// export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const [user, setUser] = useState<AuthUser | null>(null)
//   const [session, setSession] = useState<any | null>(null)
//   const [isLoading, setIsLoading] = useState(true)
//   const queryClient = useQueryClient()

//   // Fetch user profile data
//   const { data: userProfile } = useQuery({
//     queryKey: ["userProfile", session?.user?.id],
//     queryFn: async () => {
//       if (!session?.user?.id) return null
      
//       const { data, error } = await supabase
//         .from("users_profile")
//         .select("*")
//         .eq("id", session.user.id)
//         .single()
      
//       if (error) throw error
//       return data
//     },
//     enabled: !!session?.user?.id,
//   })

//   // Initialize auth state
//   useEffect(() => {
//     const initializeAuth = async () => {
//       try {
//         const { data: { session: currentSession } } = await auth.getSession()
//         setSession(currentSession)
        
//         if (currentSession?.user && userProfile) {
//           const authUser: AuthUser = {
//             id: currentSession.user.id,
//             email: currentSession.user.email!,
//             role: userProfile.role,
//             tenant_id: userProfile.tenant_id,
//             full_name: userProfile.full_name,
//           }
//           setUser(authUser)
//         } else {
//           setUser(null)
//         }
//       } catch (error) {
//         console.error("Auth initialization error:", error)
//         setUser(null)
//         setSession(null)
//       } finally {
//         setIsLoading(false)
//       }
//     }

//     initializeAuth()
//   }, [userProfile])

//   // Listen for auth state changes
//   useEffect(() => {
//     const { data: { subscription } } = auth.onAuthStateChange(
//       async (event, newSession) => {
//         setSession(newSession)
        
//         if (event === "SIGNED_OUT") {
//           setUser(null)
//           queryClient.clear()
//         } else if (newSession?.user) {
//           // Refetch user profile
//           await queryClient.invalidateQueries({ queryKey: ["userProfile"] })
//         }
//       }
//     )

//     return () => {
//       subscription.unsubscribe()
//     }
//   }, [queryClient])

// const signIn = async (email: string, password: string) => {
//   const { error } = await auth.signInWithPassword({
//     email,
//     password,
//   })

//   if (error) throw error
// }


//  const signUp = async (email: string, password: string, fullName: string) => {
//   const { error } = await auth.signUp({
//     email,
//     password,
//     options: {
//       data: {
//         full_name: fullName,
//       },
//     },
//   })

//   if (error) throw error
// }


//   const signOut = async () => {
//     const { error } = await auth.signOut()
//     if (error) throw error
//   }

//   const hasRole = (roles: UserRole[]): boolean => {
//     if (!user) return false
//     return roles.includes(user.role)
//   }

//   const hasPermission = (permission: string): boolean => {
//     if (!user) return false
    
//     // Define role-based permissions
//     const permissions: Record<UserRole, string[]> = {
//       super_admin: ["*"], // All permissions
//       gym_owner: [
//         "view_dashboard",
//         "manage_members",
//         "manage_trainers",
//         "manage_billing",
//         "view_analytics",
//         "manage_settings",
//       ],
//       manager: [
//         "view_dashboard",
//         "manage_members",
//         "manage_trainers",
//         "view_billing",
//         "view_analytics",
//       ],
//       trainer: [
//         "view_dashboard",
//         "view_members",
//         "manage_workouts",
//         "manage_diet_plans",
//         "view_schedule",
//       ],
//       frontdesk: [
//         "view_dashboard",
//         "view_members",
//         "manage_attendance",
//         "view_payments",
//       ],
//       member: [
//         "view_own_profile",
//         "view_own_workouts",
//         "view_own_diet_plans",
//         "view_attendance",
//       ],
//     }
    
//     const userPermissions = permissions[user.role] || []
//     return userPermissions.includes("*") || userPermissions.includes(permission)
//   }

//   const refreshUser = async () => {
//     await queryClient.invalidateQueries({ queryKey: ["userProfile"] })
//   }

//   const value: AuthContextType = {
//     user,
//     session,
//     isLoading,
//     signIn,
//     signUp,
//     signOut,
//     hasRole,
//     hasPermission,
//     refreshUser,
//   }

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
// }