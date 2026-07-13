import { apiSlice } from "../../apiSlice";
import { setCredentials, clearCredentials } from "../authSlice";

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.success && data.user) {
            dispatch(setCredentials(data.user));
          }
        } catch (err) {
          // Error handled by UI or globally
        }
      },
      invalidatesTags: ["User", "Dashboard"],
    }),
    signup: builder.mutation({
      query: (userData) => ({
        url: "/auth/signup",
        method: "POST",
        body: userData,
      }),
    }),
    verifyOtp: builder.mutation({
      query: (otpData) => ({
        url: "/auth/verify-otp",
        method: "POST",
        body: otpData,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.success && data.user) {
            dispatch(setCredentials(data.user));
          }
        } catch (err) {}
      },
      invalidatesTags: ["User"],
    }),
    resendVerificationOtp: builder.mutation({
      query: (emailData) => ({
        url: "/auth/resend-verification-otp",
        method: "POST",
        body: emailData,
      }),
    }),
    forgotPassword: builder.mutation({
      query: (emailData) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body: emailData,
      }),
    }),
    verifyResetOtp: builder.mutation({
      query: (resetData) => ({
        url: "/auth/verify-reset-otp",
        method: "POST",
        body: resetData,
      }),
    }),
    resetPassword: builder.mutation({
      query: (resetData) => ({
        url: "/auth/reset-password",
        method: "POST",
        body: resetData,
      }),
    }),
    checkAuth: builder.query({
      query: () => "/auth/check-auth",
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.success && data.user) {
            dispatch(setCredentials(data.user));
          } else {
            dispatch(clearCredentials());
          }
        } catch (err) {
          dispatch(clearCredentials());
        }
      },
      providesTags: ["User"],
    }),
    logout: builder.mutation({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(clearCredentials());
        } catch (err) {}
      },
      invalidatesTags: ["User", "Dashboard"],
    }),
    getOrganizersForAdmin: builder.query({
      query: () => "/auth/admin/organizers",
      providesTags: (result) =>
        result?.organizers
          ? [
              ...result.organizers.map(({ _id }) => ({ type: "User", id: _id })),
              { type: "User", id: "ORGANIZERS_LIST" },
            ]
          : [{ type: "User", id: "ORGANIZERS_LIST" }],
    }),
    toggleOrganizerVerification: builder.mutation({
      query: (organizerId) => ({
        url: `/auth/admin/organizers/${organizerId}/toggle-verify`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "User", id: arg },
        { type: "User", id: "ORGANIZERS_LIST" },
        { type: "Dashboard", id: "ADMIN" },
      ],
    }),
    deleteOrganizer: builder.mutation({
      query: (organizerId) => ({
        url: `/auth/admin/organizers/${organizerId}`,
        method: "DELETE",
      }),
      invalidatesTags: [
        { type: "User", id: "ORGANIZERS_LIST" },
        { type: "Dashboard", id: "ADMIN" },
        { type: "Event" },
      ],
    }),
    getAdminsForContact: builder.query({
      query: () => "/auth/admins",
    }),
  }),
});

export const {
  useLoginMutation,
  useSignupMutation,
  useVerifyOtpMutation,
  useResendVerificationOtpMutation,
  useForgotPasswordMutation,
  useVerifyResetOtpMutation,
  useResetPasswordMutation,
  useCheckAuthQuery,
  useLogoutMutation,
  useGetOrganizersForAdminQuery,
  useToggleOrganizerVerificationMutation,
  useDeleteOrganizerMutation,
  useGetAdminsForContactQuery,
} = authApi;
export default authApi;
