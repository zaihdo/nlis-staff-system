import { getCompactName } from '../lib/staff'
import { DAY_NAMES, HALF_HOUR_SLOTS, formatDateLabel, formatHourLabel, normalizeSlotValue, toISODate } from '../lib/time'
import type { AvailabilityItem } from '../types'

type WeeklyCalendarProps = {
  today: Date
  weekDays: Date[]
  selectedDate: string | null
  selectedHour: number | null
  availabilityByDate: Record<string, AvailabilityItem[]>
  onDayHeaderClick: (day: Date) => void
  onSlotClick: (day: Date) => void
}

export function WeeklyCalendar({
  today,
  weekDays,
  selectedDate,
  selectedHour,
  availabilityByDate,
  onDayHeaderClick,
  onSlotClick,
}: WeeklyCalendarProps) {
  const todayIso = toISODate(today)

  return (
    <section className="calendar-card weekly-calendar">
      <div className="weekly-grid" role="grid" aria-label="Weekly availability calendar">
        <div className="time-header">Time</div>

        {weekDays.map((day) => {
          const isoDate = toISODate(day)
          const isToday = isoDate === todayIso
          const isActive = selectedDate === isoDate

          return (
            <button
              key={isoDate}
              type="button"
              className={`weekday-header ${isToday ? 'today' : ''} ${isActive ? 'active' : ''}`}
              onClick={() => onDayHeaderClick(day)}
              aria-label={`Select ${formatDateLabel(isoDate)}`}
            >
              <span>{DAY_NAMES[day.getDay()]}</span>
              <strong>{day.getDate()}</strong>
            </button>
          )
        })}

        <div className="hour-column">
          {HALF_HOUR_SLOTS.map((slot) => (
            <div key={`time-${slot}`} className="time-row">
              {formatHourLabel(slot)}
            </div>
          ))}
        </div>

        {weekDays.map((day) => {
          const isoDate = toISODate(day)
          const entries = availabilityByDate[isoDate] ?? []

          return (
            <div key={`${isoDate}-column`} className={`day-column ${selectedDate === isoDate ? 'selected-day' : ''}`}>
              {HALF_HOUR_SLOTS.map((slot) => {
                const slotEntries = entries.filter((entry) => normalizeSlotValue(entry.hour) === slot)
                const isSelected = selectedDate === isoDate && selectedHour === slot

                return (
                  <button
                    key={`${isoDate}-${slot}`}
                    type="button"
                    className={`slot-cell ${isSelected ? 'selected' : ''}`}
                    onClick={() => onSlotClick(day)}
                  >
                    {slotEntries.length > 0 ? (
                      <div className="slot-badges">
                        {slotEntries.map((entry) => (
                          <span
                            key={`${entry.id}-${slot}`}
                            className="name-pill"
                            style={{ background: `${entry.color}22`, color: entry.color, borderColor: `${entry.color}66` }}
                          >
                            {getCompactName(entry.name)}
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
  )
}
