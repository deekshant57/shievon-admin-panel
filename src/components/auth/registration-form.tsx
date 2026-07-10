import Alert from '@/components/ui/alert';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import * as yup from 'yup';
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
import PasswordInput from '@/components/ui/password-input';
import { Routes } from '@/config/routes';

const registrationFormSchema = yup.object().shape({
  name: yup
    .string()
    .required('form:error-name-required')
    .min(2, 'form:error-name-required'),
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
          setErrorMessage(
            t('form:error-credential-wrong') || 'Registration failed',
          );
          return;
        }
        if (!hasAccess(allowedRoles, data.permissions)) {
          setErrorMessage(
            t('form:error-enough-permission') || 'Insufficient permission',
          );
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
          typeof msg === 'string'
            ? msg
            : t('form:error-credential-wrong') || 'Registration failed',
        );
      },
    });
  }

  return (
    <Form<RegisterInput>
      validationSchema={registrationFormSchema}
      onSubmit={onSubmit}
      useFormProps={{ defaultValues: defaultRegistrationValues }}
    >
      {({ register, formState: { errors } }) => (
        <div className="space-y-4">
          <Input
            label={t('form:input-label-name') || 'Name'}
            {...register('name')}
            variant="outline"
            error={t(errors?.name?.message ?? '')}
          />
          <Input
            label={t('form:input-label-email')}
            {...register('email')}
            type="email"
            variant="outline"
            error={t(errors?.email?.message ?? '')}
          />
          <PasswordInput
            label={t('form:input-label-password')}
            name="password"
            {...register('password')}
            variant="outline"
            required={true}
            error={
              errors?.password?.message ? t(errors.password.message) : undefined
            }
          />

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
            loading={isRegistering}
            disabled={isRegistering}
          >
            {t('form:text-register') || 'Register'}
          </Button>
        </div>
      )}
    </Form>
  );
};

export default RegistrationForm;
