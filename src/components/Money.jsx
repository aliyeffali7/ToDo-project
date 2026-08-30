import { useState, useEffect, useCallback } from 'react'
import { Wallet, CalendarDays, CheckSquare, X, LogOut } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Calendar from './Calendar'
import MoneyColumn from './MoneyColumn'
import {
  toKey, mapTx, weekRange, inWeek, inMonth, sum,
  fmtAmount, fmtRange, fmtMonth, fmtFull, CATEGORIES,
} from '../lib/money'

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2)

function StatBlock({ title, subtitle, income, expense }) {
  const net = income - expense
  return (
    <div className="money-stat-block">
      <div className="money-stat-head">
        <span className="money-stat-title">{title}</span>
        <span className="money-stat-sub">{subtitle}</span>
      </div>
      <div className="money-stat-grid">
        <div className="money-stat">
          <span className="money-stat-num" style={{ color: '#10b981' }}>{fmtAmount(income)}</span>
          <span className="money-stat-lbl">Gələn</span>
        </div>
        <div className="money-stat">
          <span className="money-stat-num" style={{ color: '#ef4444' }}>{fmtAmount(expense)}</span>
          <span className="money-stat-lbl">Çıxan</span>
        </div>
        <div className="money-stat">
          <span className="money-stat-num" style={{ color: net >= 0 ? '#0f172a' : '#ef4444' }}>
            {fmtAmount(net)}
          </span>
          <span className="money-stat-lbl">Qalıq</span>
        </div>
      </div>
    </div>
  )
}

export default function Money({ session, onSignOut, onSwitchToTasks }) {
  const todayKey = toKey(new Date())

  const [tx, setTx]       = useState([])
  const [sel, setSel]     = useState(todayKey)
  const [calOpen, setCalOpen] = useState(false)
  const [err, setErr]    = useState('')

  const loadTx = useCallback(async () => {
    if (!session) return
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true })
    if (error) { setErr(error.message); return }
    setErr('')
    if (data) setTx(data.map(mapTx))
  }, [session])

  useEffect(() => { loadTx() }, [loadTx])

  async function addTx(type, { amount, category, note }) {
    const row = {
      id: uid(),
      user_id: session.user.id,
      date: sel,
      type,
      amount,
      category,
      note,
    }
    setTx(p => [...p, mapTx(row)])                       // optimistic
    const { error } = await supabase.from('transactions').insert(row)
    if (error) { setErr(error.message); loadTx() }       // rollback
  }

  async function deleteTx(id) {
    setTx(p => p.filter(t => t.id !== id))               // optimistic
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) { setErr(error.message); loadTx() }       // rollback
  }

  // ── Derived ────────────────────────────────────────────────────────────
  const dayTx  = type => tx.filter(t => t.date === sel && t.type === type)
  const datesWithTx = [...new Set(tx.map(t => t.date))]

  const weekTx  = tx.filter(t => inWeek(t.date, sel))
  const monthTx = tx.filter(t => inMonth(t.date, sel))

  const weekIn   = sum(weekTx.filter(t => t.type === 'in'))
  const weekOut  = sum(weekTx.filter(t => t.type === 'out'))
  const monthIn  = sum(monthTx.filter(t => t.type === 'in'))
  const monthOut = sum(monthTx.filter(t => t.type === 'out'))

  const dayIn  = sum(dayTx('in'))
  const dayOut = sum(dayTx('out'))

  // Monthly expense breakdown by category
  const catBreakdown = CATEGORIES.out
    .map(c => ({ cat: c, total: sum(monthTx.filter(t => t.type === 'out' && t.category === c)) }))
    .filter(x => x.total > 0)
    .sort((a, b) => b.total - a.total)
  const catMax = catBreakdown.length ? catBreakdown[0].total : 0

  return (
    <div className="app">

      {/* ── Header ── */}
      <header className="header">
        <div className="header-brand">
          <Wallet size={20} className="brand-icon" />
          <span className="brand-name">Pul idarəsi</span>
        </div>

        <button className="mobile-cal-btn" onClick={() => setCalOpen(o => !o)}>
          <CalendarDays size={15} />
          <span>{fmtFull(sel)}</span>
        </button>

        <div className="header-right">
          <span className="desktop-date">{fmtFull(todayKey)}</span>
          <button className="view-toggle-btn" onClick={onSwitchToTasks} title="Tapşırıqlar">
            <CheckSquare size={14} />
            <span>Tapşırıqlar</span>
          </button>
          <button className="signout-btn" onClick={onSignOut} title="Çıxış">
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {err && (
        <div className="rollover-banner" style={{ background: '#fef2f2', borderColor: '#fecaca', color: '#b91c1c' }}>
          <span>Baza xətası: {err} — Supabase-də `transactions` cədvəli qurulub?</span>
          <button className="icon-btn" onClick={() => setErr('')}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Mobile calendar panel ── */}
      {calOpen && (
        <div className="mobile-panel">
          <div className="mobile-panel-head">
            <span>Tarix seçin</span>
            <button className="icon-btn" onClick={() => setCalOpen(false)}>
              <X size={16} />
            </button>
          </div>
          <Calendar
            selected={sel}
            onSelect={d => { setSel(d); setCalOpen(false) }}
            datesWithTasks={datesWithTx}
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
            datesWithTasks={datesWithTx}
            today={todayKey}
          />

          <div className="stats-card">
            <div className="stat">
              <span className="stat-num" style={{ color: '#10b981' }}>{fmtAmount(monthIn)}</span>
              <span className="stat-lbl">Bu ay gələn</span>
            </div>
          </div>
          <div className="stats-card">
            <div className="stat">
              <span className="stat-num" style={{ color: '#ef4444' }}>{fmtAmount(monthOut)}</span>
              <span className="stat-lbl">Bu ay çıxan</span>
            </div>
            <div className="stat-div" />
            <div className="stat">
              <span className="stat-num" style={{ color: monthIn - monthOut >= 0 ? '#0f172a' : '#ef4444' }}>
                {fmtAmount(monthIn - monthOut)}
              </span>
              <span className="stat-lbl">Qalıq</span>
            </div>
          </div>

          <div className="sidebar-user">
            <span className="sidebar-email" title={session.user.email}>
              {session.user.email}
            </span>
            <button className="signout-link" onClick={onSignOut}>Çıxış</button>
          </div>
        </aside>

        {/* ── Board ── */}
        <main className="board">
          <div className="board-head">
            <h2 className="board-title">{fmtFull(sel)}</h2>
            <div className="prog-row">
              <span className="prog-label" style={{ color: '#10b981' }}>+{fmtAmount(dayIn)}</span>
              <span className="prog-label" style={{ color: '#ef4444' }}>−{fmtAmount(dayOut)}</span>
              <span className="prog-label">Gün qalığı: {fmtAmount(dayIn - dayOut)}</span>
            </div>
          </div>

          <div className="cols money-cols">
            <MoneyColumn type="in"  entries={dayTx('in')}  onAdd={d => addTx('in', d)}  onDelete={deleteTx} />
            <MoneyColumn type="out" entries={dayTx('out')} onAdd={d => addTx('out', d)} onDelete={deleteTx} />
          </div>

          {/* ── Statistics ── */}
          <section className="money-stats">
            <h3 className="money-stats-heading">Statistika</h3>
            <div className="money-stats-row">
              <StatBlock
                title="Bu həftə"
                subtitle={fmtRange(weekRange(sel))}
                income={weekIn}
                expense={weekOut}
              />
              <StatBlock
                title="Bu ay"
                subtitle={fmtMonth(sel.slice(0, 7))}
                income={monthIn}
                expense={monthOut}
              />
            </div>

            {catBreakdown.length > 0 && (
              <div className="money-cat-breakdown">
                <span className="money-stat-title">Ay üzrə xərc bölgüsü</span>
                <div className="money-cat-list">
                  {catBreakdown.map(({ cat, total }) => (
                    <div className="money-cat-row" key={cat}>
                      <span className="money-cat-name">{cat}</span>
                      <div className="money-cat-track">
                        <div
                          className="money-cat-fill"
                          style={{ width: `${catMax ? (total / catMax) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="money-cat-val">{fmtAmount(total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </main>

      </div>
    </div>
  )
}
