import { GetStaticProps } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useEffect, useState } from 'react'
import * as yup from 'yup'
import AuthPageLayout from '@/components/layouts/auth-layout'
import { AuthHeader } from '@/components/auth/layout'
import Alert from '@/components/ui/alert'
import Button from '@/components/ui/button'
import Form from '@/components/ui/forms/form'
import Input from '@/components/ui/input'
import { useConfirmAccountDeletion, useSendAccountDeletionOtp } from '@/data/user'

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale!, ['common', 'form'])),
  },
})

const emailSchema = yup.object().shape({
  email: yup
    .string()
    .email('form:error-email-format')
    .required('form:error-email-required'),
})

const codeSchema = yup.object().shape({
  code: yup
    .string()
    .required('form:error-otp-required')
    .min(6, 'form:error-otp-invalid')
    .max(6, 'form:error-otp-invalid'),
})

function formatCountdown(seconds: number): string {
  if (seconds <= 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  if (remainingSeconds === 0) return `${minutes}m`
  return `${minutes}m ${remainingSeconds}s`
}

export default function DeleteAccountPage() {
  const { t } = useTranslation('common')
  const [email, setEmail] = useState('')
  const [step, setStep] = useState<'send' | 'verify' | 'success'>('send')
  const [countdown, setCountdown] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { mutate: sendOtp, isLoading: isSendingOtp } = useSendAccountDeletionOtp()
  const { mutate: confirmDeletion, isLoading: isConfirmingDeletion } =
    useConfirmAccountDeletion()

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => (prev <= 1 ? 0 : prev - 1))
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleSendOtp = (value: string) => {
    const normalizedEmail = value.trim().toLowerCase()
    setErrorMessage(null)
    setEmail(normalizedEmail)

    sendOtp(
      { email: normalizedEmail },
      {
        onSuccess: (data) => {
          setStep('verify')
          if (data?.expires_at) {
            const expiryTime = new Date(data.expires_at).getTime()
            const currentTime = Date.now()
            setCountdown(Math.max(0, Math.floor((expiryTime - currentTime) / 1000)))
          } else {
            setCountdown(60)
          }
        },
        onError: (error: any) => {
          setErrorMessage(
            error?.response?.data?.message ||
              (t('form:error-sending-otp') ?? 'Failed to send OTP')
          )
        },
      }
    )
  }

  const handleConfirmDeletion = (code: string) => {
    setErrorMessage(null)

    confirmDeletion(
      { email, code: code.trim() },
      {
        onSuccess: () => {
          setStep('success')
        },
        onError: (error: any) => {
          setErrorMessage(
            error?.response?.data?.message ||
              (t('form:error-invalid-otp') ?? 'Invalid or expired OTP code')
          )
        },
      }
    )
  }

  const handleResend = () => {
    if (countdown === 0 && email) {
      handleSendOtp(email)
    }
  }

  return (
    <AuthPageLayout variant="admin">
      <AuthHeader
        title={t('Delete your account') || 'Delete your account'}
        subtitle={
          t('auth-delete-account-subtitle') ||
          'Confirm your identity to permanently delete your account.'
        }
      />

      {step === 'send' ? (
        <Form<{ email: string }>
          validationSchema={emailSchema}
          onSubmit={({ email: enteredEmail }) => handleSendOtp(enteredEmail)}
          useFormProps={{ defaultValues: { email: '' } }}
        >
          {({ register, formState: { errors } }) => (
            <div className="w-full space-y-3">
              <Input
                label={t('form:input-label-email') || 'Email'}
                {...register('email')}
                type="email"
                variant="outline"
                className="mb-4"
                error={t(errors?.email?.message ?? '')}
              />
              <Button type="submit" className="w-full" loading={isSendingOtp}>
                {t('Get OTP') || 'Get OTP'}
              </Button>
            </div>
          )}
        </Form>
      ) : null}

      {step === 'verify' ? (
        <Form<{ code: string }>
          validationSchema={codeSchema}
          onSubmit={({ code }) => handleConfirmDeletion(code)}
          useFormProps={{ defaultValues: { code: '' } }}
        >
          {({ register, formState: { errors }, setValue }) => (
            <div className="w-full space-y-3">
              <p className="text-sm text-body mb-2">
                {t('Code sent to') || 'Code sent to'} <strong>{email}</strong>
              </p>
              <Input
                label={t('Enter verification code') || 'Enter verification code'}
                {...register('code')}
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                variant="outline"
                className="mb-4"
                error={t(errors?.code?.message ?? '')}
                placeholder="000000"
                maxLength={6}
                autoComplete="one-time-code"
                onChange={(event) => {
                  const value = event.target.value.replace(/[^0-9]/g, '')
                  setValue('code', value, { shouldValidate: true })
                }}
              />
              <Button
                type="submit"
                className="w-full"
                loading={isConfirmingDeletion}
                disabled={isConfirmingDeletion}
              >
                {t('Confirm account deletion') || 'Confirm account deletion'}
              </Button>
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isSendingOtp || countdown > 0}
                  className={`text-sm ${
                    countdown > 0
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-accent hover:text-accent-hover underline'
                  }`}
                >
                  {countdown > 0
                    ? `${t('Resend in') || 'Resend in'} ${formatCountdown(countdown)}`
                    : t('Resend OTP') || 'Resend OTP'}
                </button>
              </div>
            </div>
          )}
        </Form>
      ) : null}

      {step === 'success' ? (
        <div className="mx-auto w-full rounded border border-gray-200 bg-white p-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700 font-semibold">
            OK
          </div>
          <h4 className="mb-2 text-lg font-semibold text-heading">
            {t('Account deleted successfully') || 'Account deleted successfully'}
          </h4>
          <p className="text-sm text-body">
            {t('Your account has been removed and your current session is cleared.') ||
              'Your account has been removed and your current session is cleared.'}
          </p>
        </div>
      ) : null}

      {errorMessage ? (
        <Alert
          message={errorMessage}
          variant="error"
          closeable
          className="mt-5"
          onClose={() => setErrorMessage(null)}
        />
      ) : null}
    </AuthPageLayout>
  )
}
