import * as yup from 'yup';

export const profileValidationSchema = yup.object().shape({
  first_name: yup.string().required('form:error-name-required'),
  last_name: yup.string().optional(),
  profile: yup.object().shape({
    contact: yup.string().max(19, 'maximum 19 digit').optional(),
  }),
});
