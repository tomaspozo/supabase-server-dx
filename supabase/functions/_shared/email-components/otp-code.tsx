import * as React from 'npm:react@18.3.1'
import { Text } from 'npm:@react-email/components@0.0.22'
import { otpCode as otpStyles } from './styles.ts'

export interface OtpCodeProps {
  code: string
  label?: string
}

export function OtpCode({ code, label }: OtpCodeProps) {
  return (
    <div style={otpStyles.box}>
      {label ? <Text style={otpStyles.label}>{label}</Text> : null}
      <Text style={otpStyles.code}>{code}</Text>
    </div>
  )
}

export default OtpCode
