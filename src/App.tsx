import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { hasSupabaseConfig, supabase } from './lib/supabase'
import './App.css'

type DayName = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'

type AvailabilityItem = {
  id: string
  name: string
  day: DayName
  slot: string
  color: string
  created_at?: string
}

type SlotDefinition = {
  start: string
  end: string
}

const DAYS: DayName[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const SLOT_DEFINITIONS: SlotDefinition[] = [
  { start: '08:30', end: '09:30' },
  { start: '09:30', end: '10:30' },
  { start: '10:30', end: '11:30' },
  { start: '11:30', end: '12:30' },
  { start: '12:30', end: '13:30' },
  { start: '13:00', end: '14:00' },
]

const PALETTE = [
  '#2563eb',
  '#16a34a',
  '#dc2626',
  '#7c3aed',
  '#ea580c',
  '#0891b2',
  '#e11d48',
  '#65a30d',
  '#f59e0b',
  '#0f766e',
]

const toDisplayTime = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number)
  const suffix = hours >= 12 ? 'pm' : 'am'
  const normalizedHours = hours % 12 || 12

  return `${normalizedHours}:${String(minutes).padStart(2, '0')}${suffix}`
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
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [name, setName] = useState('')
  const [status, setStatus] = useState('Choose a name and click any slot to mark your availability.')
  const [availability, setAvailability] = useState<AvailabilityItem[]>([])
  const [selection, setSelection] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)

  const requiredPassword = import.meta.env.VITE_POLL_PASSWORD ?? 'staff-pass'

  useEffect(() => {
    const loadAvailability = async () => {
      if (!hasSupabaseConfig) {
        setAvailability([])
        setStatus('Add your Supabase credentials in .env.local to enable live data storage.')
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase.from('availability').select('*')

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
  }, [])

  useEffect(() => {
    if (!name.trim()) {
      setSelection({})
      return
    }

    const nextSelection: Record<string, boolean> = {}

    availability
      .filter((item) => item.name.trim().toLowerCase() === name.trim().toLowerCase())
      .forEach((item) => {
        nextSelection[`${item.day}|${item.slot}`] = true
      })

    setSelection(nextSelection)
  }, [name, availability])

  const slotAssignments = useMemo(() => {
    const assignments: Record<string, AvailabilityItem[]> = {}

    availability.forEach((item) => {
      const key = `${item.day}|${item.slot}`
      if (!assignments[key]) {
        assignments[key] = []
      }
      assignments[key].push(item)
    })

    return assignments
  }, [availability])

  const handleUnlock = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (password === requiredPassword) {
      setIsUnlocked(true)
      setPasswordError('')
      setStatus('Password accepted. Please add your name and update your availability.')
      return
    }

    setPasswordError('Incorrect password. Please try again.')
  }

  const refreshAvailability = async () => {
    if (!hasSupabaseConfig) {
      return
    }

    const { data, error } = await supabase.from('availability').select('*')

    if (error) {
      throw error
    }

    setAvailability(data ?? [])
  }

  const handleToggleSlot = async (day: DayName, slot: string) => {
    const trimmedName = name.trim()

    if (!trimmedName) {
      setStatus('Enter your name first so your availability can be saved.')
      return
    }

    if (!hasSupabaseConfig) {
      setStatus('Supabase is not configured yet. Add your environment variables to make changes.')
      return
    }

    const key = `${day}|${slot}`
    const isSelected = Boolean(selection[key])
    const color = getColorForName(trimmedName)

    try {
      if (isSelected) {
        const { error } = await supabase
          .from('availability')
          .delete()
          .eq('name', trimmedName)
          .eq('day', day)
          .eq('slot', slot)

        if (error) {
          throw error
        }

        setStatus(`Removed ${trimmedName} from ${day} ${toDisplayTime(slot)}.`)
      } else {
        const { error } = await supabase.from('availability').upsert(
          { name: trimmedName, day, slot, color },
          { onConflict: 'name,day,slot' },
        )

        if (error) {
          throw error
        }

        setStatus(`Saved ${trimmedName} for ${day} ${toDisplayTime(slot)}.`)
      }

      await refreshAvailability()
    } catch (error) {
      console.error(error)
      setStatus('The change could not be saved. Please review the Supabase setup and try again.')
    }
  }

  if (!isUnlocked) {
    return (
      <main className="auth-screen">
        <div className="auth-card">
          <p className="eyebrow">Staff availability</p>
          <h1>Enter the poll password</h1>

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
        </div>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Weekly poll</p>
          <h1>Staff availability</h1>
        </div>

        <button type="button" className="secondary-button" onClick={() => setIsUnlocked(false)}>
          Lock poll
        </button>
      </header>

      <section className="controls-panel">
        <div className="name-field">
          <label htmlFor="staff-name">Your name</label>
          <input
            id="staff-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Jordan"
          />
        </div>

        <div className="status-badge" aria-live="polite">
          {loading ? 'Loading availability…' : status}
        </div>
      </section>

      <section className="calendar-card">
        <div className="calendar-table" role="grid" aria-label="Staff availability calendar">
          <div className="calendar-header">
            <div className="time-heading">Time</div>
            {DAYS.map((day) => (
              <div key={day} className="day-heading">
                {day}
              </div>
            ))}
          </div>

          {SLOT_DEFINITIONS.map((slot) => (
            <div key={`${slot.start}-${slot.end}`} className="calendar-row">
              <div className="time-cell">
                <span>{toDisplayTime(slot.start)}</span>
                <small>{toDisplayTime(slot.end)}</small>
              </div>

              {DAYS.map((day) => {
                const key = `${day}|${slot.start}`
                const isSelected = Boolean(selection[key])
                const people = slotAssignments[key] ?? []

                return (
                  <button
                    key={`${day}-${slot.start}`}
                    type="button"
                    className={`slot-button ${isSelected ? 'selected' : ''}`}
                    aria-pressed={isSelected}
                    onClick={() => handleToggleSlot(day, slot.start)}
                  >
                    <div className="slot-content">
                      {people.length > 0 ? (
                        <>
                          <div className="staff-pills">
                            {people.slice(0, 3).map((person) => (
                              <span
                                key={`${person.id}-${person.name}`}
                                className="staff-pill"
                                style={{ background: person.color }}
                              >
                                {person.name}
                              </span>
                            ))}
                          </div>
                          {people.length > 3 ? <span className="more-pill">+{people.length - 3}</span> : null}
                        </>
                      ) : (
                        <span className="empty-slot-text">Click to add</span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}

export default App
