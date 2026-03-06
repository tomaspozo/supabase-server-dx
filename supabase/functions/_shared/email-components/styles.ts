/**
 * Shared style constants for email templates
 */

export const colors = {
  background: '#f3f4f6',
  surface: '#ffffff',
  text: '#1f2937',
  textMuted: '#6b7280',
  textLight: '#9ca3af',
  border: '#e5e7eb',
  primary: '#5cb8e4',
  codeBg: '#f9fafb',
  codeBorder: '#bae6fd',
  brand: '#6b7280',
} as const

export const fontFamily = {
  sans: "Geist, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  mono: 'Geist Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
} as const

export const layout = {
  container: {
    maxWidth: '480px',
    margin: '0 auto',
    backgroundColor: colors.surface,
    borderRadius: '16px',
    overflow: 'hidden' as const,
  },
  header: {
    padding: '20px 32px 16px',
    textAlign: 'center' as const,
    borderBottom: `1px solid ${colors.border}`,
  },
  content: {
    padding: '32px',
  },
  footer: {
    padding: '24px 32px',
    borderTop: `1px solid ${colors.border}`,
    textAlign: 'center' as const,
  },
  main: {
    backgroundColor: colors.background,
    fontFamily: fontFamily.sans,
  },
} as const

export const typography = {
  title: {
    fontSize: '22px',
    fontWeight: 600,
    color: '#111827',
    margin: '0 0 16px',
    textAlign: 'center' as const,
  },
  text: {
    fontSize: '15px',
    lineHeight: '26px',
    color: colors.text,
    marginBottom: '16px',
    textAlign: 'center' as const,
  },
  textSmall: {
    fontSize: '13px',
    color: colors.textMuted,
    lineHeight: '22px',
    textAlign: 'center' as const,
  },
  footerText: {
    fontSize: '12px',
    color: colors.textLight,
    margin: 0,
  },
  brandName: {
    margin: 0,
    fontSize: '15px',
    fontWeight: 600,
    color: colors.textMuted,
    letterSpacing: '0.5px',
  },
} as const

export const button = {
  display: 'inline-block',
  padding: '14px 32px',
  backgroundColor: colors.primary,
  color: '#ffffff',
  textDecoration: 'none',
  borderRadius: '50px',
  fontSize: '15px',
  fontWeight: 600,
  letterSpacing: '0.3px',
} as const

export const otpCode = {
  box: {
    backgroundColor: colors.codeBg,
    border: `1px solid ${colors.codeBorder}`,
    borderRadius: '16px',
    padding: '24px',
    textAlign: 'center' as const,
    marginBottom: '24px',
  },
  label: {
    fontSize: '12px',
    color: colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: '2px',
    marginBottom: '12px',
  },
  code: {
    fontSize: '36px',
    fontWeight: 700,
    fontFamily: fontFamily.mono,
    color: colors.primary,
    letterSpacing: '6px',
  },
} as const
