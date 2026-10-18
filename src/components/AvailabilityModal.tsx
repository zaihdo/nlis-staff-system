import { useMemo } from 'react'
import { getCompactName } from '../lib/staff'
import { HALF_HOUR_SLOTS, formatDateLabel, formatHourLabel, normalizeSlotValue } from '../lib/time'
import type { AvailabilityItem, UserRecord } from '../types'

type AvailabilityModalProps = {
  date: string
  dateEntries: AvailabilityItem[]
  users: UserRecord[]
  selectedUserId: string | null
  currentUserName: string
  selectedSlots: number[]
  selectedHour: number | null
  onUserChange: (userId: string | null) => void
  onToggleSlot: (slot: number) => void
  onSetSlots: (slots: number[]) => void
  onDeleteEntry: (entry: AvailabilityItem) => void
  onDeleteMySlot: () => void
  onDeleteMyDay: () => void
  onClose: () => void
  onSave: () => void
}

export function AvailabilityModal({
  date,
  dateEntries,
  users,
  selectedUserId,
  currentUserName,
  selectedSlots,
  selectedHour,
  onUserChange,
  onToggleSlot,
  onSetSlots,
  onDeleteEntry,
  onDeleteMySlot,
  onDeleteMyDay,
  onClose,
  onSave,
}: AvailabilityModalProps) {
  const entriesBySlot = useMemo(() => {
    const grouped: Record<number, AvailabilityItem[]> = {}

    dateEntries.forEach((item) => {
      const slotValue = normalizeSlotValue(item.hour)

      if (!grouped[slotValue]) {
        grouped[slotValue] = []
      }
      grouped[slotValue].push(item)
    })

    return grouped
  }, [dateEntries])

  const selectedHourEntries = selectedHour === null ? [] : (entriesBySlot[selectedHour] ?? [])
  const hasOwnSlotAtHour = selectedHourEntries.some((entry) => entry.name === currentUserName)
  const hasOwnEntriesForDate = dateEntries.some((entry) => entry.name === currentUserName)

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Add availability</p>
            <h2>{formatDateLabel(date)}</h2>
          </div>

          <button type="button" className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <label className="name-input">
            <span>Staff member</span>
            <select value={selectedUserId ?? ''} onChange={(event) => onUserChange(event.target.value || null)}>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.first_name} {user.last_name}
                </option>
              ))}
            </select>
          </label>

          <div className="time-picker">
            <div className="time-picker-header">
              <span>Choose a time</span>
              <div className="time-picker-actions">
                <button type="button" className="ghost-button" onClick={() => onSetSlots(HALF_HOUR_SLOTS)}>
                  Select all
                </button>
                <button type="button" className="ghost-button" onClick={() => onSetSlots([])}>
                  Clear
                </button>
              </div>
            </div>
            <div className="time-grid">
              {HALF_HOUR_SLOTS.map((slot) => {
                const isSelected = selectedSlots.includes(slot)
                const slotMatches = entriesBySlot[slot] ?? []

                return (
                  <button
                    key={slot}
                    type="button"
                    className={`time-button ${isSelected ? 'selected' : ''}`}
                    onClick={() => onToggleSlot(slot)}
                  >
                    <span>{formatHourLabel(slot)}</span>
                    {slotMatches.length > 0 ? <small>{slotMatches.length}</small> : null}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="slot-summary">
            <div className="slot-summary-header">
              <span>Staff scheduled for this time</span>
              <div className="time-picker-actions">
                {hasOwnSlotAtHour ? (
                  <button type="button" className="ghost-button" onClick={onDeleteMySlot}>
                    Delete my time
                  </button>
                ) : null}
                {hasOwnEntriesForDate ? (
                  <button type="button" className="ghost-button" onClick={onDeleteMyDay}>
                    Delete my day
                  </button>
                ) : null}
              </div>
            </div>
            <div className="slot-people">
              {selectedHourEntries.length > 0 ? (
                selectedHourEntries.map((entry) => (
                  <div key={entry.id} className="slot-person">
                    <span className="slot-color" style={{ background: entry.color }} />
                    <span>{getCompactName(entry.name)}</span>
                    <button type="button" className="remove-person" onClick={() => onDeleteEntry(entry)}>
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
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="primary-button" onClick={onSave}>
            Save availability
          </button>
        </div>
      </div>
    </div>
  )
}
