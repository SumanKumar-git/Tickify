import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api`,
    prepareHeaders: (headers) => {
      return headers;
    },
    credentials: "include",
  }),
  tagTypes: ["User", "Event", "Booking", "Ticket", "Refund", "Notification", "Dashboard"],
  endpoints: () => ({}),
});
