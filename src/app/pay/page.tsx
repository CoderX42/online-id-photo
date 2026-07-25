'use client'

import { useState } from 'react'
import { Check, Crown, ShieldCheck } from 'lucide-react'

const FEATURES = [
  '全部 {22} 种标准尺寸',
  '标准导出（JPG / PNG，无水印）',
  '高清原分辨率导出',
  '排版照（5寸 / 6寸 / A4）',
  '多尺寸一键打包 ZIP',
  '自定义尺寸云端收藏',
]

export default function PayPage() {
  const [loading, setLoading] = useState(false)
  const [qrCode, setQrCode] = useState<string>('')

  const createOrder = async () => {
    setLoading(true)
    try {
      // This will use ManualProvider until WeChat Pay is configured
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 1990 }), // ¥19.90
      })
      const data = await res.json()
      if (data.id) {
        // In production, this would redirect to /pay?order=xxx with a QR code
        // For now, show manual activation message
        setQrCode('manual')
      }
    } catch {
      // Silently handle
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-[900px] mx-auto py-16 px-5">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#d7eb78] mb-5">
          <Crown size={32} className="text-[#17201e]" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">升级付费会员</h1>
        <p className="text-[#6d736e] mt-2 max-w-md mx-auto">
          解锁全部功能：高清导出、排版照、多尺寸打包、云端收藏
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
        {/* Free tier */}
        <div className="p-8 border border-black/10 rounded-2xl bg-white">
          <h2 className="text-lg font-bold mb-2">免费版</h2>
          <p className="text-3xl font-extrabold mb-6">¥0 <span className="text-sm font-normal text-[#6d736e]">/ 永久</span></p>
          <ul className="space-y-3">
            {FEATURES.slice(0, 2).map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm">
                <Check size={16} className="text-green-600 flex-shrink-0" /> {f}
              </li>
            ))}
          </ul>
          <div className="mt-6 pt-4 border-t border-black/5">
            {FEATURES.slice(2).map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-[#a0a5a2] mt-2">
                <span className="w-4 h-4 flex-shrink-0 rounded-full border border-[#d0d5d2]" /> {f}
              </li>
            ))}
          </div>
        </div>

        {/* Premium tier */}
        <div className="p-8 border-2 border-[#2f63d7] rounded-2xl bg-white relative">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#2f63d7] text-white text-xs font-bold rounded-full">
            推荐
          </span>
          <h2 className="text-lg font-bold mb-2">付费会员</h2>
          <p className="text-3xl font-extrabold mb-6">¥19.90 <span className="text-sm font-normal text-[#6d736e]">/ 年</span></p>
          <ul className="space-y-3">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm">
                <Check size={16} className="text-[#2f63d7] flex-shrink-0" /> {f}
              </li>
            ))}
          </ul>

          {qrCode === 'manual' ? (
            <div className="mt-6 p-4 bg-[#f0fdf4] border border-green-200 rounded-lg text-center">
              <ShieldCheck size={24} className="mx-auto mb-2 text-green-600" />
              <p className="text-sm font-semibold">订单已创建</p>
              <p className="text-xs text-[#6d736e] mt-1">
                支付功能上线后，我们将通过邮件通知您完成支付。当前可免费使用全部功能。
              </p>
            </div>
          ) : (
            <button
              onClick={createOrder}
              disabled={loading}
              className="mt-6 w-full h-12 flex items-center justify-center gap-2 bg-[#2f63d7] text-white font-bold rounded-xl hover:bg-[#173572] disabled:opacity-40 transition-colors"
            >
              {loading ? '创建订单中…' : '立即升级 ¥19.90/年'}
            </button>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-[#6d736e] mt-10">
        支付由微信支付提供。会员有效期为付款之日起 365 天。
      </p>
    </div>
  )
}
