import * as React from 'npm:react@18.3.1'
import { Body, Container, Text } from 'npm:@react-email/components@0.0.22'
import { layout as layoutStyles, typography } from './styles.ts'

export interface EmailLayoutProps {
  children: React.ReactNode
}

export function EmailLayout({ children }: EmailLayoutProps) {
  const appName = Deno.env.get('APP_NAME') ?? 'App'

  return (
    <Body style={layoutStyles.main}>
      <Container style={layoutStyles.container}>
        <div style={layoutStyles.header}>
          <Text style={typography.brandName}>{appName}</Text>
        </div>
        <div style={layoutStyles.content}>{children}</div>
        <div style={layoutStyles.footer}>
          <Text style={typography.footerText}>
            &copy; {new Date().getFullYear()} {appName}
          </Text>
        </div>
      </Container>
    </Body>
  )
}

export default EmailLayout
