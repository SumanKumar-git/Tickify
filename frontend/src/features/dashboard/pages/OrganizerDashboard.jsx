import { Link } from "react-router-dom";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid } from "recharts";
import { useGetOrganizerDashboardQuery } from "../api/dashboardApi";
import { StatsCard } from "../components/StatsCard";
import { UpcomingEventCard } from "../components/UpcomingEventCard";

const MONTH_NAMES = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const OrganizerDashboard = () => {
  const { data, isLoading, error } = useGetOrganizerDashboardQuery();

  const dashboard = data?.dashboard;
  const overview = dashboard?.overview || { eventsCreated: 0, totalBookings: 0, totalRegistrations: 0, revenueGenerated: 0 };
  const upcomingEvents = dashboard?.upcomingEvents || [];
  const analytics = dashboard?.analytics || {};
  const eventPerformance = analytics.eventPerformance || [];
  const registrationTrends = analytics.registrationTrends || [];

  // Format trends for Recharts
  const chartData = registrationTrends.map((trend) => ({
    name: `${MONTH_NAMES[trend.month]} ${trend.year}`,
    "Tickets Sold": trend.totalRegistrations,
    Bookings: trend.totalBookings,
  }));

  const perfData = eventPerformance.slice(0, 5).map((perf) => ({
    title: perf.title.length > 15 ? `${perf.title.slice(0, 15)}...` : perf.title,
    Revenue: perf.revenue,
    Attendance: perf.ticketsSold,
  }));

  if (isLoading) {
    return (
      <div className="max-w-360 mx-auto p-6 lg:p-10 w-full grow animate-pulse space-y-8">
        <div className="h-10 bg-surface-container w-1/4 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 bg-surface-container rounded-xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-80 bg-surface-container rounded-2xl"></div>
          <div className="h-80 bg-surface-container rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-surface-container border border-outline-variant/30 rounded-xl text-center shadow-xl">
        <span className="material-symbols-outlined text-4xl text-error mb-2">error</span>
        <h2 className="text-md font-bold text-on-surface">Failed to load dashboard</h2>
        <p className="text-xs text-on-surface-variant mt-2">
          Could not retrieve organizer dashboard metrics. Please reload.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-360 mx-auto p-6 lg:p-10 w-full grow flex flex-col gap-8">
      {/* Header */}
      <section className="flex justify-between items-center">
        <div>
          <h1 className="text-xl md:text-headline-md font-bold text-on-surface tracking-tight">Organizer Dashboard</h1>
          <p className="text-xs text-on-surface-variant mt-1">Manage events, track registrations, and monitor financial payouts.</p>
        </div>
        <Link
          to="/organizer/events/new"
          className="bg-primary text-on-primary px-5 py-2.5 rounded-lg font-bold hover:opacity-90 active:scale-95 transition-all text-xs flex items-center gap-1.5 shadow"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Create Event
        </Link>
      </section>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Events"
          value={overview.eventsCreated}
          icon="event"
          className="h-32"
        />

        <StatsCard
          title="Total Bookings"
          value={overview.totalBookings}
          icon="shopping_bag"
          className="h-32"
        />

        <StatsCard
          title="Registrations"
          value={overview.totalRegistrations}
          icon="groups"
          className="h-32"
        />

        <StatsCard
          title="Revenue"
          value={`₹${overview.revenueGenerated?.toLocaleString()}`}
          icon="payments"
          iconColor="text-secondary"
          valueColor="text-secondary"
          className="h-32"
        />
      </div>

      {/* Graphical Charts Section */}
      {chartData.length > 0 || perfData.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Chart 1: Registration Trends */}
          {chartData.length > 0 && (
            <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/30">
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest mb-6">Registration Trends</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorRegistrations" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#c0c1ff" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#c0c1ff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2c" vertical={false} />
                    <XAxis dataKey="name" stroke="#908fa0" fontSize={10} tickLine={false} />
                    <YAxis stroke="#908fa0" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#201f22", border: "1px solid rgba(144,143,160,0.2)", borderRadius: 8, fontSize: 11 }} />
                    <Area type="monotone" dataKey="Tickets Sold" stroke="#c0c1ff" strokeWidth={2} fillOpacity={1} fill="url(#colorRegistrations)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Chart 2: Event Performance */}
          {perfData.length > 0 && (
            <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/30">
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest mb-6">Event Performance</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={perfData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2c" vertical={false} />
                    <XAxis dataKey="title" stroke="#908fa0" fontSize={10} tickLine={false} />
                    <YAxis stroke="#908fa0" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#201f22", border: "1px solid rgba(144,143,160,0.2)", borderRadius: 8, fontSize: 11 }} />
                    <Bar dataKey="Revenue" fill="#8083ff" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Upcoming Events Grid */}
      <div className="space-y-6">
        <h3 className="text-sm font-bold text-on-surface">Upcoming Approved Events</h3>
        {upcomingEvents.length === 0 ? (
          <div className="py-12 bg-surface-container/20 border border-outline-variant/20 rounded-xl text-center">
            <span className="material-symbols-outlined text-3xl text-outline opacity-40 mb-2">event_busy</span>
            <p className="text-xs text-on-surface-variant">No upcoming approved events found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.map((evt) => (
              <UpcomingEventCard key={evt._id} event={evt} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizerDashboard;
