import crypto from 'node:crypto'
import { NextResponse } from 'next/server'
import { decryptWechatResource, verifyWechatSignature } from '@/lib/payment/wechat'
import { getOrder, markOrderPaid, recordPaymentEvent } from '@/lib/payment/db'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const body = await request.text()
  const timestamp = request.headers.get('Wechatpay-Timestamp') || ''
  const nonce = request.headers.get('Wechatpay-Nonce') || ''
  const signature = request.headers.get('Wechatpay-Signature') || ''
  const serial = request.headers.get('Wechatpay-Serial') || ''
  if (!timestamp || !nonce || !signature || !serial) return NextResponse.json({ code: 'FAIL', message: '缺少签名头' }, { status: 400 })
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return NextResponse.json({ code: 'FAIL', message: '签名已过期' }, { status: 401 })

  try {
    const valid = verifyWechatSignature(`${timestamp}\n${nonce}\n${body}\n`, signature)
    if (!valid || (process.env.WECHAT_PLATFORM_SERIAL_NO && serial !== process.env.WECHAT_PLATFORM_SERIAL_NO)) throw new Error('微信回调签名无效')
    const payload = JSON.parse(body) as { id?: string; event_type?: string; resource?: { ciphertext: string; nonce: string; associated_data: string } }
    if (!payload.resource) throw new Error('缺少回调资源')
    const decrypted = JSON.parse(decryptWechatResource(payload.resource)) as { out_trade_no?: string; transaction_id?: string; trade_state?: string; amount?: { total?: number }; mchid?: string; appid?: string }
    const orderId = decrypted.out_trade_no
    if (!orderId) throw new Error('回调缺少商户订单号')
    const order = await getOrder(orderId)
    if (!order || order.amount_cents !== decrypted.amount?.total || (decrypted.mchid && decrypted.mchid !== process.env.WECHAT_MCHID) || (decrypted.appid && decrypted.appid !== process.env.WECHAT_APPID)) throw new Error('回调订单校验失败')
    const result = decrypted.trade_state === 'SUCCESS' ? 'paid' : 'ignored'
    await recordPaymentEvent({ orderId, eventType: payload.event_type || 'TRANSACTION', idempotencyKey: payload.id || `${orderId}:${decrypted.transaction_id || result}`, payloadHash: crypto.createHash('sha256').update(body).digest('hex'), result })
    if (result === 'paid') await markOrderPaid(orderId, decrypted.transaction_id || null)
    return NextResponse.json({ code: 'SUCCESS', message: '成功' })
  } catch (error) {
    console.error('微信支付回调失败', error)
    return NextResponse.json({ code: 'FAIL', message: '回调处理失败' }, { status: 400 })
  }
}
