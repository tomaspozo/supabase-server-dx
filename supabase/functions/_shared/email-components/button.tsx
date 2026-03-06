import * as React from 'npm:react@18.3.1'
import { Link } from 'npm:@react-email/components@0.0.22'
import { button as buttonStyles } from './styles.ts'

export interface EmailButtonProps {
  href: string
  children: React.ReactNode
  style?: React.CSSProperties
}

export function EmailButton({ href, children, style }: EmailButtonProps) {
  return (
    <Link href={href} style={{ ...buttonStyles, ...style }}>
      {children}
    </Link>
  )
}

export default EmailButton
