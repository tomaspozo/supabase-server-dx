import * as React from 'npm:react@18.3.1'
import {
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'
import { EmailLayout } from '../../_shared/email-components/layout.tsx'
import { EmailButton } from '../../_shared/email-components/button.tsx'
import { typography } from '../../_shared/email-components/styles.ts'

export interface RecoveryEmailProps {
  verificationUrl: string
}

export function RecoveryEmail({ verificationUrl }: RecoveryEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>Reset your password</Preview>
      <EmailLayout>
        <Heading style={typography.title}>Reset your password</Heading>
        <Text style={typography.text}>
          We received a request to reset your password. Click the button below
          to choose a new one.
        </Text>
        <Text style={{ textAlign: 'center' as const }}>
          <EmailButton href={verificationUrl}>Reset Password</EmailButton>
        </Text>
        <Text style={typography.textSmall}>
          If you didn't request a password reset, you can safely ignore this
          email. Your password will not be changed.
        </Text>
      </EmailLayout>
    </Html>
  )
}

export default RecoveryEmail
