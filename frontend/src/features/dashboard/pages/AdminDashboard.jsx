import { Link } from "react-router-dom";
import { useGetAdminDashboardQuery } from "../api/dashboardApi";
import { StatsCard } from "../components/StatsCard";
import { PendingApprovalCard } from "../components/PendingApprovalCard";

export const AdminDashboard = () => {
  const { data, isLoading, error } = useGetAdminDashboardQuery();

  const dashboard = data?.dashboard;
  const overview = dashboard?.overview || { totalEvents: 0, totalUsers: 0, totalParticipants: 0, totalBookings: 0, pendingApprovalsCount: 0 };
  const pendingApprovals = dashboard?.pendingApprovals || [];
  const refundStats = dashboard?.refundStats || { pendingRefundsCount: 0, totalRefundedAmount: 0 };

  if (isLoading) {
    return (
      <div className="max-w-360 mx-auto p-6 lg:p-10 w-full grow animate-pulse space-y-8">
        <div className="h-10 bg-surface-container w-1/4 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 bg-surface-container rounded-xl"></div>
          ))}
        </div>
        <div className="h-96 bg-surface-container rounded-2xl"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-surface-container border border-outline-variant/30 rounded-xl text-center shadow-xl">
        <span className="material-symbols-outlined text-4xl text-error mb-2">error</span>
        <h2 className="text-md font-bold text-on-surface">Failed to load admin panel</h2>
        <p className="text-xs text-on-surface-variant mt-2">
          Could not fetch administrative dashboard. Please check authorizations.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-360 mx-auto p-6 lg:p-10 w-full grow flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-headline-md font-bold text-on-surface tracking-tight">Admin Console</h1>
        <p className="text-xs text-on-surface-variant mt-1">Review event approvals, check health metrics, and audit ledger refunds.</p>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Events"
          value={overview.totalEvents}
          icon="event"
          className="h-32"
        />

        <StatsCard
          title="Total Participants"
          value={overview.totalParticipants}
          icon="people"
          className="h-32"
        />

        <StatsCard
          title="Pending Approvals"
          value={overview.pendingApprovalsCount}
          icon="rate_review"
          iconClass="animate-pulse"
          valueColor="text-primary"
          className="h-32 border-l-4 border-l-primary"
        />

        <StatsCard
          title="Pending Refunds"
          value={refundStats.pendingRefundsCount}
          icon="payments"
          iconColor="text-secondary"
          valueColor="text-secondary"
          className="h-32"
        />
      </div>

      {/* Pending Approvals queue */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">Awaiting Verification Review</h3>
          <Link to="/admin/events" className="text-primary text-xs font-bold hover:underline">
            View Review Queue
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pendingApprovals.length === 0 ? (
            <div className="col-span-full py-16 bg-surface-container-low border border-outline-variant/20 rounded-xl text-center">
              <span className="material-symbols-outlined text-3xl text-outline opacity-40 mb-2">done_all</span>
              <p className="text-xs text-on-surface-variant">Review queue is empty! No events require verification.</p>
            </div>
          ) : (
            pendingApprovals.map((evt) => (
              <PendingApprovalCard key={evt._id} event={evt} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
