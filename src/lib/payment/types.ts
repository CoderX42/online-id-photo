/** 支付订单 */
export type PayOrder = {
  id: string
  amount: number       // 元
  qrCode: string       // 支付二维码 URL 或 base64
  payUrl: string       // 支付链接
  status: 'pending' | 'paid' | 'expired'
  createdAt: number
}

/** 支付提供商接口 */
export interface PaymentProvider {
  /** 创建订单，返回支付二维码和订单ID */
  createOrder(amount: number, description: string): Promise<PayOrder>
  /** 查询订单状态 */
  checkStatus(orderId: string): Promise<'pending' | 'paid' | 'expired'>
}
