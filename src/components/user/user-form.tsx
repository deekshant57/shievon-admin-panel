import ActionButton from '@/components/ui/action-button';
import Input from '@/components/ui/input';
import PasswordInput from '@/components/ui/password-input';
import { useForm } from 'react-hook-form';
import FormSection from '@/components/page/form-section';
import { useRegisterMutation } from '@/data/user';
import { useTranslation } from 'next-i18next';
import { yupResolver } from '@hookform/resolvers/yup';
import { customerValidationSchema } from './user-validation-schema';
import StickyFooterPanel from '@/components/ui/sticky-footer-panel';
import { useRouter } from 'next/router';
import { Routes } from '@/config/routes';

type FormValues = {
  name: string;
  email: string;
  password: string;
};

const defaultValues = {
  email: '',
  password: '',
};

const CustomerCreateForm = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { mutate: registerUser, isLoading: loading } = useRegisterMutation();

  const {
    register,
    handleSubmit,
    setError,

    formState: { errors },
  } = useForm<FormValues>({
    defaultValues,
    resolver: yupResolver(customerValidationSchema),
  });

  async function onSubmit({ name, email, password }: FormValues) {
    registerUser(
      {
        name,
        email,
        password,
      },
      {
        onError: (error: any) => {
          Object.keys(error?.response?.data).forEach((field: any) => {
            setError(field, {
              type: 'manual',
              message: error?.response?.data[field][0],
            });
          });
        },
        onSuccess: (data) => {
          if (data) {
            router.push(Routes.user.list);
          }
        },
      }
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-2">
      <FormSection
        title={t('form:form-title-information')}
        details={t('form:customer-form-info-help-text')}
      >
        <Input
          label={t('form:input-label-name')}
          {...register('name')}
          type="text"
          variant="outline"
          className="mb-5"
          error={t(errors.name?.message!)}
          required
        />
        <Input
          label={t('form:input-label-email')}
          {...register('email')}
          type="email"
          variant="outline"
          className="mb-5"
          error={t(errors.email?.message!)}
          required
        />
        <PasswordInput
          label={t('form:input-label-password')}
          {...register('password')}
          error={t(errors.password?.message!)}
          variant="outline"
          className="mb-5"
          required
        />
      </FormSection>
      <StickyFooterPanel className="z-0">
        <div className="flex flex-col-reverse gap-3 text-end sm:flex-row sm:justify-end">
          <ActionButton
            type="submit"
            variant="primary"
            size="sm"
            loading={loading}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {t('form:button-label-create-customer')}
          </ActionButton>
        </div>
      </StickyFooterPanel>
    </form>
  );
};

export default CustomerCreateForm;
