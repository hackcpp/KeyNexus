import type { Metadata } from 'next'
import './globals.css'
import { ClientLayout } from '@/components/ClientLayout'

export const metadata: Metadata = {
  title: 'SoloBiz - 一人公司系统',
  description: '密钥管理 · 账本记账 · 一站式管理',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>◆</text></svg>',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
