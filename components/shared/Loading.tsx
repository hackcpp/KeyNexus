'use client'

interface LoadingProps {
  text?: string
}

export function Loading({ text }: LoadingProps) {
  return (
    <div className="loading">
      <div className="loading-spinner" />
      {text && <p style={{ color: 'var(--text-muted)' }}>{text}</p>}
    </div>
  )
}
