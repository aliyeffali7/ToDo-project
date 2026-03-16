import { useState } from 'react'
import { Plus } from 'lucide-react'
import TaskCard from './TaskCard'

export default function Column({ label, color, tasks, onAdd, onDelete, onMoveLeft, onMoveRight }) {
  const [val, setVal] = useState('')

  function submit() {
    if (!val.trim()) return
    onAdd(val.trim())
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
  )
}
