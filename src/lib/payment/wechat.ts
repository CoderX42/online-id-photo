import crypto from 'node:crypto'

/**
 * 微信支付 API v3 Native 支付
 * 文档: https://pay.weixin.qq.com/docs/merchant/apis/native-payment/direct-jsons/native-prepay.html
 */

const WECHAT_API_BASE = 'https://api.mch.weixin.qq.com/v3'

type WechatConfig = {
  mchid: string
  appid: string
  apiV3Key: string
  serialNo: string
  privateKey: string
}

function getConfig(): WechatConfig {
  const config = {
    mchid: process.env.WECHAT_MCHID || '',
    appid: process.env.WECHAT_APPID || '',
    apiV3Key: process.env.WECHAT_API_V3_KEY || '',
    serialNo: process.env.WECHAT_SERIAL_NO || '',
    privateKey: process.env.WECHAT_PRIVATE_KEY || '',
  }

  if (!config.mchid || !config.appid || !config.apiV3Key || !config.serialNo || !config.privateKey) {
    throw new Error('微信支付未完整配置。需要: WECHAT_MCHID, WECHAT_APPID, WECHAT_API_V3_KEY, WECHAT_SERIAL_NO, WECHAT_PRIVATE_KEY')
  }

  return config
}

/** 生成微信支付 v3 签名 */
function sign(method: string, url: string, body: string, config: WechatConfig): string {
  const timestamp = Math.floor(Date.now() / 1000)
  const nonce = crypto.randomBytes(16).toString('hex')
  const message = `${method}\n${url}\n${timestamp}\n${nonce}\n${body}\n`
  const signature = crypto
    .createSign('RSA-SHA256')
    .update(message)
    .sign(config.privateKey, 'base64')

  return `WECHATPAY2-SHA256-RSA2048 mchid="${config.mchid}",nonce_str="${nonce}",timestamp="${timestamp}",serial_no="${config.serialNo}",signature="${signature}"`
}

/** 创建 Native 支付订单，返回 code_url */
export async function createNativeOrder(params: {
  outTradeNo: string
  amount: number // 元
  description: string
}): Promise<{ codeUrl: string }> {
  const config = getConfig()
  const url = '/v3/pay/transactions/native'
  const body = JSON.stringify({
    appid: config.appid,
    mchid: config.mchid,
    description: params.description,
    out_trade_no: params.outTradeNo,
    notify_url: '', // 暂不配置回调，使用主动查询
    amount: {
      total: Math.round(params.amount * 100), // 单位：分
      currency: 'CNY',
    },
  })

  const auth = sign('POST', url, body, config)

  const res = await fetch(`${WECHAT_API_BASE}${url}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': auth,
    },
    body,
  })

  const data = await res.json()

  if (!res.ok) {
    const msg = data.message || data.code || '微信支付创建订单失败'
    throw new Error(`微信支付错误: ${msg}`)
  }

  if (!data.code_url) {
    throw new Error('微信支付未返回 code_url')
  }

  return { codeUrl: data.code_url }
}

/** 查询订单支付状态 */
export async function queryOrder(outTradeNo: string): Promise<'paid' | 'pending' | 'closed'> {
  const config = getConfig()
  const url = `/v3/pay/transactions/out-trade-no/${outTradeNo}?mchid=${config.mchid}`
  const auth = sign('GET', url, '', config)

  const res = await fetch(`${WECHAT_API_BASE}${url}`, {
    headers: {
      'Accept': 'application/json',
      'Authorization': auth,
    },
  })

  const data = await res.json()

  if (!res.ok) {
    console.error('微信支付查询失败:', data)
    return 'pending'
  }

  switch (data.trade_state) {
    case 'SUCCESS': return 'paid'
    case 'CLOSED':
    case 'REVOKED':
    case 'PAYERROR': return 'closed'
    default: return 'pending'
  }
}

/** 将 code_url 转为可展示的二维码图片 URL */
export function codeUrlToQrImage(codeUrl: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(codeUrl)}`
}
