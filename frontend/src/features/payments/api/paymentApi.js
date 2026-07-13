import { apiSlice } from "../../apiSlice";

export const paymentApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    initiatePayment: builder.mutation({
      query: (bookingId) => ({
        url: `/payments/booking/${bookingId}/initiate`,
        method: "POST",
      }),
    }),
    verifyPayment: builder.mutation({
      query: (paymentDetails) => ({
        url: "/payments/verify",
        method: "POST",
        body: paymentDetails,
      }),
      invalidatesTags: (result, error, { bookingId }) => [
        { type: "Booking", id: bookingId },
        { type: "Booking", id: "LIST" },
        { type: "Booking", id: "MY_PAYMENTS" },
        { type: "Ticket" },
        { type: "Dashboard" },
        { type: "Event" },
      ],
    }),
    getMyPayments: builder.query({
      query: () => "/payments/my-payments",
      providesTags: [{ type: "Booking", id: "MY_PAYMENTS" }],
    }),
  }),
});

export const { 
  useInitiatePaymentMutation, 
  useVerifyPaymentMutation,
  useGetMyPaymentsQuery,
} = paymentApi;
export default paymentApi;
