// ── Helpers for the money-management (Pul idarəsi) view ───────────────────

export const toKey = d =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const parseKey = s => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// Supabase → camelCase for the UI
export const mapTx = t => ({ ...t, createdAt: t.created_at })

// Monday-based week that contains dateKey → ['YYYY-MM-DD', 'YYYY-MM-DD']
export function weekRange(dateKey) {
  const d = parseKey(dateKey)
  const offset = (d.getDay() + 6) % 7 // 0 = Monday
  const start = new Date(d)
  start.setDate(d.getDate() - offset)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return [toKey(start), toKey(end)]
}

export const inWeek = (dateKey, refKey) => {
  const [a, b] = weekRange(refKey)
  return dateKey >= a && dateKey <= b
}

export const inMonth = (dateKey, refKey) => dateKey.slice(0, 7) === refKey.slice(0, 7)

export const sum = arr => arr.reduce((n, t) => n + Number(t.amount), 0)

const signed = t => (t.type === 'in' ? 1 : -1) * Number(t.amount)

// Running balance: cumulative (gələn − çıxan) over every transaction on or before dateKey
export const balanceThrough = (txs, dateKey) =>
  txs.reduce((n, t) => (t.date > dateKey ? n : n + signed(t)), 0)

// Balance carried into dateKey — everything strictly before it (previous day's closing balance)
export const balanceBefore = (txs, dateKey) =>
  txs.reduce((n, t) => (t.date < dateKey ? n + signed(t) : n), 0)

export const fmtAmount = n =>
  Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 }) + ' ₼'

export const fmtRange = ([a, b]) => {
  const opt = { day: 'numeric', month: 'short' }
  return `${parseKey(a).toLocaleDateString('az-AZ', opt)} – ${parseKey(b).toLocaleDateString('az-AZ', opt)}`
}

export const fmtMonth = key =>
  parseKey(key + '-01').toLocaleDateString('az-AZ', { month: 'long', year: 'numeric' })

export const fmtFull = key =>
  parseKey(key).toLocaleDateString('az-AZ', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

// Predefined categories per direction
export const CATEGORIES = {
  in: ['Maaş', 'Servo', 'Sayt', 'Əlavə iş', 'Satış', 'Hədiyyə', 'Faiz', 'Digər'],
  out: ['Yemək', 'Nəqliyyat', 'Kirayə', 'Kommunal', 'Alış-veriş', 'Proyekt', 'Əyləncə', 'Sağlamlıq', 'Təhsil', 'Digər'],
}

export const TYPE_CONFIG = {
  in: { label: 'Gələn pul', color: '#10b981' },
  out: { label: 'Çıxan pul', color: '#ef4444' },
}
