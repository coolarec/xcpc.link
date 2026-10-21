const envValue = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')

const configuredUrl = (value: unknown, fallback: string): string => {
  const candidate = envValue(value) || fallback
  try {
    const url = new URL(candidate)
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : ''
  } catch {
    return ''
  }
}

export interface SiteRecord {
  number: string
  url: string
}

export const siteRecords = {
  icp: {
    number: envValue(import.meta.env.VITE_ICP_LICENSE_NUMBER),
    url: configuredUrl(import.meta.env.VITE_ICP_LICENSE_URL, 'https://beian.miit.gov.cn/'),
  },
  publicSecurity: {
    number: envValue(import.meta.env.VITE_PUBLIC_SECURITY_RECORD_NUMBER),
    url: configuredUrl(import.meta.env.VITE_PUBLIC_SECURITY_RECORD_URL, 'https://beian.mps.gov.cn/'),
  },
} satisfies Record<'icp' | 'publicSecurity', SiteRecord>
