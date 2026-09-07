'use client'

import { useEffect, useState } from 'react'
import { Check, Clock3, QrCode, ShieldCheck } from 'lucide-react'

const AMOUNT = '¥0.50'

export default function PayPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [order, setOrder] = useState<{ id: string; qrSvg: string; status: string } | null>(null)
  const createOrder = async () => {
    setLoading(true); setError('')
    try { const res = await fetch('/api/pay/orders', { method: 'POST' }); const data = await res.json(); if (!res.ok || data.error) throw new Error(data.error || '创建订单失败'); setOrder({ id: data.orderId, qrSvg: data.qrSvg, status: 'pending' }) }
    catch (e) { setError(e instanceof Error ? e.message : '创建订单失败') } finally { setLoading(false) }
  }
  useEffect(() => { if (!order || order.status !== 'pending') return; const timer = window.setInterval(async () => { const res = await fetch(`/api/pay/orders/${order.id}`); if (!res.ok) return; const data = await res.json(); if (data.status !== 'pending') setOrder((current) => current ? { ...current, status: data.status } : current) }, 3000); return () => window.clearInterval(timer) }, [order])
  return <div className="max-w-[880px] mx-auto py-16 px-5"><div className="text-center mb-10"><span className="stamp">安全支付</span><h1 className="mt-4 text-3xl font-extrabold tracking-tight">导出高清证件照</h1><p className="text-[var(--ink-muted)] mt-2">一次支付，解锁本次 JPG、PNG、排版照和 ZIP 导出</p></div><div className="grid md:grid-cols-[1fr_0.9fr] gap-6 max-w-3xl mx-auto"><div className="paper-card p-7"><p className="text-sm text-[var(--ink-muted)]">单次导出权益</p><p className="text-4xl font-black mt-2">{AMOUNT}</p><ul className="mt-7 space-y-4 text-sm">{['高清无水印 JPG / PNG', '5 寸、6 寸、A4 排版照', '热门尺寸 ZIP 打包', '照片仍在浏览器本地处理'].map((item) => <li key={item} className="flex gap-2 items-center"><Check size={17} className="text-[var(--olive)]" />{item}</li>)}</ul></div><div className="paper-card p-7 text-center">{order?.status === 'paid' ? <div className="py-8"><ShieldCheck size={42} className="mx-auto text-[var(--olive)]" /><h2 className="font-bold text-xl mt-3">支付成功</h2><p className="text-sm text-[var(--ink-muted)] mt-2">返回工作台即可继续导出</p></div> : order?.status === 'pending' ? <><h2 className="font-bold">微信扫码支付</h2><div className="qr-box mt-5" dangerouslySetInnerHTML={{ __html: order.qrSvg }} /><p className="text-xs text-[var(--ink-muted)] mt-4 inline-flex gap-1 items-center"><Clock3 size={13} />订单状态自动刷新</p></> : <><QrCode size={36} className="mx-auto text-[var(--terracotta)]" /><h2 className="font-bold mt-3">准备好后再付款</h2><button onClick={createOrder} disabled={loading} className="btn-primary mt-6 w-full justify-center">{loading ? '创建订单中…' : '创建支付订单 · ¥0.50'}</button></>}{error && <p className="text-sm text-red-600 mt-4">{error}</p>}<p className="text-[11px] text-[var(--ink-muted)] mt-5">当前支付方式需要电脑打开微信扫码；手机可先制作，之后在电脑完成导出。</p></div></div></div>
}
