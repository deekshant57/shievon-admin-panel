import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { useTranslation } from 'next-i18next';
import * as yup from 'yup';
import Link from '@/components/ui/link';
import Form from '@/components/ui/forms/form';
import { Routes } from '@/config/routes';
import { useLogin } from '@/data/user';
import type { LoginInput } from '@/types';
import { useState } from 'react';
import Alert from '@/components/ui/alert';
import Router from 'next/router';
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

  const { mutate: login, isLoading: isLoggingIn } = useLogin();

  const loginText = t('form:button-label-login')
  const loginLabel = loginText === 'form:button-label-login' ? 'Login' : loginText

  function onSubmit(variables: LoginInput) {
    setErrorMessage(null);
    login(variables, {
      onSuccess: (data) => {
        if (!data?.token) {
          setErrorMessage(t('form:error-credential-wrong') || 'Invalid credentials');
          return;
        }
        if (!hasAccess(allowedRoles, data.permissions)) {
          setErrorMessage(t('form:error-enough-permission') || 'Insufficient permission');
          return;
        }
        setAuthCredentials(data.token, data.permissions, data.role);
        if (data.isEmailVerified === false) {
          setEmailVerified(false);
          Router.push({
            pathname: Routes.verifyEmail,
            query: { email: variables.email },
          });
          return;
        }
        Router.push(Routes.dashboard);
      },
      onError: (error: unknown) => {
        const msg = getFormErrors(error) || (error as Error)?.message;
        setErrorMessage(typeof msg === 'string' ? msg : t('form:error-credential-wrong') || 'Login failed');
      },
    });
  }

  return (
    <>
      <Form<LoginInput>
        validationSchema={loginFormSchema}
        onSubmit={onSubmit}
        useFormProps={{ defaultValues: defaultLoginValues }}
      >
        {({ register, formState: { errors } }) => (
          <>
            <Input
              label={t('form:input-label-email')}
              {...register('email')}
              type="email"
              variant="outline"
              className="mb-4"
              error={t(errors?.email?.message ?? '')}
            />
            <Input
              label={t('form:input-label-password')}
              {...register('password')}
              type="password"
              variant="outline"
              className="mb-4"
              error={t(errors?.password?.message ?? '')}
            />
            <Button className="w-full" loading={isLoggingIn} disabled={isLoggingIn}>
              {loginLabel}
            </Button>

            <div className="relative mt-8 mb-6 flex flex-col items-center justify-center text-sm text-heading sm:mt-11 sm:mb-8">
              <hr className="w-full" />
              <span className="absolute -top-2.5 bg-light px-2 -ms-4 start-2/4">
                {t('common:text-or')}
              </span>
            </div>

            <div className="text-center text-sm text-body sm:text-base">
              {t('form:text-no-account')}{' '}
              <Link
                href={Routes.register}
                className="font-semibold text-accent underline transition-colors duration-200 ms-1 hover:text-accent-hover hover:no-underline focus:text-accent-700 focus:no-underline focus:outline-none"
              >
                {t('form:link-register-shop-owner')}
              </Link>
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
};

export default LoginForm;
