import { AUTH_CRED } from '@/utils/constants';
import { Routes } from '@/config/routes';
import Cookies from 'js-cookie';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { API_ENDPOINTS } from './client/api-endpoints';
import { userClient } from './client/user';
import {
  User,
  QueryOptionsType,
  UserPaginator,
  UserQueryOptions,
  LicensedDomainPaginator,
  LicenseAdditionalData,
} from '@/types';
import { mapPaginatorData } from '@/utils/data-mappers';
import axios from 'axios';
import { setEmailVerified } from '@/utils/auth-utils';

export const useMeQuery = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useQuery<User, Error>([API_ENDPOINTS.ME], userClient.me, {
    retry: false,

    onSuccess: (me) => {
      if (router.pathname === Routes.verifyLicense) {
        router.replace(Routes.dashboard);
      }
      if (router.pathname === Routes.verifyEmail) {
        // Only redirect away from verify-email when the backend confirms verification.
        // Some backends return 200 for unverified users (with a flag), so don't force-dashboard here.
        if (me?.email_verified) {
          setEmailVerified(true);
          router.replace(Routes.dashboard);
        } else {
          setEmailVerified(false);
        }
      }
    },

    onError: (err) => {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 417) {
          router.replace(Routes.verifyLicense);
          return;
        }

        if (err.response?.status === 409) {
          setEmailVerified(false);
          router.replace(Routes.verifyEmail);
          return;
        }
        // Only clear session and redirect on auth errors; avoid logout on 5xx or network failures
        if (err.response?.status === 401 || err.response?.status === 403) {
          queryClient.clear();
          router.replace(Routes.login);
        }
      }
    },
  });
};

export function useLogin() {
  return useMutation(userClient.login);
}

export function useSendVerifyEmailOtp() {
  const { t } = useTranslation();
  return useMutation(userClient.sendVerifyEmailOtp, {
    onSuccess: () => {
      toast.success(
        t('Verification code sent to your email') || 'Verification code sent to your email'
      );
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message || t('Error sending verification code') || 'Failed to send code';
      toast.error(errorMessage);
    },
  });
}

export function useVerifyEmailOtp() {
  return useMutation(userClient.verifyEmailOtp);
}

export const useLogoutMutation = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation(userClient.logout, {
    onSuccess: () => {
      // Clear JWT token from storage
      Cookies.remove(AUTH_CRED);
      // Also clear the auth token key cookie if it exists
      const AUTH_TOKEN_KEY = process.env.NEXT_PUBLIC_AUTH_TOKEN_KEY ?? 'authToken';
      Cookies.remove(AUTH_TOKEN_KEY);
      // Clear all query cache
      queryClient.clear();
      // Redirect to login
      router.replace(Routes.login);
      toast.success(t('common:successfully-logout'), {
        toastId: 'logoutSuccess',
      });
    },
    onError: () => {
      // Even if logout endpoint fails, clear local storage and redirect
      Cookies.remove(AUTH_CRED);
      const AUTH_TOKEN_KEY = process.env.NEXT_PUBLIC_AUTH_TOKEN_KEY ?? 'authToken';
      Cookies.remove(AUTH_TOKEN_KEY);
      queryClient.clear();
      router.replace(Routes.login);
    },
  });
};

export const useRegisterMutation = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation(userClient.register, {
    onSuccess: () => {
      toast.success(t('common:successfully-register'), {
        toastId: 'successRegister',
      });
    },
    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries(API_ENDPOINTS.REGISTER);
    },
  });
};

export const useUpdateUserMutation = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  return useMutation(userClient.update, {
    onSuccess: () => {
      toast.success(t('common:successfully-updated'));
    },
    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries(API_ENDPOINTS.ME);
      queryClient.invalidateQueries(API_ENDPOINTS.USERS);
    },
  });
};

export const useUpdateMeMutation = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  return useMutation(userClient.updateMe, {
    onSuccess: () => {
      toast.success(t('common:successfully-updated'));
    },
    // Only refetch the current user after updating own profile.
    onSettled: () => {
      queryClient.invalidateQueries(API_ENDPOINTS.ME);
    },
  });
};
export const useUpdateUserEmailMutation = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  return useMutation(userClient.updateEmail, {
    onSuccess: () => {
      toast.success(t('common:successfully-updated'));
    },
    onError: (error) => {
      const {
        response: { data },
      }: any = error ?? {};

      toast.error(data?.message);
    },
    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries(API_ENDPOINTS.ME);
      queryClient.invalidateQueries(API_ENDPOINTS.USERS);
    },
  });
};

export const useChangePasswordMutation = () => {
  return useMutation(userClient.changePassword);
};


export const useForgetPasswordMutation = () => {
  return useMutation(userClient.forgetPassword);
};
export const useResendVerificationEmail = () => {
  const { t } = useTranslation('common');
  return useMutation(userClient.resendVerificationEmail, {
    onSuccess: () => {
      toast.success(t('common:PICKBAZAR_MESSAGE.EMAIL_SENT_SUCCESSFUL'));
    },
    onError: () => {
      toast(t('common:PICKBAZAR_MESSAGE.EMAIL_SENT_FAILED'));
    },
  });
};

export const useLicenseKeyMutation = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation(userClient.addLicenseKey, {
    onSuccess: () => {
      toast.success(t('common:successfully-updated'));
      setTimeout(() => {
        router.reload();
      }, 1000);
    },
    onError: () => {
      toast.error(t('common:PICKBAZAR_MESSAGE.INVALID_LICENSE_KEY'));
    },
  });
};

export const useVerifyForgetPasswordTokenMutation = () => {
  return useMutation(userClient.verifyForgetPasswordToken);
};

export const useResetPasswordMutation = () => {
  return useMutation(userClient.resetPassword);
};



export const useMakeOrRevokeAdminMutation = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation(userClient.makeAdmin, {
    onSuccess: () => {
      toast.success(t('common:successfully-updated'));
    },
    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries(API_ENDPOINTS.USERS);
    },
  });
};

export const useBlockUserMutation = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation(userClient.block, {
    onSuccess: () => {
      toast.success(t('common:successfully-block'));
    },
    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries(API_ENDPOINTS.USERS);
      queryClient.invalidateQueries(API_ENDPOINTS.STAFFS);
      queryClient.invalidateQueries(API_ENDPOINTS.ADMIN_LIST);
      queryClient.invalidateQueries(API_ENDPOINTS.CUSTOMERS);
      queryClient.invalidateQueries(API_ENDPOINTS.VENDORS_LIST);
    },
  });
};

export const useUnblockUserMutation = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation(userClient.unblock, {
    onSuccess: () => {
      toast.success(t('common:successfully-unblock'));
    },
    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries(API_ENDPOINTS.USERS);
      queryClient.invalidateQueries(API_ENDPOINTS.STAFFS);
      queryClient.invalidateQueries(API_ENDPOINTS.ADMIN_LIST);
      queryClient.invalidateQueries(API_ENDPOINTS.CUSTOMERS);
      queryClient.invalidateQueries(API_ENDPOINTS.VENDORS_LIST);
    },
  });
};

export const useAddWalletPointsMutation = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  return useMutation(userClient.addWalletPoints, {
    onSuccess: () => {
      toast.success(t('common:successfully-updated'));
    },
    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries(API_ENDPOINTS.USERS);
    },
  });
};

export const useUserQuery = ({ id }: { id: string }) => {
  return useQuery<User, Error>(
    [API_ENDPOINTS.USERS, id],
    () => userClient.fetchUser({ id }),
    {
      enabled: Boolean(id),
    }
  );
};

export interface UserListQueryOptions {
  initialData?: UserPaginator | null
}

function toInitialData(value: UserPaginator | null | undefined): UserPaginator | undefined {
  return value ?? undefined
}

export const useUsersQuery = (
  params: Partial<QueryOptionsType>,
  options?: UserListQueryOptions
) => {
  const { data, isLoading, error } = useQuery<UserPaginator, Error>(
    [API_ENDPOINTS.USERS, params],
    () => userClient.fetchUsers(params),
    {
      keepPreviousData: true,
      initialData: toInitialData(options?.initialData),
    }
  );

  return {
    users: (data as UserPaginator | undefined)?.data ?? [],
    paginatorInfo: mapPaginatorData(data as any),
    loading: isLoading,
    error,
  };
};

export const useAdminsQuery = (
  params: Partial<QueryOptionsType>,
  options?: UserListQueryOptions
) => {
  const { data, isLoading, error } = useQuery<UserPaginator, Error>(
    [API_ENDPOINTS.ADMIN_LIST, params],
    () => userClient.fetchAdmins(params),
    {
      keepPreviousData: true,
      initialData: toInitialData(options?.initialData),
    }
  );

  return {
    admins: (data as UserPaginator | undefined)?.data ?? [],
    paginatorInfo: mapPaginatorData(data as any),
    loading: isLoading,
    error,
  };
};

export const useVendorsQuery = (
  params: Partial<UserQueryOptions>,
  options?: UserListQueryOptions
) => {
  const { data, isLoading, error } = useQuery<UserPaginator, Error>(
    [API_ENDPOINTS.VENDORS_LIST, params],
    () => userClient.fetchVendors(params),
    {
      keepPreviousData: true,
      initialData: toInitialData(options?.initialData),
    }
  );

  return {
    vendors: (data as UserPaginator | undefined)?.data ?? [],
    paginatorInfo: mapPaginatorData(data as any),
    loading: isLoading,
    error,
  };
};

export const useCustomersQuery = (
  params: Partial<UserQueryOptions>,
  options?: UserListQueryOptions
) => {
  const { data, isLoading, error } = useQuery<UserPaginator, Error>(
    [API_ENDPOINTS.CUSTOMERS, params],
    () => userClient.fetchCustomers(params),
    {
      keepPreviousData: true,
      initialData: toInitialData(options?.initialData),
    }
  );

  return {
    customers: (data as UserPaginator | undefined)?.data ?? [],
    paginatorInfo: mapPaginatorData(data as any),
    loading: isLoading,
    error,
  };
};

export const useMyStaffsQuery = (
  params: Partial<UserQueryOptions & { shop_id: string }>,
  options?: UserListQueryOptions
) => {
  const { data, isLoading, error } = useQuery<UserPaginator, Error>(
    [API_ENDPOINTS.MY_STAFFS, params],
    () => userClient.getMyStaffs(params),
    {
      keepPreviousData: true,
      initialData: toInitialData(options?.initialData),
    }
  );

  return {
    myStaffs: (data as UserPaginator | undefined)?.data ?? [],
    paginatorInfo: mapPaginatorData(data as any),
    loading: isLoading,
    error,
  };
};

export const useAllStaffsQuery = (
  params: Partial<UserQueryOptions>,
  options?: UserListQueryOptions
) => {
  const { data, isLoading, error } = useQuery<UserPaginator, Error>(
    [API_ENDPOINTS.ALL_STAFFS, params],
    () => userClient.getAllStaffs(params),
    {
      keepPreviousData: true,
      initialData: toInitialData(options?.initialData),
    }
  );

  return {
    allStaffs: (data as UserPaginator | undefined)?.data ?? [],
    paginatorInfo: mapPaginatorData(data as any),
    loading: isLoading,
    error,
  };
};

