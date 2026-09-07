import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://zhaojian.example.com'
  return ['', '/studio', '/sizes', '/guide', '/pay', '/privacy'].map((path) => ({ url: `${base}${path}`, changeFrequency: 'monthly', priority: path === '' ? 1 : 0.7 }))
}
