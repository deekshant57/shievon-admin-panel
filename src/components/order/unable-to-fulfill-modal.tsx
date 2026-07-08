import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslation } from 'next-i18next';
import Modal from '@/components/ui/modal/modal';
import Button from '@/components/ui/button';
import TextArea from '@/components/ui/text-area';
import ValidationError from '@/components/ui/form-validation-error';

type FormValues = {
  reason: string;
};

const validationSchema = yup.object().shape({
  reason: yup.string().required('form:error-message-required'),
});

type UnableToFulfillModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isLoading?: boolean;
};

export default function UnableToFulfillModal({
  open,
  onClose,
  onConfirm,
  isLoading = false,
}: UnableToFulfillModalProps) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { reason: '' },
    resolver: yupResolver(validationSchema),
  });

  function handleClose() {
    reset();
    onClose();
  }

  function onSubmit({ reason }: FormValues) {
    onConfirm(reason);
    reset();
  }

  return (
    <Modal open={open} onClose={handleClose}>
      <div className="m-auto w-full max-w-lg rounded bg-light p-5 sm:p-8">
        <h3 className="mb-5 text-lg font-semibold text-heading">
          {t('common:text-unable-to-fulfill')}
        </h3>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <TextArea
            label={t('form:input-label-unable-reason')}
            {...register('reason')}
            placeholder={t('form:placeholder-unable-reason')}
            error={t(errors.reason?.message)}
            required
          />
          <ValidationError message={t(errors.reason?.message)} />
          <div className="mt-5 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleClose}>
              {t('common:button-cancel')}
            </Button>
            <Button type="submit" loading={isLoading} variant="custom">
              {t('form:button-unable-to-fulfill')}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
