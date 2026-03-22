/**
 * API Client - Replaces all direct Supabase calls with fetch-based API calls.
 * Drop-in replacement: import { api } from "@/api/apiClient" instead of { supabase } from "@/api/supabase"
 */

const BASE_URL = "/api"

async function request<T>(endpoint: string, options?: RequestInit): Promise<{ data: T | null; error: Error | null }> {
    try {
        const token = localStorage.getItem("gym_token")
        const userStored = localStorage.getItem("gym_user")
        const user = userStored ? JSON.parse(userStored) : null
        const tenantId = user?.tenant_id || ""

        const res = await fetch(`${BASE_URL}${endpoint}`, {
            headers: { 
                "Content-Type": "application/json", 
                ...(token ? { "Authorization": `Bearer ${token}` } : {}),
                ...(tenantId ? { "x-tenant-id": tenantId } : {}),
                ...options?.headers 
            },
            ...options,
        })
        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: res.statusText }))
            return { data: null, error: new Error(err.error || res.statusText) }
        }
        const data = await res.json()
        return { data, error: null }
    } catch (err: any) {
        return { data: null, error: err }
    }
}

// ========== MEMBERS ==========
export const membersApi = {
    list: (tenantId: string, search?: string, status?: string) =>
        request<any[]>(`/members?tenantId=${tenantId}${search ? `&search=${search}` : ""}${status && status !== "all" ? `&status=${status}` : ""}`),
    get: (id: string) => request<any>(`/members?id=${id}`),
    create: (data: any) => request<any>("/members", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/members?id=${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/members?id=${id}`, { method: "DELETE" }),
    renew: (data: { id: string; planId?: string }) => request<any>("/members/renew", { method: "POST", body: JSON.stringify(data) }),
}

// ========== MEMBERSHIPS ==========
export const membershipsApi = {
    list: (tenantId: string) => request<any[]>(`/memberships?tenantId=${tenantId}`),
    create: (data: any) => request<any>("/memberships", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/memberships?id=${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/memberships?id=${id}`, { method: "DELETE" }),
}

// ========== PAYMENTS ==========
export const paymentsApi = {
    list: (tenantId: string, memberId?: string, status?: string) =>
        request<any[]>(`/payments?tenantId=${tenantId}${memberId ? `&memberId=${memberId}` : ""}${status ? `&status=${status}` : ""}`),
    create: (data: any) => request<any>("/payments", { method: "POST", body: JSON.stringify(data) }),
}

// ========== INVOICES ==========
export const invoicesApi = {
    list: (tenantId: string, memberId?: string, status?: string) =>
        request<any[]>(`/invoices?tenantId=${tenantId}${memberId ? `&memberId=${memberId}` : ""}${status ? `&status=${status}` : ""}`),
}

// ========== ATTENDANCE ==========
export const attendanceApi = {
    list: (tenantId: string, memberId?: string, date?: string) =>
        request<any[]>(`/attendance?tenantId=${tenantId}${memberId ? `&memberId=${memberId}` : ""}${date ? `&date=${date}` : ""}`),
    checkin: (data: any) => request<any>("/attendance", { method: "POST", body: JSON.stringify(data) }),
    checkout: (id: string) => request<any>(`/attendance?id=${id}`, { method: "PATCH", body: JSON.stringify({ checkout: true }) }),
}

// ========== TRAINERS ==========
export const trainersApi = {
    list: (tenantId: string) => request<any[]>(`/trainers?tenantId=${tenantId}`),
    get: (id: string) => request<any>(`/trainers?id=${id}`),
    create: (data: any) => request<any>("/trainers", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/trainers?id=${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/trainers?id=${id}`, { method: "DELETE" }),
}

// ========== TRAINER SLOTS ==========
export const trainerSlotsApi = {
    list: (tenantId: string, trainerId?: string) =>
        request<any[]>(`/trainer-slots?tenantId=${tenantId}${trainerId ? `&trainerId=${trainerId}` : ""}`),
    create: (data: any) => request<any>("/trainer-slots", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/trainer-slots?id=${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/trainer-slots?id=${id}`, { method: "DELETE" }),
}

// ========== SCHEDULES ==========
export const schedulesApi = {
    list: (tenantId: string) => request<any[]>(`/schedules?tenantId=${tenantId}`),
    create: (data: any) => request<any>("/schedules", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/schedules?id=${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/schedules?id=${id}`, { method: "DELETE" }),
}

// ========== WORKOUTS ==========
export const workoutsApi = {
    list: (tenantId: string) => request<any[]>(`/workouts?tenantId=${tenantId}`),
    create: (data: any) => request<any>("/workouts", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/workouts?id=${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/workouts?id=${id}`, { method: "DELETE" }),
}

// ========== DIET PLANS ==========
export const dietPlansApi = {
    list: (tenantId: string) => request<any[]>(`/diet-plans?tenantId=${tenantId}`),
    create: (data: any) => request<any>("/diet-plans", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/diet-plans?id=${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/diet-plans?id=${id}`, { method: "DELETE" }),
}

// ========== MEMBER WORKOUTS & DIETS ==========
export const memberWorkoutsApi = {
    list: (memberId: string) => request<any[]>(`/member-workouts?memberId=${memberId}`),
    assign: (data: any) => request<any>("/member-workouts", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/member-workouts?id=${id}`, { method: "PATCH", body: JSON.stringify(data) }),
}

export const memberDietsApi = {
    list: (memberId: string) => request<any[]>(`/member-diets?memberId=${memberId}`),
    assign: (data: any) => request<any>("/member-diets", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/member-diets?id=${id}`, { method: "PATCH", body: JSON.stringify(data) }),
}

// ========== SERVICES ==========
export const servicesApi = {
    list: (tenantId: string) => request<any[]>(`/services?tenantId=${tenantId}`),
    create: (data: any) => request<any>("/services", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/services?id=${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/services?id=${id}`, { method: "DELETE" }),
}

// ========== BRANCHES ==========
export const branchesApi = {
    list: (tenantId: string) => request<any[]>(`/branches?tenantId=${tenantId}`),
    create: (data: any) => request<any>("/branches", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/branches?id=${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/branches?id=${id}`, { method: "DELETE" }),
}

// ========== LEADS ==========
export const leadsApi = {
    list: (tenantId: string) => request<any[]>(`/leads?tenantId=${tenantId}`),
    create: (data: any) => request<any>("/leads", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/leads?id=${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/leads?id=${id}`, { method: "DELETE" }),
}

// ========== OPERATIONS (Visitors & Complaints) ==========
export const visitorsApi = {
    list: (tenantId: string) => request<any[]>(`/visitors?tenantId=${tenantId}`),
    create: (data: any) => request<any>("/visitors", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/visitors?id=${id}`, { method: "PATCH", body: JSON.stringify(data) }),
}

export const complaintsApi = {
    list: (tenantId: string) => request<any[]>(`/complaints?tenantId=${tenantId}`),
    create: (data: any) => request<any>("/complaints", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/complaints?id=${id}`, { method: "PATCH", body: JSON.stringify(data) }),
}

// ========== EXPENSES ==========
export const expensesApi = {
    list: (tenantId: string) => request<any[]>(`/expenses?tenantId=${tenantId}`),
    create: (data: any) => request<any>("/expenses", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/expenses?id=${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/expenses?id=${id}`, { method: "DELETE" }),
}

// ========== PRODUCTS (POS) ==========
export const productsApi = {
    list: (tenantId: string) => request<any[]>(`/products?tenantId=${tenantId}`),
    create: (data: any) => request<any>("/products", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/products?id=${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/products?id=${id}`, { method: "DELETE" }),
}

// ========== LOCKERS ==========
export const lockersApi = {
    list: (tenantId: string) => request<any[]>(`/lockers?tenantId=${tenantId}`),
    create: (data: any) => request<any>("/lockers", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/lockers?id=${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/lockers?id=${id}`, { method: "DELETE" }),
}

// ========== FRONT DESK (Staff) ==========
export const frontDeskApi = {
    list: (tenantId: string) => request<any[]>(`/front-desk?tenantId=${tenantId}`),
    create: (data: any) => request<any>("/front-desk", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/front-desk?id=${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/front-desk?id=${id}`, { method: "DELETE" }),
}

// ========== NOTIFICATIONS ==========
export const notificationsApi = {
    list: (tenantId: string) => request<any[]>(`/notifications?tenantId=${tenantId}`),
    markRead: (id: string) => request<any>(`/notifications/${id}`, { method: "PATCH", body: JSON.stringify({ isRead: true }) }),
}

// ========== DASHBOARD ==========
export const dashboardApi = {
    getStats: () => request<any>("/reports/dashboard"),
}

// ========== TENANTS ==========
export const tenantsApi = {
    get: (id: string) => request<any>(`/tenants/${id}`),
    list: () => request<any[]>("/tenants"),
    create: (data: any) => request<any>("/tenants", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/tenants/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/tenants/${id}`, { method: "DELETE" }),
}

// ========== USER PROFILES ==========
export const usersApi = {
    list: (tenantId?: string) => request<any[]>(`/users${tenantId ? `?tenantId=${tenantId}` : ""}`),
    get: (id: string) => request<any>(`/users/${id}`),
    update: (id: string, data: any) => request<any>(`/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
}

// ========== BILLING (SaaS) ==========
export const billingApi = {
    getPlans: () => request<any[]>("/saas_plans"),
    getSubscription: (tenantId: string) => request<any>(`/saas_subscriptions?tenantId=${tenantId}`),
    getInvoices: (param: string) => request<any[]>(param === "all" ? "/invoices" : `/saas_invoices?tenantId=${param}`),
    subscribe: (data: any) => request<any>("/saas_subscriptions", { method: "POST", body: JSON.stringify(data) }),
    updatePlan: (id: string, data: any) => request<any>(`/saas_plans?id=${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    createInvoice: (data: any) => request<any>("/saas_invoices", { method: "POST", body: JSON.stringify(data) }),
}

// ========== FILE UPLOAD (Cloudinary) ==========
export const uploadApi = {
    uploadImage: async (file: File): Promise<{ url: string; publicId: string } | null> => {
        const formData = new FormData()
        formData.append("file", file)
        try {
            const res = await fetch(`${BASE_URL}/upload`, { method: "POST", body: formData })
            if (!res.ok) return null
            return await res.json()
        } catch {
            return null
        }
    },
}

// ========== REPORTS ==========
export const reportsApi = {
    getMembers: () => request<{ expiring: any[], newJoiners: any[], inactive: any[] }>("/reports/members"),
    getRevenue: (tenantId: string, period?: string) =>
        request<any>(`/reports/revenue?tenantId=${tenantId}${period ? `&period=${period}` : ""}`),
    getAttendance: (tenantId: string, period?: string) =>
        request<any>(`/reports/attendance?tenantId=${tenantId}${period ? `&period=${period}` : ""}`),
    getMemberGrowth: (tenantId: string) =>
        request<any>(`/reports/member-growth?tenantId=${tenantId}`),
}

export const razorpayApi = {
    createOrder: (data: { memberId: string, amountInr: number, membershipId?: string }) => 
        request<any>("/payments/razorpay-order", { method: "POST", body: JSON.stringify(data) })
}
