import { addDays, getStartOfWeek, getWeekLabel } from '../lib/time'

type CalendarHeaderProps = {
  today: Date
  weekStart: Date
  onWeekChange: (update: (current: Date) => Date) => void
  onLock: () => void
}

export function CalendarHeader({ today, weekStart, onWeekChange, onLock }: CalendarHeaderProps) {
  return (
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
          onClick={() => onWeekChange((current) => addDays(current, -7))}
        >
          ‹
        </button>

        <button type="button" className="today-button" onClick={() => onWeekChange(() => getStartOfWeek(today))}>
          This week
        </button>

        <div className="month-pill">{getWeekLabel(weekStart)}</div>

        <button
          type="button"
          className="nav-button"
          aria-label="Next week"
          onClick={() => onWeekChange((current) => addDays(current, 7))}
        >
          ›
        </button>

        <button type="button" className="secondary-button" onClick={onLock}>
          Lock poll
        </button>
      </div>
    </header>
  )
}
