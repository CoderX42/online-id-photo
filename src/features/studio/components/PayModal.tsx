'use client'

import { useState, useEffect, useRef } from 'react'
import { Check, LoaderCircle, X } from 'lucide-react'
import Image from 'next/image'

type PayModalProps = {
  open: boolean
  onClose: () => void
  onPaid: () => void
}

type Stage = 'loading' | 'qrcode' | 'paid' | 'error'

const AMOUNT = 0.50
const POLL_INTERVAL = 3000 // 3 秒轮询一次

export default function PayModal({ open, onClose, onPaid }: PayModalProps) {
  const [stage, setStage] = useState<Stage>('loading')
  const [orderId, setOrderId] = useState('')
  const [payUrl, setPayUrl] = useState('')
  const [error, setError] = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval>>(undefined)

  // 创建订单
  useEffect(() => {
    if (!open) return
    setStage('loading')
    setError('')

    const createOrder = async () => {
      try {
        const res = await fetch('/api/pay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: AMOUNT }),
        })
        const data = await res.json()
        if (data.error) throw new Error(data.error)

        setOrderId(data.orderId)
        setPayUrl(data.payUrl)
        setStage('qrcode')

        // 非手动模式：开始轮询支付状态
        if (data.payUrl !== 'manual') {
          startPolling(data.orderId)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '创建订单失败')
        setStage('error')
      }
    }

    createOrder()

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [open])

  const startPolling = (id: string) => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/pay?id=${id}`)
        const data = await res.json()
        if (data.status === 'paid') {
          clearInterval(pollRef.current)
          setStage('paid')
          setTimeout(() => onPaid(), 800)
        }
      } catch {
        // 轮询失败静默重试
      }
    }, POLL_INTERVAL)
  }

  const handleManualConfirm = () => {
    setStage('paid')
    setTimeout(() => onPaid(), 800)
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(61,43,31,0.5)] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-[var(--shadow-lg)] max-w-sm w-full p-6 text-center animate-fade-up relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 rounded-lg hover:bg-gray-100 text-[var(--ink-muted)]"
        >
          <X size={18} />
        </button>

        {/* 加载中 */}
        {stage === 'loading' && (
          <div className="py-8">
            <LoaderCircle className="spin mx-auto mb-3" size={32} />
            <p className="text-sm text-[var(--ink-muted)]">正在创建支付订单…</p>
          </div>
        )}

        {/* 支付二维码 */}
        {stage === 'qrcode' && (
          <>
            <h2 className="text-lg font-bold mb-1">微信/支付宝扫码支付</h2>
            <p className="text-[13px] text-[var(--ink-muted)] mb-1">
              ¥{AMOUNT.toFixed(2)} · 高清无水印证件照
            </p>
            <p className="text-[11px] text-[var(--ink-faint)] mb-5">
              订单号: {orderId}
            </p>

            {/* 二维码区域 */}
            <div className="w-48 h-48 mx-auto mb-4 rounded-xl border border-[var(--border)] bg-white flex items-center justify-center overflow-hidden">
              {payUrl === 'manual' ? (
                <div className="text-center text-[var(--ink-muted)]">
                  <Image
                    src="/pay-qr.png"
                    alt="收款码"
                    width={180}
                    height={180}
                    className="object-contain"
                    onError={(e) => {
                      const el = e.target as HTMLImageElement
                      el.style.display = 'none'
                      el.parentElement!.innerHTML = '<span class="text-4xl">📱</span><p class="text-xs mt-1">请将收款码保存为<br/>public/pay-qr.png</p>'
                    }}
                  />
                </div>
              ) : (
                <Image
                  src={payUrl}
                  alt="微信支付二维码"
                  width={180}
                  height={180}
                  className="object-contain"
                  unoptimized
                />
              )}
            </div>

            {/* 操作按钮 */}
            {payUrl === 'manual' ? (
              <button
                onClick={handleManualConfirm}
                className="w-full h-11 flex items-center justify-center gap-2 bg-[var(--olive)] text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
              >
                <Check size={17} /> 已完成支付，开始下载
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-[13px] text-[var(--olive)]">
                  <LoaderCircle className="spin" size={14} />
                  等待微信支付确认…<br />
                  <span className="text-[11px] text-[var(--ink-faint)]">支付成功后自动下载</span>
                </div>
                <button
                  onClick={() => startPolling(orderId)}
                  className="w-full h-9 text-[12px] text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors"
                >
                  已支付？点击刷新状态
                </button>
              </div>
            )}

            <p className="mt-4 text-[10px] text-[var(--ink-faint)]">
              支付遇到问题？请截图联系客服
            </p>
          </>
        )}

        {/* 支付成功 */}
        {stage === 'paid' && (
          <div className="py-6">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-green-100 grid place-items-center">
              <Check size={28} className="text-green-600" />
            </div>
            <p className="font-bold text-lg">支付成功</p>
            <p className="text-sm text-[var(--ink-muted)]">正在准备下载…</p>
          </div>
        )}

        {/* 错误 */}
        {stage === 'error' && (
          <div className="py-6">
            <p className="text-sm text-red-600 mb-3">{error}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm"
            >
              关闭
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
