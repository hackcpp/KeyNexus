'use client'

interface SectionHeaderProps {
  title: string
  children?: React.ReactNode
}

export function SectionHeader({ title, children }: SectionHeaderProps) {
  return (
    <div className="vault-header">
      <h2 className="vault-title">{title}</h2>
      {children && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {children}
        </div>
      )}
    </div>
  )
}
