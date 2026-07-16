import { describe, it, expect } from "vitest"
import {
  monthKey,
  labelForMonthKey,
  lastNMonthKeys,
  bucketMonthlySum,
  bucketMonthlyCount,
  weekKey,
  lastNWeekKeys,
  bucketWeeklyCount,
  computeRetention,
  computeTopPlans,
  monthOverMonthChange,
} from "../lib/analytics.js"

describe("monthKey / labelForMonthKey", () => {
  it("formats a date as YYYY-MM", () => {
    expect(monthKey(new Date(2026, 0, 15))).toBe("2026-01")
    expect(monthKey(new Date(2026, 11, 1))).toBe("2026-12")
  })

  it("formats a month key as a human label", () => {
    expect(labelForMonthKey("2026-01")).toBe("Jan 2026")
    expect(labelForMonthKey("2026-12")).toBe("Dec 2026")
  })
})

describe("lastNMonthKeys", () => {
  it("returns n months ending at the current month, in order", () => {
    const now = new Date(2026, 2, 10) // March 2026
    expect(lastNMonthKeys(3, now)).toEqual(["2026-01", "2026-02", "2026-03"])
  })

  it("correctly crosses a year boundary", () => {
    const now = new Date(2026, 1, 1) // Feb 2026
    expect(lastNMonthKeys(3, now)).toEqual(["2025-12", "2026-01", "2026-02"])
  })
})

describe("bucketMonthlySum", () => {
  const now = new Date(2026, 2, 15) // March 2026

  it("sums values into the correct month bucket", () => {
    const rows = [
      { date: new Date(2026, 0, 5), value: 100 },
      { date: new Date(2026, 0, 20), value: 50 },
      { date: new Date(2026, 2, 1), value: 200 },
    ]
    const result = bucketMonthlySum(rows, 3, now)
    expect(result).toEqual([
      { month: "2026-01", label: "Jan 2026", value: 150 },
      { month: "2026-02", label: "Feb 2026", value: 0 },
      { month: "2026-03", label: "Mar 2026", value: 200 },
    ])
  })

  it("zero-fills months with no data instead of omitting them", () => {
    const result = bucketMonthlySum([], 3, now)
    expect(result.map((b) => b.value)).toEqual([0, 0, 0])
    expect(result).toHaveLength(3)
  })

  it("ignores rows with a null date", () => {
    const rows = [{ date: null, value: 999 }, { date: new Date(2026, 2, 1), value: 10 }]
    const result = bucketMonthlySum(rows, 3, now)
    expect(result[2].value).toBe(10)
  })

  it("ignores rows outside the requested window", () => {
    const rows = [{ date: new Date(2020, 0, 1), value: 999 }]
    const result = bucketMonthlySum(rows, 3, now)
    expect(result.every((b) => b.value === 0)).toBe(true)
  })
})

describe("bucketMonthlyCount", () => {
  it("counts rows per month", () => {
    const now = new Date(2026, 1, 1)
    const rows = [{ date: new Date(2026, 0, 1) }, { date: new Date(2026, 0, 15) }, { date: new Date(2026, 1, 1) }]
    const result = bucketMonthlyCount(rows, 2, now)
    expect(result.map((b) => b.value)).toEqual([2, 1])
  })
})

describe("weekKey / lastNWeekKeys / bucketWeeklyCount", () => {
  it("buckets a Wednesday to the Monday of its week", () => {
    // 2026-01-14 is a Wednesday
    expect(weekKey(new Date(Date.UTC(2026, 0, 14)))).toBe("2026-01-12")
  })

  it("produces n consecutive week keys ending at the current week", () => {
    const now = new Date(Date.UTC(2026, 0, 14)) // Wed, week of Jan 12
    const keys = lastNWeekKeys(3, now)
    expect(keys).toEqual(["2025-12-29", "2026-01-05", "2026-01-12"])
  })

  it("zero-fills weeks with no attendance", () => {
    const now = new Date(Date.UTC(2026, 0, 14))
    const result = bucketWeeklyCount([], 3, now)
    expect(result.map((b) => b.value)).toEqual([0, 0, 0])
  })

  it("counts check-ins into the correct week", () => {
    const now = new Date(Date.UTC(2026, 0, 14))
    const rows = [
      { date: new Date(Date.UTC(2026, 0, 12)) }, // Monday of current week
      { date: new Date(Date.UTC(2026, 0, 13)) }, // Tuesday, same week
      { date: new Date(Date.UTC(2026, 0, 5)) }, // previous week
    ]
    const result = bucketWeeklyCount(rows, 3, now)
    expect(result[2].value).toBe(2) // current week
    expect(result[1].value).toBe(1) // previous week
  })
})

describe("computeRetention", () => {
  it("computes the % active in each cohort and their difference", () => {
    const cohort30 = [{ status: "active" }, { status: "active" }, { status: "expired" }, { status: "active" }]
    const cohort90 = [{ status: "active" }, { status: "expired" }]
    const result = computeRetention(cohort30, cohort90)
    expect(result.rate30).toBe(75) // 3/4
    expect(result.rate90).toBe(50) // 1/2
    expect(result.changePercent).toBe(25)
    expect(result.cohortSize30).toBe(4)
    expect(result.cohortSize90).toBe(2)
  })

  it("returns 0 rate for an empty cohort instead of NaN or dividing by zero", () => {
    const result = computeRetention([], [])
    expect(result.rate30).toBe(0)
    expect(result.rate90).toBe(0)
    expect(result.changePercent).toBe(0)
  })
})

describe("computeTopPlans", () => {
  it("groups revenue and distinct members by plan, sorted descending", () => {
    const payments = [
      { membershipId: "p1", planName: "Gold", amountCents: 100000, memberId: "m1" },
      { membershipId: "p1", planName: "Gold", amountCents: 100000, memberId: "m2" },
      { membershipId: "p2", planName: "Silver", amountCents: 500000, memberId: "m3" },
      { membershipId: null, planName: "N/A", amountCents: 999999, memberId: "m4" },
    ]
    const result = computeTopPlans(payments)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ planId: "p2", planName: "Silver", revenue: 500000, memberCount: 1 })
    expect(result[1]).toEqual({ planId: "p1", planName: "Gold", revenue: 200000, memberCount: 2 })
  })

  it("respects the limit parameter", () => {
    const payments = Array.from({ length: 10 }, (_, i) => ({
      membershipId: `p${i}`,
      planName: `Plan ${i}`,
      amountCents: i,
      memberId: `m${i}`,
    }))
    expect(computeTopPlans(payments, 3)).toHaveLength(3)
  })
})

describe("monthOverMonthChange", () => {
  it("computes % change between the last two buckets", () => {
    expect(monthOverMonthChange([{ value: 100 }, { value: 150 }])).toBe(50)
    expect(monthOverMonthChange([{ value: 100 }, { value: 50 }])).toBe(-50)
  })

  it("returns null when there aren't at least two buckets", () => {
    expect(monthOverMonthChange([{ value: 100 }])).toBeNull()
    expect(monthOverMonthChange([])).toBeNull()
  })

  it("returns 0 when both are zero, and null (not Infinity) when only the previous is zero", () => {
    expect(monthOverMonthChange([{ value: 0 }, { value: 0 }])).toBe(0)
    expect(monthOverMonthChange([{ value: 0 }, { value: 50 }])).toBeNull()
  })
})
