import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { hasSupabaseConfig, supabase } from './lib/supabase'
import './App.css'

type AvailabilityItem = {
  id: string
  date: string
  hour: number
  name: string
  color: string
  user_id?: string | null
  created_at?: string
}

type UserRecord = {
  id: string
  first_name: string
  last_name: string
  color: string
}

const HOURS = Array.from({ length: 7 }, (_, index) => 8 + index)
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
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

const DEFAULT_USERS: UserRecord[] = [
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

const toISODate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatDateLabel = (dateString: string) => {
  const date = new Date(`${dateString}T00:00:00`)
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

const formatHourLabel = (hour: number) => {
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const normalizedHour = hour % 12 || 12
  return `${normalizedHour}:00 ${suffix}`
}

const getStartOfWeek = (date: Date) => {
  const nextDate = new Date(date)
  const day = nextDate.getDay()
  const diff = day === 0 ? -6 : 1 - day
  nextDate.setDate(nextDate.getDate() + diff)
  nextDate.setHours(0, 0, 0, 0)
  return nextDate
}

const addDays = (date: Date, amount: number) => {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + amount)
  return nextDate
}

const getWeekLabel = (date: Date) => {
  const start = getStartOfWeek(date)
  const end = addDays(start, 6)

  const sameMonth = start.getMonth() === end.getMonth()
  const sameYear = start.getFullYear() === end.getFullYear()

  if (sameMonth && sameYear) {
    return `${new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric' }).format(start)} – ${new Intl.DateTimeFormat('en-US', { day: 'numeric' }).format(end)}`
  }

  return `${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(start)} – ${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(end)}`
}

const getColorForName = (name: string) => {
  const normalized = name.trim()
  if (!normalized) {
    return '#94a3b8'
  }

  const total = [...normalized].reduce((sum, character) => sum + character.charCodeAt(0), 0)
  return PALETTE[total % PALETTE.length]
}

function App() {
  const today = new Date()
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [authMode, setAuthMode] = useState<'staff' | 'admin'>('staff')
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [adminEmail, setAdminEmail] = useState(import.meta.env.VITE_SUPABASE_AUTH_EMAIL ?? '')
  const [adminPassword, setAdminPassword] = useState(import.meta.env.VITE_SUPABASE_AUTH_PASSWORD ?? '')
  const [adminError, setAdminError] = useState('')
  const [adminLoading, setAdminLoading] = useState(false)
  const [weekStart, setWeekStart] = useState(getStartOfWeek(today))
  const [selectedDate, setSelectedDate] = useState<string | null>(toISODate(today))
  const [selectedHour, setSelectedHour] = useState<number>(8)
  const [status, setStatus] = useState('Choose a date and add a time slot to mark your availability.')
  const [availability, setAvailability] = useState<AvailabilityItem[]>([])
  const [users, setUsers] = useState<UserRecord[]>(DEFAULT_USERS)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(DEFAULT_USERS[0]?.id ?? null)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  const requiredPassword = import.meta.env.VITE_POLL_PASSWORD ?? 'staff-pass'
  const hasAdminAuth = Boolean(import.meta.env.VITE_SUPABASE_AUTH_EMAIL && import.meta.env.VITE_SUPABASE_AUTH_PASSWORD)
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart])
  const selectedUser = users.find((user) => user.id === selectedUserId) ?? users[0] ?? null

  const availabilityByDate = useMemo(() => {
    const entries: Record<string, AvailabilityItem[]> = {}

    availability.forEach((item) => {
      if (!entries[item.date]) {
        entries[item.date] = []
      }
      entries[item.date].push(item)
    })

    return entries
  }, [availability])

  const selectedDateEntriesByHour = useMemo(() => {
    if (!selectedDate) {
      return {} as Record<number, AvailabilityItem[]>
    }

    const grouped: Record<number, AvailabilityItem[]> = {}
    const items = availabilityByDate[selectedDate] ?? []

    items.forEach((item) => {
      if (!grouped[item.hour]) {
        grouped[item.hour] = []
      }
      grouped[item.hour].push(item)
    })

    return grouped
  }, [availabilityByDate, selectedDate])

  const selectedHourEntries = selectedDateEntriesByHour[selectedHour] ?? []

  useEffect(() => {
    const loadUsers = async () => {
      if (!hasSupabaseConfig || !supabase) {
        setUsers(DEFAULT_USERS)
        setSelectedUserId(DEFAULT_USERS[0]?.id ?? null)
        return
      }

      try {
        const { data, error } = await supabase.from('users').select('*').order('last_name', { ascending: true })

        if (error) {
          throw error
        }

        if (data && data.length > 0) {
          const nextUsers = data as UserRecord[]
          setUsers(nextUsers)
          setSelectedUserId((current) => {
            if (current && nextUsers.some((user) => user.id === current)) {
              return current
            }

            return nextUsers[0]?.id ?? null
          })
          return
        }

        setUsers(DEFAULT_USERS)
        setSelectedUserId(DEFAULT_USERS[0]?.id ?? null)
      } catch (error) {
        console.error(error)
        setUsers(DEFAULT_USERS)
        setSelectedUserId(DEFAULT_USERS[0]?.id ?? null)
      }
    }

    void loadUsers()
  }, [])

  useEffect(() => {
    const loadAvailability = async () => {
      if (!hasSupabaseConfig) {
        setAvailability([])
        setStatus('Add your Supabase credentials in .env.local to enable live data storage.')
        setLoading(false)
        return
      }

      try {
        if (!supabase) {
          setAvailability([])
          setLoading(false)
          return
        }

        const yearStart = `${weekStart.getFullYear()}-01-01`
        const nextYearStart = `${weekStart.getFullYear() + 1}-01-01`
        const { data, error } = await supabase.from('availability').select('*').gte('date', yearStart).lt('date', nextYearStart)

        if (error) {
          throw error
        }

        setAvailability(data ?? [])
      } catch (error) {
        console.error(error)
        setStatus('The availability board could not load. Check the Supabase table and keys.')
      } finally {
        setLoading(false)
      }
    }

    void loadAvailability()
  }, [weekStart])

  const handleUnlock = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (password === requiredPassword) {
      setIsUnlocked(true)
      setPasswordError('')
      setStatus('Password accepted. Please choose a date and add your availability.')
      return
    }

    setPasswordError('Incorrect password. Please try again.')
  }

  const handleAdminSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!hasSupabaseConfig || !supabase) {
      setAdminError('Supabase is not configured yet. Add your auth credentials in .env.local.')
      return
    }

    if (!adminEmail.trim() || !adminPassword.trim()) {
      setAdminError('Enter both an email and a password to continue.')
      return
    }

    setAdminLoading(true)
    setAdminError('')

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: adminEmail.trim(),
        password: adminPassword,
      })

      if (error) {
        throw error
      }

      setIsUnlocked(true)
      setStatus('Admin sign in successful. You can now manage the availability calendar.')
    } catch (error) {
      console.error(error)
      setAdminError('Unable to sign in with Supabase Auth. Check the admin email and password.')
    } finally {
      setAdminLoading(false)
    }
  }

  const refreshAvailability = async () => {
    if (!hasSupabaseConfig || !supabase) {
      return
    }

    const yearStart = `${weekStart.getFullYear()}-01-01`
    const nextYearStart = `${weekStart.getFullYear() + 1}-01-01`
    const { data, error } = await supabase.from('availability').select('*').gte('date', yearStart).lt('date', nextYearStart)

    if (error) {
      throw error
    }

    setAvailability(data ?? [])
  }

  const handleDayClick = (date: Date, hour = 8) => {
    const isoDate = toISODate(date)
    setSelectedDate(isoDate)
    setSelectedHour(hour)
    setModalOpen(true)
  }

  const handleSaveAvailability = async () => {
    if (!selectedDate) {
      return
    }

    const activeUser = selectedUser ?? users[0] ?? null
    if (!activeUser) {
      setStatus('Select a staff member before saving availability.')
      return
    }

    const trimmedName = `${activeUser.first_name} ${activeUser.last_name}`.trim()
    if (!trimmedName) {
      setStatus('Add a name before saving availability.')
      return
    }

    if (!hasSupabaseConfig) {
      setStatus('Supabase is not configured yet. Add your environment variables to make changes.')
      return
    }

    if (!supabase) {
      setStatus('Supabase is not configured yet. Add your environment variables to make changes.')
      return
    }

    const color = activeUser.color || getColorForName(trimmedName)

    try {
      const { error } = await supabase.from('availability').upsert(
        {
          name: trimmedName,
          date: selectedDate,
          hour: selectedHour,
          color,
        },
        { onConflict: 'name,date,hour' },
      )

      if (error) {
        throw error
      }

      setStatus(`Saved ${trimmedName} for ${formatDateLabel(selectedDate)} at ${formatHourLabel(selectedHour)}.`)
      setModalOpen(false)
      await refreshAvailability()
    } catch (error) {
      console.error(error)

      const message = error instanceof Error ? error.message : String(error ?? '')
      const isMissingTable =
        message.includes('Could not find the table') || message.includes('PGRST205') || message.includes('does not exist')

      setStatus(
        isMissingTable
          ? 'The Supabase table is missing in this environment. Run the SQL in supabase/schema.sql in your dev project first.'
          : 'The change could not be saved. Please review the Supabase setup and try again.',
      )
    }
  }

  const handleDeleteAvailability = async (entry: AvailabilityItem) => {
    if (!supabase) {
      return
    }

    try {
      const { error } = await supabase.from('availability').delete().eq('id', entry.id)

      if (error) {
        throw error
      }

      await refreshAvailability()
      setStatus(`Removed ${entry.name} from ${formatDateLabel(entry.date)} at ${formatHourLabel(entry.hour)}.`)
    } catch (error) {
      console.error(error)
      setStatus('The availability could not be removed.')
    }
  }

  if (!isUnlocked) {
    return (
      <main className="auth-screen">
        <div className="auth-card">
          <p className="eyebrow">Staff availability</p>
          <h1>Access the calendar</h1>

          <div className="auth-switcher">
            <button
              type="button"
              className={authMode === 'staff' ? 'switch-button active' : 'switch-button'}
              onClick={() => setAuthMode('staff')}
            >
              Staff access
            </button>
            <button
              type="button"
              className={authMode === 'admin' ? 'switch-button active' : 'switch-button'}
              onClick={() => setAuthMode('admin')}
              disabled={!hasAdminAuth}
            >
              Admin sign in
            </button>
          </div>

          {authMode === 'staff' ? (
            <form onSubmit={handleUnlock} className="auth-form">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Type the access password"
              />

              {passwordError ? <p className="error-text">{passwordError}</p> : null}

              <button type="submit" className="primary-button">
                Unlock poll
              </button>
            </form>
          ) : (
            <form onSubmit={handleAdminSignIn} className="auth-form">
              <label htmlFor="admin-email">Email</label>
              <input
                id="admin-email"
                type="email"
                value={adminEmail}
                onChange={(event) => setAdminEmail(event.target.value)}
                placeholder="admin@example.com"
              />

              <label htmlFor="admin-password">Password</label>
              <input
                id="admin-password"
                type="password"
                value={adminPassword}
                onChange={(event) => setAdminPassword(event.target.value)}
                placeholder="Type your admin password"
              />

              {adminError ? <p className="error-text">{adminError}</p> : null}

              <button type="submit" className="primary-button" disabled={adminLoading}>
                {adminLoading ? 'Signing in…' : 'Sign in with Supabase'}
              </button>
            </form>
          )}
        </div>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Calendar poll</p>
          <h1>Staff availability</h1>
        </div>

        <div className="toolbar">
          <button
            type="button"
            className="nav-button"
            aria-label="Previous week"
            onClick={() => setWeekStart((current) => addDays(current, -7))}
          >
            ‹
          </button>

          <button
            type="button"
            className="today-button"
            onClick={() => setWeekStart(getStartOfWeek(today))}
          >
            This week
          </button>

          <div className="month-pill">{getWeekLabel(weekStart)}</div>

          <button
            type="button"
            className="nav-button"
            aria-label="Next week"
            onClick={() => setWeekStart((current) => addDays(current, 7))}
          >
            ›
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={async () => {
              if (hasSupabaseConfig && supabase) {
                await supabase.auth.signOut().catch(() => undefined)
              }
              setIsUnlocked(false)
            }}
          >
            Lock poll
          </button>
        </div>
      </header>

      <section className="controls-panel">
        <div className="status-badge" aria-live="polite">
          {loading ? 'Loading calendar…' : status}
        </div>
      </section>

      <section className="calendar-card weekly-calendar">
        <div className="weekly-grid" role="grid" aria-label="Weekly availability calendar">
          <div className="time-header">Time</div>

          {weekDays.map((day) => {
            const isoDate = toISODate(day)
            const isToday = isoDate === toISODate(today)
            const isActive = selectedDate === isoDate

            return (
              <div key={isoDate} className={`weekday-header ${isToday ? 'today' : ''} ${isActive ? 'active' : ''}`}>
                <span>{DAY_NAMES[day.getDay()]}</span>
                <strong>{day.getDate()}</strong>
              </div>
            )
          })}

          <div className="hour-column">
            {HOURS.map((hour) => (
              <div key={`time-${hour}`} className="time-row">
                {formatHourLabel(hour)}
              </div>
            ))}
          </div>

          {weekDays.map((day) => {
            const isoDate = toISODate(day)
            const entries = availabilityByDate[isoDate] ?? []

            return (
              <div key={`${isoDate}-column`} className={`day-column ${selectedDate === isoDate ? 'selected-day' : ''}`}>
                {HOURS.map((hour) => {
                  const hourEntries = entries.filter((entry) => entry.hour === hour)
                  const isSelected = selectedDate === isoDate && selectedHour === hour

                  return (
                    <button
                      key={`${isoDate}-${hour}`}
                      type="button"
                      className={`slot-cell ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleDayClick(day, hour)}
                    >
                      {hourEntries.length > 0 ? (
                        <div className="slot-badges">
                          {hourEntries.map((entry) => (
                            <span
                              key={`${entry.id}-${hour}`}
                              className="name-pill"
                              style={{ background: `${entry.color}22`, color: entry.color, borderColor: `${entry.color}66` }}
                            >
                              {entry.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="empty-slot-label">+</span>
                      )}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </section>

      {modalOpen && selectedDate ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Add availability</p>
                <h2>{formatDateLabel(selectedDate)}</h2>
              </div>

              <button type="button" className="close-button" onClick={() => setModalOpen(false)}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <label className="name-input">
                <span>Staff member</span>
                <select
                  value={selectedUserId ?? ''}
                  onChange={(event) => setSelectedUserId(event.target.value || null)}
                >
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.first_name} {user.last_name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="time-picker">
                <span>Choose a time</span>
                <div className="time-grid">
                  {HOURS.map((hour) => {
                    const isSelected = selectedHour === hour
                    const hourMatches = selectedDateEntriesByHour[hour] ?? []

                    return (
                      <button
                        key={hour}
                        type="button"
                        className={`time-button ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedHour(hour)}
                      >
                        <span>{formatHourLabel(hour)}</span>
                        {hourMatches.length > 0 ? <small>{hourMatches.length}</small> : null}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="slot-summary">
                <span>Staff scheduled for this time</span>
                <div className="slot-people">
                  {selectedHourEntries.length > 0 ? (
                    selectedHourEntries.map((entry) => (
                      <div key={entry.id} className="slot-person">
                        <span className="slot-color" style={{ background: entry.color }} />
                        <span>{entry.name}</span>
                        <button type="button" className="remove-person" onClick={() => handleDeleteAvailability(entry)}>
                          Remove
                        </button>
                      </div>
                    ))
                  ) : (
                    <span className="empty-slot-text">No one saved for this slot yet.</span>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button type="button" className="primary-button" onClick={handleSaveAvailability}>
                Save availability
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}

export default App
