import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

const dailyClosePayload = {
  date: v.string(),
  finished: v.array(v.string()),
  firstStepTomorrow: v.optional(v.string()),
  markdownSummary: v.string(),
  needsPrioritization: v.array(v.string()),
  projectId: v.string(),
  stillOpen: v.array(v.string()),
}

const dailyCloseReturn = (close: {
  _id: string
  projectId?: string
  date: string
  finished: string[]
  stillOpen: string[]
  needsPrioritization: string[]
  firstStepTomorrow?: string
  markdownSummary: string
  createdAt: number
  updatedAt: number
}) => ({
  id: close._id,
  projectId: close.projectId ?? '',
  date: close.date,
  finished: close.finished,
  stillOpen: close.stillOpen,
  needsPrioritization: close.needsPrioritization,
  firstStepTomorrow: close.firstStepTomorrow,
  markdownSummary: close.markdownSummary,
  createdAt: close.createdAt,
  updatedAt: close.updatedAt,
})

export const createDailyClose = mutation({
  args: dailyClosePayload,
  handler: async (ctx, args) => {
    const now = Date.now()
    const existing = await ctx.db
      .query('dailyCloses')
      .withIndex('by_project_date', (q) =>
        q.eq('projectId', args.projectId).eq('date', args.date),
      )
      .first()

    if (existing) {
      await ctx.db.patch(existing._id, { ...args, updatedAt: now })
      const updated = await ctx.db.get(existing._id)
      if (!updated) throw new Error('Unable to update daily close.')
      return dailyCloseReturn(updated)
    }

    const id = await ctx.db.insert('dailyCloses', {
      ...args,
      createdAt: now,
      updatedAt: now,
    })
    const close = await ctx.db.get(id)
    if (!close) throw new Error('Unable to create daily close.')
    return dailyCloseReturn(close)
  },
})

export const updateDailyClose = mutation({
  args: {
    id: v.string(),
    ...dailyClosePayload,
  },
  handler: async (ctx, args) => {
    const { id, ...patch } = args
    const closeId = ctx.db.normalizeId('dailyCloses', id)
    if (!closeId) throw new Error('Unknown daily close.')

    await ctx.db.patch(closeId, { ...patch, updatedAt: Date.now() })
    const close = await ctx.db.get(closeId)
    if (!close) throw new Error('Unable to update daily close.')
    return dailyCloseReturn(close)
  },
})

export const getDailyCloseByDate = query({
  args: { date: v.string(), projectId: v.string() },
  handler: async (ctx, args) => {
    const close = await ctx.db
      .query('dailyCloses')
      .withIndex('by_project_date', (q) =>
        q.eq('projectId', args.projectId).eq('date', args.date),
      )
      .first()

    return close ? dailyCloseReturn(close) : null
  },
})

export const listDailyCloses = query({
  args: { projectId: v.string() },
  handler: async (ctx, args) => {
    const closes = await ctx.db
      .query('dailyCloses')
      .withIndex('by_project_date', (q) => q.eq('projectId', args.projectId))
      .collect()
    return closes
      .sort((first, second) => second.createdAt - first.createdAt)
      .map(dailyCloseReturn)
  },
})
