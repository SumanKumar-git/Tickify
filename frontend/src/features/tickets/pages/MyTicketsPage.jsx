import { useState } from "react";
import { Link } from "react-router-dom";
import { useGetMyTicketsQuery } from "../api/ticketApi";
import { TicketCard } from "../components/TicketCard";

export const MyTicketsPage = () => {
  const { data, isLoading, error } = useGetMyTicketsQuery();
  const tickets = data?.tickets || [];
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredTickets = tickets.filter((t) => {
    if (filterStatus === "all") return true;
    return t.ticketStatus === filterStatus;
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10 w-full grow animate-pulse space-y-6">
        <div className="h-6 bg-surface-container w-1/4 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-44 bg-surface-container rounded-2xl"></div>
          <div className="h-44 bg-surface-container rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-surface-container border border-outline-variant/30 rounded-xl text-center shadow-xl">
        <span className="material-symbols-outlined text-4xl text-error mb-2">error_outline</span>
        <h2 className="text-md font-bold text-on-surface">Failed to load tickets</h2>
        <p className="text-xs text-on-surface-variant mt-2">
          Could not retrieve tickets. Please refresh the page.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 w-full grow flex flex-col gap-6">
      {/* Header Title Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-headline-md font-bold text-on-surface tracking-tight">My Tickets</h1>
          <p className="text-xs text-on-surface-variant mt-1">Access your active digital entry codes and checked-in vouchers.</p>
        </div>

        {/* Filter Section */}
        {tickets.length > 0 && (
          <div className="flex bg-surface-container p-1 rounded-xl border border-outline-variant/20 shrink-0">
            {["all", "active", "used", "cancelled"].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  filterStatus === status
                    ? "bg-primary text-on-primary shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        )}
      </div>

      {tickets.length === 0 ? (
        <div className="py-20 bg-surface-container/20 border border-outline-variant/25 rounded-2xl text-center">
          <span className="material-symbols-outlined text-5xl text-outline opacity-40 mb-3">local_activity</span>
          <p className="text-sm font-bold text-on-surface">No tickets purchased yet</p>
          <p className="text-xs text-on-surface-variant mt-1">
            You don't have any event entry tickets. Find events and book tickets to get entry vouchers.
          </p>
          <Link
            to="/"
            className="mt-6 inline-block bg-primary text-on-primary text-xs font-bold px-6 py-2.5 rounded-lg active:scale-95 transition-all cursor-pointer"
          >
            Explore Events
          </Link>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="py-20 bg-surface-container/10 border border-outline-variant/20 rounded-2xl text-center">
          <span className="material-symbols-outlined text-5xl text-outline opacity-30 mb-3">local_activity</span>
          <p className="text-sm font-bold text-on-surface">No {filterStatus} tickets found</p>
          <p className="text-xs text-on-surface-variant mt-1">
            You don't have any tickets currently marked as {filterStatus}.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredTickets.map((t) => (
            <TicketCard key={t._id} ticket={t} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTicketsPage;
