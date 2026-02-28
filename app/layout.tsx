import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'KeyNexus - 智能密钥保险箱',
  description: '安全的云端密钥管理工具',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
