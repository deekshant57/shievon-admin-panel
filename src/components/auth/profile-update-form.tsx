import Input from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import Button from '@/components/ui/button';
import Description from '@/components/ui/description';
import Card from '@/components/common/card';
import { useUpdateMeMutation } from '@/data/user';
import TextArea from '@/components/ui/text-area';
import { useTranslation } from 'next-i18next';
import FileInput from '@/components/ui/file-input';
import pick from 'lodash/pick';
import SwitchInput from '@/components/ui/switch-input';
import Label from '@/components/ui/label';
import { adminOnly, getAuthCredentials, hasAccess } from '@/utils/auth-utils';
import { yupResolver } from '@hookform/resolvers/yup';
import { profileValidationSchema } from './profile-validation-schema';
import PhoneNumberInput from '@/components/ui/phone-input';

type FormValues = {
  first_name: string;
  last_name: string;
  profile: {
    id: string;
    bio: string;
    contact: string;
    avatar: {
      thumbnail?: string;
      original?: string;
      id?: string;
    };
    notifications: {
      email: string;
      enable: boolean;
    };
  };
};

export default function ProfileUpdate({ me }: any) {
  const { t } = useTranslation();
  const { mutate: updateUser, isLoading: loading } = useUpdateMeMutation();
  const { permissions } = getAuthCredentials();
  let permission = hasAccess(adminOnly, permissions);

  const fullName = (me?.name ?? '').trim();
  const [firstFromName, ...restNameParts] = fullName
    ? fullName.split(' ').filter(Boolean)
    : [];
  const lastFromName = restNameParts.join(' ');

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    //@ts-ignore
    resolver: yupResolver(profileValidationSchema),
    defaultValues: {
      first_name: me?.first_name ?? firstFromName ?? '',
      last_name: me?.last_name ?? lastFromName ?? '',
      ...(me &&
        pick(me, [
          'profile.bio',
          'profile.contact',
          'profile.avatar',
          'profile.notifications.email',
          'profile.notifications.enable',
        ])),
    },
  });

  async function onSubmit(values: FormValues) {
    const { first_name, last_name, profile } = values;

    const fullName =
      [first_name, last_name]
        .filter((part) => !!part && part.trim().length > 0)
        .join(' ')
        .trim() || undefined;

    // Map form values to the flat UpdateMeInput payload expected by PUT /api/me.
    const input = {
      name: fullName,
      first_name: first_name || undefined,
      last_name: last_name || undefined,
      // Use mobile_no as the primary contact field; backend also exposes
      // phone as a separate optional field.
      mobile_no: profile?.contact,
      bio: profile?.bio,
      avatar:
        profile?.avatar?.original || profile?.avatar?.thumbnail
          ? {
              original: profile?.avatar?.original,
              thumbnail: profile?.avatar?.thumbnail,
            }
          : undefined,
    };

    updateUser(input);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-wrap pb-8 my-5 border-b border-dashed border-border-base sm:my-8">
        <Description
          title={t('form:input-label-avatar')}
          details={t('form:avatar-help-text')}
          className="w-full px-0 pb-5 sm:w-4/12 sm:py-8 sm:pe-4 md:w-1/3 md:pe-5"
        />

        <Card className="w-full sm:w-8/12 md:w-2/3">
          <FileInput name="profile.avatar" control={control} multiple={false} />
        </Card>
      </div>
      {permission ? (
        <div className="flex flex-wrap pb-8 my-5 border-b border-dashed border-border-base sm:my-8">
          <Description
            title={t('form:form-notification-title')}
            details={t('form:form-notification-description')}
            className="w-full px-0 pb-5 sm:w-4/12 sm:py-8 sm:pe-4 md:w-1/3 md:pe-5"
          />

          <Card className="w-full mb-5 sm:w-8/12 md:w-2/3">
            <Input
              label={t('form:input-notification-email')}
              {...register('profile.notifications.email')}
              error={t(errors?.profile?.notifications?.email?.message!)}
              variant="outline"
              className="mb-5"
              type="email"
            />
            <div className="flex items-center gap-x-4">
              <SwitchInput
                name="profile.notifications.enable"
                control={control}
              />
              <Label className="!mb-0.5">
                {t('form:input-enable-notification')}
              </Label>
            </div>
          </Card>
        </div>
      ) : (
        ''
      )}
      <div className="flex flex-wrap pb-8 my-5 border-b border-dashed border-border-base sm:my-8">
        <Description
          title={t('form:form-title-information')}
          details={t('form:profile-info-help-text')}
          className="w-full px-0 pb-5 sm:w-4/12 sm:py-8 sm:pe-4 md:w-1/3 md:pe-5"
        />

        <Card className="w-full mb-5 sm:w-8/12 md:w-2/3">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-5">
            <Input
              label="First Name"
              {...register('first_name')}
              error={
                errors.first_name?.message
                  ? t(errors.first_name.message)
                  : undefined
              }
              variant="outline"
            />
            <Input
              label="Last Name"
              {...register('last_name')}
              error={
                errors.last_name?.message
                  ? t(errors.last_name.message)
                  : undefined
              }
              variant="outline"
            />
          </div>
          <TextArea
            label={t('form:input-label-bio')}
            {...register('profile.bio')}
            error={t(errors.profile?.bio?.message!)}
            variant="outline"
            className="mb-6"
          />
          <PhoneNumberInput
            label={t('form:input-label-contact')}
            {...register('profile.contact')}
            control={control}
            error={t(errors.profile?.contact?.message!)}
          />
        </Card>
        <div className="w-full text-end">
          <Button loading={loading} disabled={loading}>
            {t('form:button-label-save')}
          </Button>
        </div>
      </div>
    </form>
  );
}
