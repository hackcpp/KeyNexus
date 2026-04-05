'use client'

interface MonthPickerProps {
  year: number
  month: number
  onChange: (year: number, month: number) => void
}

export function MonthPicker({ year, month, onChange }: MonthPickerProps) {
  const prev = () => {
    if (month === 1) onChange(year - 1, 12)
    else onChange(year, month - 1)
  }

  const next = () => {
    if (month === 12) onChange(year + 1, 1)
    else onChange(year, month + 1)
  }

  return (
    <div className="month-picker">
      <button type="button" className="btn btn-ghost" onClick={prev}>
        ◀
      </button>
      <span className="month-picker-label">
        {year}年{month}月
      </span>
      <button type="button" className="btn btn-ghost" onClick={next}>
        ▶
      </button>
    </div>
  )
}
