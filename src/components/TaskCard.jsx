import { Trash2, ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react'

const fmtShort = s => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function TaskCard({ task, color, onDelete, onMoveLeft, onMoveRight }) {
  return (
    <div className="task-card">
      <span className="task-bar" style={{ background: color }} />

      <div className="task-body">
        <span className="task-text">{task.text}</span>
        <div className="task-tags">
          {task.rolledFrom && (
            <span className="rollover-tag" title={`Originally from ${fmtShort(task.rolledFrom)}`}>
              <RotateCcw size={10} />
              {fmtShort(task.rolledFrom)}
            </span>
          )}
        </div>
      </div>

      <div className="task-actions">
        {onMoveLeft && (
          <button className="taction" onClick={onMoveLeft} title="Move back">
            <ArrowLeft size={12} />
          </button>
        )}
        {onMoveRight && (
          <button className="taction" onClick={onMoveRight} title="Move forward">
            <ArrowRight size={12} />
          </button>
        )}
        <button className="taction del" onClick={onDelete} title="Delete">
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  )
}
