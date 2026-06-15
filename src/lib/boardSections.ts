import type { BoardSection } from './types'

export const defaultBoardSections: BoardSection[] = [
  {
    id: 'real_commitment',
    name: 'My Real Commitments',
    color: '#51604C',
    description: 'Work you accepted, own, and should actually move forward.',
  },
  {
    id: 'real_fire',
    name: 'Real Fires',
    color: '#B85C38',
    description: 'Urgent work with real impact if ignored.',
  },
  {
    id: 'borrowed_fire',
    name: 'Borrowed Fires',
    color: '#B58B2A',
    description: 'Someone else’s urgency that may not belong to you.',
  },
  {
    id: 'noise',
    name: 'Noise / Needs Clarity',
    color: '#78716C',
    description: 'Vague, duplicated, unclear, or unprioritized work.',
  },
]

export function cloneDefaultBoardSections() {
  return defaultBoardSections.map((section) => ({ ...section }))
}

export function createBoardSection(): BoardSection {
  return {
    id: `section_${crypto.randomUUID()}`,
    name: 'New section',
    color: '#51604C',
    description: '',
  }
}

export function normalizeBoardSections(sections?: BoardSection[]) {
  if (!Array.isArray(sections) || sections.length === 0) {
    return cloneDefaultBoardSections()
  }

  const seen = new Set<string>()
  const normalized = sections.reduce<BoardSection[]>((validSections, section) => {
    const id = section?.id?.trim()
    if (!id || seen.has(id)) return validSections

    seen.add(id)
    validSections.push({
      id,
      name: section.name?.trim() || 'Untitled section',
      color: normalizeHexColor(section.color),
      description: section.description?.trim() ?? '',
    })
    return validSections
  }, [])

  return normalized.length > 0 ? normalized : cloneDefaultBoardSections()
}

export function sectionColorStyle(section: BoardSection) {
  return {
    '--section-color': section.color,
    '--section-bg': sectionBackgroundTint(section.color),
    '--section-border': section.color,
  }
}

function normalizeHexColor(color?: string) {
  if (!color) return '#51604C'

  const trimmed = color.trim()
  return /^#[0-9a-f]{6}$/i.test(trimmed) ? trimmed.toUpperCase() : '#51604C'
}

function sectionBackgroundTint(hexColor: string) {
  const { hue, saturation } = hexToHsl(hexColor)
  const adjustedSaturation = clamp(Math.round(saturation * 1.2), 32, 72)

  return `hsl(${hue} ${adjustedSaturation}% 90%)`
}

function hexToHsl(hexColor: string) {
  const hex = normalizeHexColor(hexColor).slice(1)
  const value = Number.parseInt(hex, 16)
  const red = ((value >> 16) & 255) / 255
  const green = ((value >> 8) & 255) / 255
  const blue = (value & 255) / 255
  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)
  const lightness = (max + min) / 2
  const delta = max - min

  if (delta === 0) {
    return { hue: 0, saturation: 0, lightness: Math.round(lightness * 100) }
  }

  const saturation =
    lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min)
  let hue =
    max === red
      ? (green - blue) / delta + (green < blue ? 6 : 0)
      : max === green
        ? (blue - red) / delta + 2
        : (red - green) / delta + 4

  hue /= 6

  return {
    hue: Math.round(hue * 360),
    saturation: Math.round(saturation * 100),
    lightness: Math.round(lightness * 100),
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}
