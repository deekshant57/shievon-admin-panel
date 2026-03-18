import Alert from '@/components/ui/alert';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { useState } from 'react';
import { Routes } from '@/config/routes';
import { useTranslation } from 'next-i18next';
import * as yup from 'yup';
import Link from '@/components/ui/link';
import Form from '@/components/ui/forms/form';
import {
  allowedRoles,
  hasAccess,
  setAuthCredentials,
  setEmailVerified,
} from '@/utils/auth-utils';
import { useRegisterMutation } from '@/data/user';
import type { RegisterInput } from '@/types';
import Router from 'next/router';
import { getFormErrors } from '@/data/client/http-client';

const registrationFormSchema = yup.object().shape({
  name: yup.string().required('form:error-name-required').min(2, 'form:error-name-required'),
  email: yup
    .string()
    .email('form:error-email-format')
    .required('form:error-email-required'),
  password: yup
    .string()
    .required('form:error-password-required')
    .min(8, 'Password must be at least 8 characters'),
});

const defaultRegistrationValues: RegisterInput = {
  name: '',
  email: '',
  password: '',
  permission: 'Store owner',
};

const RegistrationForm = () => {
  const { t } = useTranslation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { mutate: register, isLoading: isRegistering } = useRegisterMutation();

  function onSubmit(variables: RegisterInput) {
    setErrorMessage(null);
    const payload: RegisterInput = {
      ...variables,
      permission: variables.permission ?? 'Store owner',
    };
    register(payload, {
      onSuccess: (data: any) => {
        if (!data?.token) {
          setErrorMessage(t('form:error-credential-wrong') || 'Registration failed');
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
        setErrorMessage(
          typeof msg === 'string' ? msg : t('form:error-credential-wrong') || 'Registration failed'
        );
      },
    });
  }

  return (
    <>
      <Form<RegisterInput>
        validationSchema={registrationFormSchema}
        onSubmit={onSubmit}
        useFormProps={{ defaultValues: defaultRegistrationValues }}
      >
        {({ register, formState: { errors } }) => (
          <>
            <Input
              label={t('form:input-label-name') || 'Name'}
              {...register('name')}
              variant="outline"
              className="mb-4"
              error={t(errors?.name?.message ?? '')}
            />
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
            <Button className="w-full" loading={isRegistering} disabled={isRegistering}>
              {'Register'}
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
          {t('common:text-or')}
        </span>
      </div>
      <div className="text-sm text-center text-body sm:text-base">
        {t('form:text-have-account') || 'Already have an account?'}{' '}
        <Link
          href={Routes.login}
          className="font-semibold underline transition-colors duration-200 ms-1 text-accent hover:text-accent-hover hover:no-underline focus:text-accent-700 focus:no-underline focus:outline-none"
        >
          {t('form:button-label-login') === 'form:button-label-login'
            ? 'Login'
            : t('form:button-label-login')}
        </Link>
      </div>
    </>
  );
};

export default RegistrationForm;
