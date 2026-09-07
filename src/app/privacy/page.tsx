import Link from 'next/link'

export default function PrivacyPage() {
  return <article className="max-w-2xl mx-auto px-5 py-16"><span className="stamp">隐私说明</span><h1 className="mt-5 text-3xl font-black">你的照片，由你掌控</h1><div className="mt-8 space-y-6 text-[15px] leading-8 text-[var(--ink-muted)]"><p>照见的抠图、换底色、裁切和排版默认在你的浏览器本地完成。我们不会把原始照片上传到服务器，也不会保存照片内容。</p><p>支付流程只处理订单号、金额、支付状态和微信交易号等必要订单信息。订单用于确认本次导出权益和处理售后问题。</p><p>请勿上传包含他人隐私、身份证号码或其他不必要敏感信息的图片。</p><p><Link className="text-[var(--terracotta)] font-semibold" href="/studio">返回在线制作 →</Link></p></div></article>
}
