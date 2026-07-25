import crypto from 'node:crypto'

/**
 * 微信支付 API v3 — Native 扫码支付
 * https://pay.weixin.qq.com/docs/merchant/apis/native-payment/direct-jsons/native-prepay.html
 */

const API_BASE = 'https://api.mch.weixin.qq.com/v3'

type Config = { mchid: string; appid: string; apiV3Key: string; serialNo: string; privateKey: string }

function loadConfig(): Config {
  const mchid = process.env.WECHAT_MCHID || ''
  const appid = process.env.WECHAT_APPID || ''
  const apiV3Key = process.env.WECHAT_API_V3_KEY || ''
  const serialNo = process.env.WECHAT_SERIAL_NO || ''
  const privateKey = process.env.WECHAT_PRIVATE_KEY?.replace(/\\n/g, '\n') || ''

  if (!mchid || !appid || !apiV3Key || !serialNo || !privateKey) {
    throw new Error('WECHAT_MCHID, WECHAT_APPID, WECHAT_API_V3_KEY, WECHAT_SERIAL_NO, WECHAT_PRIVATE_KEY')
  }

  return { mchid, appid, apiV3Key, serialNo, privateKey }
}

function sign(method: string, path: string, body: string, cfg: Config): string {
  const timestamp = Math.floor(Date.now() / 1000)
  const nonce = crypto.randomBytes(16).toString('hex')
  const message = `${method}\n${path}\n${timestamp}\n${nonce}\n${body}\n`
  const signature = crypto.createSign('RSA-SHA256').update(message).sign(cfg.privateKey, 'base64')
  return `WECHATPAY2-SHA256-RSA2048 mchid="${cfg.mchid}",nonce_str="${nonce}",timestamp="${timestamp}",serial_no="${cfg.serialNo}",signature="${signature}"`
}

async function request(method: string, path: string, body: object | null, cfg: Config) {
  const bodyStr = body ? JSON.stringify(body) : ''
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: sign(method, path, bodyStr, cfg),
    },
    ...(body ? { body: bodyStr } : {}),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || `微信支付错误: ${res.status}`)
  return data
}

/** 创建 Native 支付订单 → 返回 code_url（微信扫码链接） */
export async function createNativeOrder(outTradeNo: string, amountYuan: number, description: string): Promise<string> {
  const cfg = loadConfig()
  const body = {
    appid: cfg.appid,
    mchid: cfg.mchid,
    description,
    out_trade_no: outTradeNo,
    notify_url: '',
    amount: { total: Math.round(amountYuan * 100), currency: 'CNY' },
  }
  const data = await request('POST', '/v3/pay/transactions/native', body, cfg)
  if (!data.code_url) throw new Error('微信未返回 code_url')
  return data.code_url
}

/** 关闭未支付订单 */
export async function closeOrder(outTradeNo: string): Promise<void> {
  const cfg = loadConfig()
  await request('POST', `/v3/pay/transactions/out-trade-no/${outTradeNo}/close`, { mchid: cfg.mchid }, cfg)
}

/** 查询订单状态 → paid / pending / closed */
export async function queryOrder(outTradeNo: string): Promise<'paid' | 'pending' | 'closed'> {
  const cfg = loadConfig()
  const data = await request('GET', `/v3/pay/transactions/out-trade-no/${outTradeNo}?mchid=${cfg.mchid}`, null, cfg)
  switch (data.trade_state) {
    case 'SUCCESS': return 'paid'
    case 'CLOSED': case 'REVOKED': case 'PAYERROR': return 'closed'
    default: return 'pending'
  }
}
