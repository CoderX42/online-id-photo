import Link from 'next/link'
import { ArrowRight, Check, LockKeyhole, Star } from 'lucide-react'

const Steps = [
  { step: '01', icon: '📷', title: '拍一张正面照', desc: '手机后置摄像头，靠窗自然光拍一张上半身正面照。', accent: 'var(--terracotta)', bg: 'var(--terracotta-light)' },
  { step: '02', icon: '✨', title: 'AI 自动处理', desc: '浏览器本地运行人像模型，去背景换底色，照片绝不上传。', accent: 'var(--olive)', bg: 'var(--olive-light)' },
  { step: '03', icon: '📦', title: '下载冲印', desc: '选尺寸、微调位置，一键下载高清照或排版相纸。', accent: 'var(--golden)', bg: 'var(--golden-light)' },
]

export default function HomePage() {
  return (
    <>
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden">
        {/* Atmosphere */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-[radial-gradient(ellipse_at_center,var(--terracotta-light)_0%,transparent_65%)]" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[300px] rounded-full bg-[radial-gradient(ellipse_at_center,var(--olive-light)_0%,transparent_60%)]" />
        </div>

        <div className="relative max-w-[800px] mx-auto px-5 pt-20 pb-16 lg:pt-28 lg:pb-20 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-sm border border-[var(--terracotta-soft)] rounded-full text-[13px] font-bold text-[var(--terracotta)] animate-fade-up shadow-sm">
            <Star size={14} fill="currentColor" />
            免费 · 无水印 · 无需登录
          </div>

          {/* Headline — massive, centered typography */}
          <h1 className="mt-6 font-['ZCOOL_KuaiLe',cursive] text-[clamp(48px,8vw,96px)] leading-[1.05] tracking-[-0.02em] animate-fade-up stagger-1">
            在家拍出
            <br />
            <span className="relative inline-block text-[var(--terracotta)]">
              好看证件照
              <svg className="absolute -bottom-1 left-0 w-full h-[12px] text-[var(--terracotta-soft)]/60" viewBox="0 0 200 10" preserveAspectRatio="none" aria-hidden="true">
                <path d="M0 8 Q 40 0, 80 6 T 160 4 T 200 7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 max-w-[500px] mx-auto text-[17px] leading-relaxed text-[var(--ink-muted)] animate-fade-up stagger-2">
            上传照片，AI 自动抠图换底、精准裁切、自动排版。
            <strong className="text-[var(--ink)]"> 全程在浏览器完成</strong>，照片不上传任何服务器。
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 animate-fade-up stagger-3">
            <Link
              href="/studio"
              className="group inline-flex items-center gap-2.5 h-[56px] px-8 bg-[var(--terracotta)] text-white font-bold rounded-2xl shadow-[0_6px_0_#a66447] hover:shadow-[0_4px_0_#a66447] hover:translate-y-[2px] active:shadow-none active:translate-y-[6px] transition-all"
            >
              免费开始制作
              <ArrowRight size={17} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/guide"
              className="inline-flex items-center gap-2 px-5 py-3 text-[14px] font-semibold text-[var(--ink)] border-b-2 border-dashed border-[var(--terracotta-soft)] hover:text-[var(--terracotta)] hover:border-[var(--terracotta)] transition-colors"
            >
              先看拍摄技巧 →
            </Link>
          </div>

          {/* Trust badges */}
          <div className="mt-10 flex flex-wrap justify-center gap-3 animate-fade-up stagger-4">
            {['AI 本地抠图 · 零上传', '300 DPI 高清输出', '23 种常用尺寸'].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/60 backdrop-blur-sm border border-[var(--border)] rounded-lg text-[12px] text-[var(--ink-muted)]">
                <Check size={13} className="shrink-0 text-[var(--olive)]" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="max-w-[900px] mx-auto px-5 pb-14 lg:pb-18">
        <div className="text-center mb-10">
          <span className="stamp mb-3">三步出片</span>
          <h2 className="mt-4 font-['ZCOOL_KuaiLe',cursive] text-[clamp(26px,4vw,40px)] tracking-[-0.01em]">
            就像去楼下照相馆一样简单
          </h2>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 lg:gap-5">
          {Steps.map(({ step, icon, title, desc, accent, bg }, i) => (
            <div
              key={step}
              className="group relative rounded-2xl p-7 border border-[var(--border)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:-translate-y-1 transition-all duration-300"
              style={{ background: `linear-gradient(160deg, ${bg} 0%, var(--cream) 100%)` }}
            >
              <span
                className="absolute -top-2 -right-2 text-[120px] font-['Oswald',sans-serif] font-black leading-none select-none pointer-events-none opacity-[0.08]"
                style={{ color: accent }}
              >
                {step}
              </span>
              <span className="relative text-[9px] font-bold font-['Oswald',sans-serif] tracking-[0.2em] opacity-40" style={{ color: accent }}>
                STEP {step}
              </span>
              <div className="relative mt-3 text-4xl">{icon}</div>
              <h3 className="relative mt-3 text-lg font-bold">{title}</h3>
              <p className="relative mt-2 text-[14px] text-[var(--ink-muted)] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== BOTTOM TRUST ===== */}
      <section className="relative overflow-hidden border-t border-[var(--border-light)]">
        <div className="absolute inset-0 pointer-events-none bg-[var(--cream)]/60" />
        <div className="relative max-w-[600px] mx-auto px-5 py-16 lg:py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-sm border border-[var(--olive-soft)] rounded-full text-[13px] font-semibold text-[var(--olive)] mb-6">
            <LockKeyhole size={15} />
            照片仅在本机处理，不上传服务器
          </div>

          <h2 className="font-['ZCOOL_KuaiLe',cursive] text-[clamp(28px,5vw,48px)] leading-tight tracking-[-0.01em]">
            你的肖像，{' '}
            <span className="relative inline-block text-[var(--terracotta)]">
              你掌控
              <svg className="absolute -bottom-1 left-0 w-full h-[8px] text-[var(--terracotta-soft)]/50" viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true">
                <path d="M0 6 Q 20 1, 50 5 T 100 5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </span>
          </h2>

          <p className="mt-4 text-[15px] text-[var(--ink-muted)] leading-relaxed">
            AI 抠图、换底色、裁切排版 — 全部在浏览器内完成。像在自家电脑上操作一样安全。
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-5 text-[12px] text-[var(--ink-muted)]">
            {['本地 AI 推理', '零数据上传', '开源可审计'].map((t) => (
              <span key={t} className="inline-flex items-center gap-1">
                <Check size={13} className="text-[var(--olive)]" /> {t}
              </span>
            ))}
          </div>

          <Link
            href="/studio"
            className="mt-8 inline-flex items-center gap-2.5 h-[54px] px-8 bg-[var(--olive)] text-white font-bold rounded-2xl shadow-[0_6px_0_#4a633d] hover:shadow-[0_4px_0_#4a633d] hover:translate-y-[2px] active:shadow-none active:translate-y-[6px] transition-all"
          >
            免费开始制作
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </>
  )
}
