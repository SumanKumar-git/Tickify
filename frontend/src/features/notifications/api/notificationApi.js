import { apiSlice } from "../../apiSlice";

export const notificationApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMyNotifications: builder.query({
      query: (params) => ({
        url: "/notifications",
        params,
      }),
      providesTags: (result) =>
        result?.notifications
          ? [
              ...result.notifications.map(({ _id }) => ({ type: "Notification", id: _id })),
              { type: "Notification", id: "LIST" },
            ]
          : [{ type: "Notification", id: "LIST" }],
    }),
    getUnreadNotificationCount: builder.query({
      query: () => "/notifications/unread-count",
      providesTags: [{ type: "Notification", id: "UNREAD_COUNT" }],
    }),
    markNotificationAsRead: builder.mutation({
      query: (notificationId) => ({
        url: `/notifications/${notificationId}/read`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "Notification", id: arg },
        { type: "Notification", id: "UNREAD_COUNT" },
        { type: "Notification", id: "LIST" },
      ],
    }),
    markAllNotificationsAsRead: builder.mutation({
      query: () => ({
        url: "/notifications/read-all",
        method: "PATCH",
      }),
      invalidatesTags: [
        { type: "Notification", id: "UNREAD_COUNT" },
        { type: "Notification", id: "LIST" },
      ],
    }),
    deleteNotification: builder.mutation({
      query: (notificationId) => ({
        url: `/notifications/${notificationId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "Notification", id: arg },
        { type: "Notification", id: "UNREAD_COUNT" },
        { type: "Notification", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetMyNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useDeleteNotificationMutation,
} = notificationApi;
export default notificationApi;
