/**
 * Send Email — handles all Supabase Auth emails via Resend + React Email
 *
 * Called by queue-worker (via _admin_enqueue_task → pg_net → queue-worker).
 * Uses withSupabase({ allow: 'private' }) since only queue-worker/service_role invokes it.
 */

import * as React from 'npm:react@18.3.1'
import { Resend } from 'npm:resend@4.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { withSupabase } from '../_shared/withSupabase.ts'
import { ConfirmationEmail } from './_templates/confirmation.tsx'
import { MagicLinkEmail } from './_templates/magic-link.tsx'
import { RecoveryEmail } from './_templates/recovery.tsx'
import { InviteEmail } from './_templates/invite.tsx'
import { EmailChangeEmail } from './_templates/email-change.tsx'

interface AuthHookUser {
  id: string
  email?: string
  email_new?: string
  [key: string]: unknown
}

interface AuthHookEmailData {
  token: string
  token_hash: string
  redirect_to?: string
  email_action_type: string
  site_url: string
  token_new?: string
  token_hash_new?: string
  [key: string]: unknown
}

interface AuthHookPayload {
  user: AuthHookUser
  email_data: AuthHookEmailData
}

const SUBJECTS: Record<string, string> = {
  signup: 'Confirm your email',
  magiclink: 'Your login link',
  recovery: 'Reset your password',
  invite: "You've been invited",
  email_change: 'Confirm your email change',
}

function buildVerificationUrl(
  supabaseUrl: string,
  tokenHash: string,
  emailActionType: string,
  redirectTo: string
): string {
  const base = `${supabaseUrl.replace(/\/$/, '')}/auth/v1/verify`
  const params = new URLSearchParams({
    token: tokenHash,
    type: emailActionType,
    ...(redirectTo ? { redirect_to: redirectTo } : {}),
  })
  return `${base}?${params.toString()}`
}

Deno.serve(
  withSupabase({ allow: 'private' }, async (req, _ctx) => {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    const { user, email_data } = (await req.json()) as AuthHookPayload
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const appName = Deno.env.get('APP_NAME') ?? 'App'
    const fromEmail =
      Deno.env.get('RESEND_FROM_EMAIL') ?? `${appName} <noreply@example.com>`

    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY is not set')
    }

    const resend = new Resend(resendApiKey)
    const redirectTo = email_data.redirect_to ?? ''
    const emailActionType = email_data.email_action_type ?? 'signup'

    const sendOne = async (
      to: string,
      subject: string,
      element: React.ReactElement
    ): Promise<{ error: unknown } | null> => {
      const [html, text] = await Promise.all([
        renderAsync(element),
        renderAsync(element, { plainText: true }),
      ])
      const { error } = await resend.emails.send({
        from: fromEmail,
        to: [to],
        subject,
        html,
        text,
      })
      return error ? { error } : null
    }

    // Dual email-change: send to both current and new email
    if (
      emailActionType === 'email_change' &&
      email_data.token_hash_new &&
      email_data.token_new &&
      user.email_new
    ) {
      const currentUrl = buildVerificationUrl(
        supabaseUrl,
        email_data.token_hash_new,
        emailActionType,
        redirectTo
      )
      const newUrl = buildVerificationUrl(
        supabaseUrl,
        email_data.token_hash,
        emailActionType,
        redirectTo
      )

      const currentElement = React.createElement(EmailChangeEmail, {
        verificationUrl: currentUrl,
        token: email_data.token,
        isNewEmail: false,
      })
      const newElement = React.createElement(EmailChangeEmail, {
        verificationUrl: newUrl,
        token: email_data.token_new,
        isNewEmail: true,
      })

      const subject = SUBJECTS.email_change
      const err1 = await sendOne(user.email!, subject, currentElement)
      if (err1) throw err1.error
      const err2 = await sendOne(user.email_new, subject, newElement)
      if (err2) throw err2.error
      return new Response('OK', { status: 200 })
    }

    // Standard single-email flow
    const tokenHash = email_data.token_hash
    const token =
      emailActionType === 'email_change' && user.email_new
        ? (email_data.token_new ?? email_data.token)
        : email_data.token
    const verificationUrl = buildVerificationUrl(
      supabaseUrl,
      tokenHash,
      emailActionType,
      redirectTo
    )
    const to = user.email ?? user.email_new
    if (!to) {
      throw new Error('No recipient email')
    }

    let element: React.ReactElement
    let subject: string

    switch (emailActionType) {
      case 'signup': {
        subject = SUBJECTS.signup
        element = React.createElement(ConfirmationEmail, {
          verificationUrl,
          token: email_data.token,
        })
        break
      }
      case 'magiclink': {
        subject = SUBJECTS.magiclink
        element = React.createElement(MagicLinkEmail, {
          verificationUrl,
          token: email_data.token,
        })
        break
      }
      case 'recovery': {
        subject = SUBJECTS.recovery
        element = React.createElement(RecoveryEmail, { verificationUrl })
        break
      }
      case 'invite': {
        subject = SUBJECTS.invite
        element = React.createElement(InviteEmail, { verificationUrl })
        break
      }
      case 'email_change': {
        subject = SUBJECTS.email_change
        element = React.createElement(EmailChangeEmail, {
          verificationUrl,
          token,
          isNewEmail: !!user.email_new,
        })
        break
      }
      default: {
        subject = SUBJECTS.signup
        element = React.createElement(ConfirmationEmail, {
          verificationUrl,
          token: email_data.token,
        })
      }
    }

    const err = await sendOne(to, subject, element)
    if (err) throw err.error
    return new Response('OK', { status: 200 })
  })
)
