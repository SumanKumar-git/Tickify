import { apiSlice } from "../../apiSlice";

export const bookingApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createBooking: builder.mutation({
      query: (bookingData) => ({
        url: "/bookings",
        method: "POST",
        body: bookingData,
      }),
      invalidatesTags: ["Booking", "Event", "Dashboard"],
    }),
    getMyBookings: builder.query({
      query: () => "/bookings/my-bookings",
      providesTags: (result) =>
        result?.booking
          ? [
              ...result.booking.map(({ _id }) => ({ type: "Booking", id: _id })),
              { type: "Booking", id: "LIST" },
            ]
          : [{ type: "Booking", id: "LIST" }],
    }),
    getBookingById: builder.query({
      query: (bookingId) => `/bookings/${bookingId}`,
      providesTags: (result, error, arg) => [{ type: "Booking", id: arg }],
    }),
    cancelBooking: builder.mutation({
      query: (bookingId) => ({
        url: `/bookings/${bookingId}/cancel`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "Booking", id: arg },
        { type: "Booking", id: "LIST" },
        { type: "Ticket" },
        { type: "Refund" },
        { type: "Event" },
        { type: "Dashboard" },
      ],
    }),
    getEventRegistrations: builder.query({
      query: ({ eventId, params }) => ({
        url: `/bookings/event/${eventId}/registrations`,
        params,
      }),
      providesTags: (result, error, { eventId }) => [
        { type: "Booking", id: `REGISTRATIONS_${eventId}` },
      ],
    }),
  }),
});

export const {
  useCreateBookingMutation,
  useGetMyBookingsQuery,
  useGetBookingByIdQuery,
  useCancelBookingMutation,
  useGetEventRegistrationsQuery,
} = bookingApi;
export default bookingApi;
