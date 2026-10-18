import { useMemo, useState } from 'react'
import { AuthScreen } from './components/AuthScreen'
import { AvailabilityModal } from './components/AvailabilityModal'
import { CalendarHeader } from './components/CalendarHeader'
import { WeeklyCalendar } from './components/WeeklyCalendar'
import { useAvailability } from './hooks/useAvailability'
import { useUsers } from './hooks/useUsers'
import {
  deleteAvailabilityDay,
  deleteAvailabilityEntry,
  deleteAvailabilitySlot,
  saveDayAvailability,
} from './lib/availabilityApi'
import { getColorForName, getFullName } from './lib/staff'
import { hasSupabaseConfig, supabase } from './lib/supabase'
import { addDays, formatDateLabel, formatHourLabel, getStartOfWeek, normalizeSlotValue, toISODate } from './lib/time'
import type { AvailabilityItem, UserRecord } from './types'
import './App.css'

const describeSaveError = (error: unknown) => {
  // Supabase errors are plain objects with a `message`, not Error instances.
  const message =
    error && typeof error === 'object' && 'message' in error ? String(error.message) : String(error ?? '')
  const isMissingTable =
    message.includes('Could not find the table') || message.includes('PGRST205') || message.includes('does not exist')

  return isMissingTable
    ? 'The Supabase table is missing in this environment. Run the SQL in supabase/schema.sql in your dev project first.'
    : `The change could not be saved. Supabase error: ${message || 'Please review the Supabase setup and try again.'}`
}

function App() {
  const today = new Date()
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [weekStart, setWeekStart] = useState(getStartOfWeek(today))
  const [selectedDate, setSelectedDate] = useState<string | null>(toISODate(today))
  const [selectedHour, setSelectedHour] = useState<number | null>(null)
  const [selectedSlots, setSelectedSlots] = useState<number[]>([])
  const [status, setStatus] = useState('Choose a date and add a time slot to mark your availability.')
  const [modalOpen, setModalOpen] = useState(false)

  const { users, selectedUserId, setSelectedUserId } = useUsers()
  const { availabilityByDate, loading, refreshAvailability } = useAvailability(weekStart, setStatus)

  const weekDays = useMemo(() => Array.from({ length: 5 }, (_, index) => addDays(weekStart, index)), [weekStart])
  const selectedUser = users.find((user) => user.id === selectedUserId) ?? users[0] ?? null
  const currentUserName = getFullName(selectedUser)
  const selectedDateEntries = selectedDate ? (availabilityByDate[selectedDate] ?? []) : []

  const getSavedSlots = (date: string, user: UserRecord | null) => {
    if (!user) {
      return []
    }

    const fullName = getFullName(user)
    return (availabilityByDate[date] ?? [])
      .filter((item) => item.name === fullName)
      .map((item) => normalizeSlotValue(item.hour))
      .sort((left, right) => left - right)
  }

  const toggleSelectedSlot = (slot: number) => {
    setSelectedSlots((current) => {
      if (current.includes(slot)) {
        return current.filter((currentSlot) => currentSlot !== slot)
      }

      return [...current, slot].sort((left, right) => left - right)
    })
    setSelectedHour(slot)
  }

  const handleDayClick = (date: Date) => {
    const isoDate = toISODate(date)
    setSelectedDate(isoDate)
    setSelectedHour(null)
    setSelectedSlots(getSavedSlots(isoDate, selectedUser))
    setModalOpen(true)
  }

  const handleDayHeaderClick = (date: Date) => {
    setSelectedDate(toISODate(date))
    setSelectedSlots([])
  }

  const handleUserChange = (userId: string | null) => {
    setSelectedUserId(userId)

    if (selectedDate) {
      setSelectedSlots(getSavedSlots(selectedDate, users.find((user) => user.id === userId) ?? null))
    }
  }

  const handleSaveAvailability = async () => {
    if (!selectedDate) {
      setStatus('Select a date before saving your availability.')
      return
    }

    const activeUser = selectedUser ?? users[0] ?? null
    if (!activeUser) {
      setStatus('Select a staff member before saving availability.')
      return
    }

    const trimmedName = getFullName(activeUser)
    if (!trimmedName) {
      setStatus('Add a name before saving availability.')
      return
    }

    const activeHour = selectedHour ?? selectedSlots[selectedSlots.length - 1] ?? null
    if (activeHour !== null) {
      setSelectedHour(activeHour)
    }

    if (!hasSupabaseConfig || !supabase) {
      setStatus('Supabase is not configured yet. Add your environment variables to make changes.')
      return
    }

    try {
      await saveDayAvailability(supabase, {
        name: trimmedName,
        date: selectedDate,
        slots: selectedSlots,
        color: activeUser.color || getColorForName(trimmedName),
      })

      const savedSlotsText = selectedSlots.map((slot) => formatHourLabel(slot)).join(', ')

      setStatus(
        selectedSlots.length > 0
          ? `Saved ${trimmedName} for ${formatDateLabel(selectedDate)} at ${savedSlotsText}.`
          : `Cleared ${trimmedName}'s availability for ${formatDateLabel(selectedDate)}.`,
      )
      setModalOpen(false)
      await refreshAvailability()
    } catch (error) {
      console.error('Availability save failed:', error)
      setStatus(describeSaveError(error))
    }
  }

  const handleDeleteAvailability = async (entry: AvailabilityItem) => {
    if (!supabase) {
      return
    }

    try {
      await deleteAvailabilityEntry(supabase, entry.id)

      if (entry.name === currentUserName) {
        const removedSlot = normalizeSlotValue(entry.hour)
        setSelectedSlots((current) => current.filter((slot) => slot !== removedSlot))
      }

      await refreshAvailability()
      setStatus(`Removed ${entry.name} from ${formatDateLabel(entry.date)} at ${formatHourLabel(entry.hour)}.`)
    } catch (error) {
      console.error(error)
      setStatus('The availability could not be removed.')
    }
  }

  const handleDeleteCurrentUserSlot = async () => {
    if (!selectedDate || !selectedUser || !supabase || selectedHour === null) {
      return
    }

    try {
      await deleteAvailabilitySlot(supabase, currentUserName, selectedDate, selectedHour)

      setSelectedSlots((current) => current.filter((slot) => slot !== selectedHour))
      await refreshAvailability()
      setStatus(`Removed ${currentUserName} from ${formatDateLabel(selectedDate)} at ${formatHourLabel(selectedHour)}.`)
    } catch (error) {
      console.error(error)
      setStatus('Your saved time could not be removed.')
    }
  }

  const handleDeleteCurrentUserDate = async () => {
    if (!selectedDate || !selectedUser || !supabase) {
      return
    }

    try {
      await deleteAvailabilityDay(supabase, currentUserName, selectedDate)

      setSelectedHour(null)
      setSelectedSlots([])
      await refreshAvailability()
      setStatus(`Removed all of ${currentUserName}'s availability for ${formatDateLabel(selectedDate)}.`)
    } catch (error) {
      console.error(error)
      setStatus('Your saved availability for this day could not be removed.')
    }
  }

  const handleLock = async () => {
    if (hasSupabaseConfig && supabase) {
      await supabase.auth.signOut().catch(() => undefined)
    }
    setIsUnlocked(false)
  }

  if (!isUnlocked) {
    return (
      <AuthScreen
        onUnlock={(message) => {
          setIsUnlocked(true)
          setStatus(message)
        }}
      />
    )
  }

  return (
    <main className="app-shell">
      <CalendarHeader today={today} weekStart={weekStart} onWeekChange={setWeekStart} onLock={handleLock} />

      <section className="controls-panel">
        <div className="status-badge" aria-live="polite">
          {loading ? 'Loading calendar…' : status}
        </div>
      </section>

      <WeeklyCalendar
        today={today}
        weekDays={weekDays}
        selectedDate={selectedDate}
        selectedHour={selectedHour}
        availabilityByDate={availabilityByDate}
        onDayHeaderClick={handleDayHeaderClick}
        onSlotClick={handleDayClick}
      />

      {modalOpen && selectedDate ? (
        <AvailabilityModal
          date={selectedDate}
          dateEntries={selectedDateEntries}
          users={users}
          selectedUserId={selectedUserId}
          currentUserName={currentUserName}
          selectedSlots={selectedSlots}
          selectedHour={selectedHour}
          onUserChange={handleUserChange}
          onToggleSlot={toggleSelectedSlot}
          onSetSlots={setSelectedSlots}
          onDeleteEntry={handleDeleteAvailability}
          onDeleteMySlot={handleDeleteCurrentUserSlot}
          onDeleteMyDay={handleDeleteCurrentUserDate}
          onClose={() => setModalOpen(false)}
          onSave={handleSaveAvailability}
        />
      ) : null}
    </main>
  )
}

export default App
