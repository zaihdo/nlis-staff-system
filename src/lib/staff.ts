import type { UserRecord } from '../types'

const PALETTE = [
  '#007AFF',
  '#34C759',
  '#FF3B30',
  '#AF52DE',
  '#FF9500',
  '#00C7BE',
  '#FF2D55',
  '#30D158',
  '#FFB000',
  '#5AC8FA',
]

// Used when Supabase is not configured or the users table is empty.
export const DEFAULT_USERS: UserRecord[] = [
  { id: 'zaidh-imran', first_name: 'Zaidh', last_name: 'Imran', color: '#007AFF' },
  { id: 'mohamed-abdallah', first_name: 'Mohamed', last_name: 'Abdallah', color: '#34C759' },
  { id: 'mohamed-ameen', first_name: 'Mohamed', last_name: 'Ameen', color: '#FF3B30' },
  { id: 'mohamed-asif', first_name: 'Mohamed', last_name: 'Asif', color: '#AF52DE' },
  { id: 'ahmed-elbanna', first_name: 'Ahmed', last_name: 'Elbanna', color: '#FF9500' },
  { id: 'abderrahmane-allouache', first_name: 'Abderrahmane', last_name: 'Allouache', color: '#00C7BE' },
  { id: 'ahmed-fekry', first_name: 'Ahmed', last_name: 'Fekry', color: '#FF2D55' },
  { id: 'fazal-rahman', first_name: 'Fazal', last_name: 'Rahman', color: '#30D158' },
  { id: 'mohamed-el-kady', first_name: 'Mohamed', last_name: 'El Kady', color: '#FFB000' },
  { id: 'ibrahim-alnahhal', first_name: 'Ibrahim', last_name: 'Alnahhal', color: '#5AC8FA' },
]

// Availability rows are keyed by this full-name string.
export const getFullName = (user: UserRecord | null | undefined) =>
  `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim()

export const getColorForName = (name: string) => {
  const normalized = name.trim()
  if (!normalized) {
    return '#94a3b8'
  }

  const total = [...normalized].reduce((sum, character) => sum + character.charCodeAt(0), 0)
  return PALETTE[total % PALETTE.length]
}

export const getCompactName = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean)

  if (parts.length === 0) {
    return ''
  }

  if (parts.length === 1) {
    return parts[0]
  }

  const firstInitial = parts[0].charAt(0).toUpperCase()
  const lastName = parts[parts.length - 1]

  return `${firstInitial}. ${lastName}`
}
