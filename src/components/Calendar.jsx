import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]
const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa']

export default function Calendar({ selected, onSelect, datesWithTasks, today }) {
  const [view, setView] = useState(() => {
    const [y, m] = selected.split('-').map(Number)
    return { y, m: m - 1 }
  })

  const prev = () => setView(v => v.m === 0  ? { y: v.y - 1, m: 11 } : { ...v, m: v.m - 1 })
  const next = () => setView(v => v.m === 11 ? { y: v.y + 1, m: 0  } : { ...v, m: v.m + 1 })

  const { y, m }  = view
  const firstDay  = new Date(y, m, 1).getDay()
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const dk = d => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  return (
    <div className="cal">
      <div className="cal-nav">
        <button className="cal-arrow" onClick={prev} aria-label="Previous month">
          <ChevronLeft size={14} />
        </button>
        <span className="cal-title">{MONTHS[m]} {y}</span>
        <button className="cal-arrow" onClick={next} aria-label="Next month">
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="cal-grid">
        {DAYS.map(d => <div key={d} className="cal-dn">{d}</div>)}
        {Array.from({ length: firstDay }, (_, i) => <div key={`_${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const key = dk(i + 1)
          const isSel   = key === selected
          const isToday = key === today
          const hasTasks = datesWithTasks.includes(key)
          return (
            <button
              key={key}
              className={`cal-day${isSel ? ' sel' : ''}${isToday ? ' now' : ''}`}
              onClick={() => onSelect(key)}
              aria-label={`${i + 1} ${MONTHS[m]} ${y}`}
              aria-pressed={isSel}
            >
              {i + 1}
              {hasTasks && <i className="cal-dot" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
