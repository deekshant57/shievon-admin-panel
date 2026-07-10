import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { AuthHeader } from '@/components/auth/layout';
import {
  useSendVerifyEmailOtp,
  useVerifyEmailOtp,
  useLogoutMutation,
  useMeQuery,
} from '@/data/user';
import { Routes } from '@/config/routes';
import { useRouter } from 'next/router';
import AuthPageLayout from '@/components/layouts/auth-layout';
import { useTranslation } from 'next-i18next';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { getEmailVerified, setAuthCredentials, setEmailVerified } from '@/utils/auth-utils';
import { useState, useEffect } from 'react';
import Form from '@/components/ui/forms/form';
import * as yup from 'yup';
import Alert from '@/components/ui/alert';

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale!, ['common', 'form'])),
  },
});

const emailSchema = yup.object().shape({
  email: yup
    .string()
    .email('form:error-email-format')
    .required('form:error-email-required'),
});

const codeSchema = yup.object().shape({
  code: yup
    .string()
    .required('form:error-otp-required')
    .min(6, 'form:error-otp-invalid')
    .max(6, 'form:error-otp-invalid'),
});

function formatCountdown(seconds: number): string {
  if (seconds <= 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) return `${minutes}m`;
  return `${minutes}m ${remainingSeconds}s`;
}

export default function VerifyEmailPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const queryEmail = typeof router.query.email === 'string' ? router.query.email : '';

  const [email, setEmail] = useState(queryEmail);
  const [step, setStep] = useState<'send' | 'verify'>(queryEmail ? 'send' : 'send');
  const [countdown, setCountdown] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useMeQuery();

  const { mutate: sendOtp, isLoading: isSendingOtp } = useSendVerifyEmailOtp();
  const { mutate: verifyOtp, isLoading: isVerifyingOtp } = useVerifyEmailOtp();
  const { mutate: logout, isLoading: isLoggingOut } = useLogoutMutation();

  const { emailVerified } = getEmailVerified();
  useEffect(() => {
    if (emailVerified) {
      router.replace(Routes.dashboard);
    }
  }, [emailVerified, router]);

  // Sync email from query when it appears (e.g. client-side redirect from login)
  useEffect(() => {
    if (queryEmail && !email) {
      setEmail(queryEmail);
    }
  }, [queryEmail, email]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendCode = (emailValue: string) => {
    setErrorMessage(null);
    setEmail(emailValue);
    sendOtp(
      { email: emailValue },
      {
        onSuccess: (data) => {
          setStep('verify');
          if (data?.expires_at) {
            const expiryTime = new Date(data.expires_at).getTime();
            const currentTime = Date.now();
            setCountdown(Math.max(0, Math.floor((expiryTime - currentTime) / 1000)));
          } else {
            setCountdown(60);
          }
        },
        onError: (error: any) => {
          setErrorMessage(
            error?.response?.data?.message || t('form:error-sending-otp') || 'Failed to send code'
          );
        },
      }
    );
  };

  const handleVerify = (code: string) => {
    setErrorMessage(null);
    verifyOtp(
      { email, code },
      {
        onSuccess: (data) => {
          if (data?.token) {
            setAuthCredentials(data.token, data.permissions, data.role);
            setEmailVerified(true);
            router.replace(Routes.dashboard);
            return;
          }
          setErrorMessage(t('form:error-invalid-otp') || 'Invalid code');
        },
        onError: (error: any) => {
          setErrorMessage(
            error?.response?.data?.message || t('form:error-invalid-otp') || 'Invalid code'
          );
        },
      }
    );
  };

  const handleResend = () => {
    if (countdown === 0) handleSendCode(email);
  };

  return (
    <AuthPageLayout variant="admin">
      <AuthHeader
        title={t('email-not-verified') || 'Verify your email'}
        subtitle={t('auth-verify-subtitle')}
      />

      {step === 'send' ? (
        <>
          {queryEmail ? (
            <div className="w-full space-y-3">
              <p className="text-sm text-body mb-2">
                {t('Verification code will be sent to') || 'Verification code will be sent to'}{' '}
                <strong>{queryEmail}</strong>
              </p>
              <Button
                type="button"
                onClick={() => handleSendCode(queryEmail)}
                disabled={isSendingOtp}
                className="w-full"
              >
                {t('Send verification code') || 'Send verification code'}
              </Button>
            </div>
          ) : (
            <Form<{ email: string }>
              validationSchema={emailSchema}
              onSubmit={({ email: e }) => handleSendCode(e)}
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
                  <Button type="submit" className="w-full" disabled={isSendingOtp}>
                    {t('Send verification code') || 'Send verification code'}
                  </Button>
                </div>
              )}
            </Form>
          )}
        </>
      ) : (
        <Form<{ code: string }>
          validationSchema={codeSchema}
          onSubmit={({ code }) => handleVerify(code)}
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
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setValue('code', value, { shouldValidate: true });
                }}
              />
              <Button type="submit" className="w-full" loading={isVerifyingOtp} disabled={isVerifyingOtp}>
                {t('Verify email') || 'Verify email'}
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
                    : t('Resend code') || 'Resend code'}
                </button>
              </div>
            </div>
          )}
        </Form>
      )}

      {errorMessage ? (
        <Alert
          message={errorMessage}
          variant="error"
          closeable
          className="mt-5"
          onClose={() => setErrorMessage(null)}
        />
      ) : null}

      <div className="mt-6 w-full">
        <Button
          type="button"
          variant="outline"
          disabled={isLoggingOut}
          className="w-full"
          onClick={() => logout()}
        >
          {t('common:authorized-nav-item-logout') || 'Logout'}
        </Button>
      </div>
    </AuthPageLayout>
  );
}
