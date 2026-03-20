import { useState } from 'react'
import { Plus } from 'lucide-react'
import TaskCard from './TaskCard'

const PRIORITIES = ['first', 'later', 'much later']

export default function Column({ label, color, tasks, onAdd, onDelete, onMoveLeft, onMoveRight, showPriority }) {
  const [val, setVal] = useState('')
  const [priority, setPriority] = useState('later')

  function submit() {
    if (!val.trim()) return
    onAdd(val.trim(), priority)
    setVal('')
  }

  return (
    <div className="col">
      <div className="col-head">
        <div className="col-title-row">
          <span className="col-dot" style={{ background: color }} />
          <span className="col-title">{label}</span>
        </div>
        <span className="col-badge" style={{ color, background: `${color}1a` }}>
          {tasks.length}
        </span>
      </div>

      <div className="col-body">
        {tasks.length === 0
          ? <p className="col-empty">No tasks yet</p>
          : tasks.map(t => (
              <TaskCard
                key={t.id}
                task={t}
                color={color}
                onDelete={() => onDelete(t.id)}
                onMoveLeft={onMoveLeft   ? () => onMoveLeft(t.id)  : null}
                onMoveRight={onMoveRight ? () => onMoveRight(t.id) : null}
              />
            ))
        }
      </div>

      <div className="col-add">
        {showPriority && (
          <div className="priority-row">
            {PRIORITIES.map(p => (
              <button
                key={p}
                type="button"
                className={`priority-btn priority-${p.replace(/ /g, '-')}${priority === p ? ' active' : ''}`}
                onClick={() => setPriority(p)}
              >
                {p}
              </button>
            ))}
          </div>
        )}
        <div className="col-add-row">
          <input
            className="col-input"
            value={val}
            onChange={e => setVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="Add a task…"
          />
          <button
            className="col-btn"
            style={{ background: color }}
            onClick={submit}
            aria-label="Add task"
          >
            <Plus size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
