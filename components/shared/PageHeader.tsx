'use client'

interface PageHeaderProps {
  title: string
  children?: React.ReactNode
}

/**
 * 页面标题，可选附带 tabs 等控件
 * children 会与标题在同一行显示
 */
export function PageHeader({ title, children }: PageHeaderProps) {
  if (!children) {
    return <h1 className="page-title">{title}</h1>
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px' }}>
      <h1 className="page-title" style={{ marginBottom: 0 }}>
        {title}
      </h1>
      {children}
    </div>
  )
}
