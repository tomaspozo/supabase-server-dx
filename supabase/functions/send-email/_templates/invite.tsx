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

export interface InviteEmailProps {
  verificationUrl: string
}

export function InviteEmail({ verificationUrl }: InviteEmailProps) {
  const appName = Deno.env.get('APP_NAME') ?? 'App'

  return (
    <Html lang="en">
      <Head />
      <Preview>You've been invited</Preview>
      <EmailLayout>
        <Heading style={typography.title}>You're invited!</Heading>
        <Text style={typography.text}>
          You've been invited to join {appName}. Click the button below to
          accept the invitation and create your account.
        </Text>
        <Text style={{ textAlign: 'center' as const }}>
          <EmailButton href={verificationUrl}>Accept Invitation</EmailButton>
        </Text>
        <Text style={typography.textSmall}>
          If you weren't expecting this invitation, you can safely ignore this
          email.
        </Text>
      </EmailLayout>
    </Html>
  )
}

export default InviteEmail
