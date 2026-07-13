import { useState, useEffect, useRef } from "react";
import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Toaster, toast } from "react-hot-toast";
import {
  selectCurrentUser,
  selectIsAuthenticated,
  selectIsAuthInitialized,
  clearCredentials,
} from "../../features/auth/authSlice";
import { useCheckAuthQuery, useLogoutMutation } from "../../features/auth/api/authApi";
import {
  useGetMyNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useDeleteNotificationMutation,
} from "../../features/notifications/api/notificationApi";

export const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isInitialized = useSelector(selectIsAuthInitialized);

  // Restore auth session on mount
  const { isLoading: isAuthChecking } = useCheckAuthQuery(undefined, {
    skip: isInitialized,
  });

  const [logout] = useLogoutMutation();

  // Search bar and Notification states
  const [navSearch, setNavSearch] = useState("");
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  const handleNavSearchSubmit = (e) => {
    e.preventDefault();
    if (navSearch.trim()) {
      navigate(`/events?search=${encodeURIComponent(navSearch.trim())}`);
      setNavSearch("");
    }
  };

  // Notifications queries (only poll if logged in)
  const { data: notificationsData } = useGetMyNotificationsQuery(
    { limit: 5 },
    { skip: !isAuthenticated, pollingInterval: 30000 }
  );
  const { data: unreadData } = useGetUnreadNotificationCountQuery(undefined, {
    skip: !isAuthenticated,
    pollingInterval: 30000,
  });

  const [markAsRead] = useMarkNotificationAsReadMutation();
  const [markAllRead] = useMarkAllNotificationsAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();

  const unreadCount = unreadData?.unreadCount || 0;
  const notifications = notificationsData?.notifications || [];

  // Close dropdowns on outside clicks
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      toast.success("Successfully logged out");
      navigate("/auth");
    } catch (err) {
      toast.error("Logout failed");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead().unwrap();
      toast.success("All notifications marked as read");
    } catch (err) {
      toast.error("Failed to mark read");
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      await markAsRead(notif._id).unwrap();
    }
    setIsNotificationOpen(false);
    // Redirect based on type
    if (notif.relatedEvent) {
      navigate(`/events/${notif.relatedEvent}`);
    } else if (notif.relatedBooking) {
      navigate(`/bookings/${notif.relatedBooking}`);
    }
  };

  const handleDeleteNotif = async (e, id) => {
    e.stopPropagation();
    try {
      await deleteNotification(id).unwrap();
      toast.success("Notification deleted");
    } catch (err) {
      toast.error("Failed to delete notification");
    }
  };

  if (!isInitialized && isAuthChecking) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
        </div>
        <p className="mt-4 text-sm text-on-surface-variant font-medium animate-pulse">Initializing Tickify...</p>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-sans">
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#201f22',
          color: '#e5e1e4',
          border: '1px solid rgba(144, 143, 160, 0.2)'
        }
      }} />

      {/* TopNavBar */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-surface-container border-b border-outline-variant/30">
        <div className="flex items-center gap-8 grow">
          <Link to="/" className="flex items-center gap-1.5 font-display text-2xl font-black tracking-tight bg-linear-to-r from-primary to-primary-container bg-clip-text text-transparent hover:opacity-90 transition-opacity shrink-0">
            <span className="material-symbols-outlined text-[28px] shrink-0">confirmation_number</span>
            <span>Tickify</span>
          </Link>
          <nav className="hidden md:flex gap-6 shrink-0">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `text-label-sm font-semibold transition-colors hover:text-primary ${
                  isActive && location.pathname === "/" ? "text-primary border-b-2 border-primary pb-1" : "text-on-surface-variant"
                }`
              }
            >
              Discover
            </NavLink>
            <NavLink
              to="/events"
              className={({ isActive }) =>
                `text-label-sm font-semibold transition-colors hover:text-primary ${
                  location.pathname.startsWith("/events") ? "text-primary border-b-2 border-primary pb-1" : "text-on-surface-variant"
                }`
              }
            >
              Events
            </NavLink>
            {isAuthenticated && user?.role === "user" && (
              <NavLink
                to="/tickets"
                className={({ isActive }) =>
                  `text-label-sm font-semibold transition-colors hover:text-primary ${
                    isActive ? "text-primary border-b-2 border-primary pb-1" : "text-on-surface-variant"
                  }`
                }
              >
                My Tickets
              </NavLink>
            )}
            {isAuthenticated && user?.role === "organizer" && (
              <NavLink
                to="/organizer/dashboard"
                className={({ isActive }) =>
                  `text-label-sm font-semibold transition-colors hover:text-primary ${
                    isActive ? "text-primary border-b-2 border-primary pb-1" : "text-on-surface-variant"
                  }`
                }
              >
                Organize
              </NavLink>
            )}
            {isAuthenticated && user?.role === "admin" && (
              <NavLink
                to="/admin/dashboard"
                className={({ isActive }) =>
                  `text-label-sm font-semibold transition-colors hover:text-primary ${
                    isActive ? "text-primary border-b-2 border-primary pb-1" : "text-on-surface-variant"
                  }`
                }
              >
                Admin
              </NavLink>
            )}
          </nav>

          {/* Header Search Bar */}
          {/* Header Search Bar */}
          <form onSubmit={handleNavSearchSubmit} className="hidden md:block relative max-w-md w-full ml-4">
            <input
              type="text"
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-outline-variant/30 bg-surface-container-low/85 text-on-surface text-xs focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-outline/70"
              placeholder="Search events, cities..."
            />
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px] pointer-events-none flex items-center">
              search
            </span>
          </form>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated && user?.role === "organizer" && (
            <Link
              to="/organizer/events/new"
              className="hidden md:flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-lg font-bold hover:opacity-90 active:scale-95 transition-all shadow-sm text-label-sm"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Create Event
            </Link>
          )}

          {/* Notifications Dropdown */}
          {isAuthenticated && (
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="w-10 h-10 rounded-full hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors relative"
              >
                <span className="material-symbols-outlined text-[24px]">notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary text-on-primary font-bold text-[9px] rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {isNotificationOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-surface-container border border-outline-variant/30 rounded-xl shadow-2xl overflow-hidden z-50">
                  <div className="p-4 border-b border-outline-variant/30 flex justify-between items-center">
                    <span className="font-bold text-sm text-on-surface">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-primary font-semibold hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-outline-variant/10">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-on-surface-variant text-xs">
                        <span className="material-symbols-outlined text-3xl opacity-30 mb-2 block">notifications_off</span>
                        All quiet for now.
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif._id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`p-4 flex items-start gap-3 cursor-pointer hover:bg-surface-container-high transition-colors ${
                            !notif.isRead ? "bg-primary/5" : ""
                          }`}
                        >
                          <div className="flex-1">
                            <p className="text-xs font-bold text-on-surface mb-0.5">{notif.title}</p>
                            <p className="text-[11px] text-on-surface-variant leading-relaxed">{notif.message}</p>
                            <span className="text-[9px] text-outline mt-1 block">
                              {new Date(notif.createdAt).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1 items-end">
                            {!notif.isRead && (
                              <span className="w-2 h-2 bg-primary rounded-full shrink-0"></span>
                            )}
                            <button
                              onClick={(e) => handleDeleteNotif(e, notif._id)}
                              className="text-on-surface-variant hover:text-error opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-surface-container-highest transition-all"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-3 bg-surface-container-low border-t border-outline-variant/30 text-center">
                    <span className="text-[11px] text-on-surface-variant">Showing latest notifications</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Profile Dropdown */}
          {isAuthenticated ? (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="w-10 h-10 rounded-full border border-outline-variant/30 overflow-hidden cursor-pointer hover:border-primary transition-all active:scale-95 flex items-center justify-center bg-surface-container-high"
              >
                {user.profilePhoto ? (
                  <img
                    alt="User Profile"
                    className="w-full h-full object-cover"
                    src={user.profilePhoto}
                  />
                ) : (
                  <span className="material-symbols-outlined text-on-surface-variant">account_circle</span>
                )}
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-surface-container border border-outline-variant/30 rounded-xl shadow-2xl overflow-hidden z-50">
                  <div className="p-4 border-b border-outline-variant/30">
                    <p className="text-sm font-bold text-on-surface">{user.fullName}</p>
                    <p className="text-xs text-on-surface-variant truncate">{user.email}</p>
                    <span className="inline-block mt-2 text-[9px] font-bold uppercase tracking-widest bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded">
                      {user.role === "user" ? "Participant" : user.role}
                    </span>
                  </div>
                  <div className="p-1.5">
                    {user.role === "user" && (
                      <>
                        <Link
                          to="/dashboard"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all"
                        >
                          <span className="material-symbols-outlined text-[18px]">dashboard</span>
                          My Dashboard
                        </Link>
                        <Link
                          to="/tickets"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all"
                        >
                          <span className="material-symbols-outlined text-[18px]">local_activity</span>
                          My Tickets
                        </Link>
                        <Link
                          to="/bookings"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all"
                        >
                          <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                          My Bookings
                        </Link>
                      </>
                    )}
                    {user.role === "organizer" && (
                      <>
                        <Link
                          to="/organizer/dashboard"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all"
                        >
                          <span className="material-symbols-outlined text-[18px]">dashboard</span>
                          Organizer Panel
                        </Link>
                        <Link
                          to="/organizer/events"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all"
                        >
                          <span className="material-symbols-outlined text-[18px]">event</span>
                          Manage Events
                        </Link>
                      </>
                    )}
                    {user.role === "admin" && (
                      <>
                        <Link
                          to="/admin/dashboard"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all"
                        >
                          <span className="material-symbols-outlined text-[18px]">dashboard</span>
                          Admin Panel
                        </Link>
                        <Link
                          to="/admin/events"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all"
                        >
                          <span className="material-symbols-outlined text-[18px]">rate_review</span>
                          Review Events
                        </Link>
                      </>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-error hover:bg-error/10 transition-all text-left mt-1 border-t border-outline-variant/10 pt-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">logout</span>
                      Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                to="/auth"
                className="text-on-surface-variant font-medium hover:text-primary transition-all text-label-sm active:scale-95"
              >
                Log In
              </Link>
              <Link
                to="/auth?tab=signup"
                className="bg-primary text-on-primary px-4 py-2 rounded-lg font-bold hover:opacity-90 active:scale-95 transition-all shadow-sm text-label-sm"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Main Page Area */}
      <main className="grow pt-16 flex flex-col">
        <Outlet />
      </main>

      {!["/auth", "/verify-otp", "/forgot-password", "/reset-password", "/dashboard"].includes(location.pathname) &&
       !location.pathname.startsWith("/organizer") &&
       !location.pathname.startsWith("/admin") &&
       !location.pathname.startsWith("/tickets") &&
       !location.pathname.startsWith("/bookings") &&
       !location.pathname.startsWith("/transactions") && (
        <footer className="w-full py-16 px-6 bg-surface-container-lowest text-on-surface border-t border-outline-variant/30 mt-auto">
          <div className="max-w-360 mx-auto w-full flex flex-col md:flex-row justify-between items-start gap-12">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 font-display text-3xl font-black tracking-tight bg-linear-to-r from-primary to-primary-container bg-clip-text text-transparent">
                <span className="material-symbols-outlined text-[32px] shrink-0">confirmation_number</span>
                <span>Tickify</span>
              </div>
              <p className="text-on-surface-variant max-w-70 text-xs leading-relaxed">
                Empowering connections through seamless event technology and premium attendee experiences worldwide.
              </p>
            </div>
            <div className="flex flex-wrap gap-12 md:gap-20">
              <div className="flex flex-col gap-3">
                <span className="font-bold text-[10px] uppercase tracking-widest text-outline">Platform</span>
                <Link to="/" className="text-on-surface-variant hover:text-primary transition-all text-xs">Discover</Link>
                <Link to="/events" className="text-on-surface-variant hover:text-primary transition-all text-xs">Events</Link>
                <Link to="/auth" className="text-on-surface-variant hover:text-primary transition-all text-xs">Organize</Link>
              </div>
              <div className="flex flex-col gap-3">
                <span className="font-bold text-[10px] uppercase tracking-widest text-outline">Support</span>
                <Link to="/contact" className="text-on-surface-variant hover:text-primary transition-all text-xs">Contact</Link>
              </div>
            </div>
          </div>
          <div className="max-w-360 mx-auto w-full border-t border-outline-variant/10 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-xs text-on-surface-variant opacity-60">© 2026 Tickify SaaS. All rights reserved.</p>
          </div>
        </footer>
      )}
    </div>
  );
};

export default MainLayout;
