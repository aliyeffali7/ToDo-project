import { useState, useEffect, useCallback } from 'react'
import { CalendarDays, CheckSquare, X, RefreshCw, LogOut } from 'lucide-react'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'
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

// Supabase returns rolled_from (snake_case) → map to rolledFrom for TaskCard
const mapTask = t => ({ ...t, rolledFrom: t.rolled_from })

const fmtFull = s => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
}

export default function App() {
  const todayKey = toKey(new Date())

  const [session, setSession]         = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [tasks, setTasks]             = useState([])        // flat array from Supabase
  const [sel, setSel]                 = useState(todayKey)
  const [calOpen, setCalOpen]         = useState(false)
  const [rolloverMsg, setRolloverMsg] = useState('')

  // ── Auth state ──────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  // ── Load + rollover when signed in ──────────────────────────────────────
  const loadTasks = useCallback(async () => {
    if (!session) return
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true })
    if (data) setTasks(data.map(mapTask))
  }, [session])

  useEffect(() => {
    if (!session) return
    runRolloverThenLoad()
  }, [session]) // eslint-disable-line react-hooks/exhaustive-deps

  async function runRolloverThenLoad() {
    const count = await rollover()
    await loadTasks()
    if (count > 0) {
      setRolloverMsg(`${count} unfinished task${count > 1 ? 's' : ''} carried over from previous days`)
      const t = setTimeout(() => setRolloverMsg(''), 5000)
      return () => clearTimeout(t)
    }
  }

  async function rollover() {
    // Find all incomplete tasks from past dates
    const { data } = await supabase
      .from('tasks')
      .select('id, date, rolled_from')
      .eq('user_id', session.user.id)
      .lt('date', todayKey)
      .neq('col', 'done')

    if (!data?.length) return 0

    // Move them to today, preserving their original rolled_from date
    await Promise.all(
      data.map(t =>
        supabase.from('tasks').update({
          date:        todayKey,
          rolled_from: t.rolled_from ?? t.date,   // keep original origin
        }).eq('id', t.id)
      )
    )

    return data.length
  }

  async function signOut() {
    await supabase.auth.signOut()
    setTasks([])
    setSession(null)
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────
  async function addTask(col, text) {
    if (!text.trim()) return
    const newTask = {
      id:      uid(),
      user_id: session.user.id,
      date:    sel,
      col,
      text:    text.trim(),
    }
    setTasks(p => [...p, mapTask(newTask)])                   // optimistic
    const { error } = await supabase.from('tasks').insert(newTask)
    if (error) loadTasks()                                    // rollback
  }

  async function deleteTask(id) {
    setTasks(p => p.filter(t => t.id !== id))                // optimistic
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) loadTasks()                                    // rollback
  }

  async function moveTask(id, toCol) {
    setTasks(p => p.map(t => t.id === id ? { ...t, col: toCol } : t))   // optimistic
    const { error } = await supabase.from('tasks').update({ col: toCol }).eq('id', id)
    if (error) loadTasks()                                    // rollback
  }

  // ── Derived ──────────────────────────────────────────────────────────────
  const dayTasks = col => tasks.filter(t => t.date === sel && t.col === col)
  const allTasks  = COLS.flatMap(c => dayTasks(c))
  const doneTasks = dayTasks('done').length
  const progress  = allTasks.length ? Math.round((doneTasks / allTasks.length) * 100) : 0
  const datesWithTasks = [...new Set(tasks.map(t => t.date))]

  // ── Render ────────────────────────────────────────────────────────────────
  if (authLoading) return (
    <div className="splash">
      <div className="splash-spinner" />
    </div>
  )

  if (!session) return <Auth />

  return (
    <div className="app">

      {/* ── Header ── */}
      <header className="header">
        <div className="header-brand">
          <CheckSquare size={20} className="brand-icon" />
          <span className="brand-name">TaskBoard</span>
        </div>

        <button className="mobile-cal-btn" onClick={() => setCalOpen(o => !o)}>
          <CalendarDays size={15} />
          <span>{fmtFull(sel)}</span>
        </button>

        <div className="header-right">
          <span className="desktop-date">{fmtFull(todayKey)}</span>
          <button className="signout-btn" onClick={signOut} title="Sign out">
            <LogOut size={15} />
          </button>
        </div>
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
                  {dayTasks('inprogress').length}
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

          <div className="sidebar-user">
            <span className="sidebar-email" title={session.user.email}>
              {session.user.email}
            </span>
            <button className="signout-link" onClick={signOut}>Sign out</button>
          </div>
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
                tasks={dayTasks(col)}
                onAdd={t => addTask(col, t)}
                onDelete={id => deleteTask(id)}
                onMoveLeft={MOVE_LEFT[col]   ? id => moveTask(id, MOVE_LEFT[col])  : null}
                onMoveRight={MOVE_RIGHT[col] ? id => moveTask(id, MOVE_RIGHT[col]) : null}
              />
            ))}
          </div>
        </main>

      </div>
    </div>
  )
}
