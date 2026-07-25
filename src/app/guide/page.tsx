import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight, Camera, Lightbulb, Sun, User } from 'lucide-react'

export const metadata: Metadata = {
  title: '拍摄指南 · 照见',
  description: '证件照拍摄技巧：正对镜头、光线均匀、留足空间。手机也能拍出合规证件照。',
}

const tips = [
  {
    num: '01',
    icon: User,
    title: '正对镜头',
    desc: '抬头挺胸，双肩自然放平，露出眉毛与耳朵。表情自然就好，不要刻意微笑。',
    accent: 'var(--terracotta)',
    bg: 'var(--terracotta-light)',
  },
  {
    num: '02',
    icon: Sun,
    title: '光线均匀',
    desc: '面向窗户，让柔和自然光均匀照亮面部。阴天靠窗的散射光是最理想的光源，避开顶灯直射。',
    accent: 'var(--golden)',
    bg: 'var(--golden-light)',
  },
  {
    num: '03',
    icon: Camera,
    title: '留足空间',
    desc: '拍到胸口以下，头顶上方保留适当空白。方便后期裁剪适配一寸、二寸等各种尺寸规格。',
    accent: 'var(--olive)',
    bg: 'var(--olive-light)',
  },
]

const proTips = [
  {
    label: '穿着建议',
    desc: '穿深色有领衣服，与背景形成自然对比。避免白衬衫在浅色背景下与底色混淆。',
    icon: '👔',
  },
  {
    label: '光线技巧',
    desc: '不要在大晴天正午拍摄，面部阴影过重。阴天靠窗的散射光是最好的天然柔光箱。',
    icon: '☁️',
  },
]

export default function GuidePage() {
  return (
    <>
      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden safelight">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-[radial-gradient(ellipse_at_center,var(--terracotta-light)_0%,transparent_60%)]" />
        </div>

        <div className="relative max-w-[900px] mx-auto px-5 lg:px-8 pt-12 pb-8 lg:pt-16 lg:pb-10 text-center">
          <span className="stamp mb-3">拍摄贴士</span>
          <h1 className="mt-4 font-['ZCOOL_KuaiLe',cursive] text-[clamp(34px,5vw,56px)] leading-tight tracking-[-0.01em]">
            拍对了，{' '}
            <span className="relative inline-block text-[var(--terracotta)]">
              成片更自然
              <svg className="absolute -bottom-1 left-0 w-full h-[8px] text-[var(--terracotta-soft)]/50" viewBox="0 0 160 8" preserveAspectRatio="none" aria-hidden="true">
                <path d="M0 6 Q 35 1, 80 5 T 160 6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </span>
          </h1>
          <p className="mt-4 text-[15px] text-[var(--ink-muted)] max-w-[420px] mx-auto">
            不用专业设备。靠近窗边，用手机后置摄像头就足够了。
          </p>
        </div>
      </section>

      {/* ===== Main tips ===== */}
      <section className="max-w-[900px] mx-auto px-5 lg:px-8 pb-12 lg:pb-16">
        <div className="grid sm:grid-cols-3 gap-5 lg:gap-6">
          {tips.map(({ num, icon: Icon, title, desc, accent, bg }) => (
            <div
              key={num}
              className="group flex flex-col items-center text-center p-8 rounded-2xl border border-[var(--border-light)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:-translate-y-1 transition-all duration-300"
              style={{ background: `linear-gradient(180deg, ${bg}40 0%, var(--paper) 100%)` }}
            >
              {/* Step number — large editorial numeral */}
              <span
                className="text-[72px] font-black font-['Oswald',sans-serif] leading-none tracking-[-0.04em] select-none opacity-[0.10]"
                style={{ color: accent }}
              >
                {num}
              </span>

              {/* Icon */}
              <div
                className="-mt-10 mb-4 w-14 h-14 grid place-items-center rounded-2xl text-white shadow-sm group-hover:scale-110 transition-transform"
                style={{ background: accent }}
              >
                <Icon size={26} />
              </div>

              {/* Title */}
              <h2 className="text-lg font-bold">{title}</h2>

              {/* Desc */}
              <p className="mt-2 text-[14px] text-[var(--ink-muted)] leading-relaxed">
                {desc}
              </p>
            </div>
          ))}
        </div>

        {/* Pro tips */}
        <div className="mt-8 grid sm:grid-cols-2 gap-4">
          {proTips.map(({ label, desc, icon }) => (
            <div
              key={label}
              className="flex items-start gap-4 p-5 rounded-2xl border border-dashed border-[var(--border)] bg-white/60"
            >
              <span className="text-2xl shrink-0">{icon}</span>
              <div>
                <span className="text-[11px] font-bold font-['Oswald',sans-serif] text-[var(--terracotta)] tracking-[0.15em]">
                  PRO TIP
                </span>
                <h3 className="text-sm font-bold mt-1">{label}</h3>
                <p className="mt-1 text-[13px] text-[var(--ink-muted)] leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-10 pt-8 border-t border-dashed border-[var(--border)] text-center">
          <p className="text-[15px] text-[var(--ink-muted)] mb-4">
            准备好拍一张了吗？
          </p>
          <Link
            href="/studio"
            className="inline-flex items-center gap-2.5 h-[52px] px-8 bg-[var(--terracotta)] text-white font-bold rounded-2xl shadow-[0_6px_0_#a66447] hover:shadow-[0_4px_0_#a66447] hover:translate-y-[2px] active:shadow-none active:translate-y-[6px] transition-all"
          >
            去制作证件照
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>
    </>
  )
}
