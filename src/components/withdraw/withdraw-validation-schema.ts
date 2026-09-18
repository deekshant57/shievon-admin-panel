import * as yup from 'yup';

export const withdrawValidationSchema = yup.object().shape({
  amount: yup
    .number()
    .typeError('form:error-amount-must-number')
    .positive('form:error-amount-must-positive')
    .min(500, 'form:error-min-payout-amount')
    .required('form:error-amount-required'),
  note: yup.string().nullable().optional(),
  balance_kind: yup.string().nullable().optional(),
});
