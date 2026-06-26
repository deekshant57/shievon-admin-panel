import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import PasswordInput from '@/components/ui/password-input';
import { useTranslation } from 'next-i18next';
import * as yup from 'yup';
import Link from '@/components/ui/link';
import Form from '@/components/ui/forms/form';
import { Routes } from '@/config/routes';
import { useLogin } from '@/data/user';
import type { LoginInput } from '@/types';
import { useState } from 'react';
import Alert from '@/components/ui/alert';
import { useRouter } from 'next/router';
import {
  allowedRoles,
  hasAccess,
  setAuthCredentials,
  setEmailVerified,
} from '@/utils/auth-utils';
import { getFormErrors } from '@/data/client/http-client';

const loginFormSchema = yup.object().shape({
  email: yup
    .string()
    .email('form:error-email-format')
    .required('form:error-email-required'),
  password: yup.string().required('form:error-password-required'),
});

const defaultLoginValues: LoginInput = {
  email: '',
  password: '',
};

const LoginForm = () => {
  const { t } = useTranslation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const { mutate: login, isLoading: isLoggingIn } = useLogin();

  const loginText = t('form:button-label-login');
  const loginLabel =
    loginText === 'form:button-label-login' ? 'Login' : loginText;

  function onSubmit(variables: LoginInput) {
    setErrorMessage(null);
    login(variables, {
      onSuccess: (data) => {
        const permissionGranted = hasAccess(allowedRoles, data.permissions);
        if (!data?.token) {
          setErrorMessage(
            t('form:error-credential-wrong') || 'Invalid credentials',
          );
          return;
        }
        if (!permissionGranted) {
          setErrorMessage(
            t('form:error-enough-permission') || 'Insufficient permission',
          );
          return;
        }
        setAuthCredentials(data.token, data.permissions, data.role);
        if (data.isEmailVerified === false) {
          setEmailVerified(false);
          router.push({
            pathname: Routes.verifyEmail,
            query: { email: variables.email },
          });
          return;
        }
        const queryNext =
          typeof router.query?.next === 'string' ? router.query.next : '';
        const nextPath =
          queryNext.startsWith('/') && !queryNext.startsWith('//')
            ? queryNext
            : Routes.dashboard;
        router.push(nextPath);
      },
      onError: (error: unknown) => {
        const msg = getFormErrors(error) || (error as Error)?.message;
        setErrorMessage(
          typeof msg === 'string'
            ? msg
            : t('form:error-credential-wrong') || 'Login failed',
        );
      },
    });
  }

  return (
    <Form<LoginInput>
      validationSchema={loginFormSchema}
      onSubmit={onSubmit}
      useFormProps={{ defaultValues: defaultLoginValues }}
    >
      {({ register, formState: { errors } }) => (
        <div className="space-y-4">
          <Input
            label={t('form:input-label-email')}
            {...register('email')}
            type="email"
            variant="outline"
            error={t(errors?.email?.message ?? '')}
          />
          <div>
            <PasswordInput
              label={t('form:input-label-password')}
              {...register('password')}
              variant="outline"
              required={true}
              error={
                errors?.password?.message
                  ? t(errors.password.message)
                  : undefined
              }
            />
            <div className="mt-2 text-end">
              <Link
                href={Routes.forgotPassword}
                className="text-sm font-medium text-accent transition-colors duration-200 hover:text-accent-hover focus:text-accent-700 focus:outline-none"
              >
                {t('form:input-forgot-password-label')}
              </Link>
            </div>
          </div>

          {errorMessage ? (
            <Alert
              message={errorMessage}
              variant="error"
              closeable={true}
              onClose={() => setErrorMessage(null)}
            />
          ) : null}

          <Button
            type="submit"
            className="h-11 w-full"
            loading={isLoggingIn}
            spinnerColor="rgb(var(--color-accent))"
            disabled={isLoggingIn}
          >
            {loginLabel}
          </Button>
        </div>
      )}
    </Form>
  );
};

export default LoginForm;
