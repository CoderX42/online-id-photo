import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import './globals.css'

export const metadata: Metadata = {
  title: '照见 · 在线证件照 — 免费无水印 智能抠图换底',
  description: '免费在线证件照制作工具，AI 智能抠图、一键换底色、适配所有常用尺寸。照片处理完全在浏览器本地完成，不上传服务器，保护你的肖像隐私。',
  keywords: ['证件照', '在线证件照', '免费证件照', '智能抠图', '换底色', '一寸照', '二寸照', '排版照'],
  openGraph: {
    title: '照见 · 在线证件照',
    description: '免费无水印，智能抠图换底，所有处理在浏览器本地完成。',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&family=Noto+Serif+SC:wght@500;600;700;900&family=Oswald:wght@500;600&family=ZCOOL+KuaiLe&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen flex flex-col bg-[#f4f1e9]">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
