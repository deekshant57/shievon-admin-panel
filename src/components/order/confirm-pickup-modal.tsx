import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslation } from 'next-i18next';
import Modal from '@/components/ui/modal/modal';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import ValidationError from '@/components/ui/form-validation-error';

type FormValues = {
  quantity: number;
};

type ConfirmPickupModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (quantity?: number) => void;
  maxQuantity: number;
  isLoading?: boolean;
};

export default function ConfirmPickupModal({
  open,
  onClose,
  onConfirm,
  maxQuantity,
  isLoading = false,
}: ConfirmPickupModalProps) {
  const { t } = useTranslation();

  const validationSchema = yup.object().shape({
    quantity: yup
      .number()
      .typeError('form:error-value-required')
      .required('form:error-value-required')
      .min(1, 'form:error-value-required')
      .max(maxQuantity, 'form:error-value-required'),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { quantity: maxQuantity },
    resolver: yupResolver(validationSchema),
  });

  useEffect(() => {
    if (open) {
      reset({ quantity: maxQuantity });
    }
  }, [open, maxQuantity, reset]);

  function handleClose() {
    reset({ quantity: maxQuantity });
    onClose();
  }

  function onSubmit({ quantity }: FormValues) {
    onConfirm(quantity);
    reset({ quantity: maxQuantity });
  }

  return (
    <Modal open={open} onClose={handleClose}>
      <div className="m-auto w-full max-w-md rounded bg-light p-5 sm:p-8">
        <h3 className="mb-5 text-lg font-semibold text-heading">
          {t('form:button-confirm-pickup')}
        </h3>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Input
            label={t('form:input-label-pickup-quantity')}
            type="number"
            min={1}
            max={maxQuantity}
            {...register('quantity', { valueAsNumber: true })}
            error={t(errors.quantity?.message)}
            required
          />
          <ValidationError message={t(errors.quantity?.message)} />
          <p className="mt-2 text-sm text-body">
            {t('table:table-item-picked-quantity')}: {maxQuantity}
          </p>
          <div className="mt-5 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleClose}>
              {t('common:button-cancel')}
            </Button>
            <Button type="submit" loading={isLoading}>
              {t('form:button-confirm-pickup')}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
