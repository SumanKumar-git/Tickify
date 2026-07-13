import { apiSlice } from "../../apiSlice";

export const dashboardApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getParticipantDashboard: builder.query({
      query: () => "/dashboard/participant",
      providesTags: [{ type: "Dashboard", id: "PARTICIPANT" }],
    }),
    getOrganizerDashboard: builder.query({
      query: () => "/dashboard/organizer",
      providesTags: [{ type: "Dashboard", id: "ORGANIZER" }],
    }),
    getAdminDashboard: builder.query({
      query: () => "/dashboard/admin",
      providesTags: [{ type: "Dashboard", id: "ADMIN" }],
    }),
  }),
});

export const {
  useGetParticipantDashboardQuery,
  useGetOrganizerDashboardQuery,
  useGetAdminDashboardQuery,
} = dashboardApi;
export default dashboardApi;
