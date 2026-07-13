import { useNavigate } from "react-router-dom";

export const RegisteredEventCard = ({ booking }) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/bookings/${booking._id}`)}
      className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 flex flex-col sm:flex-row items-center gap-4 hover:border-primary/50 cursor-pointer transition-all duration-300 group"
    >
      <div className="w-full sm:w-20 h-20 rounded-lg overflow-hidden shrink-0 shadow bg-surface-container-high">
        {booking.event?.poster ? (
          <img
            alt={booking.event.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            src={booking.event.poster}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-outline">
            <span className="material-symbols-outlined text-xl">image</span>
          </div>
        )}
      </div>
      <div className="grow text-center sm:text-left min-w-0">
        <span
          className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border mb-1 inline-block ${
            booking.bookingStatus === "confirmed"
              ? "bg-secondary-container/20 text-secondary border-secondary-container/30"
              : "bg-surface-container-high text-on-surface border-outline-variant/40 animate-pulse"
          }`}
        >
          {booking.bookingStatus}
        </span>
        <h4 className="text-xs font-bold text-on-surface mb-0.5 group-hover:text-primary transition-colors truncate">
          {booking.event?.title}
        </h4>
        <div className="flex items-center justify-center sm:justify-start gap-4 text-on-surface-variant text-[10px]">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">calendar_month</span>
            {new Date(booking.event?.startDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">location_on</span>
            {booking.event?.venue?.city}
          </span>
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        {booking.bookingStatus === "confirmed" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/tickets`);
            }}
            className="w-10 h-10 rounded-lg text-primary border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors flex items-center justify-center"
            title="View Tickets"
          >
            <span className="material-symbols-outlined text-[20px]">qr_code_2</span>
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/bookings/${booking._id}`);
          }}
          className="w-10 h-10 rounded-lg text-on-surface-variant border border-outline-variant/30 hover:bg-surface-bright transition-colors flex items-center justify-center"
          title="View Details"
        >
          <span className="material-symbols-outlined text-[20px]">info</span>
        </button>
      </div>
    </div>
  );
};
