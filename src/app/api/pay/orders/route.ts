import { NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { createNativeOrder } from '@/lib/payment/wechat'
import { createOrder, getOrder, newOrderId, expireOrderIfNeeded, markOrderClosed } from '@/lib/payment/db'

export const runtime = 'nodejs'
const AMOUNT_CENTS = 50

export async function POST() {
  try {
    const orderId = newOrderId()
    await createOrder(orderId, AMOUNT_CENTS)
    let codeUrl: string
    try {
      codeUrl = await createNativeOrder(orderId, AMOUNT_CENTS, '照见证件照导出')
    } catch (error) {
      await markOrderClosed(orderId)
      throw error
    }
    const qrSvg = await QRCode.toString(codeUrl, { type: 'svg', width: 220, margin: 2, color: { dark: '#3d2b1f', light: '#ffffff' } })
    const order = await getOrder(orderId)
    return NextResponse.json({ orderId, amountCents: AMOUNT_CENTS, qrSvg, expiresAt: order?.expires_at })
  } catch (error) {
    console.error('创建支付订单失败', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : '创建支付订单失败' }, { status: 503 })
  }
}

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: '缺少订单号' }, { status: 400 })
  try {
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

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: '缺少订单号' }, { status: 400 })
  try {
    const order = await markOrderClosed(id)
    return NextResponse.json({ orderId: id, status: order?.status ?? 'closed' })
  } catch (error) {
    console.error('关闭支付订单失败', error)
    return NextResponse.json({ error: '关闭订单失败' }, { status: 503 })
  }
}
