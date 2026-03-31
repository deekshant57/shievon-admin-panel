import { useEffect, useMemo, useState } from 'react';
import Alert from '@/components/ui/alert';
import { useForgetPasswordMutation } from '@/data/user';
import dynamic from 'next/dynamic';
import { useTranslation } from 'next-i18next';
import Button from '@/components/ui/button';
import { getFormErrors } from '@/data/client/http-client';
import PageLoader from '@/components/ui/page-loader/page-loader';

const EnterEmailView = dynamic(() => import('./enter-email-view'));

const getCooldownSecondsFromMessage = (message?: string) => {
  if (!message) return 0;
  const match = message.match(/please wait\s+(\d+)\s+seconds/i);
  return match ? Number(match[1]) : 0;
};

const ForgotPassword = () => {
  const { t } = useTranslation();
  const { mutate: forgetPassword, isLoading } = useForgetPasswordMutation();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setCooldownSeconds((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldownSeconds]);

  const resendText = useMemo(() => {
    if (cooldownSeconds > 0) {
      return t('form:text-resend-in', { seconds: cooldownSeconds });
    }
    return t('form:text-resend-reset-link');
  }, [cooldownSeconds, t]);

  function requestResetLink(email: string) {
    setErrorMsg(null);
    forgetPassword(
      {
        email,
      },
      {
        onSuccess: (data) => {
          if (data?.success) {
            setSubmittedEmail(email);
            setSuccessMsg(
              data?.message || 'Password reset link sent successfully'
            );
            setCooldownSeconds(0);
          } else {
            const message = data?.message || 'Unable to send reset link';
            setErrorMsg(message);
            setCooldownSeconds(getCooldownSecondsFromMessage(message));
          }
        },
        onError: (error: unknown) => {
          const message =
            getFormErrors(error) ||
            (error as Error)?.message ||
            'Unable to send reset link';
          setErrorMsg(message);
          setCooldownSeconds(getCooldownSecondsFromMessage(message));
        },
      }
    );
  }

  function handleEmailSubmit({ email }: { email: string }) {
    requestResetLink(email);
  }

  if (isLoading) {
    return <PageLoader />
  }

  return (
    <>
      {errorMsg && (
        <Alert
          variant="error"
          message={errorMsg}
          className="mb-6"
          closeable={true}
          onClose={() => setErrorMsg(null)}
        />
      )}

      {successMsg && (
        <Alert
          variant="success"
          message={successMsg}
          className="mb-6"
          closeable={true}
          onClose={() => setSuccessMsg(null)}
        />
      )}

      {!submittedEmail && (
        <EnterEmailView loading={isLoading} onSubmit={handleEmailSubmit} />
      )}

      {submittedEmail && (
        <div className="space-y-4">
          <p className="text-center text-sm text-body">
            {t('form:text-reset-link-email-sent', { email: submittedEmail })}
          </p>
          <Button
            type="button"
            className="h-11 w-full"
            loading={isLoading}
            disabled={isLoading || cooldownSeconds > 0}
            onClick={() => requestResetLink(submittedEmail)}
          >
            {resendText}
          </Button>
        </div>
      )}
    </>
  );
};

export default ForgotPassword;
