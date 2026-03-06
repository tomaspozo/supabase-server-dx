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

export interface MagicLinkEmailProps {
  verificationUrl: string
  token: string
}

export function MagicLinkEmail({
  verificationUrl,
  token,
}: MagicLinkEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>Your login code</Preview>
      <EmailLayout>
        <Heading style={typography.title}>Sign in to your account</Heading>
        <Text style={typography.text}>
          Use the code below to sign in, or click the button.
        </Text>
        <OtpCode code={token} label="Login code" />
        <Text style={typography.text}>Or click the link below:</Text>
        <Text style={{ textAlign: 'center' as const }}>
          <EmailButton href={verificationUrl}>Sign In</EmailButton>
        </Text>
        <Text style={typography.textSmall}>
          If you didn't request this email, you can safely ignore it.
        </Text>
      </EmailLayout>
    </Html>
  )
}

export default MagicLinkEmail
