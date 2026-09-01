import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { CATEGORIES, TYPE_CONFIG, fmtAmount, sum } from '../lib/money'

export default function MoneyColumn({ type, entries, onAdd, onDelete }) {
  const { label, color } = TYPE_CONFIG[type]
  const cats = CATEGORIES[type]

  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(cats[0])
  const [note, setNote] = useState('')
  const [noteErr, setNoteErr] = useState(false)

  const needsName = category === 'Borc'

  function submit() {
    const value = parseFloat(String(amount).replace(',', '.'))
    if (!value || value <= 0) return
    if (needsName && !note.trim()) { setNoteErr(true); return }
    onAdd({ amount: value, category, note: note.trim() })
    setAmount('')
    setNote('')
    setNoteErr(false)
    setCategory(cats[0])
  }

  const total = sum(entries)

  return (
    <div className="col">
      <div className="col-head">
        <div className="col-title-row">
          <span className="col-dot" style={{ background: color }} />
          <span className="col-title">{label}</span>
        </div>
        <span className="col-badge" style={{ color, background: `${color}1a` }}>
          {fmtAmount(total)}
        </span>
      </div>

      <div className="col-body">
        {entries.length === 0
          ? <p className="col-empty">Qeyd yoxdur</p>
          : entries.map(e => (
              <div className="task-card" key={e.id}>
                <span className="task-bar" style={{ background: color }} />
                <div className="task-body">
                  <span className="task-text">
                    <strong className="money-amount" style={{ color }}>
                      {fmtAmount(e.amount)}
                    </strong>
                  </span>
                  <div className="task-tags">
                    <span className="money-cat">{e.category}</span>
                    {e.note && <span className="money-note">{e.note}</span>}
                  </div>
                </div>
                <div className="task-actions">
                  <button className="taction del" onClick={() => onDelete(e.id)} title="Sil">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))
        }
      </div>

      <div className="col-add">
        <div className="col-add-row">
          <input
            className="col-input"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="Məbləğ (₼)"
          />
          <button
            className="col-btn"
            style={{ background: color }}
            onClick={submit}
            aria-label="Əlavə et"
          >
            <Plus size={15} />
          </button>
        </div>
        <select
          className="col-input cat-select"
          value={category}
          onChange={e => setCategory(e.target.value)}
        >
          {cats.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input
          className="col-input"
          style={noteErr ? { borderColor: '#ef4444', boxShadow: '0 0 0 3px rgba(239,68,68,.1)' } : undefined}
          value={note}
          onChange={e => { setNote(e.target.value); if (noteErr) setNoteErr(false) }}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder={
            needsName
              ? (type === 'in' ? 'Kimdən aldın? (ad) — vacib' : 'Kimə verdin? (ad) — vacib')
              : 'Qeyd (istəyə bağlı)'
          }
        />
        {noteErr && (
          <span style={{ fontSize: '.7rem', color: '#ef4444', fontWeight: 600 }}>
            Borc üçün şəxsin adını yaz
          </span>
        )}
      </div>
    </div>
  )
}
