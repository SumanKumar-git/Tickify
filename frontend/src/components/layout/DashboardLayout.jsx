import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useSelector} from "react-redux";
import { selectCurrentUser, selectIsAuthenticated } from "../../features/auth/authSlice";
import { useLogoutMutation } from "../../features/auth/api/authApi";
import { toast } from "react-hot-toast";

export const DashboardLayout = () => {
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [logout] = useLogoutMutation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      toast.success("Successfully logged out");
      navigate("/auth");
    } catch (err) {
      toast.error("Logout failed");
    }
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  // Sidebar navigation items based on role
  const getNavItems = () => {
    switch (user.role) {
      case "organizer":
        return [
          {
            label: "Dashboard",
            to: "/organizer/dashboard",
            icon: "dashboard",
          },
          {
            label: "Events",
            to: "/organizer/events",
            icon: "calendar_today",
          },
          {
            label: "Create Event",
            to: "/organizer/events/new",
            icon: "add_box",
          },
        ];
      case "admin":
        return [
          {
            label: "Dashboard",
            to: "/admin/dashboard",
            icon: "dashboard",
          },
          {
            label: "Review Queue",
            to: "/admin/events",
            icon: "rate_review",
          },
          {
            label: "Organizers",
            to: "/admin/organizers",
            icon: "groups",
          },
          {
            label: "Refunds",
            to: "/admin/refunds",
            icon: "payments",
          },
        ];
      case "user":
      default:
        return [
          {
            label: "Dashboard",
            to: "/dashboard",
            icon: "dashboard",
          },
          {
            label: "My Tickets",
            to: "/tickets",
            icon: "local_activity",
          },
          {
            label: "My Bookings",
            to: "/bookings",
            icon: "calendar_month",
          },
          {
            label: "Transactions",
            to: "/transactions",
            icon: "receipt_long",
          },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <div className="flex flex-1 relative min-h-[calc(100vh-64px)]">
      {/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-primary text-on-primary shadow-2xl flex items-center justify-center cursor-pointer active:scale-95 transition-all"
      >
        <span className="material-symbols-outlined text-[24px]">
          {isSidebarOpen ? "close" : "menu"}
        </span>
      </button>

      {/* Sidebar navigation */}
      <aside
        className={`fixed top-16 left-0 h-[calc(100vh-64px)] w-64 p-4 bg-surface-container-lowest border-r border-outline-variant/30 flex flex-col z-40 transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Header / Brand block */}
        <div className="flex items-center gap-3 px-4 py-4 mb-6">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary">
            <span className="material-symbols-outlined text-[20px]">
              {user.role === "admin"
                ? "admin_panel_settings"
                : user.role === "organizer"
                ? "business_center"
                : "account_circle"}
            </span>
          </div>
          <div>
            <h2 className="text-sm font-bold text-primary leading-none uppercase tracking-wide">
              {user.role === "user" ? "Participant" : `${user.role} Panel`}
            </h2>
            <span className="text-[10px] text-on-surface-variant font-medium">
              Tickify Portal
            </span>
          </div>
        </div>

        {/* Links */}
        <nav className="flex-1 flex flex-col gap-1.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-primary/10 text-primary border-l-4 border-primary pl-3 sidebar-active"
                    : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                }`
              }
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer controls inside sidebar */}
        <div className="mt-auto pt-4 border-t border-outline-variant/20">
          <div className="flex items-center gap-3 p-2 mb-4 bg-surface-container-low rounded-lg border border-outline-variant/10">
            <div className="w-9 h-9 rounded-full overflow-hidden shrink-0">
              {user.profilePhoto ? (
                <img
                  alt="avatar"
                  className="w-full h-full object-cover"
                  src={user.profilePhoto}
                />
              ) : (
                <span className="material-symbols-outlined text-[36px] text-on-surface-variant">
                  account_circle
                </span>
              )}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-on-surface truncate">{user.fullName}</p>
              <p className="text-[10px] text-on-surface-variant truncate capitalize">
                {user.role} Account
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold text-error hover:bg-error/10 transition-all text-left"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main dashboard routing viewport */}
      <main className="flex-1 lg:ml-64 p-6 lg:p-10 bg-background flex flex-col overflow-x-hidden min-h-full">
        <Outlet />
      </main>

      {/* Backdrop overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30 pt-16"
        ></div>
      )}
    </div>
  );
};

export default DashboardLayout;
