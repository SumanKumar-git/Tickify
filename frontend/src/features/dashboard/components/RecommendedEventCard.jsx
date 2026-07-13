import { useNavigate } from "react-router-dom";

export const RecommendedEventCard = ({ event }) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/events/${event._id}`)}
      className="group cursor-pointer space-y-3"
    >
      <div className="relative w-full aspect-16/10 rounded-xl overflow-hidden shadow-xl bg-surface-container-low border border-outline-variant/20">
        {event.poster ? (
          <img
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            src={event.poster}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-outline">
            <span className="material-symbols-outlined text-3xl">image</span>
          </div>
        )}
        <div className="absolute top-3 right-3 glass-card px-2.5 py-1 rounded-lg text-[9px] font-bold text-on-surface shadow-2xl border border-outline-variant/30">
          ₹{event.ticketPrice?.toLocaleString()}
        </div>
      </div>
      <div>
        <p className="text-primary text-[8px] font-bold uppercase tracking-widest mb-0.5">{event.category}</p>
        <h5 className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors leading-tight truncate">
          {event.title}
        </h5>
        <p className="text-[10px] text-on-surface-variant leading-snug line-clamp-2 mt-1">
          {event.description}
        </p>
      </div>
    </div>
  );
};
