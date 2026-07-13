import { useNavigate } from "react-router-dom";

export const BookingCard = ({ booking, onCancel, isCancelling }) => {
  const navigate = useNavigate();

  const isPending = booking.bookingStatus === "pending";
  const isConfirmed = booking.bookingStatus === "confirmed";
  const isCancelled = booking.bookingStatus === "cancelled";
  const event = booking.event || {};
  const isPastEvent = new Date(event.startDate) <= new Date();

  return (
    <div
      onClick={() => navigate(`/bookings/${booking._id}`)}
      className="bg-surface-container p-5 rounded-xl border border-outline-variant/30 flex flex-col sm:flex-row items-center gap-6 hover:border-primary/40 cursor-pointer transition-all duration-300"
    >
      {/* Poster */}
      <div className="w-full sm:w-24 h-24 rounded-lg overflow-hidden shrink-0 shadow bg-surface-container-high">
        {event.poster ? (
          <img alt={event.title} className="w-full h-full object-cover" src={event.poster} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-outline">
            <span className="material-symbols-outlined text-2xl">image</span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="grow text-center sm:text-left space-y-1.5 min-w-0">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
          <span
            className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border ${
              isConfirmed
                ? "bg-secondary-container/20 text-secondary border-secondary-container/30"
                : isCancelled
                ? "bg-error-container/20 text-error border-error-container/30"
                : "bg-surface-container-high text-on-surface border-outline-variant/40 animate-pulse"
            }`}
          >
            {booking.bookingStatus}
          </span>
          <span className="text-[10px] text-outline">Order ID #{booking._id.toUpperCase()}</span>
        </div>
        <h3 className="text-sm font-bold text-on-surface truncate leading-tight">{event.title}</h3>
        <div className="flex items-center justify-center sm:justify-start gap-4 text-on-surface-variant text-[11px]">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px]">calendar_month</span>
            {new Date(event.startDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px]">location_on</span>
            {event.venue?.city}
          </span>
        </div>
      </div>

      {/* Amount / Action */}
      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4 w-full sm:w-auto shrink-0 border-t sm:border-t-0 border-outline-variant/10 pt-4 sm:pt-0">
        <div className="text-left sm:text-right">
          <p className="text-[10px] text-outline font-semibold uppercase">Total Paid</p>
          <p className="text-sm font-extrabold text-on-surface mt-0.5">₹{booking.totalAmount.toLocaleString()}</p>
        </div>

        <div className="flex gap-2">
          {isPending && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/bookings/${booking._id}`);
              }}
              className="bg-primary text-on-primary text-[10px] font-bold px-3 py-1.5 rounded hover:opacity-90 active:scale-95 transition-all cursor-pointer"
            >
              Checkout
            </button>
          )}
          {!isCancelled && !isPastEvent && (
            <button
              disabled={isCancelling}
              onClick={(e) => onCancel(e, booking._id)}
              className="border border-error/30 text-error hover:bg-error/10 text-[10px] font-bold px-3 py-1.5 rounded active:scale-95 transition-all cursor-pointer"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
