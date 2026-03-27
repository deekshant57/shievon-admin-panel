import { useForm } from 'react-hook-form';
import Button from '@/components/ui/button';
import Card from '@/components/common/card';
import Description from '@/components/ui/description';
import { toast } from 'react-toastify';
import PasswordInput from '@/components/ui/password-input';
import { useChangePasswordMutation } from '@/data/user';
import { Routes } from '@/config/routes';
import { useTranslation } from 'next-i18next';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useRouter } from 'next/router';

interface FormValues {
  oldPassword: string;
  newPassword: string;
  passwordConfirmation: string;
}

const changePasswordSchema = yup.object().shape({
  oldPassword: yup
    .string()
    .required('form:error-old-password-required')
    .min(6, 'form:error-password-length'),
  newPassword: yup
    .string()
    .required('form:error-password-required')
    .min(6, 'form:error-password-length')
    .test(
      'not-same-as-old',
      'form:error-password-same-as-old',
      function (value) {
        const oldPassword = this.parent?.oldPassword as string | undefined;
        if (!value || !oldPassword) return true;
        return value !== oldPassword;
      },
    ),
  passwordConfirmation: yup
    .string()
    .oneOf([yup.ref('newPassword')], 'form:error-match-passwords')
    .required('form:error-confirm-password'),
});

const ChangePasswordForm = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { mutate: changePassword, isLoading: loading } =
    useChangePasswordMutation();
  const {
    register,
    handleSubmit,
    setError,
    reset,

    formState: { errors },
  } = useForm<FormValues>({
    resolver: yupResolver(changePasswordSchema),
  });

  async function onSubmit(values: FormValues) {
    changePassword(
      {
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      },
      {
        onError: (error: any) => {
          const message = error?.response?.data?.message;
          if (message) {
            setError('oldPassword', {
              type: 'manual',
              message,
            });
          }
        },
        onSuccess: () => {
          toast.success(t('common:password-changed-successfully'));
          reset();
          router.replace(Routes.dashboard);
        },
      }
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      <div className="my-5 flex flex-wrap sm:my-8">
        <Description
          title={t('form:input-label-password')}
          details={t('form:password-help-text')}
          className="sm:pe-4 md:pe-5 w-full px-0 pb-5 sm:w-4/12 sm:py-8 md:w-1/3"
        />

        <Card className="mb-5 w-full sm:w-8/12 md:w-2/3">
          <PasswordInput
            label={t('form:input-label-old-password')}
            {...register('oldPassword')}
            variant="outline"
            error={t(errors.oldPassword?.message!)}
            className="mb-5"
          />
          <PasswordInput
            label={t('form:input-label-new-password')}
            {...register('newPassword')}
            variant="outline"
            error={t(errors.newPassword?.message!)}
            className="mb-5"
          />
          <PasswordInput
            label={t('form:input-label-confirm-password')}
            {...register('passwordConfirmation')}
            variant="outline"
            error={t(errors.passwordConfirmation?.message!)}
          />
        </Card>

        <div className="text-end w-full">
          <Button loading={loading} disabled={loading}>
            {t('form:button-label-change-password')}
          </Button>
        </div>
      </div>
    </form>
  );
};
export default ChangePasswordForm;
