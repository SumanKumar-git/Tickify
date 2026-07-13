import { apiSlice } from "../../apiSlice";

export const eventApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllEvents: builder.query({
      query: (params) => ({
        url: "/events",
        params,
      }),
      providesTags: (result) =>
        result?.events
          ? [
              ...result.events.map(({ _id }) => ({ type: "Event", id: _id })),
              { type: "Event", id: "LIST" },
            ]
          : [{ type: "Event", id: "LIST" }],
    }),
    getEventByIdForUser: builder.query({
      query: (id) => `/events/${id}`,
      providesTags: (result, error, arg) => [{ type: "Event", id: arg }],
    }),
    createEvent: builder.mutation({
      query: (formData) => ({
        url: "/events/organizer/create",
        method: "POST",
        body: formData, // FormData containing poster file and event details
      }),
      invalidatesTags: [
        { type: "Event", id: "LIST" },
        { type: "Dashboard", id: "ORGANIZER" },
      ],
    }),
    getAllEventsByOrganizer: builder.query({
      query: (params) => ({
        url: "/events/organizer/events",
        params,
      }),
      providesTags: (result) =>
        result?.events
          ? [
              ...result.events.map(({ _id }) => ({ type: "Event", id: _id })),
              { type: "Event", id: "ORGANIZER_LIST" },
            ]
          : [{ type: "Event", id: "ORGANIZER_LIST" }],
    }),
    getEventByIdForOrganizer: builder.query({
      query: (id) => `/events/organizer/events/${id}`,
      providesTags: (result, error, arg) => [{ type: "Event", id: arg }],
    }),
    updateEvent: builder.mutation({
      query: ({ id, formData }) => ({
        url: `/events/organizer/events/${id}`,
        method: "PATCH",
        body: formData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Event", id },
        { type: "Event", id: "LIST" },
        { type: "Event", id: "ORGANIZER_LIST" },
      ],
    }),
    deleteEvent: builder.mutation({
      query: (id) => ({
        url: `/events/organizer/events/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [
        { type: "Event", id: "LIST" },
        { type: "Event", id: "ORGANIZER_LIST" },
        { type: "Dashboard", id: "ORGANIZER" },
      ],
    }),
    getEventsForAdmin: builder.query({
      query: (params) => ({
        url: "/events/admin/events",
        params,
      }),
      providesTags: (result) =>
        result?.events
          ? [
              ...result.events.map(({ _id }) => ({ type: "Event", id: _id })),
              { type: "Event", id: "ADMIN_LIST" },
            ]
          : [{ type: "Event", id: "ADMIN_LIST" }],
    }),
    getEventByIdForAdmin: builder.query({
      query: (id) => `/events/admin/events/${id}`,
      providesTags: (result, error, arg) => [{ type: "Event", id: arg }],
    }),
    approveEvent: builder.mutation({
      query: ({ id, reviewRemark }) => ({
        url: `/events/admin/approve/${id}`,
        method: "PATCH",
        body: { reviewRemark },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Event", id },
        { type: "Event", id: "LIST" },
        { type: "Event", id: "ADMIN_LIST" },
        { type: "Dashboard", id: "ADMIN" },
      ],
    }),
    rejectEvent: builder.mutation({
      query: ({ id, reviewRemark }) => ({
        url: `/events/admin/reject/${id}`,
        method: "PATCH",
        body: { reviewRemark },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Event", id },
        { type: "Event", id: "LIST" },
        { type: "Event", id: "ADMIN_LIST" },
        { type: "Dashboard", id: "ADMIN" },
      ],
    }),
  }),
});

export const {
  useGetAllEventsQuery,
  useGetEventByIdForUserQuery,
  useCreateEventMutation,
  useGetAllEventsByOrganizerQuery,
  useGetEventByIdForOrganizerQuery,
  useUpdateEventMutation,
  useDeleteEventMutation,
  useGetEventsForAdminQuery,
  useGetEventByIdForAdminQuery,
  useApproveEventMutation,
  useRejectEventMutation,
} = eventApi;
export default eventApi;
