import { useState, useEffect } from 'react'
import { CalendarDays, CheckSquare, X, RefreshCw } from 'lucide-react'
import Calendar from './components/Calendar'
import Column from './components/Column'

const COLS = ['todo', 'inprogress', 'done']

const COL_CONFIG = {
  todo:       { label: 'To Do',       color: '#64748b' },
  inprogress: { label: 'In Progress', color: '#f59e0b' },
  done:       { label: 'Done',        color: '#10b981' },
}

const MOVE_RIGHT = { todo: 'inprogress', inprogress: 'done' }
const MOVE_LEFT  = { inprogress: 'todo', done: 'inprogress' }

const toKey = d =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2)

const load = () => {
  try { return JSON.parse(localStorage.getItem('taskboard_v1') || '{}') }
  catch { return {} }
}

const fmtFull = s => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
}

// Returns { data, count } — moves all unfinished tasks from past days to today.
// Completed (done) tasks stay on their original date as a record.
function applyRollover(data, todayKey) {
  const updated = JSON.parse(JSON.stringify(data))
  let count = 0

  Object.keys(updated).forEach(dateKey => {
    if (dateKey >= todayKey) return                        // skip today & future
    const pending = [
      ...(updated[dateKey]?.todo       || []),
      ...(updated[dateKey]?.inprogress || []),
    ]
    if (pending.length === 0) return

    // Stamp each task so we know it was rolled over
    const stamped = pending.map(t => ({
      ...t,
      rolledFrom: t.rolledFrom ?? dateKey,                // keep original origin date
    }))

    if (!updated[todayKey]) updated[todayKey] = { todo: [], inprogress: [], done: [] }
    updated[todayKey].todo = [...(updated[todayKey].todo || []), ...stamped]

    // Clear the old date's unfinished columns (keep done as history)
    updated[dateKey].todo       = []
    updated[dateKey].inprogress = []
    count += pending.length
  })

  return { data: updated, count }
}

export default function App() {
  const todayKey = toKey(new Date())
  const [sel, setSel]           = useState(todayKey)
  const [data, setData]         = useState(load)
  const [calOpen, setCalOpen]   = useState(false)
  const [rolloverMsg, setRolloverMsg] = useState('')  // banner text

  // Run rollover once on mount
  useEffect(() => {
    const raw = load()
    const { data: rolled, count } = applyRollover(raw, todayKey)
    if (count > 0) {
      setData(rolled)
      setRolloverMsg(`${count} unfinished task${count > 1 ? 's' : ''} carried over from previous days`)
      const t = setTimeout(() => setRolloverMsg(''), 5000)
      return () => clearTimeout(t)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    localStorage.setItem('taskboard_v1', JSON.stringify(data))
  }, [data])

  const tasks = col => data[sel]?.[col] || []

  function addTask(col, text) {
    if (!text.trim()) return
    setData(p => ({
      ...p,
      [sel]: {
        todo: [], inprogress: [], done: [],
        ...p[sel],
        [col]: [...(p[sel]?.[col] || []), { id: uid(), text: text.trim() }],
      },
    }))
  }

  function deleteTask(col, id) {
    setData(p => ({
      ...p,
      [sel]: { ...p[sel], [col]: (p[sel]?.[col] || []).filter(t => t.id !== id) },
    }))
  }

  function moveTask(fromCol, id, toCol) {
    setData(p => {
      const task = (p[sel]?.[fromCol] || []).find(t => t.id === id)
      if (!task) return p
      return {
        ...p,
        [sel]: {
          ...p[sel],
          [fromCol]: (p[sel][fromCol] || []).filter(t => t.id !== id),
          [toCol]:   [...(p[sel]?.[toCol] || []), task],
        },
      }
    })
  }

  const allTasks    = COLS.flatMap(c => tasks(c))
  const doneTasks   = tasks('done').length
  const progress    = allTasks.length ? Math.round((doneTasks / allTasks.length) * 100) : 0
  const datesWithTasks = Object.keys(data).filter(k =>
    COLS.some(c => (data[k]?.[c] || []).length > 0)
  )

  return (
    <div className="app">

      {/* ── Header ── */}
      <header className="header">
        <div className="header-brand">
          <CheckSquare size={20} className="brand-icon" />
          <span className="brand-name">TaskBoard</span>
        </div>

        {/* Mobile: date button that opens calendar */}
        <button className="mobile-cal-btn" onClick={() => setCalOpen(o => !o)}>
          <CalendarDays size={15} />
          <span>{fmtFull(sel)}</span>
        </button>

        <span className="desktop-date">{fmtFull(todayKey)}</span>
      </header>

      {/* ── Rollover banner ── */}
      {rolloverMsg && (
        <div className="rollover-banner">
          <RefreshCw size={14} className="rollover-icon" />
          <span>{rolloverMsg}</span>
          <button className="icon-btn" onClick={() => setRolloverMsg('')}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Mobile calendar panel ── */}
      {calOpen && (
        <div className="mobile-panel">
          <div className="mobile-panel-head">
            <span>Select a date</span>
            <button className="icon-btn" onClick={() => setCalOpen(false)}>
              <X size={16} />
            </button>
          </div>
          <Calendar
            selected={sel}
            onSelect={d => { setSel(d); setCalOpen(false) }}
            datesWithTasks={datesWithTasks}
            today={todayKey}
          />
        </div>
      )}

      <div className="layout">

        {/* ── Desktop sidebar ── */}
        <aside className="sidebar">
          <Calendar
            selected={sel}
            onSelect={setSel}
            datesWithTasks={datesWithTasks}
            today={todayKey}
          />

          {allTasks.length > 0 && (
            <div className="stats-card">
              <div className="stat">
                <span className="stat-num">{allTasks.length}</span>
                <span className="stat-lbl">Total</span>
              </div>
              <div className="stat-div" />
              <div className="stat">
                <span className="stat-num" style={{ color: '#f59e0b' }}>
                  {tasks('inprogress').length}
                </span>
                <span className="stat-lbl">Active</span>
              </div>
              <div className="stat-div" />
              <div className="stat">
                <span className="stat-num" style={{ color: '#10b981' }}>
                  {doneTasks}
                </span>
                <span className="stat-lbl">Done</span>
              </div>
            </div>
          )}
        </aside>

        {/* ── Board ── */}
        <main className="board">
          <div className="board-head">
            <h2 className="board-title">{fmtFull(sel)}</h2>
            {allTasks.length > 0 && (
              <div className="prog-row">
                <div className="prog-track">
                  <div className="prog-fill" style={{ width: `${progress}%` }} />
                </div>
                <span className="prog-label">{progress}%</span>
              </div>
            )}
          </div>

          <div className="cols">
            {COLS.map(col => (
              <Column
                key={col}
                label={COL_CONFIG[col].label}
                color={COL_CONFIG[col].color}
                tasks={tasks(col)}
                onAdd={t => addTask(col, t)}
                onDelete={id => deleteTask(col, id)}
                onMoveLeft={MOVE_LEFT[col]  ? id => moveTask(col, id, MOVE_LEFT[col])  : null}
                onMoveRight={MOVE_RIGHT[col] ? id => moveTask(col, id, MOVE_RIGHT[col]) : null}
              />
            ))}
          </div>
        </main>

      </div>
    </div>
  )
}
