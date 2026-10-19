// Slots are half-hour indexes into the day: slot 17 = 8:30 AM, slot 27 = 1:30 PM.
export const HALF_HOUR_SLOTS = Array.from({ length: 11 }, (_, index) => 17 + index)
export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export const toISODate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const formatDateLabel = (dateString: string) => {
  const date = new Date(`${dateString}T00:00:00`)
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export const normalizeSlotValue = (slotValue: number) => {
  if (slotValue >= 0 && slotValue <= 47) {
    return slotValue
  }

  if (slotValue >= 8 && slotValue <= 14) {
    return slotValue * 2
  }

  return slotValue
}

export const formatHourLabel = (slot: number) => {
  const totalMinutes = normalizeSlotValue(slot) * 30
  const hour = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const normalizedHour = hour % 12 || 12
  return `${normalizedHour}:${String(minutes).padStart(2, '0')} ${suffix}`
}

export const getStartOfWeek = (date: Date) => {
  const nextDate = new Date(date)
  const day = nextDate.getDay()
  const diff = day === 0 ? -6 : 1 - day
  nextDate.setDate(nextDate.getDate() + diff)
  nextDate.setHours(0, 0, 0, 0)
  return nextDate
}

export const addDays = (date: Date, amount: number) => {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + amount)
  return nextDate
}

export const getWeekLabel = (date: Date) => {
  const start = getStartOfWeek(date)
  const end = addDays(start, 6)

  const sameMonth = start.getMonth() === end.getMonth()
  const sameYear = start.getFullYear() === end.getFullYear()

  if (sameMonth && sameYear) {
    return `${new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric' }).format(start)} – ${new Intl.DateTimeFormat('en-US', { day: 'numeric' }).format(end)}`
  }

  return `${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(start)} – ${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(end)}`
}
