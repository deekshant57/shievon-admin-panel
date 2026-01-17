import {
  AuthResponse,
  LoginInput,
  RegisterInput,
  User,
  ChangePasswordInput,
  ForgetPasswordInput,
  VerifyForgetPasswordTokenInput,
  ResetPasswordInput,
  MakeAdminInput,
  BlockUserInput,
  WalletPointsInput,
  UpdateUser,
  QueryOptionsType,
  UserPaginator,
  UserQueryOptions,
  VendorQueryOptionsType,
  KeyInput,
  LicensedDomainPaginator,
  LicenseAdditionalData,
  SendLoginOtpInput,
  SendLoginOtpResponse,
  VerifyLoginOtpInput,
  VerifyLoginOtpResponse,
  MeResponse,
  SendRegistrationOtpInput,
  SendRegistrationOtpResponse,
  VerifyRegistrationOtpInput,
  VerifyRegistrationOtpResponse,
} from '@/types';
import { API_ENDPOINTS } from './api-endpoints';
import { HttpClient } from './http-client';

export const userClient = {
  me: async () => {
    // HttpClient.get now returns the unwrapped data directly (MeResponse.data)
    const userData = await HttpClient.get<User>(API_ENDPOINTS.ME);
    // Return user data with defaults for missing fields
    return {
      id: userData.id || '',
      name: userData.name || '',
      email: userData.email || '',
      is_active: userData.is_active ?? true,
      shops: userData.shops || [],
      managed_shop: userData.managed_shop || null as any,
      created_at: userData.created_at || '',
      updated_at: userData.updated_at || '',
      address: userData.address || [],
      profile: userData.profile,
      orders: userData.orders,
      email_verified: userData.email_verified ?? false,
    } as User;
  },
  login: (variables: LoginInput) => {
    return HttpClient.post<AuthResponse>(API_ENDPOINTS.TOKEN, variables);
  },
  sendLoginOtp: async (variables: SendLoginOtpInput) => {
    // HttpClient.post now returns the unwrapped data directly
    return await HttpClient.post<SendLoginOtpResponse['data']>(
      API_ENDPOINTS.SEND_LOGIN_OTP,
      variables
    );
  },
  verifyLoginOtp: async (variables: VerifyLoginOtpInput) => {
    // HttpClient.post now returns the unwrapped data directly
    const response = await HttpClient.post<VerifyLoginOtpResponse['data']>(
      API_ENDPOINTS.VERIFY_LOGIN_OTP,
      variables
    );
    // Transform to AuthResponse format
    return {
      token: response.token,
      permissions: response.permissions,
      role: response.role,
    };
  },
  logout: () => {
    return HttpClient.post<any>(API_ENDPOINTS.LOGOUT, {});
  },
  register: (variables: RegisterInput) => {
    return HttpClient.post<AuthResponse>(API_ENDPOINTS.REGISTER, variables);
  },
  sendRegistrationOtp: async (variables: SendRegistrationOtpInput) => {
    // HttpClient.post now returns the unwrapped data directly
    return await HttpClient.post<SendRegistrationOtpResponse['data']>(
      API_ENDPOINTS.SEND_REGISTRATION_OTP,
      variables
    );
  },
  verifyRegistrationOtp: async (variables: VerifyRegistrationOtpInput) => {
    // HttpClient.post now returns the unwrapped data directly
    const response = await HttpClient.post<VerifyRegistrationOtpResponse['data']>(
      API_ENDPOINTS.VERIFY_REGISTRATION_OTP,
      variables
    );
    // Transform to AuthResponse format
    return {
      token: response.token,
      permissions: response.permissions,
      role: response.role,
    };
  },
  update: ({ id, input }: { id: string; input: UpdateUser }) => {
    return HttpClient.put<User>(`${API_ENDPOINTS.USERS}/${id}`, input);
  },
  changePassword: (variables: ChangePasswordInput) => {
    return HttpClient.post<any>(API_ENDPOINTS.CHANGE_PASSWORD, variables);
  },
  forgetPassword: (variables: ForgetPasswordInput) => {
    return HttpClient.post<any>(API_ENDPOINTS.FORGET_PASSWORD, variables);
  },
  verifyForgetPasswordToken: (variables: VerifyForgetPasswordTokenInput) => {
    return HttpClient.post<any>(
      API_ENDPOINTS.VERIFY_FORGET_PASSWORD_TOKEN,
      variables
    );
  },
  resetPassword: (variables: ResetPasswordInput) => {
    return HttpClient.post<any>(API_ENDPOINTS.RESET_PASSWORD, variables);
  },
  makeAdmin: (variables: MakeAdminInput) => {
    return HttpClient.post<any>(API_ENDPOINTS.MAKE_ADMIN, variables);
  },
  block: (variables: BlockUserInput) => {
    return HttpClient.post<any>(API_ENDPOINTS.BLOCK_USER, variables);
  },
  unblock: (variables: BlockUserInput) => {
    return HttpClient.post<any>(API_ENDPOINTS.UNBLOCK_USER, variables);
  },
  addWalletPoints: (variables: WalletPointsInput) => {
    return HttpClient.post<any>(API_ENDPOINTS.ADD_WALLET_POINTS, variables);
  },
  addLicenseKey: (variables: KeyInput) => {
    return HttpClient.post<any>(API_ENDPOINTS.ADD_LICENSE_KEY_VERIFY, variables);
  },

  fetchUsers: ({ name, ...params }: Partial<UserQueryOptions>) => {
    return HttpClient.get<UserPaginator>(API_ENDPOINTS.USERS, {
      searchJoin: 'and',
      with: 'wallet',
      ...params,
      search: HttpClient.formatSearchParams({ name }),
    });
  },
  fetchAdmins: ({ ...params }: Partial<UserQueryOptions>) => {
    return HttpClient.get<UserPaginator>(API_ENDPOINTS.ADMIN_LIST, {
      searchJoin: 'and',
      with: 'wallet;permissions;profile',
      ...params,
    });
  },
  fetchUser: ({ id }: { id: string }) => {
    return HttpClient.get<User>(`${API_ENDPOINTS.USERS}/${id}`);
  },
  resendVerificationEmail: () => {
    return HttpClient.post<any>(API_ENDPOINTS.SEND_VERIFICATION_EMAIL, {});
  },
  updateEmail: ({ email }: { email: string }) => {
    return HttpClient.post<any>(API_ENDPOINTS.UPDATE_EMAIL, { email });
  },
  fetchVendors: ({ is_active, ...params }: Partial<UserQueryOptions>) => {
    return HttpClient.get<UserPaginator>(API_ENDPOINTS.VENDORS_LIST, {
      searchJoin: 'and',
      with: 'wallet;permissions;profile',
      is_active,
      ...params,
    });
  },
  fetchCustomers: ({ ...params }: Partial<UserQueryOptions>) => {
    return HttpClient.get<UserPaginator>(API_ENDPOINTS.CUSTOMERS, {
      searchJoin: 'and',
      with: 'wallet',
      ...params,
    });
  },
  getMyStaffs: ({ is_active, shop_id, name, ...params }: Partial<UserQueryOptions & { shop_id: string }>) => {
    return HttpClient.get<UserPaginator>(API_ENDPOINTS.MY_STAFFS, {
      searchJoin: 'and',
      shop_id,
      ...params,
      search: HttpClient.formatSearchParams({ name, is_active })
    });
  },
  getAllStaffs: ({ is_active, name, ...params }: Partial<UserQueryOptions>) => {
    return HttpClient.get<UserPaginator>(API_ENDPOINTS.ALL_STAFFS, {
      searchJoin: 'and',
      ...params,
      search: HttpClient.formatSearchParams({ name, is_active }),
    });
  },
  
};
