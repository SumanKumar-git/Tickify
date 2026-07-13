import { apiSlice } from "../../apiSlice";

export const ticketApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMyTickets: builder.query({
      query: () => "/tickets/my-tickets",
      providesTags: (result) =>
        result?.tickets
          ? [
              ...result.tickets.map(({ _id }) => ({ type: "Ticket", id: _id })),
              { type: "Ticket", id: "LIST" },
            ]
          : [{ type: "Ticket", id: "LIST" }],
    }),
    getTicketById: builder.query({
      query: (ticketId) => `/tickets/${ticketId}`,
      providesTags: (result, error, arg) => [{ type: "Ticket", id: arg }],
    }),
    getTicketQrPayload: builder.query({
      query: (ticketId) => `/tickets/${ticketId}/qr`,
      providesTags: (result, error, arg) => [{ type: "Ticket", id: `QR_${arg}` }],
    }),
    getEventTickets: builder.query({
      query: ({ eventId, params }) => ({
        url: `/tickets/events/${eventId}/tickets`,
        params,
      }),
      providesTags: (result, error, { eventId }) => [
        { type: "Ticket", id: `EVENT_${eventId}_LIST` },
      ],
    }),
    checkInTicket: builder.mutation({
      query: ({ eventId, qrPayload }) => ({
        url: `/tickets/events/${eventId}/check-in`,
        method: "POST",
        body: { qrPayload },
      }),
      invalidatesTags: (result, error, { eventId }) => [
        { type: "Ticket" },
        { type: "Booking", id: `REGISTRATIONS_${eventId}` },
        { type: "Dashboard" },
      ],
    }),
  }),
});

export const {
  useGetMyTicketsQuery,
  useGetTicketByIdQuery,
  useLazyGetTicketQrPayloadQuery,
  useGetTicketQrPayloadQuery,
  useGetEventTicketsQuery,
  useCheckInTicketMutation,
} = ticketApi;
export default ticketApi;
