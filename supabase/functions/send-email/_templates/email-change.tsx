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

export interface EmailChangeEmailProps {
  verificationUrl: string
  token: string
  isNewEmail: boolean
}

export function EmailChangeEmail({
  verificationUrl,
  token,
  isNewEmail,
}: EmailChangeEmailProps) {
  const heading = isNewEmail
    ? 'Confirm your new email'
    : 'Email change requested'
  const body = isNewEmail
    ? 'Please confirm your new email address by entering the code below or clicking the button.'
    : 'A request was made to change the email address associated with your account. Enter the code below or click the button to confirm.'
  const preview = isNewEmail
    ? 'Confirm your new email address'
    : 'Confirm your email change'

  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <EmailLayout>
        <Heading style={typography.title}>{heading}</Heading>
        <Text style={typography.text}>{body}</Text>
        <OtpCode code={token} label="Verification code" />
        <Text style={{ textAlign: 'center' as const }}>
          <EmailButton href={verificationUrl}>Confirm Email Change</EmailButton>
        </Text>
        <Text style={typography.textSmall}>
          If you didn't request this change, please secure your account
          immediately.
        </Text>
      </EmailLayout>
    </Html>
  )
}

export default EmailChangeEmail
