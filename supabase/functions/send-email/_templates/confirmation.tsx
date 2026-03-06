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
import { OtpCode } from '../../_shared/email-components/otp-code.tsx'
import { typography } from '../../_shared/email-components/styles.ts'

export interface ConfirmationEmailProps {
  verificationUrl: string
  token: string
}

export function ConfirmationEmail({
  verificationUrl,
  token,
}: ConfirmationEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>Confirm your email address</Preview>
      <EmailLayout>
        <Heading style={typography.title}>Confirm your email</Heading>
        <Text style={typography.text}>
          Thanks for signing up! Please confirm your email address by entering
          the code below or clicking the button.
        </Text>
        <OtpCode code={token} label="Verification code" />
        <Text style={{ ...typography.text, textAlign: 'center' as const }}>
          <EmailButton href={verificationUrl}>Confirm Email</EmailButton>
        </Text>
        <Text style={typography.textSmall}>
          If you didn't create an account, you can safely ignore this email.
        </Text>
      </EmailLayout>
    </Html>
  )
}

export default ConfirmationEmail
