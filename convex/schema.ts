import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export const workCategory = v.union(
  v.literal('real_commitment'),
  v.literal('real_fire'),
  v.literal('borrowed_fire'),
  v.literal('noise'),
)

export const urgency = v.union(
  v.literal('today'),
  v.literal('this_week'),
  v.literal('unclear'),
  v.literal('later'),
)

export const impact = v.union(
  v.literal('low'),
  v.literal('medium'),
  v.literal('high'),
)

export const workStatus = v.union(
  v.literal('open'),
  v.literal('done'),
  v.literal('archived'),
)

export default defineSchema({
  dailyCloses: defineTable({
    date: v.string(),
    finished: v.array(v.string()),
    stillOpen: v.array(v.string()),
    needsPrioritization: v.array(v.string()),
    firstStepTomorrow: v.optional(v.string()),
    markdownSummary: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_date', ['date']),
  workItems: defineTable({
    title: v.string(),
    category: workCategory,
    urgency: v.optional(urgency),
    impact: v.optional(impact),
    requestedBy: v.optional(v.string()),
    displaces: v.optional(v.string()),
    links: v.optional(
      v.array(
        v.object({
          label: v.string(),
          url: v.string(),
        }),
      ),
    ),
    notes: v.optional(v.string()),
    status: workStatus,
    createdAt: v.number(),
    updatedAt: v.number(),
    completedAt: v.optional(v.number()),
    date: v.string(),
  })
    .index('by_category', ['category'])
    .index('by_date', ['date'])
    .index('by_date_status', ['date', 'status'])
    .index('by_status', ['status']),
})
