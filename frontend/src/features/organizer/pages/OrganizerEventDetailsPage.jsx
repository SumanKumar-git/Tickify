import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useGetEventByIdForOrganizerQuery } from "../../events/api/eventApi";
import { useGetEventRegistrationsQuery } from "../../bookings/api/bookingApi";
import { useCheckInTicketMutation } from "../../tickets/api/ticketApi";

export const OrganizerEventDetailsPage = () => {
  const { id } = useParams();

  // Fetch Event details
  const { data: eventData, isLoading: isEventLoading, error: eventError } = useGetEventByIdForOrganizerQuery(id);
  const event = eventData?.event;

  // Fetch Registrations
  const [page, setPage] = useState(1);
  const { data: regData, isLoading: isRegLoading } = useGetEventRegistrationsQuery({ eventId: id, params: { page, limit: 10 } });
  const registrations = regData?.registrations || [];
  const pagination = regData?.pagination || { currentPage: 1, totalPages: 1 };

  // Ticket check-in mutation
  const [qrPayload, setQrPayload] = useState("");
  const [checkInTicket, { isLoading: isCheckingIn }] = useCheckInTicketMutation();
  const [lastCheckIn, setLastCheckIn] = useState(null);

  const handleCheckIn = async (e) => {
    e.preventDefault();
    if (!qrPayload.trim()) {
      toast.error("Please enter a ticket signature payload");
      return;
    }

    try {
      const res = await checkInTicket({ eventId: id, qrPayload }).unwrap();
      toast.success(res.message || "Ticket checked in successfully!");
      setLastCheckIn(res.ticket);
      setQrPayload("");
    } catch (err) {
      toast.error(err.data?.message || "Invalid signature payload or ticket is already used/cancelled");
    }
  };

  if (isEventLoading) {
    return (
      <div className="max-w-360 mx-auto px-6 py-10 w-full grow animate-pulse space-y-6">
        <div className="h-10 bg-surface-container w-1/3 rounded"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-96 bg-surface-container rounded-2xl"></div>
          <div className="h-96 bg-surface-container rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (eventError || !event) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-surface-container border border-outline-variant/30 rounded-xl text-center shadow-xl">
        <span className="material-symbols-outlined text-4xl text-error mb-2">event_busy</span>
        <h2 className="text-md font-bold text-on-surface">Event Not Found</h2>
        <p className="text-xs text-on-surface-variant mt-2">Could not retrieve details for this event.</p>
        <Link
          to="/organizer/events"
          className="mt-6 inline-block bg-primary text-on-primary text-xs font-bold px-6 py-2.5 rounded-lg active:scale-95 transition-all cursor-pointer"
        >
          Back to Event List
        </Link>
      </div>
    );
  }

  const soldCount = event.totalSeats - event.availableSeats;
  const isApproved = event.status === "approved";

  return (
    <div className="max-w-360 mx-auto p-6 lg:p-10 w-full grow flex flex-col gap-10">
      
      {/* Back button */}
      <div>
        <Link to="/organizer/events" className="flex items-center gap-1.5 text-xs text-primary font-bold hover:underline mb-4">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to Events List
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-xl md:text-headline-md font-bold text-on-surface tracking-tight truncate max-w-xl">
            {event.title}
          </h1>
          <span className={`self-start md:self-auto px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border ${
            isApproved
              ? "bg-secondary-container/20 text-secondary border-secondary-container/30"
              : "bg-surface-container-high text-on-surface border-outline-variant/40 animate-pulse"
          }`}>
            {event.status}
          </span>
        </div>
      </div>

      {/* Grid splits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Columns: Details and Roster table */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* Metadata quick highlights */}
          <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/30 grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-[9px] text-outline font-semibold uppercase">Total Seats</p>
              <p className="text-sm font-bold text-on-surface mt-1">{event.totalSeats}</p>
            </div>
            <div>
              <p className="text-[9px] text-outline font-semibold uppercase">Seats Booked</p>
              <p className="text-sm font-bold text-on-surface mt-1">{soldCount}</p>
            </div>
            <div>
              <p className="text-[9px] text-outline font-semibold uppercase">Available Seats</p>
              <p className="text-sm font-bold text-on-surface mt-1">{event.availableSeats}</p>
            </div>
            <div>
              <p className="text-[9px] text-outline font-semibold uppercase">Ticket Price</p>
              <p className="text-sm font-bold text-on-surface mt-1">
                {event.ticketPrice > 0 ? `₹${event.ticketPrice.toLocaleString()}` : "Free"}
              </p>
            </div>
          </div>

          {/* Attendee Registrations Table */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">Attendee Registrations</h3>
            {isRegLoading ? (
              <div className="h-44 bg-surface-container rounded-xl animate-pulse"></div>
            ) : registrations.length === 0 ? (
              <div className="py-12 bg-surface-container/20 border border-outline-variant/20 rounded-xl text-center">
                <span className="material-symbols-outlined text-3xl text-outline opacity-40 mb-2">groups</span>
                <p className="text-xs text-on-surface-variant">No participants have registered yet.</p>
              </div>
            ) : (
              <div className="bg-surface-container border border-outline-variant/30 rounded-xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-surface-container-high border-b border-outline-variant/30 text-on-surface-variant font-bold text-[9px] uppercase tracking-wider">
                        <th className="p-3">Attendee</th>
                        <th className="p-3">Email</th>
                        <th className="p-3">Seats</th>
                        <th className="p-3">Payment</th>
                        <th className="p-3">Booking Status</th>
                        <th className="p-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10 text-on-surface">
                      {registrations.map((reg) => (
                        <tr key={reg._id || reg.bookingId} className="hover:bg-surface-container-high/20 transition-colors">
                          <td className="p-3 font-semibold">{reg.participant?.fullName}</td>
                          <td className="p-3 text-on-surface-variant font-mono">{reg.participant?.email}</td>
                          <td className="p-3 font-bold">{reg.quantity}</td>
                          <td className="p-3 font-semibold">
                            {reg.paymentStatus === "success" ? (
                              <span className="text-secondary">₹{reg.totalAmount.toLocaleString()}</span>
                            ) : (
                              <span className="text-outline">Unpaid</span>
                            )}
                          </td>
                          <td className="p-3">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border ${
                              reg.bookingStatus === "confirmed"
                                ? "bg-secondary-container/20 text-secondary border-secondary-container/30"
                                : "bg-error-container/20 text-error border-error-container/30"
                            }`}>
                              {reg.bookingStatus}
                            </span>
                          </td>
                          <td className="p-3 text-outline">
                            {reg.bookingDate ? new Date(reg.bookingDate).toLocaleDateString(undefined, { dateStyle: "short" }) : "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {pagination.totalPages > 1 && (
                  <div className="bg-surface-container-high border-t border-outline-variant/30 p-3.5 flex justify-between items-center gap-4 text-xs font-semibold">
                    <button
                      onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                      disabled={page === 1}
                      className="px-3 py-1.5 rounded bg-surface-container-low border border-outline-variant/30 text-on-surface hover:bg-surface-bright active:scale-95 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                      Previous
                    </button>
                    <span className="text-on-surface-variant font-mono">
                      Page <span className="text-primary font-bold">{page}</span> of {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setPage((prev) => Math.min(prev + 1, pagination.totalPages))}
                      disabled={page === pagination.totalPages}
                      className="px-3 py-1.5 rounded bg-surface-container-low border border-outline-variant/30 text-on-surface hover:bg-surface-bright active:scale-95 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      Next
                      <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Ticket Check-in Console */}
        <aside className="bg-surface-container p-6 rounded-2xl border border-outline-variant/30 shadow-xl space-y-6">
          <div className="pb-4 border-b border-outline-variant/20">
            <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest">Entry Check-In</h3>
            <p className="text-[10px] text-on-surface-variant mt-1 leading-snug">
              Scanner check-in dashboard. Validate guest tickets.
            </p>
          </div>

          {isApproved ? (
            <div className="space-y-4">
              <Link
                to={`/organizer/events/${id}/check-in`}
                className="w-full py-3 bg-primary text-on-primary rounded-lg text-xs font-bold shadow hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
                <span>Launch Camera Scanner</span>
              </Link>

              <div className="relative flex py-2 items-center">
                <div className="grow border-t border-outline-variant/20"></div>
                <span className="shrink mx-3 text-[9px] text-outline font-bold uppercase tracking-wider">or verify manually</span>
                <div className="grow border-t border-outline-variant/20"></div>
              </div>

              <form onSubmit={handleCheckIn} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-on-surface-variant">Signature Payload</label>
                  <input
                    type="text"
                    value={qrPayload}
                    onChange={(e) => setQrPayload(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-high text-xs text-on-surface placeholder:text-outline/40 focus:ring-1 focus:ring-primary outline-none transition-all"
                    placeholder="Paste QR cryptographic payload..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isCheckingIn}
                  className="w-full py-2.5 bg-primary text-on-primary rounded-lg text-xs font-bold shadow hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center"
                >
                  {isCheckingIn ? "Validating..." : "Verify & Check In"}
                </button>
              </form>
            </div>
          ) : (
            <div className="p-4 bg-secondary-container/10 border border-secondary-container/20 rounded-xl text-center text-xs text-secondary leading-relaxed">
              Check-in controls will be unlocked once administrators approve the event listing.
            </div>
          )}

          {/* Last checked in guest widget */}
          {lastCheckIn && (
            <div className="border-t border-outline-variant/10 pt-4 space-y-2">
              <p className="text-[9px] text-outline font-semibold uppercase">Last Verified Guest</p>
              <div className="p-3 bg-secondary-container/10 border border-secondary-container/25 rounded-lg text-left space-y-1">
                <p className="text-xs font-bold text-secondary">Verified Entry</p>
                <p className="text-[10px] font-bold text-on-surface">{lastCheckIn.user?.fullName || lastCheckIn.booking?.user?.fullName || "Guest"}</p>
                <p className="text-[9px] text-outline font-mono">No: {lastCheckIn.ticketNumber}</p>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default OrganizerEventDetailsPage;
