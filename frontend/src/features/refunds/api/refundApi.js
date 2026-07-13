import { apiSlice } from "../../apiSlice";

export const refundApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMyRefunds: builder.query({
      query: () => "/refunds/my-refunds",
      providesTags: (result) =>
        result?.refunds
          ? [
              ...result.refunds.map(({ _id }) => ({ type: "Refund", id: _id })),
              { type: "Refund", id: "LIST" },
            ]
          : [{ type: "Refund", id: "LIST" }],
    }),
    getRefundById: builder.query({
      query: (refundId) => `/refunds/${refundId}`,
      providesTags: (result, error, arg) => [{ type: "Refund", id: arg }],
    }),
    getAllRefundsForAdmin: builder.query({
      query: () => "/refunds/admin/all-refunds",
      providesTags: (result) =>
        result?.refunds
          ? [
              ...result.refunds.map(({ _id }) => ({ type: "Refund", id: _id })),
              { type: "Refund", id: "ADMIN_LIST" },
            ]
          : [{ type: "Refund", id: "ADMIN_LIST" }],
    }),
    processRefund: builder.mutation({
      query: (refundId) => ({
        url: `/refunds/${refundId}/process`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "Refund", id: arg },
        { type: "Refund", id: "LIST" },
        { type: "Refund", id: "ADMIN_LIST" },
        { type: "Booking" },
        { type: "Dashboard" },
      ],
    }),
  }),
});

export const { 
  useGetMyRefundsQuery, 
  useGetRefundByIdQuery, 
  useProcessRefundMutation,
  useGetAllRefundsForAdminQuery,
} = refundApi;
export default refundApi;
