export interface User {
  id: string
  email: string
  fullName: string | null
  phone: string | null
  avatarUrl: string | null
  role: UserRole
  tenantId: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type UserRole = "super_admin" | "gym_owner" | "manager" | "trainer" | "frontdesk" | "member"

export type Gender = "male" | "female" | "other" | "prefer_not_to_say"

export interface Tenant {
  id: string
  name: string
  slug: string
  ownerUserId: string | null
  // Owner Details
  ownerName: string | null
  ownerEmail: string | null
  ownerPhone: string | null
  ownerPhotoUrl: string | null

  // Address
  address: any | null
  phone: string | null
  email: string | null
  timezone: string

  // Branding
  logoUrl: string | null
  primaryColor: string | null
  secondaryColor: string | null

  // Business Details
  businessType: string | null
  status: TenantStatus
  gstNumber: string | null
  panNumber: string | null
  registeredAddress: string | null

  // Billing Settings
  currency: string
  billingCycle: string
  paymentGatewayPreference: string
  invoicePrefix: string

  // Subscription
  subscriptionId: string | null
  subscriptionStatus: SubscriptionStatus
  subscriptionExpiresAt: Date | null
  features: string[] | null

  createdAt: string
  updatedAt: string
}

export type TenantStatus = "active" | "suspended" | "cancelled"

export type SubscriptionStatus = "active" | "inactive" | "cancelled" | "past_due"

export interface Membership {
  id: string
  tenantId: string
  name: string
  description: string | null
  durationDays: number
  priceCents: number
  currency: string
  perks: any
  type: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Member {
  id: string
  tenantId: string
  userId: string | null
  memberCode: string
  fullName: string
  email: string | null
  phone: string | null
  dob: Date | null
  gender: Gender | null
  address: any | null
  emergencyContact: any | null
  joinedAt: string
  currentPlanId: string | null
  planStartedAt: Date | null
  planExpiresAt: Date | null
  status: MemberStatus
  notes: string | null
  assignedTrainerId: string | null
  avatarUrl: string | null
  createdAt: string
  updatedAt: string
  // Optional relation for backward compatibility
  currentPlan?: Membership
}

export type MemberStatus = "active" | "inactive" | "suspended" | "expired"

export interface Payment {
  id: string
  tenantId: string
  memberId: string
  membershipId: string | null
  razorpayOrderId: string | null
  amountCents: number
  currency: string
  provider: PaymentProvider
  providerPaymentId: string | null
  status: PaymentStatus
  paidAt: Date | null
  metadata: any
  createdAt: string
  updatedAt: string
  member?: Member
  membership?: Membership
}

export type PaymentProvider = "stripe" | "razorpay" | "cash"
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded"

export interface Attendance {
  id: string
  tenantId: string
  memberId: string
  checkinAt: string
  checkoutAt: string | null
  deviceInfo: any
  createdAt: string
  member?: Member
}

export interface Trainer {
  id: string
  tenantId: string
  userId: string | null
  fullName: string
  email: string | null
  phone: string | null
  bio: string | null
  specialties: string[]
  hourlyRateCents: number | null
  isActive: boolean
  avatarUrl: string | null
  createdAt: string
  updatedAt: string
  user?: User
}

export interface TrainerSlot {
  id: string
  trainerId: string
  tenantId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  isRecurring: boolean
  isBooked: boolean
  bookedByMemberId: string | null
  bookedAt: string | null
  createdAt: string
  updatedAt: string
  trainer?: Trainer
}

export interface Workout {
  id: string
  tenantId: string
  name: string
  description: string | null
  exercises: any
  createdBy: string | null
  isPublic: boolean
  difficulty: string | null
  estimatedDurationMinutes: number | null
  createdAt: string
  updatedAt: string
}

export interface DietPlan {
  id: string
  tenantId: string
  name: string
  description: string | null
  meals: any
  createdBy: string | null
  isPublic: boolean
  targetCalories: number | null
  dietaryRestrictions: string[]
  createdAt: string
  updatedAt: string
}

export interface MemberWorkout {
  id: string
  tenantId: string
  memberId: string
  workoutId: string
  assignedBy: string | null
  assignedAt: string
  completedAt: string | null
  notes: string | null
  progress: any
  workout?: Workout
}

export interface MemberDiet {
  id: string
  tenantId: string
  memberId: string
  dietPlanId: string
  assignedBy: string | null
  assignedAt: string
  startedAt: string | null
  completedAt: string | null
  notes: string | null
  dietPlan?: DietPlan
}

export interface Notification {
  id: string
  tenantId: string
  userId: string | null
  notificationType: string
  title: string
  message: string
  data: any
  isRead: boolean
  createdAt: string
}

export interface DashboardStats {
  totalMembers: number
  activeMembers: number
  totalTrainers: number
  totalFrontdesk: number
  totalManagers: number
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
  tenantId: string | null
  fullName: string | null
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

export interface DashboardStats {
  totalMembers: number
  activeMembers: number
  totalTrainers: number
  totalFrontdesk: number
  totalManagers: number
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
  tenantId: string | null
  fullName: string | null
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
  tenantId: string
  name: string
  address: string | null
  phone: string | null
  managerId: string | null
  createdAt: string
  updatedAt: string
}

export interface Service {
  id: string
  tenantId: string
  name: string
  description: string | null
  type: "class" | "facility" | "training"
  capacity: number | null
  createdAt: string
  updatedAt: string
}

export type StaffShift = "morning" | "evening" | "both"
export type StaffStatus = "active" | "on_leave" | "terminated" | "resigned" | "probation"
export type LeaveType = "casual" | "sick" | "earned" | "unpaid"
export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled"

export interface StaffProfile {
  id: string
  tenantId: string
  userId: string
  employeeCode: string
  department?: string
  designation?: string
  joiningDate: string
  resignationDate?: string
  shift: StaffShift
  status: StaffStatus
  salaryPerMonth?: number
  notes?: string
}

export interface StaffLeave {
  id: string
  tenantId: string
  staffId: string
  leaveType: LeaveType
  startDate: string
  endDate: string
  totalDays: number
  reason?: string
  status: LeaveStatus
  approvedBy?: string
  approvedAt?: string
}

export interface Invoice {
  id: string
  tenantId: string
  memberId: string
  paymentId?: string
  invoiceNumber: string
  invoiceDate: string
  dueDate?: string
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled" | "void"
  subtotalPaise: number
  discountPaise: number
  taxPercent: number
  taxPaise: number
  totalPaise: number
  currency: string
  notes?: string
  lineItems: any[]
  createdAt: string
  updatedAt: string
}

export interface SaasPlan {
  id: string
  name: string
  description: string | null
  pricePaise: number
  durationDays: number | null
  features: any
  isActive: boolean
  createdAt: string | null
}

export interface SaasSubscription {
  id: string
  tenantId: string
  planId: string | null
  startDate: string | null
  endDate: string | null
  pricePaidPaise: number | null
  status: SubscriptionStatus
  createdAt: string | null
  plan?: SaasPlan
}

export interface SaasInvoice {
  id: string
  tenantId: string
  subscriptionId: string | null
  invoiceNumber: string | null
  amountPaise: number | null
  status: "paid" | "pending" | "failed" | "overdue"
  paymentDate: string | null
  createdAt: string | null
}