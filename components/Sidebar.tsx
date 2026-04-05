'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'

const navItems = [
  { href: '/', label: '系统总览', icon: '◈' },
  { href: '/vault', label: '密钥管理', icon: '🔐' },
  { href: '/ledger', label: '收支账本', icon: '📒' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { signOut } = useAuth()

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-logo">◆</span>
        <span className="sidebar-title">SoloBiz</span>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button className="btn btn-ghost" onClick={() => signOut()} style={{ width: '100%' }}>
          退出登录 ↗
        </button>
      </div>
    </aside>
  )
}
