/**
 * Pure aggregation functions for the real analytics engine. Deliberately
 * separated from any Prisma/Express code so they're unit-testable without a
 * database (same pattern as lib/prismaTenantScope.ts's applyTenantScope) —
 * see server/__tests__/analytics.test.ts.
 *
 * These replace the fabricated/hardcoded chart data previously shown on
 * DashboardPage.tsx, MemberAnalyticsPage.tsx, and the Super Admin Dashboard.
 */

export interface MonthBucket {
  month: string // "2026-01"
  label: string // "Jan 2026"
  value: number
}

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

export function labelForMonthKey(key: string): string {
  const [year, month] = key.split("-").map(Number)
  return `${MONTH_LABELS[month - 1]} ${year}`
}

/** The last `n` calendar months as sorted "YYYY-MM" keys, ending with the current month. */
export function lastNMonthKeys(n: number, now: Date = new Date()): string[] {
  const keys: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    keys.push(monthKey(d))
  }
  return keys
}

/** Buckets rows into the last `n` months, summing `value`. Months with no rows are 0, not omitted. */
export function bucketMonthlySum(
  rows: { date: Date | string | null; value: number }[],
  months: number,
  now: Date = new Date()
): MonthBucket[] {
  const keys = lastNMonthKeys(months, now)
  const totals = new Map<string, number>(keys.map((k) => [k, 0]))
  for (const row of rows) {
    if (!row.date) continue
    const key = monthKey(new Date(row.date))
    if (totals.has(key)) totals.set(key, (totals.get(key) || 0) + row.value)
  }
  return keys.map((key) => ({ month: key, label: labelForMonthKey(key), value: totals.get(key) || 0 }))
}

/** Same as bucketMonthlySum but counts rows instead of summing a value field. */
export function bucketMonthlyCount(
  rows: { date: Date | string | null }[],
  months: number,
  now: Date = new Date()
): MonthBucket[] {
  return bucketMonthlySum(
    rows.map((r) => ({ date: r.date, value: 1 })),
    months,
    now
  )
}

export interface WeekBucket {
  week: string // Monday of that week, ISO date
  label: string
  value: number
}

/** Monday (UTC) of the week containing `date`, as an ISO date string — used as the bucket key. */
export function weekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const dayNum = (d.getUTCDay() + 6) % 7 // Monday=0 ... Sunday=6
  d.setUTCDate(d.getUTCDate() - dayNum)
  return d.toISOString().split("T")[0]
}

export function lastNWeekKeys(n: number, now: Date = new Date()): string[] {
  const keys: string[] = []
  const currentMonday = new Date(`${weekKey(now)}T00:00:00.000Z`)
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(currentMonday)
    d.setUTCDate(d.getUTCDate() - i * 7)
    keys.push(d.toISOString().split("T")[0])
  }
  return keys
}

export function bucketWeeklyCount(
  rows: { date: Date | string | null }[],
  weeks: number,
  now: Date = new Date()
): WeekBucket[] {
  const keys = lastNWeekKeys(weeks, now)
  const counts = new Map<string, number>(keys.map((k) => [k, 0]))
  for (const row of rows) {
    if (!row.date) continue
    const key = weekKey(new Date(row.date))
    if (counts.has(key)) counts.set(key, (counts.get(key) || 0) + 1)
  }
  return keys.map((week) => ({ week, label: week, value: counts.get(week) || 0 }))
}

export interface RetentionResult {
  /** % of members who joined 30+ days ago that are still status="active" today. */
  rate30: number
  /** Same calculation over a 90-day-ago cohort — a same-metric comparison point, NOT a "last month" trend. */
  rate90: number
  /** rate30 - rate90. Positive means recent joiners are retaining better than the 90-day cohort did. */
  changePercent: number
  cohortSize30: number
  cohortSize90: number
}

export function computeRetention(cohort30: { status: string }[], cohort90: { status: string }[]): RetentionResult {
  const rateOf = (cohort: { status: string }[]) =>
    cohort.length === 0 ? 0 : (cohort.filter((m) => m.status === "active").length / cohort.length) * 100
  const rate30 = Math.round(rateOf(cohort30) * 10) / 10
  const rate90 = Math.round(rateOf(cohort90) * 10) / 10
  return {
    rate30,
    rate90,
    changePercent: Math.round((rate30 - rate90) * 10) / 10,
    cohortSize30: cohort30.length,
    cohortSize90: cohort90.length,
  }
}

export interface TopPlanResult {
  planId: string
  planName: string
  revenue: number
  memberCount: number
}

/** Top plans by revenue over the given payments. `revenue` is in the same unit as amountCents passed in. */
export function computeTopPlans(
  payments: { membershipId: string | null; planName: string; amountCents: number; memberId: string }[],
  limit = 5
): TopPlanResult[] {
  const byPlan = new Map<string, { planName: string; revenue: number; members: Set<string> }>()
  for (const p of payments) {
    if (!p.membershipId) continue
    const entry = byPlan.get(p.membershipId) || { planName: p.planName, revenue: 0, members: new Set<string>() }
    entry.revenue += p.amountCents
    entry.members.add(p.memberId)
    byPlan.set(p.membershipId, entry)
  }
  return Array.from(byPlan.entries())
    .map(([planId, v]) => ({ planId, planName: v.planName, revenue: v.revenue, memberCount: v.members.size }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)
}

/** Month-over-month % change between the last two buckets of a trend. Null if not computable (avoids divide-by-zero noise). */
export function monthOverMonthChange(buckets: { value: number }[]): number | null {
  if (buckets.length < 2) return null
  const previous = buckets[buckets.length - 2].value
  const current = buckets[buckets.length - 1].value
  if (previous === 0) return current === 0 ? 0 : null
  return Math.round(((current - previous) / previous) * 1000) / 10
}
