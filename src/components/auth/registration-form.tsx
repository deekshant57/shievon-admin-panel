import Alert from '@/components/ui/alert';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { Routes } from '@/config/routes';
import { useTranslation } from 'next-i18next';
import * as yup from 'yup';
import Link from '@/components/ui/link';
import Form from '@/components/ui/forms/form';
import {
  allowedRoles,
  hasAccess,
  setAuthCredentials,
} from '@/utils/auth-utils';
import { useSendRegistrationOtp, useVerifyRegistrationOtp } from '@/data/user';
import type { SendRegistrationOtpInput, VerifyRegistrationOtpInput } from '@/types';

// Step 1: Name and Email schema
const registrationFormSchema = yup.object().shape({
  name: yup.string().required('form:error-name-required'),
  email: yup
    .string()
    .email('form:error-email-format')
    .required('form:error-email-required'),
});

// Step 2: OTP schema
const otpFormSchema = yup.object().shape({
  code: yup
    .string()
    .required('form:error-otp-required')
    .min(6, 'form:error-otp-invalid')
    .max(6, 'form:error-otp-invalid'),
});

const defaultRegistrationValues = {
  name: '',
  email: '',
};

const defaultOtpValues = {
  code: '',
};

// Helper function to format countdown time
const formatCountdown = (seconds: number): string => {
  if (seconds <= 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }
  return `${minutes}m ${remainingSeconds}s`;
};

const RegistrationForm = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [step, setStep] = useState<'registration' | 'otp'>('registration');
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(0);

  const { mutate: sendOtp, isLoading: isSendingOtp } = useSendRegistrationOtp();
  const { mutate: verifyOtp, isLoading: isVerifyingOtp } = useVerifyRegistrationOtp();

  // Update countdown based on expiry time
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => {
          if (prev <= 1) return 0;
          return prev - 1;
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  function onSendOtp({ name: nameValue, email: emailValue }: { name: string; email: string }) {
    setName(nameValue);
    setEmail(emailValue);
    sendOtp(
      {
        email: emailValue,
        name: nameValue,
        role: 'Store owner', // Hardcoded as per requirement
      },
      {
        onSuccess: (data) => {
          setStep('otp');
          setErrorMessage(null);
          // Reset OTP input to empty
          // Calculate countdown from expires_at
          if (data?.expires_at) {
            const expiryTime = new Date(data.expires_at).getTime();
            const currentTime = new Date().getTime();
            const secondsRemaining = Math.max(0, Math.floor((expiryTime - currentTime) / 1000));
            setCountdown(secondsRemaining);
          } else {
            setCountdown(60); // Fallback to 60 seconds if expires_at is not available
          }
        },
        onError: (error: any) => {
          const errorMsg = error?.response?.data?.message || 'form:error-sending-otp';
          setErrorMessage(errorMsg);
        },
      }
    );
  }

  function onVerifyOtp({ code }: { code: string }) {
    verifyOtp(
      {
        email,
        code,
        name,
      },
      {
        onSuccess: (data) => {
          if (data?.token) {
            if (hasAccess(allowedRoles, data?.permissions)) {
              setAuthCredentials(data?.token, data?.permissions, data?.role);
              router.push(Routes.dashboard);
              return;
            }
            setErrorMessage('form:error-enough-permission');
          } else {
            setErrorMessage('form:error-credential-wrong');
          }
        },
        onError: (error: any) => {
          const errorMsg = error?.response?.data?.message || 'form:error-invalid-otp';
          setErrorMessage(errorMsg);
        },
      }
    );
  }

  const handleBackToRegistration = () => {
    setStep('registration');
    setErrorMessage(null);
  };

  const handleResendOtp = () => {
    if (countdown === 0) {
      onSendOtp({ name, email });
    }
  };

  if (step === 'otp') {
    return (
      <>
        <Form<{ code: string }>
          key={`otp-form-${step}`}
          validationSchema={otpFormSchema}
          onSubmit={onVerifyOtp}
          useFormProps={{ 
            defaultValues: { code: '' }
          }}
        >
          {({ register, formState: { errors }, setValue }) => (
            <>
              <div className="mb-4">
                <p className="text-sm text-body mb-2">
                  {t('OTP sent to') || 'OTP sent to'} {email}
                </p>
                <button
                  type="button"
                  onClick={handleBackToRegistration}
                  className="text-sm text-accent hover:text-accent-hover underline"
                >
                  {t('Change email') || 'Change email'}
                </button>
              </div>
              <Input
                label={t('Enter OTP') || 'Enter OTP'}
                {...register('code')}
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                variant="outline"
                className="mb-4"
                error={t(errors?.code?.message!)}
                placeholder="000000"
                maxLength={6}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                onKeyPress={(e) => {
                  if (!/[0-9]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setValue('code', value, { shouldValidate: true });
                }}
              />
              <Button className="w-full" loading={isVerifyingOtp} disabled={isVerifyingOtp}>
                {t('Verify & Register') || 'Verify & Register'}
              </Button>
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isSendingOtp || countdown > 0}
                  className={`text-sm ${
                    countdown > 0
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-accent hover:text-accent-hover underline'
                  }`}
                >
                  {countdown > 0
                    ? `${t('Resend OTP in') || 'Resend OTP in'} ${formatCountdown(countdown)}`
                    : t('Resend OTP') || 'Resend OTP'}
                </button>
              </div>
            </>
          )}
        </Form>
        {errorMessage ? (
          <Alert
            message={errorMessage}
            variant="error"
            closeable={true}
            className="mt-5"
            onClose={() => setErrorMessage(null)}
          />
        ) : null}
      </>
    );
  }

  return (
    <>
      <Form<{ name: string; email: string }>
        validationSchema={registrationFormSchema}
        onSubmit={onSendOtp}
        useFormProps={{ defaultValues: defaultRegistrationValues }}
      >
        {({ register, formState: { errors } }) => (
          <>
            <Input
              label={t('Name') || 'Name'}
              {...register('name')}
              variant="outline"
              className="mb-4"
              error={t(errors?.name?.message!)}
            />
            <Input
              label={t('Email') || 'Email'}
              {...register('email')}
              type="email"
              variant="outline"
              className="mb-4"
              error={t(errors?.email?.message!)}
            />
            <Button className="w-full" loading={isSendingOtp} disabled={isSendingOtp}>
              {t('Send OTP') || 'Send OTP'}
            </Button>
          </>
        )}
      </Form>
      {errorMessage ? (
        <Alert
          message={errorMessage}
          variant="error"
          closeable={true}
          className="mt-5"
          onClose={() => setErrorMessage(null)}
        />
      ) : null}
      <div className="relative flex flex-col items-center justify-center mt-8 mb-6 text-sm text-heading sm:mt-11 sm:mb-8">
        <hr className="w-full" />
        <span className="start-2/4 -ms-4 absolute -top-2.5 bg-light px-2">
          {t('Or') || 'Or'}
        </span>
      </div>
      <div className="text-sm text-center text-body sm:text-base">
        {t('Already have an account?') || 'Already have an account?'}{' '}
        <Link
          href={Routes.login}
          className="font-semibold underline transition-colors duration-200 ms-1 text-accent hover:text-accent-hover hover:no-underline focus:text-accent-700 focus:no-underline focus:outline-none"
        >
          {t('Login') || 'Login'}
        </Link>
      </div>
    </>
  );
};

export default RegistrationForm;
