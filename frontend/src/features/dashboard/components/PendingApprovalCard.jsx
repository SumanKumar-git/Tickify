import { useNavigate } from "react-router-dom";

export const PendingApprovalCard = ({ event }) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/admin/events`)}
      className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 flex items-center gap-4 hover:border-primary/50 cursor-pointer transition-all duration-300 group"
    >
      <div className="w-16 h-16 rounded overflow-hidden shrink-0 bg-surface-container-high">
        {event.poster ? (
          <img alt={event.title} className="w-full h-full object-cover" src={event.poster} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-outline">
            <span className="material-symbols-outlined text-sm">image</span>
          </div>
        )}
      </div>
      <div className="grow min-w-0">
        <p className="text-[9px] uppercase tracking-widest text-primary font-bold">{event.category}</p>
        <h4 className="text-xs font-bold text-on-surface mt-0.5 truncate group-hover:text-primary transition-colors">
          {event.title}
        </h4>
        <p className="text-[10px] text-on-surface-variant mt-0.5 truncate">
          Organized by {event.organizer?.fullName || "Organizer"}
        </p>
      </div>
      <button className="bg-primary text-on-primary text-[10px] font-bold px-3.5 py-2 rounded shrink-0 hover:opacity-90 active:scale-95 transition-all">
        Review
      </button>
    </div>
  );
};
