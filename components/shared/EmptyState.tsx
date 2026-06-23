'use client'

interface EmptyStateProps {
  children: React.ReactNode
}

export function EmptyState({ children }: EmptyStateProps) {
  return <div className="empty-state">{children}</div>
}
