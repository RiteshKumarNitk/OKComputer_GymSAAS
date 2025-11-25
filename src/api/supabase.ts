import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables")
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      "x-application-name": "gym-management-saas",
    },
  },
})

/* -------------------------------------------------------
   AUTH FUNCTIONS (FIXED)
-------------------------------------------------------- */
export const auth = {
  /* -----------------------------------------
     SIGN IN
  ------------------------------------------ */
  signIn: async (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password })
  },

  /* -----------------------------------------
     SIGN UP → FIXED + PROFILE CREATION
  ------------------------------------------ */
  signUp: async (email: string, password: string, fullName: string) => {
    // Step 1 — Create Auth user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) {
      console.error("AUTH SIGNUP ERROR:", error)
      throw error
    }

    const user = data.user
    if (!user) throw new Error("Auth user not created")

    // Step 2 — Create Profile Entry
    const { error: profileError } = await supabase
      .from("users_profile")
      .insert({
        id: user.id,
        email,
        full_name: fullName,
        role: "gym_owner", // default role
        tenant_id: null,
      })

    if (profileError) {
      console.error("PROFILE INSERT ERROR:", profileError)
      throw profileError
    }

    return { user }
  },

  /* -----------------------------------------
     SIGN OUT
  ------------------------------------------ */
  signOut: async () => {
    return supabase.auth.signOut()
  },

  /* -----------------------------------------
     GET SESSION
  ------------------------------------------ */
  getSession: async () => {
    return supabase.auth.getSession()
  },

  /* -----------------------------------------
     GET USER
  ------------------------------------------ */
  getUser: async () => {
    return supabase.auth.getUser()
  },

  /* -----------------------------------------
     UPDATE USER
  ------------------------------------------ */
  updateUser: async (updates: any) => {
    return supabase.auth.updateUser(updates)
  },

  /* -----------------------------------------
     AUTH STATE SUBSCRIPTIONS
  ------------------------------------------ */
  onAuthStateChange: (callback: (event: any, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback)
  },
}

/* -------------------------------------------------------
   REALTIME CHANNEL SUBSCRIPTIONS
-------------------------------------------------------- */
export const subscribeToChannel = (
  channelName: string,
  callback: (payload: any) => void
) => {
  const channel = supabase.channel(channelName)

  channel.on("broadcast", { event: "*" }, (payload) => {
    callback(payload)
  })

  channel.subscribe()

  return channel
}

/* -------------------------------------------------------
   FILE STORAGE
-------------------------------------------------------- */
export const storage = {
  uploadFile: async (bucket: string, path: string, file: File) => {
    return supabase.storage.from(bucket).upload(path, file)
  },

  downloadFile: async (bucket: string, path: string) => {
    return supabase.storage.from(bucket).download(path)
  },

  getPublicUrl: (bucket: string, path: string) => {
    return supabase.storage.from(bucket).getPublicUrl(path)
  },

  deleteFile: async (bucket: string, path: string) => {
    return supabase.storage.from(bucket).remove([path])
  },
}

export default supabase
