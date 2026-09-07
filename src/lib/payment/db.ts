import crypto from 'node:crypto'
import { neon } from '@neondatabase/serverless'

export type OrderStatus = 'pending' | 'paid' | 'expired' | 'closed'

export type Order = {
  id: string
  amount_cents: number
  status: OrderStatus
  provider: string
  out_trade_no: string
  transaction_id: string | null
  created_at: string
  paid_at: string | null
  expires_at: string
}

let sqlClient: ReturnType<typeof neon> | null = null

function sql() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL 未配置，请在 Vercel 环境变量中连接 Neon Postgres')
  if (!sqlClient) sqlClient = neon(url)
  return sqlClient
}

function first<T>(result: unknown): T | undefined {
  return (result as { [index: number]: T } | undefined)?.[0]
}

export function newOrderId() {
  return `ZJ${Date.now().toString(36)}${crypto.randomUUID().slice(0, 8)}`.toUpperCase()
}

export async function createOrder(outTradeNo: string, amountCents = 50) {
  const result = await sql()`
    INSERT INTO orders (id, amount_cents, status, provider, out_trade_no, expires_at)
    VALUES (${outTradeNo}, ${amountCents}, 'pending', 'wechat_native', ${outTradeNo}, now() + interval '5 minutes')
    RETURNING *
  `
  return first<Order>(result)!
}

export async function getOrder(id: string) {
  const result = await sql()`SELECT * FROM orders WHERE id = ${id} LIMIT 1`
  return first<Order>(result) ?? null
}

export async function markOrderPaid(id: string, transactionId: string | null) {
  const result = await sql()`
    UPDATE orders
    SET status = 'paid', transaction_id = COALESCE(${transactionId}, transaction_id), paid_at = COALESCE(paid_at, now())
    WHERE id = ${id} AND status <> 'paid'
    RETURNING *
  `
  return first<Order>(result) ?? getOrder(id)
}

export async function markOrderClosed(id: string, status: 'expired' | 'closed' = 'closed') {
  const result = await sql()`
    UPDATE orders SET status = ${status}
    WHERE id = ${id} AND status = 'pending'
    RETURNING *
  `
  return first<Order>(result) ?? getOrder(id)
}

export async function recordPaymentEvent(input: {
  orderId: string
  eventType: string
  idempotencyKey: string
  payloadHash: string
  result: string
}) {
  await sql()`
    INSERT INTO payment_events (order_id, event_type, idempotency_key, payload_hash, result)
    VALUES (${input.orderId}, ${input.eventType}, ${input.idempotencyKey}, ${input.payloadHash}, ${input.result})
    ON CONFLICT (idempotency_key) DO NOTHING
  `
}

export async function expireOrderIfNeeded(order: Order) {
  if (order.status === 'pending' && Date.parse(order.expires_at) <= Date.now()) {
    return markOrderClosed(order.id, 'expired')
  }
  return order
}
