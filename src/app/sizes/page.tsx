import Link from 'next/link'
import { categories, photoSizes } from '@/lib/photoSizes'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '证件照尺寸大全 · 在线制作指南 — 照见',
  description: '最全证件照尺寸查询：一寸照、二寸照、护照、签证、驾照、社保卡等常用证件照尺寸规格，像素毫米对照，在线免费制作。',
  openGraph: {
    title: '证件照尺寸大全 · 在线制作指南',
    description: '常用证件照尺寸规格，像素毫米对照，在线免费制作。',
    type: 'website',
  },
}

export default function SizesPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: photoSizes.slice(0, 5).map((size) => ({
      '@type': 'Question',
      name: `${size.name}尺寸是多少？`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `${size.name}：${size.width}×${size.height}像素，即 ${size.widthMm}×${size.heightMm}mm。`,
      },
    })),
  }

  return (
    <div className="max-w-[1340px] mx-auto py-14 px-5 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="text-center mb-12">
        <span className="stamp mb-3">尺寸大全</span>
        <h1 className="mt-4 text-3xl lg:text-4xl font-bold tracking-[-0.02em]">
          找到你需要的那一张
        </h1>
        <p className="mt-3 text-[15px] text-[var(--ink-muted)] max-w-2xl mx-auto">
          收录 {photoSizes.length} 种常用证件照尺寸规格。所有尺寸均可在浏览器内免费制作。
        </p>
      </div>

      {categories.map((category) => {
        const sizes = category === '近期热门'
          ? photoSizes.filter((s) => s.hot)
          : photoSizes.filter((s) => s.category === category)

        if (sizes.length === 0) return null

        return (
          <section key={category} className="mb-10">
            <div className="flex items-center gap-3 mb-5">
              <h2 className="text-lg font-bold">{category}</h2>
              {category === '近期热门' && (
                <span className="px-2.5 py-0.5 text-[11px] font-bold bg-[var(--terracotta-light)] text-[var(--terracotta)] rounded-full">
                  热门
                </span>
              )}
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sizes.map((size) => (
                <Link
                  key={size.id}
                  href={`/studio?size=${size.id}`}
                  className="group flex items-center justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--cream)] hover:border-[var(--terracotta-soft)] hover:shadow-[var(--shadow-sm)] transition-all"
                >
                  <div>
                    <h3 className="font-bold text-[15px] group-hover:text-[var(--terracotta)] transition-colors">
                      {size.name}
                    </h3>
                    <div className="mt-1.5 flex gap-4 text-[12px] text-[var(--ink-muted)]">
                      <code className="font-mono text-[var(--ink)]">{size.width}×{size.height}px</code>
                      <code className="font-mono">{size.widthMm}×{size.heightMm}mm</code>
                    </div>
                  </div>
                  <div
                    className="shrink-0 rounded-lg border border-[var(--border)] overflow-hidden bg-[#dce5f2]"
                    style={{
                      width: Math.max(32, Math.round(size.widthMm * 1.2)),
                      height: Math.max(44, Math.round(size.heightMm * 1.2)),
                    }}
                    aria-hidden="true"
                  />
                </Link>
              ))}
            </div>
          </section>
        )
      })}

      {/* Quick links */}
      <div className="mt-14 pt-8 border-t border-dashed border-[var(--border)]">
        <h2 className="text-base font-bold mb-4">🔥 热门尺寸快速入口</h2>
        <div className="flex flex-wrap gap-2">
          {photoSizes.filter((s) => s.hot).map((size) => (
            <Link
              key={size.id}
              href={`/studio?size=${size.id}`}
              className="px-3.5 py-1.5 border border-[var(--border)] rounded-full text-[13px] text-[var(--terracotta)] font-medium hover:bg-[var(--terracotta-light)] hover:border-[var(--terracotta-soft)] transition-colors"
            >
              {size.name} {size.widthMm}×{size.heightMm}mm
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
