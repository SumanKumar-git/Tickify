import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useGetAllEventsByOrganizerQuery, useDeleteEventMutation } from "../../events/api/eventApi";

export const OrganizerEventsPage = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useGetAllEventsByOrganizerQuery({ page, limit: 10 });
  const events = data?.events || [];
  const totalPages = data?.totalPages || 1;

  const [deleteEvent, { isLoading: isDeleting }] = useDeleteEventMutation();

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) return;

    try {
      await deleteEvent(id).unwrap();
      toast.success("Event deleted successfully");
    } catch (err) {
      toast.error(err.data?.message || "Failed to delete event");
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-360 mx-auto px-6 py-10 w-full grow animate-pulse space-y-6">
        <div className="h-6 bg-surface-container w-1/4 rounded"></div>
        <div className="h-44 bg-surface-container rounded-2xl"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-surface-container border border-outline-variant/30 rounded-xl text-center shadow-xl">
        <span className="material-symbols-outlined text-4xl text-error mb-2">error</span>
        <h2 className="text-md font-bold text-on-surface">Failed to load events</h2>
        <p className="text-xs text-on-surface-variant mt-2">
          Could not fetch event listings. Please reload.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-360 mx-auto px-6 py-10 w-full grow flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl md:text-headline-md font-bold text-on-surface tracking-tight">Manage Events</h1>
          <p className="text-xs text-on-surface-variant mt-1">Review event statuses, update details, or audit attendees.</p>
        </div>
        <Link
          to="/organizer/events/new"
          className="bg-primary text-on-primary px-5 py-2.5 rounded-lg font-bold hover:opacity-90 active:scale-95 transition-all text-xs flex items-center gap-1.5 shadow"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Create Event
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="py-20 bg-surface-container/20 border border-outline-variant/25 rounded-2xl text-center">
          <span className="material-symbols-outlined text-5xl text-outline opacity-40 mb-3">campaign</span>
          <p className="text-sm font-bold text-on-surface">No events created yet</p>
          <p className="text-xs text-on-surface-variant mt-1 font-medium">
            Get started by listing your very first workshop, conference, or music session!
          </p>
          <Link
            to="/organizer/events/new"
            className="mt-6 inline-block bg-primary text-on-primary text-xs font-bold px-6 py-2.5 rounded-lg active:scale-95 transition-all cursor-pointer shadow"
          >
            Create Event
          </Link>
        </div>
      ) : (
        /* Event Table / Cards */
        <div className="bg-surface-container border border-outline-variant/30 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-container-high border-b border-outline-variant/30 text-on-surface-variant font-bold text-[10px] uppercase tracking-wider">
                  <th className="p-4">Event Details</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Tickets Sold</th>
                  <th className="p-4">Price</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {events.map((evt) => {
                  const soldCount = evt.totalSeats - evt.availableSeats;
                  const isApproved = evt.status === "approved";
                  const isPending = evt.status === "pending";
                  const isRejected = evt.status === "rejected";

                  return (
                    <tr
                      key={evt._id}
                      onClick={() => navigate(`/organizer/events/${evt._id}`)}
                      className="hover:bg-surface-container-high/40 transition-colors cursor-pointer"
                    >
                      <td className="p-4 flex items-center gap-3">
                        <div className="w-12 h-12 rounded overflow-hidden shrink-0 bg-surface-container-high">
                          {evt.poster ? (
                            <img alt={evt.title} className="w-full h-full object-cover" src={evt.poster} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-outline">
                              <span className="material-symbols-outlined text-sm">image</span>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-on-surface truncate max-w-50">{evt.title}</p>
                          <p className="text-[10px] text-outline mt-0.5">
                            {new Date(evt.startDate).toLocaleDateString(undefined, { dateStyle: "short" })}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-medium text-on-surface-variant">{evt.category}</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border ${
                          isApproved
                            ? "bg-secondary-container/20 text-secondary border-secondary-container/30"
                            : isRejected
                            ? "bg-error-container/20 text-error border-error-container/30"
                            : "bg-surface-container-high text-on-surface border-outline-variant/40 animate-pulse"
                        }`}>
                          {evt.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-on-surface">{soldCount}</span>
                        <span className="text-outline"> / {evt.totalSeats} seats</span>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-on-surface">
                          {evt.ticketPrice > 0 ? `₹${evt.ticketPrice.toLocaleString()}` : "Free"}
                        </span>
                      </td>
                      <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-2 justify-end">
                          {!isApproved && (
                            <Link
                              to={`/organizer/events/${evt._id}/edit`}
                              className="w-8 h-8 rounded bg-surface-container-low border border-outline-variant/30 flex items-center justify-center text-primary hover:bg-surface-container-high transition-colors"
                              title="Edit"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </Link>
                          )}
                          <button
                            disabled={isDeleting}
                            onClick={(e) => handleDelete(e, evt._id)}
                            className="w-8 h-8 rounded bg-surface-container-low border border-outline-variant/30 flex items-center justify-center text-error hover:bg-error/10 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="bg-surface-container-high border-t border-outline-variant/30 p-4 flex justify-between items-center gap-4 text-xs font-semibold">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="px-3.5 py-2 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface hover:bg-surface-bright active:scale-95 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                Previous
              </button>
              <span className="text-on-surface-variant font-mono">
                Page <span className="text-primary font-bold">{page}</span> of {totalPages}
              </span>
              <button
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
                className="px-3.5 py-2 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface hover:bg-surface-bright active:scale-95 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5"
              >
                Next
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrganizerEventsPage;
