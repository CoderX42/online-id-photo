'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Check, LoaderCircle, X, Clock } from 'lucide-react'
import Image from 'next/image'

const AMOUNT = 0.50
const POLL_MS = 3000
const TIMEOUT_MINUTES = 5

type Stage = 'loading' | 'qrcode' | 'paid' | 'expired' | 'error'

type PayModalProps = { open: boolean; onClose: () => void; onPaid: () => void }

export default function PayModal({ open, onClose, onPaid }: PayModalProps) {
  const [stage, setStage] = useState<Stage>('loading')
  const [orderId, setOrderId] = useState('')
  const [qrSvg, setQrSvg] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(TIMEOUT_MINUTES * 60)
  const pollRef = useRef<ReturnType<typeof window.setInterval>>(undefined)
  const countdownRef = useRef<ReturnType<typeof window.setInterval>>(undefined)

  const startPolling = useCallback((id: string) => {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/pay?id=${id}`)
        const data = await res.json()
        if (data.status === 'paid') {
          stopTimers()
          setStage('paid')
          setTimeout(onPaid, 1000)
        } else if (data.status === 'expired') {
          stopTimers()
          setStage('expired')
        }
      } catch { /* retry on next poll */ }
    }, POLL_MS)
  }, [onPaid])

  const stopTimers = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = undefined }
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = undefined }
  }, [])

  // Init order on open
  useEffect(() => {
    if (!open) return
    setStage('loading')
    setError('')
    setCountdown(TIMEOUT_MINUTES * 60)

    const init = async () => {
      try {
        const res = await fetch('/api/pay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: AMOUNT }),
        })
        const data = await res.json()
        if (data.error) throw new Error(data.error)

        setOrderId(data.orderId)
        setQrSvg(data.qrSvg)
        setStage('qrcode')

        // Start countdown
        countdownRef.current = setInterval(() => {
          setCountdown((c) => {
            if (c <= 1) { setStage('expired'); stopTimers(); return 0 }
            return c - 1
          })
        }, 1000)

        if (data.wxConfigured) startPolling(data.orderId)
      } catch (err) {
        setError(err instanceof Error ? err.message : '创建订单失败')
        setStage('error')
      }
    }

    init()
    return stopTimers
  }, [open, startPolling, stopTimers])

  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(61,43,31,0.5)] backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-[var(--shadow-lg)] max-w-sm w-full p-6 text-center animate-fade-up relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 p-1 rounded-lg hover:bg-gray-100 text-[var(--ink-muted)]">
          <X size={18} />
        </button>

        {/* Loading */}
        {stage === 'loading' && (
          <div className="py-10">
            <LoaderCircle className="spin mx-auto mb-3 text-[var(--terracotta)]" size={32} />
            <p className="text-sm text-[var(--ink-muted)]">正在创建支付订单…</p>
          </div>
        )}

        {/* QR Code */}
        {stage === 'qrcode' && (
          <>
            <h2 className="text-lg font-bold mb-1">微信扫码支付</h2>
            <p className="text-sm text-[var(--ink-muted)] mb-4">
              <span className="text-[var(--terracotta)] font-bold text-xl">¥{AMOUNT.toFixed(2)}</span>
              <span className="mx-2">·</span>
              高清无水印证件照
            </p>

            {/* QR container */}
            <div className="w-52 h-52 mx-auto mb-3 rounded-xl border border-[var(--border)] bg-white flex items-center justify-center overflow-hidden">
              {qrSvg ? (
                <div dangerouslySetInnerHTML={{ __html: qrSvg }} className="[&>svg]:w-full [&>svg]:h-full" />
              ) : (
                <div className="text-center text-[var(--ink-muted)]">
                  <Image
                    src="/pay-qr.png"
                    alt="收款码"
                    width={190}
                    height={190}
                    className="object-contain"
                    onError={(e) => {
                      const el = e.target as HTMLImageElement
                      el.style.display = 'none'
                      el.parentElement!.innerHTML = '<span class="text-4xl">📱</span><p class="text-[11px] mt-1 text-[var(--ink-faint)]">将收款码保存为<br/>public/pay-qr.png</p>'
                    }}
                  />
                </div>
              )}
            </div>

            {/* Order info */}
            <p className="text-[10px] text-[var(--ink-faint)] mb-4">
              订单 {orderId.slice(-8)}
              <span className="mx-2">·</span>
              <span className="inline-flex items-center gap-1"><Clock size={11} />{fmtTime(countdown)}</span>
            </p>

            {/* Manual confirm button */}
            {!qrSvg ? (
              <button
                onClick={() => { stopTimers(); setStage('paid'); setTimeout(onPaid, 1000) }}
                className="w-full h-11 flex items-center justify-center gap-2 bg-[var(--olive)] text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
              >
                <Check size={17} /> 已完成支付，开始下载
              </button>
            ) : (
              <button
                onClick={() => startPolling(orderId)}
                className="w-full h-9 text-[12px] text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors"
              >
                已付款？点此刷新
              </button>
            )}
          </>
        )}

        {/* Paid */}
        {stage === 'paid' && (
          <div className="py-8">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-green-100 grid place-items-center">
              <Check size={28} className="text-green-600" />
            </div>
            <p className="font-bold text-lg">支付成功</p>
            <p className="text-sm text-[var(--ink-muted)]">正在准备下载…</p>
          </div>
        )}

        {/* Expired */}
        {stage === 'expired' && (
          <div className="py-6">
            <p className="text-sm text-[var(--ink-muted)] mb-4">订单已过期，请重新创建</p>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm hover:bg-gray-50"
            >
              关闭
            </button>
          </div>
        )}

        {/* Error */}
        {stage === 'error' && (
          <div className="py-6">
            <p className="text-sm text-red-600 mb-4">{error}</p>
            <button onClick={onClose} className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm">关闭</button>
          </div>
        )}
      </div>
    </div>
  )
}
