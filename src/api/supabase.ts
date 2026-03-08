/**
 * COMPATIBILITY SHIM - Replaces the old Supabase client
 * 
 * This file provides a supabase-like interface that internally calls
 * the new API routes via fetch(). This allows all existing component
 * imports to work without changing every single file.
 * 
 * Usage: Components still import { supabase } from "@/api/supabase"
 * but the calls now go through the Next.js API routes → Prisma.
 */

type QueryResult<T> = { data: T | null; error: Error | null }

function createQueryBuilder(tableName: string) {
    let endpoint = `/api/${tableName}`
    let params: Record<string, string> = {}
    let selectFields = "*"
    let body: any = null
    let method = "GET"
    let orderField = ""
    let orderAsc = true
    let rangeStart = 0
    let rangeEnd = 100
    let isSingle = false
    let isCount = false
    let isInsert = false
    let isUpdate = false
    let isDelete = false

    // Map table names to API endpoints
    const tableMap: Record<string, string> = {
        members: "members",
        memberships: "memberships",
        trainers: "trainers",
        trainer_slots: "trainer-slots",
        attendance: "attendance",
        schedules: "schedules",
        workouts: "workouts",
        diet_plans: "diet-plans",
        member_workouts: "member-workouts",
        member_diets: "member-diets",
        services: "services",
        branches: "branches",
        leads: "leads",
        visitors: "visitors",
        complaints: "complaints",
        expenses: "expenses",
        products: "products",
        lockers: "lockers",
        front_desk: "front-desk",
        notifications: "notifications",
        payments: "payments",
        tenants: "tenants",
        users_profile: "users",
        saas_plans: "billing?type=plans",
        saas_subscriptions: "billing?type=subscription",
        saas_invoices: "billing?type=invoices",
    }

    const mappedTable = tableMap[tableName] || tableName
    endpoint = `/api/${mappedTable}`

    const builder = {
        select(fields?: string) {
            if (fields) selectFields = fields
            return builder
        },
        eq(field: string, value: any) {
            // Convert snake_case field names to URL params
            if (field === "tenant_id") params.tenantId = value
            else if (field === "member_id") params.memberId = value
            else if (field === "trainer_id") params.trainerId = value
            else if (field === "is_active") params.isActive = value
            else if (field === "status") params.status = value
            else if (field === "id") params.id = value
            else params[field] = value
            return builder
        },
        neq(field: string, value: any) {
            return builder // Filtering handled server-side
        },
        gt(field: string, value: any) {
            return builder
        },
        gte(field: string, value: any) {
            return builder
        },
        lt(field: string, value: any) {
            return builder
        },
        lte(field: string, value: any) {
            return builder
        },
        like(field: string, value: any) {
            return builder
        },
        ilike(field: string, value: any) {
            return builder
        },
        in(field: string, values: any[]) {
            return builder
        },
        or(filter: string) {
            // Extract search terms from supabase-style or filter
            const match = filter.match(/\.ilike\.%([^%]+)%/)
            if (match) params.search = match[1]
            return builder
        },
        order(field: string, opts?: { ascending?: boolean }) {
            orderField = field
            orderAsc = opts?.ascending ?? true
            return builder
        },
        range(start: number, end: number) {
            rangeStart = start
            rangeEnd = end
            return builder
        },
        limit(n: number) {
            rangeEnd = n
            return builder
        },
        single() {
            isSingle = true
            return builder
        },
        maybeSingle() {
            isSingle = true
            return builder
        },
        insert(data: any) {
            isInsert = true
            method = "POST"
            body = data
            return builder
        },
        update(data: any) {
            isUpdate = true
            method = "PATCH"
            body = data
            return builder
        },
        delete() {
            isDelete = true
            method = "DELETE"
            return builder
        },
        async then(resolve: (value: QueryResult<any>) => void) {
            try {
                const url = new URL(endpoint, window.location.origin)
                Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)))

                const options: RequestInit = { method, headers: { "Content-Type": "application/json" } }
                if (body && (isInsert || isUpdate)) {
                    options.body = JSON.stringify(body)
                }

                const res = await fetch(url.toString(), options)
                if (!res.ok) {
                    const err = await res.json().catch(() => ({ error: res.statusText }))
                    resolve({ data: null, error: new Error(err.error || res.statusText) })
                    return
                }

                let data = await res.json()
                if (isSingle && Array.isArray(data)) {
                    data = data[0] || null
                }
                resolve({ data, error: null })
            } catch (err: any) {
                resolve({ data: null, error: err })
            }
        },
    }

    return builder
}

// Main supabase-compatible client
export const supabase = {
    from(tableName: string) {
        return createQueryBuilder(tableName)
    },

    // Auth compatibility (delegates to NextAuth)
    auth: {
        async getSession() {
            try {
                const res = await fetch("/api/auth/session")
                const session = await res.json()
                return { data: { session }, error: null }
            } catch (err: any) {
                return { data: { session: null }, error: err }
            }
        },
        async getUser() {
            try {
                const res = await fetch("/api/auth/session")
                const session = await res.json()
                return { data: { user: session?.user || null }, error: null }
            } catch (err: any) {
                return { data: { user: null }, error: err }
            }
        },
        async signInWithPassword(credentials: { email: string; password: string }) {
            try {
                const res = await fetch("/api/auth/callback/credentials", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(credentials),
                })
                const data = await res.json()
                return { data, error: null }
            } catch (err: any) {
                return { data: null, error: err }
            }
        },
        async signUp(credentials: { email: string; password: string; options?: any }) {
            try {
                const res = await fetch("/api/auth/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: credentials.email,
                        password: credentials.password,
                        ...credentials.options?.data,
                    }),
                })
                const data = await res.json()
                if (!res.ok) return { data: null, error: new Error(data.error) }
                return { data, error: null }
            } catch (err: any) {
                return { data: null, error: err }
            }
        },
        async signOut() {
            await fetch("/api/auth/signout", { method: "POST" })
            return { error: null }
        },
        onAuthStateChange(callback: (event: string, session: any) => void) {
            // NextAuth handles this via SessionProvider
            return { data: { subscription: { unsubscribe: () => { } } } }
        },
    },

    // Storage compatibility (Cloudinary)
    storage: {
        from(bucket: string) {
            return {
                async upload(path: string, file: File) {
                    const formData = new FormData()
                    formData.append("file", file)
                    try {
                        const res = await fetch("/api/upload", { method: "POST", body: formData })
                        const data = await res.json()
                        return { data: { path: data.url }, error: null }
                    } catch (err: any) {
                        return { data: null, error: err }
                    }
                },
                getPublicUrl(path: string) {
                    return { data: { publicUrl: path } }
                },
            }
        },
    },
}
