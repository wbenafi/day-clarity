import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

const defaultProjectName = 'Initial Project'
const legacyDefaultProjectName = 'Default'

const projectReturn = (project: {
  _id: string
  name: string
  archivedAt?: number
  createdAt: number
  updatedAt: number
}) => ({
  id: project._id,
  name: project.name,
  archivedAt: project.archivedAt,
  createdAt: project.createdAt,
  updatedAt: project.updatedAt,
})

export const ensureDefaultProject = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()
    const projects = await ctx.db.query('projects').collect()
    let defaultProject = projects.find(
      (project) => project.name === defaultProjectName && !project.archivedAt,
    )
    const legacyDefaultProject = projects.find(
      (project) => project.name === legacyDefaultProjectName && !project.archivedAt,
    )

    if (!defaultProject && legacyDefaultProject) {
      await ctx.db.patch(legacyDefaultProject._id, {
        name: defaultProjectName,
        updatedAt: now,
      })
      defaultProject = await ctx.db.get(legacyDefaultProject._id)
    } else if (!defaultProject) {
      const id = await ctx.db.insert('projects', {
        name: defaultProjectName,
        createdAt: now,
        updatedAt: now,
      })
      defaultProject = await ctx.db.get(id)
    }

    if (!defaultProject) throw new Error('Unable to create default project.')

    const workItems = await ctx.db.query('workItems').collect()
    await Promise.all(
      workItems
        .filter((item) => !item.projectId)
        .map((item) =>
          ctx.db.patch(item._id, {
            projectId: defaultProject._id,
            updatedAt: now,
          }),
        ),
    )

    const dailyCloses = await ctx.db.query('dailyCloses').collect()
    await Promise.all(
      dailyCloses
        .filter((close) => !close.projectId)
        .map((close) =>
          ctx.db.patch(close._id, {
            projectId: defaultProject._id,
            updatedAt: now,
          }),
        ),
    )

    return projectReturn(defaultProject)
  },
})

export const listProjects = query({
  args: {},
  handler: async (ctx) => {
    const projects = await ctx.db.query('projects').collect()
    return projects
      .filter((project) => !project.archivedAt)
      .sort((first, second) => first.createdAt - second.createdAt)
      .map(projectReturn)
  },
})

export const createProject = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const name = args.name.trim()
    if (!name) throw new Error('Project name is required.')

    const now = Date.now()
    const id = await ctx.db.insert('projects', {
      name,
      createdAt: now,
      updatedAt: now,
    })
    const project = await ctx.db.get(id)
    if (!project) throw new Error('Unable to create project.')
    return projectReturn(project)
  },
})

export const updateProject = mutation({
  args: {
    id: v.string(),
    name: v.string(),
    archivedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const projectId = ctx.db.normalizeId('projects', args.id)
    if (!projectId) throw new Error('Unknown project.')

    const name = args.name.trim()
    if (!name) throw new Error('Project name is required.')

    await ctx.db.patch(projectId, {
      name,
      archivedAt: args.archivedAt,
      updatedAt: Date.now(),
    })
    const project = await ctx.db.get(projectId)
    if (!project) throw new Error('Unable to update project.')
    return projectReturn(project)
  },
})
