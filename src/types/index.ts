export interface User {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  role: UserRole
  tenant_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type UserRole = "super_admin" | "gym_owner" | "manager" | "trainer" | "frontdesk" | "member"

export interface Tenant {
  id: string
  name: string
  slug: string
  // Owner Details
  owner_name: string | null
  owner_email: string | null
  owner_phone: string | null

  // Branding
  logo_url: string | null
  cover_image_url: string | null
  primary_color: string
  secondary_color: string

  // Business Details
  business_type: string | null
  gst_number: string | null
  pan_number: string | null
  registered_address: string | null

  // Billing Settings
  billing_currency: string
  billing_cycle: string
  payment_gateway_preference: string
  invoice_prefix: string

  // Communication Settings
  sms_provider: string | null
  whatsapp_number: string | null
  email_from_name: string | null
  smtp_config: any | null

  created_at: string
  updated_at: string
}

export type SubscriptionStatus = "active" | "inactive" | "cancelled" | "past_due"

export interface Membership {
  id: string
  tenant_id: string
  name: string
  description: string | null
  duration_days: number
  price_cents: number
  currency: string
  perks: any
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Member {
  id: string
  tenant_id: string
  user_id: string | null
  member_code: string
  full_name: string
  email: string | null
  phone: string | null
  dob: string | null
  gender: string | null
  address: any | null
  emergency_contact: any | null
  joined_at: string
  current_plan_id: string | null
  plan_started_at: string | null
  plan_expires_at: string | null
  status: MemberStatus
  notes: string | null
  created_at: string
  updated_at: string
  membership?: Membership
}

export type MemberStatus = "active" | "inactive" | "suspended" | "expired"

export interface Payment {
  id: string
  tenant_id: string
  member_id: string
  membership_id: string | null
  amount_cents: number
  currency: string
  provider: PaymentProvider
  provider_payment_id: string | null
  status: PaymentStatus
  paid_at: string | null
  metadata: any
  created_at: string
  updated_at: string
  member?: Member
  membership?: Membership
}

export type PaymentProvider = "stripe" | "razorpay" | "cash"
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded"

export interface Attendance {
  id: string
  tenant_id: string
  member_id: string
  checkin_at: string
  checkout_at: string | null
  device_info: any
  created_at: string
  member?: Member
}

export interface Trainer {
  id: string
  tenant_id: string
  user_id: string | null
  full_name: string
  email: string | null
  phone: string | null
  bio: string | null
  specialties: string[]
  hourly_rate_cents: number | null
  is_active: boolean
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface TrainerSlot {
  id: string
  trainer_id: string
  tenant_id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_recurring: boolean
  is_booked: boolean
  booked_by_member_id: string | null
  booked_at: string | null
  created_at: string
  updated_at: string
  trainer?: Trainer
}

export interface Workout {
  id: string
  tenant_id: string
  name: string
  description: string | null
  exercises: any
  created_by: string | null
  is_public: boolean
  difficulty: string | null
  estimated_duration_minutes: number | null
  created_at: string
  updated_at: string
}

export interface DietPlan {
  id: string
  tenant_id: string
  name: string
  description: string | null
  meals: any
  created_by: string | null
  is_public: boolean
  target_calories: number | null
  dietary_restrictions: string[]
  created_at: string
  updated_at: string
}

export interface MemberWorkout {
  id: string
  member_id: string
  workout_id: string
  assigned_by: string | null
  assigned_at: string
  completed_at: string | null
  notes: string | null
  progress: any
  workout?: Workout
}

export interface MemberDiet {
  id: string
  member_id: string
  diet_plan_id: string
  assigned_by: string | null
  assigned_at: string
  started_at: string | null
  completed_at: string | null
  notes: string | null
  diet_plan?: DietPlan
}

export interface Notification {
  id: string
  tenant_id: string
  user_id: string | null
  type: string
  title: string
  message: string
  data: any
  is_read: boolean
  created_at: string
}

export interface DashboardStats {
  totalMembers: number
  activeMembers: number
  totalRevenue: number
  monthlyRevenue: number
  attendanceToday: number
  newMembersThisMonth: number
  membershipDistribution: { [key: string]: number }
  revenueTrend: { month: string; revenue: number }[]
  attendanceTrend: { date: string; count: number }[]
}

export interface ApiResponse<T> {
  data: T | null
  error: Error | null
}

export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  tenant_id: string | null
  full_name: string | null
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  password: string
  fullName: string
  role?: UserRole
  tenantId?: string
}

export interface QRCodeData {
  memberId: string
  tenantId: string
  timestamp: number
}

export interface Branch {
  id: string
  tenant_id: string
  name: string
  address: string | null
  phone: string | null
  manager_id: string | null
  created_at: string
  updated_at: string
}

export interface Service {
  id: string
  tenant_id: string
  name: string
  description: string | null
  type: "class" | "facility" | "training"
  capacity: number | null
  created_at: string
  updated_at: string
}