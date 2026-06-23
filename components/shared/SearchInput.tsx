'use client'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchInput({ value, onChange, placeholder = '搜索...' }: SearchInputProps) {
  return (
    <input
      type="text"
      className="input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        maxWidth: '220px',
        fontSize: '12px',
        borderRadius: '999px',
      }}
    />
  )
}
