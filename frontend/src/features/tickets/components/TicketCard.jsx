import { useNavigate } from "react-router-dom";

export const TicketCard = ({ ticket }) => {
  const navigate = useNavigate();
  const event = ticket.event || {};
  const isActive = ticket.ticketStatus === "active";
  const isUsed = ticket.ticketStatus === "used";

  const formatISTDateTime = (dateStr) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return { date: "", time: "", weekday: "" };

    const weekday = date.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", weekday: "short" });
    const dateStrFormatted = date.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short" });
    const timeStr = date.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: true });

    return { date: dateStrFormatted, time: timeStr, weekday };
  };

  const { date: istDate, time: istTime, weekday: istWeekday } = formatISTDateTime(event.startDate);

  return (
    <div
      onClick={() => navigate(`/tickets/${ticket._id}`)}
      className="bg-surface-container flex rounded-2xl overflow-hidden border border-outline-variant/30 hover:border-primary/40 hover:shadow-primary/5 cursor-pointer shadow-lg transition-all duration-300 relative group"
    >
      {/* Visual Left Strip: Poster */}
      <div className="w-1/3 relative shrink-0 bg-surface-container-high overflow-hidden">
        {event.poster ? (
          <img
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            src={event.poster}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-outline">
            <span className="material-symbols-outlined text-2xl">image</span>
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/45 to-transparent"></div>
        <span className="absolute bottom-2.5 left-2.5 text-[8px] bg-primary/25 backdrop-blur-md px-2 py-0.5 border border-primary/30 rounded text-primary font-bold uppercase tracking-wider">
          {event.category}
        </span>
      </div>

      {/* Ticket Details Panel */}
      <div className="w-2/3 p-5 flex flex-col justify-between relative min-w-0">
        {/* Dashed ticket divider coupon effect */}
        <div className="absolute left-0 top-0 bottom-0 border-l border-dashed border-outline-variant/30"></div>
        {/* Mini-circle tear-off shapes on sides */}
        <div className="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full bg-background border-r border-b border-outline-variant/10"></div>
        <div className="absolute -left-1.5 -bottom-1.5 w-3 h-3 rounded-full bg-background border-r border-t border-outline-variant/10"></div>

        <div className="space-y-2 min-w-0">
          <div className="flex justify-between items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border tracking-wider ${
                isActive
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/20"
                  : isUsed
                  ? "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20"
                  : "bg-error/10 text-error border-error/20"
              }`}
            >
              {ticket.ticketStatus}
            </span>
            <span className="text-[9px] font-bold text-outline uppercase tracking-wider font-mono truncate">
              No. {ticket.ticketNumber}
            </span>
          </div>

          <h3 className="text-sm font-black text-on-surface truncate group-hover:text-primary transition-colors leading-tight">
            {event.title}
          </h3>

          {/* Venue & Time in IST */}
          <div className="space-y-1">
            <p className="text-[10px] text-on-surface-variant flex items-center gap-1.5 font-medium">
              <span className="material-symbols-outlined text-[14px] text-primary">calendar_today</span>
              <span>
                {istWeekday}, {istDate} | {istTime} (IST)
              </span>
            </p>
            <p className="text-[10px] text-on-surface-variant flex items-center gap-1.5 truncate">
              <span className="material-symbols-outlined text-[14px] text-primary">location_on</span>
              <span className="truncate">
                {event.venue?.name || "Event Venue"}, {event.venue?.city}
              </span>
            </p>
          </div>
        </div>

        <div className="flex justify-between items-end border-t border-outline-variant/10 pt-3 mt-4 shrink-0">
          <div>
            <p className="text-[8px] text-outline font-semibold uppercase tracking-wider">Ticket Price</p>
            <p className="text-[11px] font-extrabold text-on-surface leading-none mt-0.5">
              {event.ticketPrice > 0 ? `₹${event.ticketPrice.toLocaleString()}` : "Free"}
            </p>
          </div>
          <span className="text-[10px] text-primary font-bold group-hover:underline flex items-center gap-0.5">
            View Ticket
            <span className="material-symbols-outlined text-[12px] transition-transform group-hover:translate-x-0.5">
              arrow_forward
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};
