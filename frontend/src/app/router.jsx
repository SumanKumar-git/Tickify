import { createBrowserRouter, RouterProvider } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import DashboardLayout from "../components/layout/DashboardLayout";
import ProtectedRoute from "../components/guards/ProtectedRoute";
import RoleProtectedRoute from "../components/guards/RoleProtectedRoute";

// Auth features
import AuthPage from "../features/auth/pages/AuthPage";
import VerifyOtpPage from "../features/auth/pages/VerifyOtpPage";
import ForgotPasswordPage from "../features/auth/pages/ForgotPasswordPage";
import ResetPasswordPage from "../features/auth/pages/ResetPasswordPage";

// Public event features
import LandingPage from "../features/events/pages/LandingPage";
import BrowseEventsPage from "../features/events/pages/BrowseEventsPage";
import EventDetailsPage from "../features/events/pages/EventDetailsPage";
import ContactPage from "../features/events/pages/ContactPage";

// Booking features
import CheckoutPage from "../features/bookings/pages/CheckoutPage";
import MyBookingsPage from "../features/bookings/pages/MyBookingsPage";
import TransactionsPage from "../features/payments/pages/TransactionsPage";

// Tickets & Refunds
import MyTicketsPage from "../features/tickets/pages/MyTicketsPage";
import TicketDetailsPage from "../features/tickets/pages/TicketDetailsPage";
import RefundsPage from "../features/refunds/pages/RefundsPage";

// Dashboards
import ParticipantDashboard from "../features/dashboard/pages/ParticipantDashboard";
import OrganizerDashboard from "../features/dashboard/pages/OrganizerDashboard";
import AdminDashboard from "../features/dashboard/pages/AdminDashboard";

// Organizer features
import OrganizerEventsPage from "../features/organizer/pages/OrganizerEventsPage";
import CreateEventPage from "../features/organizer/pages/CreateEventPage";
import EditEventPage from "../features/organizer/pages/EditEventPage";
import OrganizerEventDetailsPage from "../features/organizer/pages/OrganizerEventDetailsPage";
import OrganizerCheckInPage from "../features/organizer/pages/OrganizerCheckInPage";

// Admin features
import AdminEventsPage from "../features/admin/pages/AdminEventsPage";
import AdminRefundsPage from "../features/admin/pages/AdminRefundsPage";
import AdminOrganizersPage from "../features/admin/pages/AdminOrganizersPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      // Public discovery routes
      {
        path: "",
        element: <LandingPage />,
      },
      {
        path: "events",
        element: <BrowseEventsPage />,
      },
      {
        path: "events/:id",
        element: <EventDetailsPage />,
      },
      {
        path: "contact",
        element: <ContactPage />,
      },
      // Guest-only authentication routes
      {
        path: "auth",
        element: <AuthPage />,
      },
      {
        path: "verify-otp",
        element: <VerifyOtpPage />,
      },
      {
        path: "forgot-password",
        element: <ForgotPasswordPage />,
      },
      {
        path: "reset-password",
        element: <ResetPasswordPage />,
      },

      // Protected routes (require user login session)
      {
        element: <ProtectedRoute />,
        children: [
          // Checkout bookings
          {
            path: "bookings/:bookingId",
            element: <CheckoutPage />,
          },

          // Role-specific portals (Participant)
          {
            element: <RoleProtectedRoute allowedRoles={["user"]} />,
            children: [
              {
                element: <DashboardLayout />,
                children: [
                  {
                    path: "dashboard",
                    element: <ParticipantDashboard />,
                  },
                  {
                    path: "tickets",
                    element: <MyTicketsPage />,
                  },
                  {
                    path: "bookings",
                    element: <MyBookingsPage />,
                  },
                  {
                    path: "refunds",
                    element: <RefundsPage />,
                  },
                  {
                    path: "transactions",
                    element: <TransactionsPage />,
                  },
                ],
              },
              {
                path: "tickets/:ticketId",
                element: <TicketDetailsPage />,
              },
            ],
          },

          // Role-specific portals (Organizer)
          {
            element: <RoleProtectedRoute allowedRoles={["organizer"]} />,
            children: [
              {
                element: <DashboardLayout />,
                children: [
                  {
                    path: "organizer/dashboard",
                    element: <OrganizerDashboard />,
                  },
                  {
                    path: "organizer/events",
                    element: <OrganizerEventsPage />,
                  },
                  {
                    path: "organizer/events/new",
                    element: <CreateEventPage />,
                  },
                  {
                    path: "organizer/events/:id/edit",
                    element: <EditEventPage />,
                  },
                  {
                    path: "organizer/events/:id",
                    element: <OrganizerEventDetailsPage />,
                  },
                  {
                    path: "organizer/events/:id/check-in",
                    element: <OrganizerCheckInPage />,
                  },
                ],
              },
            ],
          },

          // Role-specific portals (Admin)
          {
            element: <RoleProtectedRoute allowedRoles={["admin"]} />,
            children: [
              {
                element: <DashboardLayout />,
                children: [
                  {
                    path: "admin/dashboard",
                    element: <AdminDashboard />,
                  },
                  {
                    path: "admin/events",
                    element: <AdminEventsPage />,
                  },
                  {
                    path: "admin/organizers",
                    element: <AdminOrganizersPage />,
                  },
                  {
                    path: "admin/refunds",
                    element: <AdminRefundsPage />,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]);

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;
