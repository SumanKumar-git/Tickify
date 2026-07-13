import { useState } from "react";
import { toast } from "react-hot-toast";
import { useGetEventsForAdminQuery, useApproveEventMutation, useRejectEventMutation } from "../../events/api/eventApi";

export const AdminEventsPage = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useGetEventsForAdminQuery({ page, limit: 10 });
  const events = data?.events || [];
  const totalPages = data?.totalPages || 1;

  const [approveEvent, { isLoading: isApproving }] = useApproveEventMutation();
  const [rejectEvent, { isLoading: isRejecting }] = useRejectEventMutation();

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [remark, setRemark] = useState("");

  const handleApprove = async () => {
    if (!selectedEvent) return;
    try {
      const res = await approveEvent({ id: selectedEvent._id, reviewRemark: remark }).unwrap();
      toast.success(res.message || "Event approved successfully");
      setSelectedEvent(null);
      setRemark("");
    } catch (err) {
      toast.error(err.data?.message || "Failed to approve event");
    }
  };

  const handleReject = async () => {
    if (!selectedEvent) return;
    if (!remark.trim()) {
      toast.error("Please provide a rejection remark reason");
      return;
    }
    try {
      const res = await rejectEvent({ id: selectedEvent._id, reviewRemark: remark }).unwrap();
      toast.success(res.message || "Event rejected successfully");
      setSelectedEvent(null);
      setRemark("");
    } catch (err) {
      toast.error(err.data?.message || "Failed to reject event");
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
        <h2 className="text-md font-bold text-on-surface">Failed to load review queue</h2>
        <p className="text-xs text-on-surface-variant mt-2">Could not retrieve event list.</p>
      </div>
    );
  }

  return (
    <div className="max-w-360 mx-auto px-6 py-10 w-full grow flex flex-col gap-6">
      <div>
        <h1 className="text-xl md:text-headline-md font-bold text-on-surface tracking-tight">Review Event Queue</h1>
        <p className="text-xs text-on-surface-variant mt-1">Audit organizer profiles and verify venue bookings before approving listings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: Events table list */}
        <div className="lg:col-span-2 bg-surface-container border border-outline-variant/30 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-container-high border-b border-outline-variant/30 text-on-surface-variant font-bold text-[10px] uppercase tracking-wider">
                  <th className="p-4">Event Details</th>
                  <th className="p-4">Organizer</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10 text-on-surface">
                {events.map((evt) => {
                  const isApproved = evt.status === "approved";
                  const isPending = evt.status === "pending";
                  const isRejected = evt.status === "rejected";

                  return (
                    <tr
                      key={evt._id}
                      onClick={() => {
                        setSelectedEvent(evt);
                        setRemark(evt.reviewRemark || "");
                      }}
                      className={`hover:bg-surface-container-high/40 transition-colors cursor-pointer ${
                        selectedEvent?._id === evt._id ? "bg-surface-container-high/60" : ""
                      }`}
                    >
                      <td className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded overflow-hidden shrink-0 bg-surface-container-high">
                          {evt.poster ? (
                            <img alt={evt.title} className="w-full h-full object-cover" src={evt.poster} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-outline">
                              <span className="material-symbols-outlined text-xs">image</span>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold truncate max-w-45">{evt.title}</p>
                          <p className="text-[10px] text-outline mt-0.5">{evt.category}</p>
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-on-surface-variant">{evt.organizer?.fullName}</td>
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
                      <td className="p-4 text-right">
                        <button className="text-primary font-bold text-[10px] hover:underline">
                          Select
                        </button>
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

        {/* Right Column: Event Audit panel */}
        <aside className="bg-surface-container p-6 rounded-2xl border border-outline-variant/30 shadow-xl space-y-6">
          {selectedEvent ? (
            <div className="space-y-6">
              <div className="pb-4 border-b border-outline-variant/20">
                <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest">Audit Console</h3>
                <p className="text-[10px] text-on-surface-variant mt-1 leading-snug">
                  Auditing: {selectedEvent.title}
                </p>
              </div>

              {/* Event poster card details */}
              <div className="h-32 rounded-lg overflow-hidden relative border border-outline-variant/20 bg-surface-container-high">
                {selectedEvent.poster && (
                  <img alt="poster" className="w-full h-full object-cover" src={selectedEvent.poster} />
                )}
                <div className="absolute inset-0 bg-black/40"></div>
              </div>

              <div className="text-[11px] text-on-surface-variant space-y-2 border-b border-outline-variant/10 pb-4">
                <p><span className="text-outline font-semibold">Description:</span> {selectedEvent.description}</p>
                <p><span className="text-outline font-semibold">Venue:</span> {selectedEvent.venue?.name}, {selectedEvent.venue?.city}</p>
                <p><span className="text-outline font-semibold">Capacity:</span> {selectedEvent.totalSeats} seats</p>
                <p><span className="text-outline font-semibold">Price:</span> ₹{selectedEvent.ticketPrice}</p>
              </div>

              {/* Remark textbox */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-on-surface-variant">Review Remarks</label>
                <textarea
                  rows={3}
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-high text-xs text-on-surface placeholder:text-outline/40 focus:ring-1 focus:ring-primary outline-none resize-none transition-all"
                  placeholder="Approve message or rejection reason details..."
                />
              </div>

              {selectedEvent.status === "pending" && (
                <div className="flex gap-4">
                  <button
                    onClick={handleReject}
                    disabled={isRejecting || isApproving}
                    className="w-1/2 py-2.5 border border-error/30 hover:bg-error/10 text-error rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    Reject
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={isRejecting || isApproving}
                    className="w-1/2 py-2.5 bg-primary text-on-primary rounded-lg text-xs font-bold shadow hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                  >
                    Approve
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-on-surface-variant text-xs leading-relaxed">
              <span className="material-symbols-outlined text-4xl opacity-30 mb-2 block">rate_review</span>
              Select an event from the list to audit details and verify publication.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default AdminEventsPage;
