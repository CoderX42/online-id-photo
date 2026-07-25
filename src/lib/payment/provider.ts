export interface CreateOrderParams {
  userId: string
  amount: number // in cents (分)
  description: string
}

export interface CreateOrderResult {
  paymentUrl: string
  orderId: string
}

export interface WebhookResult {
  orderId: string
  transactionId: string
  paid: boolean
}

export interface PaymentProvider {
  createOrder(params: CreateOrderParams): Promise<CreateOrderResult>
  verifyWebhook(body: any, signature: string): Promise<WebhookResult>
}

/**
 * ManualProvider — used when no payment gateway is configured.
 * Creates a "pending" order that an admin can manually mark as paid.
 */
export class ManualProvider implements PaymentProvider {
  async createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    return {
      paymentUrl: `/pay/manual?order=${params.userId}`,
      orderId: `manual-${Date.now()}`,
    }
  }

  async verifyWebhook(_body: any, _signature: string): Promise<WebhookResult> {
    return { orderId: '', transactionId: '', paid: false }
  }
}

/**
 * Returns the active payment provider based on environment configuration.
 */
export function getPaymentProvider(): PaymentProvider {
  // TODO: switch to WechatNativeProvider when credentials are configured
  return new ManualProvider()
}
