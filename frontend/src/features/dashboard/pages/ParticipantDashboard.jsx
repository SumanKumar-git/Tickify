import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useGetParticipantDashboardQuery } from "../api/dashboardApi";
import { useGetAllEventsQuery } from "../../events/api/eventApi";
import { StatsCard } from "../components/StatsCard";
import { RegisteredEventCard } from "../components/RegisteredEventCard";
import { RecommendedEventCard } from "../components/RecommendedEventCard";

export const ParticipantDashboard = () => {
  const { data: dashData, isLoading, error } = useGetParticipantDashboardQuery();
  const { data: recData } = useGetAllEventsQuery({ limit: 2 });

  const dashboard = dashData?.dashboard;
  const overview = dashboard?.overview || { totalRegisteredEvents: 0, upcomingEventsCount: 0, totalTickets: 0 };
  const registeredEvents = dashboard?.registeredEvents || [];
  const profile = dashboard?.profileInformation || {};
  const recommendedEvents = recData?.events || [];

  // Countdown timer calculation for the next event
  const [countdown, setCountdown] = useState({ days: "00", hours: "00", minutes: "00" });

  useEffect(() => {
    if (!registeredEvents.length) return;

    // Find the next upcoming event
    const upcoming = registeredEvents
      .filter((b) => b.bookingStatus === "confirmed" && new Date(b.event?.startDate) > new Date())
      .sort((a, b) => new Date(a.event.startDate) - new Date(b.event.startDate))[0];

    if (!upcoming) return;

    const targetDate = new Date(upcoming.event.startDate);

    const updateTimer = () => {
      const diff = targetDate - new Date();
      if (diff <= 0) {
        setCountdown({ days: "00", hours: "00", minutes: "00" });
        return;
      }
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);

      setCountdown({
        days: d.toString().padStart(2, "0"),
        hours: h.toString().padStart(2, "0"),
        minutes: m.toString().padStart(2, "0"),
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [registeredEvents]);

  // Compute total spending
  const totalInvestment = registeredEvents
    .filter((b) => b.bookingStatus === "confirmed")
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  if (isLoading) {
    return (
      <div className="max-w-360 mx-auto p-6 lg:p-10 w-full grow animate-pulse space-y-8">
        <div className="h-10 bg-surface-container w-1/3 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 bg-surface-container rounded-xl"></div>
          <div className="h-32 bg-surface-container rounded-xl"></div>
          <div className="h-32 bg-surface-container rounded-xl"></div>
        </div>
        <div className="h-96 bg-surface-container rounded-2xl"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-surface-container border border-outline-variant/30 rounded-xl text-center shadow-xl">
        <span className="material-symbols-outlined text-4xl text-error mb-2">error</span>
        <h2 className="text-md font-bold text-on-surface">Failed to load dashboard</h2>
        <p className="text-xs text-on-surface-variant mt-2">
          Could not fetch dashboard metrics. Please reload.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-360 mx-auto p-6 lg:p-10 w-full grow flex flex-col gap-10">
      {/* Dashboard Header */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl md:text-display-lg-mobile lg:text-display-lg text-on-background font-extrabold tracking-tight">
            Welcome back, <span className="text-primary">{profile.fullName?.split(" ")[0]}</span>
          </h1>
          <p className="text-xs md:text-body-lg text-on-surface-variant mt-1">
            Ready to explore? You have <span className="text-on-surface font-bold">{overview.upcomingEventsCount} upcoming events</span>.
          </p>
        </div>
        <div className="flex items-center gap-4 bg-surface-container-low p-4 rounded-xl shadow-lg border border-outline-variant/30">
          <div className="text-right">
            <p className="text-xs font-bold text-on-surface">{profile.fullName}</p>
            <p className="text-[9px] uppercase tracking-widest text-primary font-bold">Pro Attendee</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center shadow-inner">
            <span className="material-symbols-outlined text-on-primary-container text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              star
            </span>
          </div>
        </div>
      </section>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Registered Events"
          className="bento-item glass-card h-40"
          extraHeader={
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-md">event_available</span>
            </div>
          }
        >
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-on-surface leading-none">{overview.totalRegisteredEvents}</span>
            <span className="text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded text-[8px] font-bold uppercase">
              Confirmed
            </span>
          </div>
        </StatsCard>

        <StatsCard
          title="Next Event In"
          className="bento-item bg-primary text-on-primary shadow-2xl shadow-primary/20 h-40 relative overflow-hidden"
          extraHeader={
            <span className="material-symbols-outlined opacity-80 text-[20px]">timer</span>
          }
        >
          <div className="relative z-10 flex items-center gap-4">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-extrabold">{countdown.days}</span>
              <span className="text-[8px] uppercase font-bold opacity-60">Days</span>
            </div>
            <span className="text-xl opacity-40 font-light">:</span>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-extrabold">{countdown.hours}</span>
              <span className="text-[8px] uppercase font-bold opacity-60">Hrs</span>
            </div>
            <span className="text-xl opacity-40 font-light">:</span>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-extrabold">{countdown.minutes}</span>
              <span className="text-[8px] uppercase font-bold opacity-60">Min</span>
            </div>
          </div>
          <div className="absolute -right-8 -bottom-8 w-28 h-28 bg-white opacity-10 rounded-full blur-2xl"></div>
        </StatsCard>

        <StatsCard
          title="Total Investment"
          className="bento-item glass-card h-40"
          extraHeader={
            <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary text-md">payments</span>
            </div>
          }
        >
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-on-surface leading-none">₹{totalInvestment.toLocaleString()}</span>
            <span className="text-on-surface-variant text-[9px] uppercase font-bold">Total</span>
          </div>
        </StatsCard>
      </div>

      {/* Grid panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: Registered Events */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-md font-bold text-on-surface">Registered Events</h3>
            <Link to="/bookings" className="text-primary text-xs font-bold hover:underline">
              View All Bookings
            </Link>
          </div>

          <div className="space-y-4">
            {registeredEvents.length === 0 ? (
              <div className="py-12 bg-surface-container-low border border-outline-variant/20 rounded-xl text-center">
                <span className="material-symbols-outlined text-3xl text-outline opacity-40 mb-2">event_busy</span>
                <p className="text-xs text-on-surface-variant">No registered events found.</p>
              </div>
            ) : (
              registeredEvents.map((booking) => (
                <RegisteredEventCard key={booking._id} booking={booking} />
              ))
            )}
          </div>
        </div>

        {/* Right Column: Recommendations */}
        <div className="lg:col-span-1 space-y-6">
          <h3 className="text-md font-bold text-on-surface">Recommendations</h3>
          <div className="space-y-6">
            {recommendedEvents.length === 0 ? (
              <p className="text-xs text-on-surface-variant">No recommended events available.</p>
            ) : (
              recommendedEvents.map((rec) => (
                <RecommendedEventCard key={rec._id} event={rec} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParticipantDashboard;
