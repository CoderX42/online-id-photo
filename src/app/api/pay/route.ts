import { NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { createNativeOrder, queryOrder, closeOrder } from '@/lib/payment/wechat'

const PAY_TIMEOUT_MS = 5 * 60 * 1000 // 5 分钟过期

const orders = new Map<string, {
  amount: number
  status: 'pending' | 'paid' | 'expired'
  codeUrl: string | null
  createdAt: number
}>()

function gid(): string {
  return `ZJ${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase()
}

/** 清理过期订单 */
function cleanExpired() {
  const now = Date.now()
  for (const [id, o] of orders) {
    if (o.status === 'pending' && now - o.createdAt > PAY_TIMEOUT_MS) {
      o.status = 'expired'
      if (o.codeUrl) closeOrder(id).catch(() => {})
    }
  }
}

/** POST /api/pay — 创建支付订单，返回二维码 SVG */
export async function POST(request: Request) {
  try {
    const { amount } = await request.json()
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: '金额无效' }, { status: 400 })
    }

    cleanExpired()
    const orderId = gid()

    // 尝试微信支付
    let qrSvg: string | null = null
    let wxOk = false
    try {
      const codeUrl = await createNativeOrder(orderId, amount, '证件照下载')
      qrSvg = await QRCode.toString(codeUrl, {
        type: 'svg',
        width: 200,
        margin: 2,
        color: { dark: '#3d2b1f', light: '#ffffff' },
      })
      wxOk = true
    } catch (e) {
      console.warn('微信支付创建失败，降级手动模式:', e)
    }

    orders.set(orderId, {
      amount,
      status: 'pending',
      codeUrl: wxOk ? 'wechat' : null,
      createdAt: Date.now(),
    })

    return NextResponse.json({
      orderId,
      amount,
      qrSvg,        // null = 手动模式（显示静态收款码）
      wxConfigured: wxOk,
    })
  } catch (error) {
    console.error('创建订单失败:', error)
    return NextResponse.json({ error: '创建订单失败' }, { status: 500 })
  }
}

/** GET /api/pay?id=xxx — 查询支付状态 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const orderId = searchParams.get('id')
  if (!orderId) return NextResponse.json({ error: '缺少订单ID' }, { status: 400 })

  const order = orders.get(orderId)
  if (!order) return NextResponse.json({ error: '订单不存在' }, { status: 404 })

  // 检查过期
  if (order.status === 'pending' && Date.now() - order.createdAt > PAY_TIMEOUT_MS) {
    order.status = 'expired'
    if (order.codeUrl) closeOrder(orderId).catch(() => {})
    return NextResponse.json({ orderId, status: 'expired', amount: order.amount })
  }

  // 向微信查询
  if (order.status === 'pending' && order.codeUrl) {
    try {
      const s = await queryOrder(orderId)
      if (s === 'paid') order.status = 'paid'
      else if (s === 'closed') order.status = 'expired'
    } catch { /* 查询失败保持 pending */ }
  }

  return NextResponse.json({ orderId, status: order.status, amount: order.amount })
}
