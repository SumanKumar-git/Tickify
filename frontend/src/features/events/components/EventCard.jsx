import { useNavigate } from "react-router-dom";

export const EventCard = ({ event }) => {
  const navigate = useNavigate();

  const formatEventDate = (dateStr) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    const weekday = date.toLocaleDateString(undefined, { weekday: "short" });
    const day = date.toLocaleDateString(undefined, { day: "numeric" });
    const month = date.toLocaleDateString(undefined, { month: "short" });
    return `${weekday}, ${day} ${month} onwards`;
  };

  return (
    <div
      onClick={() => navigate(`/events/${event._id}`)}
      className="bg-surface-container rounded-2xl overflow-hidden border border-outline-variant/20 hover:border-primary/50 transition-all flex flex-col group cursor-pointer duration-300 shadow-lg w-full"
    >
      {/* Poster Section (Portrait aspect ratio like BookMyShow posters, approx 3/4) */}
      <div className="relative aspect-3/4 overflow-hidden bg-surface-container-high shrink-0">
        {event.poster ? (
          <img
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            src={event.poster}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-outline bg-surface-container-high">
            <span className="material-symbols-outlined text-4xl">image</span>
          </div>
        )}
      </div>

      {/* Text Details Section */}
      <div className="p-4 flex flex-col gap-1 grow bg-surface-container">
        {/* Date/Time (Amber/Gold font) */}
        <div className="text-[#f59e0b] text-[10px] font-bold uppercase tracking-wider leading-none mb-1">
          {formatEventDate(event.startDate)}
        </div>

        {/* Title */}
        <h3 className="text-sm md:text-base font-black text-white group-hover:text-primary transition-all duration-300 line-clamp-1 leading-snug">
          {event.title}
        </h3>

        {/* Location / Venue */}
        <div className="text-outline text-[10px] font-semibold truncate leading-none mt-0.5">
          {event.venue?.name || "Online"}, {event.venue?.city}
        </div>

        {/* Pricing onwards */}
        <div className="text-on-background text-xs md:text-sm font-extrabold mt-2 leading-none">
          {event.ticketPrice > 0 ? `₹${event.ticketPrice.toLocaleString()} onwards` : "Free Entry"}
        </div>
      </div>
    </div>
  );
};
