import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import dotenv from "dotenv"

dotenv.config()

const DEFAULT_EXERCISES_7_DAY = [
  {
    day: "Monday",
    focus: "Chest & Triceps",
    exercises: [
      { name: "Bench Press", sets: 4, reps: 8-12, rest: "90s", notes: "" },
      { name: "Incline Dumbbell Press", sets: 3, reps: 10-12, rest: "60s", notes: "" },
      { name: "Cable Flyes", sets: 3, reps: 12-15, rest: "60s", notes: "" },
      { name: "Tricep Pushdowns", sets: 3, reps: 12-15, rest: "60s", notes: "" },
      { name: "Overhead Tricep Extension", sets: 3, reps: 12-15, rest: "60s", notes: "" },
    ]
  },
  {
    day: "Tuesday",
    focus: "Back & Biceps",
    exercises: [
      { name: "Deadlift", sets: 4, reps: 5-8, rest: "2-3min", notes: "" },
      { name: "Lat Pulldowns", sets: 3, reps: 8-12, rest: "60s", notes: "" },
      { name: "Seated Cable Rows", sets: 3, reps: 10-12, rest: "60s", notes: "" },
      { name: "Face Pulls", sets: 3, reps: 15-20, rest: "60s", notes: "" },
      { name: "Barbell Curls", sets: 3, reps: 10-12, rest: "60s", notes: "" },
    ]
  },
  {
    day: "Wednesday",
    focus: "Rest or Light Cardio",
    exercises: [
      { name: "Light Cardio", sets: 1, reps: 0, rest: "0s", notes: "20-30 mins" },
      { name: "Core Exercises", sets: 3, reps: 15, rest: "60s", notes: "Planks, Crunches" },
    ]
  },
  {
    day: "Thursday",
    focus: "Shoulders & Abs",
    exercises: [
      { name: "Overhead Press", sets: 4, reps: 8-12, rest: "90s", notes: "" },
      { name: "Lateral Raises", sets: 3, reps: 12-15, rest: "60s", notes: "" },
      { name: "Rear Delt Flyes", sets: 3, reps: 12-15, rest: "60s", notes: "" },
      { name: "Cable Lateral Raises", sets: 3, reps: 12-15, rest: "60s", notes: "" },
      { name: "Hanging Leg Raises", sets: 3, reps: 12-15, rest: "60s", notes: "" },
      { name: "Plank", sets: 3, reps: 60, rest: "60s", notes: "Seconds" },
    ]
  },
  {
    day: "Friday",
    focus: "Legs",
    exercises: [
      { name: "Squats", sets: 4, reps: 6-10, rest: "2-3min", notes: "" },
      { name: "Romanian Deadlifts", sets: 3, reps: 8-12, rest: "90s", notes: "" },
      { name: "Leg Press", sets: 3, reps: 10-15, rest: "90s", notes: "" },
      { name: "Leg Extensions", sets: 3, reps: 12-15, rest: "60s", notes: "" },
      { name: "Calf Raises", sets: 4, reps: 15-20, rest: "60s", notes: "" },
    ]
  },
  {
    day: "Saturday",
    focus: "Full Body HIIT",
    exercises: [
      { name: "Burpees", sets: 3, reps: 10, rest: "60s", notes: "" },
      { name: "Mountain Climbers", sets: 3, reps: 30, rest: "60s", notes: "Seconds" },
      { name: "Jumping Jacks", sets: 3, reps: 60, rest: "60s", notes: "Seconds" },
      { name: "Kettlebell Swings", sets: 3, reps: 15, rest: "60s", notes: "" },
      { name: "Battle Ropes", sets: 3, reps: 30, rest: "60s", notes: "Seconds" },
    ]
  },
  {
    day: "Sunday",
    focus: "Rest",
    exercises: [
      { name: "Rest Day", sets: 0, reps: 0, rest: "0s", notes: "Recovery -Stretching, walking" },
    ]
  },
]

const DEFAULT_EXERCISES_6_DAY = [
  {
    day: "Monday",
    focus: "Push (Chest/Shoulders/Triceps)",
    exercises: [
      { name: "Bench Press", sets: 4, reps: 6-10, rest: "2min", notes: "" },
      { name: "Overhead Press", sets: 4, reps: 6-10, rest: "90s", notes: "" },
      { name: "Incline Dumbbell Press", sets: 3, reps: 8-12, rest: "90s", notes: "" },
      { name: "Lateral Raises", sets: 4, reps: 12-15, rest: "60s", notes: "" },
      { name: "Tricep Pushdowns", sets: 3, reps: 12-15, rest: "60s", notes: "" },
    ]
  },
  {
    day: "Tuesday",
    focus: "Pull (Back/Biceps)",
    exercises: [
      { name: "Deadlift", sets: 4, reps: 5, rest: "2-3min", notes: "" },
      { name: "Pull-ups or Lat Pulldowns", sets: 4, reps: 6-10, rest: "90s", notes: "" },
      { name: "Seated Cable Row", sets: 3, reps: 8-12, rest: "90s", notes: "" },
      { name: "Face Pulls", sets: 3, reps: 15-20, rest: "60s", notes: "" },
      { name: "Barbell Curls", sets: 3, reps: 10-12, rest: "60s", notes: "" },
    ]
  },
  {
    day: "Wednesday",
    focus: "Legs (Quads/Hams/Calves)",
    exercises: [
      { name: "Squats", sets: 4, reps: 6-10, rest: "2-3min", notes: "" },
      { name: "Romanian Deadlift", sets: 3, reps: 8-12, rest: "90s", notes: "" },
      { name: "Leg Press", sets: 3, reps: 10-15, rest: "90s", notes: "" },
      { name: "Leg Extensions", sets: 3, reps: 12-15, rest: "60s", notes: "" },
      { name: "Calf Raises", sets: 4, reps: 15-20, rest: "60s", notes: "" },
    ]
  },
  {
    day: "Thursday",
    focus: "Push (Chest/Shoulders/Triceps)",
    exercises: [
      { name: "Incline Dumbbell Press", sets: 4, reps: 8-12, rest: "90s", notes: "" },
      { name: "Dumbbell Shoulder Press", sets: 4, reps: 8-12, rest: "90s", notes: "" },
      { name: "Cable Flyes", sets: 3, reps: 12-15, rest: "60s", notes: "" },
      { name: "Rear Delt Flyes", sets: 3, reps: 12-15, rest: "60s", notes: "" },
      { name: "Skull Crushers", sets: 3, reps: 10-12, rest: "60s", notes: "" },
    ]
  },
  {
    day: "Friday",
    focus: "Pull (Back/Biceps)",
    exercises: [
      { name: "Barbell Rows", sets: 4, reps: 6-10, rest: "90s", notes: "" },
      { name: "Single Arm Dumbbell Row", sets: 3, reps: 8-12, rest: "60s", notes: "" },
      { name: "T-Bar Rows", sets: 3, reps: 8-12, rest: "90s", notes: "" },
      { name: "Hammer Curls", sets: 3, reps: 10-12, rest: "60s", notes: "" },
      { name: "Preacher Curls", sets: 3, reps: 10-12, rest: "60s", notes: "" },
    ]
  },
  {
    day: "Saturday",
    focus: "Legs + Core",
    exercises: [
      { name: "Front Squats", sets: 4, reps: 8-12, rest: "90s", notes: "" },
      { name: "Lunges", sets: 3, reps: 10-12, rest: "60s", notes: "" },
      { name: "Hip Thrusts", sets: 3, reps: 10-12, rest: "60s", notes: "" },
      { name: "Plank", sets: 3, reps: 60, rest: "60s", notes: "Seconds" },
      { name: "Cable Woodchoppers", sets: 3, reps: 12, rest: "60s", notes: "" },
    ]
  },
]

async function seedWorkoutTemplates() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
  const prisma = new PrismaClient({ adapter })

  const templates = [
    {
      name: "7-Day Standard",
      description: "Full body workout split with rest on Sunday - ideal for beginners",
      days: 7,
      exercises: JSON.stringify(DEFAULT_EXERCISES_7_DAY),
      isDefault: true,
    },
    {
      name: "6-Day Power",
      description: "6-day push/pull/legs split for intermediate-advanced",
      days: 6,
      exercises: JSON.stringify(DEFAULT_EXERCISES_6_DAY),
      isDefault: false,
    },
  ]

  // Get all tenants
  const tenants = await prisma.tenant.findMany()

  for (const tenant of tenants) {
    for (const template of templates) {
      const existing = await prisma.workoutTemplate.findFirst({
        where: { tenantId: tenant.id, name: template.name }
      })

      if (!existing) {
        await prisma.workoutTemplate.create({
          data: { ...template, tenantId: tenant.id }
        })
        console.log(`✅ Created "${template.name}" for tenant: ${tenant.name}`)
      } else {
        console.log(`ℹ️ Already exists: "${template.name}" for tenant: ${tenant.name}`)
      }
    }
  }

  await prisma.$disconnect()
}

seedWorkoutTemplates().catch((err) => {
  console.error("❌ Seed failed:", err)
  process.exit(1)
})