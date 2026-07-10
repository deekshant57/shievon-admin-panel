import Button from '@/components/ui/button';
import PasswordInput from '@/components/ui/password-input';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslation } from 'next-i18next';

interface Props {
  onSubmit: (values: { password: string }) => void;
  loading: boolean;
}

const schema = yup.object().shape({
  password: yup
    .string()
    .required('form:error-password-required')
    .min(8, 'form:error-password-min-length-8'),
  confirm_password: yup
    .string()
    .required('form:error-confirm-password')
    .oneOf([yup.ref('password')], 'form:error-match-passwords'),
});

const EnterNewPasswordView = ({ onSubmit, loading }: Props) => {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ password: string; confirm_password: string }>({
    resolver: yupResolver(schema),
  });

  return (
    <form
      onSubmit={handleSubmit(({ password }) => {
        onSubmit({ password });
      })}
      noValidate
    >
      <PasswordInput
        label={t('form:input-label-password')}
        {...register('password')}
        error={t(errors.password?.message!)}
        variant="outline"
        className="mb-5"
      />
      <PasswordInput
        label={t('form:input-label-confirm-password')}
        {...register('confirm_password')}
        error={t(errors.confirm_password?.message!)}
        variant="outline"
        className="mb-5"
      />

      <Button type="submit" className="h-11 w-full" loading={loading} disabled={loading}>
        {t('form:text-reset-password')}
      </Button>
    </form>
  );
};

export default EnterNewPasswordView;
