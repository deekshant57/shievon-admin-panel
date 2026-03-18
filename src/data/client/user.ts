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
  UpdateMeInput,
  QueryOptionsType,
  UserPaginator,
  UserQueryOptions,
  VendorQueryOptionsType,
  KeyInput,
  LicensedDomainPaginator,
  LicenseAdditionalData,
  MeResponse,
  SendVerifyEmailOtpInput,
  SendVerifyEmailOtpResponse,
  VerifyEmailOtpInput,
  VerifyEmailOtpResponse,
} from '@/types';
import { API_ENDPOINTS } from './api-endpoints';
import { HttpClient } from './http-client';

export const userClient = {
  me: async () => {
    // HttpClient.get now returns the unwrapped data directly from /api/me
    const userData = await HttpClient.get<any>(API_ENDPOINTS.ME);

    // Build a normalized Profile object, merging legacy profile shape with
    // the new flat fields returned by /api/me (mobile_no, phone, avatar, bio).
    const legacyProfile = userData.profile ?? {};
    const mergedProfile =
      userData.bio ||
      userData.avatar ||
      userData.mobile_no ||
      legacyProfile
        ? {
            id: legacyProfile.id ?? '',
            avatar: userData.avatar ?? legacyProfile.avatar,
            bio: userData.bio ?? legacyProfile.bio,
            // The profile "contact" field in the UI should reflect only
            // the mobile number, not the separate phone/landline field.
            contact: userData.mobile_no ?? legacyProfile.contact,
            socials: legacyProfile.socials,
            customer: legacyProfile.customer,
          }
        : undefined;

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
      profile: mergedProfile,
      orders: userData.orders,
      email_verified: userData.email_verified ?? false,
      first_name: userData.first_name,
      last_name: userData.last_name,
      mobile_no: userData.mobile_no,
      phone: userData.phone,
      date_of_birth: userData.date_of_birth,
      gender: userData.gender,
      avatar: userData.avatar,
      bio: userData.bio,
    } as User;
  },
  login: (variables: LoginInput) => {
    return HttpClient.post<AuthResponse>(API_ENDPOINTS.TOKEN, variables);
  },
  logout: () => {
    return HttpClient.post<any>(API_ENDPOINTS.LOGOUT, {});
  },
  register: (variables: RegisterInput) => {
    return HttpClient.post<AuthResponse>(API_ENDPOINTS.REGISTER, variables);
  },
  sendVerifyEmailOtp: async (variables: SendVerifyEmailOtpInput) => {
    return await HttpClient.post<SendVerifyEmailOtpResponse['data']>(
      API_ENDPOINTS.SEND_VERIFY_EMAIL_OTP,
      variables
    );
  },
  verifyEmailOtp: async (variables: VerifyEmailOtpInput) => {
    const response = await HttpClient.post<VerifyEmailOtpResponse['data']>(
      API_ENDPOINTS.VERIFY_EMAIL_OTP,
      variables
    );
    return {
      token: response.token,
      permissions: response.permissions,
      role: response.role,
      isEmailVerified: response.isEmailVerified ?? true,
    };
  },
  update: ({ id, input }: { id: string; input: UpdateUser }) => {
    // Admin/super-admin updating arbitrary users by ID.
    return HttpClient.put<User>(`${API_ENDPOINTS.USERS}/${id}`, input);
  },
  updateMe: (input: UpdateMeInput) => {
    // Safer self-update: ID comes from auth token on the backend.
    return HttpClient.put<User>(API_ENDPOINTS.ME, input);
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

  // GET /api/users – Swagger: orderBy, sortedBy, text, search, first, limit, page
  fetchUsers: ({ name, ...params }: Partial<UserQueryOptions>) => {
    return HttpClient.get<UserPaginator>(API_ENDPOINTS.USERS, {
      orderBy: params.orderBy ?? 'created_at',
      sortedBy: params.sortedBy ?? 'desc',
      text: name ?? undefined,
      search: name ? HttpClient.formatSearchParams({ name }) : undefined,
      limit: params.limit ?? 20,
      page: params.page ?? 1,
      ...params,
    });
  },
  // GET /api/admin/list – Swagger: orderBy, sortedBy, text, search, first, limit, page
  fetchAdmins: ({ name, ...params }: Partial<UserQueryOptions>) => {
    return HttpClient.get<UserPaginator>(API_ENDPOINTS.ADMIN_LIST, {
      orderBy: params.orderBy ?? 'created_at',
      sortedBy: params.sortedBy ?? 'desc',
      text: name ?? undefined,
      search: name ? HttpClient.formatSearchParams({ name }) : undefined,
      limit: params.limit ?? 20,
      page: params.page ?? 1,
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
  // GET /api/vendors/list – Swagger: orderBy, sortedBy, text, search, first, limit, page (+ is_active for filtering)
  fetchVendors: ({ is_active, name, ...params }: Partial<UserQueryOptions>) => {
    return HttpClient.get<UserPaginator>(API_ENDPOINTS.VENDORS_LIST, {
      orderBy: params.orderBy ?? 'created_at',
      sortedBy: params.sortedBy ?? 'desc',
      text: name ?? undefined,
      search: name ? HttpClient.formatSearchParams({ name }) : undefined,
      limit: params.limit ?? 20,
      page: params.page ?? 1,
      ...(is_active !== undefined && { is_active }),
      ...params,
    });
  },
  // GET /api/customers/list – Swagger: orderBy, sortedBy, text, search, first, limit, page
  fetchCustomers: ({ name, search: searchParam, ...params }: Partial<UserQueryOptions>) => {
    const searchTerm = name ?? searchParam
    return HttpClient.get<UserPaginator>(API_ENDPOINTS.CUSTOMERS, {
      orderBy: params.orderBy ?? 'created_at',
      sortedBy: params.sortedBy ?? 'desc',
      text: searchTerm ?? undefined,
      search: searchTerm ? HttpClient.formatSearchParams({ name: searchTerm }) : undefined,
      limit: params.limit ?? 20,
      page: params.page ?? 1,
      ...params,
    });
  },
  // GET /api/my-staffs – Swagger: orderBy, sortedBy, text, search, first, limit, page
  getMyStaffs: ({ is_active, shop_id, name, ...params }: Partial<UserQueryOptions & { shop_id: string }>) => {
    return HttpClient.get<UserPaginator>(API_ENDPOINTS.MY_STAFFS, {
      orderBy: params.orderBy ?? 'created_at',
      sortedBy: params.sortedBy ?? 'desc',
      text: name ?? undefined,
      search: name || is_active !== undefined ? HttpClient.formatSearchParams({ name, is_active }) : undefined,
      limit: params.limit ?? 20,
      page: params.page ?? 1,
      ...(shop_id && { shop_id }),
      ...params,
    });
  },
  // GET /api/all-staffs – Swagger: orderBy, sortedBy, text, search, first, limit, page
  getAllStaffs: ({ is_active, name, ...params }: Partial<UserQueryOptions>) => {
    return HttpClient.get<UserPaginator>(API_ENDPOINTS.ALL_STAFFS, {
      orderBy: params.orderBy ?? 'created_at',
      sortedBy: params.sortedBy ?? 'desc',
      text: name ?? undefined,
      search: name || is_active !== undefined ? HttpClient.formatSearchParams({ name, is_active }) : undefined,
      limit: params.limit ?? 20,
      page: params.page ?? 1,
      ...params,
    });
  },
  
};
