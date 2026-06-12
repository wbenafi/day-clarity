import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { impact, urgency, workCategory, workStatus } from './schema'

const optionalString = v.optional(v.string())
const workLink = v.object({
  label: v.string(),
  url: v.string(),
})

const workItemPayload = {
  category: workCategory,
  completedAt: v.optional(v.number()),
  date: v.string(),
  displaces: optionalString,
  impact: v.optional(impact),
  links: v.optional(v.array(workLink)),
  notes: optionalString,
  requestedBy: optionalString,
  status: workStatus,
  title: v.string(),
  urgency: v.optional(urgency),
}

const workItemReturn = (item: {
  _id: string
  title: string
  category: 'real_commitment' | 'real_fire' | 'borrowed_fire' | 'noise'
  urgency?: 'today' | 'this_week' | 'unclear' | 'later'
  impact?: 'low' | 'medium' | 'high'
  requestedBy?: string
  displaces?: string
  links?: Array<{ label: string; url: string }>
  notes?: string
  status: 'open' | 'done' | 'archived'
  createdAt: number
  updatedAt: number
  completedAt?: number
  date: string
}) => ({
  id: item._id,
  title: item.title,
  category: item.category,
  urgency: item.urgency,
  impact: item.impact,
  requestedBy: item.requestedBy,
  displaces: item.displaces,
  links: item.links,
  notes: item.notes,
  status: item.status,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
  completedAt: item.completedAt,
  date: item.date,
})

export const createWorkItem = mutation({
  args: workItemPayload,
  handler: async (ctx, args) => {
    const now = Date.now()
    const id = await ctx.db.insert('workItems', {
      ...args,
      createdAt: now,
      updatedAt: now,
    })
    const item = await ctx.db.get(id)
    if (!item) throw new Error('Unable to create work item.')
    return workItemReturn(item)
  },
})

export const updateWorkItem = mutation({
  args: {
    id: v.string(),
    ...workItemPayload,
    createdAt: v.number(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const { id, ...patch } = args
    const itemId = ctx.db.normalizeId('workItems', id)
    if (!itemId) throw new Error('Unknown work item.')

    await ctx.db.patch(itemId, { ...patch, updatedAt: Date.now() })
    const item = await ctx.db.get(itemId)
    if (!item) throw new Error('Unable to update work item.')
    return workItemReturn(item)
  },
})

export const archiveWorkItem = mutation({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const itemId = ctx.db.normalizeId('workItems', args.id)
    if (!itemId) throw new Error('Unknown work item.')

    await ctx.db.patch(itemId, { status: 'archived', updatedAt: Date.now() })
  },
})

export const markWorkItemDone = mutation({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const itemId = ctx.db.normalizeId('workItems', args.id)
    if (!itemId) throw new Error('Unknown work item.')

    await ctx.db.patch(itemId, {
      completedAt: Date.now(),
      status: 'done',
      updatedAt: Date.now(),
    })
    const item = await ctx.db.get(itemId)
    if (!item) throw new Error('Unable to mark work item done.')
    return workItemReturn(item)
  },
})

export const reopenWorkItem = mutation({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const itemId = ctx.db.normalizeId('workItems', args.id)
    if (!itemId) throw new Error('Unknown work item.')

    await ctx.db.patch(itemId, {
      completedAt: undefined,
      status: 'open',
      updatedAt: Date.now(),
    })
    const item = await ctx.db.get(itemId)
    if (!item) throw new Error('Unable to reopen work item.')
    return workItemReturn(item)
  },
})

export const listWorkItemsByDate = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query('workItems')
      .withIndex('by_date', (q) => q.eq('date', args.date))
      .collect()

    return items
      .filter((item) => item.status !== 'archived')
      .sort((first, second) => first.createdAt - second.createdAt)
      .map(workItemReturn)
  },
})

export const listTodayWorkItems = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query('workItems')
      .withIndex('by_date', (q) => q.eq('date', args.date))
      .collect()

    return items
      .filter((item) => item.status !== 'archived')
      .sort((first, second) => first.createdAt - second.createdAt)
      .map(workItemReturn)
  },
})
