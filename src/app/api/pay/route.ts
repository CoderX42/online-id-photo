import { NextResponse } from 'next/server'
import { createNativeOrder, queryOrder, codeUrlToQrImage } from '@/lib/payment/wechat'

const orders = new Map<string, { amount: number; status: 'pending' | 'paid'; createdAt: number }>()

function generateOrderId(): string {
  return `ZJ${Date.now()}${Math.random().toString(36).slice(2, 8)}`.toUpperCase()
}

/** POST /api/pay — 创建微信支付订单 */
export async function POST(request: Request) {
  try {
    const { amount } = await request.json()
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: '金额无效' }, { status: 400 })
    }

    const orderId = generateOrderId()
    orders.set(orderId, { amount, status: 'pending', createdAt: Date.now() })

    // 尝试微信支付，失败降级到手动模式
    let payUrl: string
    try {
      const { codeUrl } = await createNativeOrder({
        outTradeNo: orderId,
        amount,
        description: '证件照下载',
      })
      // 将微信 code_url 转为二维码图片
      payUrl = codeUrlToQrImage(codeUrl)
    } catch (wxError) {
      console.warn('微信支付创建订单失败，降级手动模式:', wxError)
      payUrl = 'manual'
    }

    return NextResponse.json({ orderId, amount, payUrl })
  } catch (error) {
    console.error('创建订单失败:', error)
    return NextResponse.json({ error: '创建订单失败' }, { status: 500 })
  }
}

/** GET /api/pay?id=xxx — 查询订单状态 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const orderId = searchParams.get('id')

  if (!orderId) {
    return NextResponse.json({ error: '缺少订单ID' }, { status: 400 })
  }

  const order = orders.get(orderId)
  if (!order) {
    return NextResponse.json({ error: '订单不存在' }, { status: 404 })
  }

  // 向微信查询最新状态
  if (order.status === 'pending') {
    try {
      const wxStatus = await queryOrder(orderId)
      if (wxStatus === 'paid') {
        order.status = 'paid'
        orders.set(orderId, order)
      } else if (wxStatus === 'closed') {
        return NextResponse.json({ orderId, status: 'expired', amount: order.amount })
      }
    } catch {
      // 微信查询失败时保持 pending 状态，让前端继续轮询
    }
  }

  return NextResponse.json({ orderId, status: order.status, amount: order.amount })
}
