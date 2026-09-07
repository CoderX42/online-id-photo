import { NextResponse } from 'next/server'
import { expireOrderIfNeeded, getOrder, markOrderClosed } from '@/lib/payment/db'

export const runtime = 'nodejs'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const found = await getOrder(id)
    if (!found) return NextResponse.json({ error: '订单不存在' }, { status: 404 })
    const order = await expireOrderIfNeeded(found)
    if (!order) return NextResponse.json({ error: '订单不存在' }, { status: 404 })
    return NextResponse.json({ orderId: order.id, status: order.status, amountCents: order.amount_cents, expiresAt: order.expires_at })
  } catch (error) {
    console.error('查询支付订单失败', error)
    return NextResponse.json({ error: '查询订单失败' }, { status: 503 })
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const order = await markOrderClosed(id)
    return NextResponse.json({ orderId: id, status: order?.status ?? 'closed' })
  } catch (error) {
    console.error('关闭支付订单失败', error)
    return NextResponse.json({ error: '关闭订单失败' }, { status: 503 })
  }
}
